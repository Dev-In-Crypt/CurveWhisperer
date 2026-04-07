import { EventEmitter } from 'events';
import { CurveStore } from '../state/curve-store.js';
import { ScoreCache } from './cache.js';
import { OnchainPublisher } from '../publisher/onchain.js';
import { WSPublisher } from '../publisher/websocket.js';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompts.js';
import { calculateRuleBasedScore } from './rule-engine.js';
import { ScoreResult } from '../utils/types.js';
import { config } from '../config.js';
import { createChildLogger } from '../utils/logger.js';

const log = createChildLogger('score-engine');

async function callLLM(systemPrompt: string, userPrompt: string): Promise<string | null> {
  const baseUrl = config.llm.baseUrl.replace(/\/+$/, '');
  const url = `${baseUrl}/api/v1/chat/completions`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.llm.apiKey}`,
        },
        body: JSON.stringify({
          model: config.llm.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        log.warn({ status: res.status, attempt }, 'LLM API error');
        continue;
      }

      const json = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
      return json.choices?.[0]?.message?.content || null;
    } catch (err: any) {
      log.warn({ err: err.message, attempt }, 'LLM call failed');
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, Math.pow(2, attempt + 1) * 1000));
      }
    }
  }

  log.error('All LLM retry attempts failed');
  return null;
}

function parseLLMResponse(raw: string): ScoreResult | null {
  try {
    // Strip markdown code block wrappers if present
    let cleaned = raw.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(cleaned) as {
      score?: number;
      confidence?: string;
      reasoning?: string;
      risks?: string[];
      bullishFactors?: string[];
    };

    if (typeof parsed.score !== 'number' || parsed.score < 0 || parsed.score > 100) return null;
    if (!['high', 'medium', 'low'].includes(parsed.confidence || '')) return null;
    if (typeof parsed.reasoning !== 'string') return null;

    return {
      score: Math.round(parsed.score),
      confidence: parsed.confidence as 'high' | 'medium' | 'low',
      reasoning: parsed.reasoning.slice(0, 500),
      risks: Array.isArray(parsed.risks) ? parsed.risks.slice(0, 5) : [],
      bullishFactors: Array.isArray(parsed.bullishFactors) ? parsed.bullishFactors.slice(0, 5) : [],
      source: 'llm',
      timestamp: Date.now(),
    };
  } catch (err) {
    log.warn({ raw: raw.slice(0, 200) }, 'Failed to parse LLM response');
    return null;
  }
}

export class ScoreOrchestrator extends EventEmitter {
  private curveStore: CurveStore;
  private cache: ScoreCache;
  private onchain: OnchainPublisher;
  private wsPublisher: WSPublisher | null;
  private periodicTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    curveStore: CurveStore,
    cache: ScoreCache,
    onchain: OnchainPublisher,
    wsPublisher: WSPublisher | null = null,
  ) {
    super();
    this.curveStore = curveStore;
    this.cache = cache;
    this.onchain = onchain;
    this.wsPublisher = wsPublisher;
  }

  async scoreToken(address: string, trigger: string): Promise<ScoreResult | null> {
    const key = address.toLowerCase();

    // Check cache
    const cached = this.cache.get(key);
    if (cached && trigger !== 'user-request') return cached;

    // Get curve state
    const state = this.curveStore.getCurve(key);
    if (!state) {
      log.debug({ address: key }, 'Token not found for scoring');
      return null;
    }

    const prevScore = state.lastScore?.score;

    // Try LLM
    const userPrompt = buildUserPrompt(state);
    const rawResponse = await callLLM(SYSTEM_PROMPT, userPrompt);
    let result: ScoreResult | null = null;

    if (rawResponse) {
      result = parseLLMResponse(rawResponse);
    }

    // Fallback to rule engine
    if (!result) {
      result = calculateRuleBasedScore(state);
      log.info({ address: key, score: result.score }, 'Using rule-based fallback');
    }

    // Cache and update store
    this.cache.set(key, result);
    this.curveStore.updateScore(key, result);

    // Publish via WS
    if (this.wsPublisher) {
      this.wsPublisher.broadcast('scores', {
        tokenAddress: key,
        name: state.name,
        symbol: state.symbol,
        ...result,
      });
    }

    // On-chain write if significant change and fill > 50%
    if (
      prevScore !== undefined &&
      Math.abs(result.score - (prevScore || 0)) > 10 &&
      state.filledPercent > 50
    ) {
      this.onchain.publishScore(key, result.score, result.reasoning, result.confidence);
    }

    // Emit significant change
    if (prevScore !== undefined && Math.abs(result.score - (prevScore || 0)) > 10) {
      this.emit('score:significant-change', key, result, prevScore);
    }

    log.info({ address: key, score: result.score, source: result.source, trigger }, 'Token scored');
    return result;
  }

  startPeriodicScoring(): void {
    this.periodicTimer = setInterval(async () => {
      const curves = this.curveStore.getActiveCurves('fill', 10);
      for (const curve of curves) {
        if (curve.filledPercent < 10) continue;
        const cached = this.cache.get(curve.address);
        if (!cached || Date.now() - cached.timestamp > 5 * 60 * 1000) {
          await this.scoreToken(curve.address, 'periodic');
          // Small delay between calls to avoid rate limits
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    }, 60000);
  }

  stop(): void {
    if (this.periodicTimer) clearInterval(this.periodicTimer);
  }
}
