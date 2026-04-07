import WebSocket from 'ws';
import { createChildLogger } from './logger.js';

const log = createChildLogger('bitquery');

export class BitqueryClient {
  private apiKey: string;
  private httpUrl: string;
  private wsUrl: string;
  private subscriptions: Map<string, {
    gql: string;
    variables?: Record<string, unknown>;
    onData: (data: unknown) => void;
    onError: (err: Error) => void;
  }> = new Map();
  private ws: WebSocket | null = null;
  private retryCount = 0;
  private maxRetries = 5;
  private reconnecting = false;
  private subIdCounter = 0;

  constructor(apiKey: string, httpUrl: string, wsUrl: string) {
    this.apiKey = apiKey;
    this.httpUrl = httpUrl;
    this.wsUrl = wsUrl;
  }

  async query<T = unknown>(gql: string, variables?: Record<string, unknown>): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(this.httpUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ query: gql, variables }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Bitquery HTTP ${res.status}: ${await res.text()}`);
      }

      const json = await res.json() as { data?: T; errors?: Array<{ message: string }> };
      if (json.errors?.length) {
        throw new Error(`Bitquery errors: ${json.errors.map(e => e.message).join(', ')}`);
      }
      return json.data as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  subscribe(
    id: string,
    gql: string,
    variables: Record<string, unknown> | undefined,
    onData: (data: unknown) => void,
    onError: (err: Error) => void,
  ): string {
    const subId = id || `sub_${++this.subIdCounter}`;
    this.subscriptions.set(subId, { gql, variables, onData, onError });

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendSubscribe(subId, gql, variables);
    } else if (!this.ws) {
      this.connect();
    }
    return subId;
  }

  unsubscribe(id: string): void {
    this.subscriptions.delete(id);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'complete', id }));
    }
  }

  connect(): void {
    if (this.ws) return;

    log.info('Connecting to Bitquery WebSocket...');
    this.ws = new WebSocket(this.wsUrl, 'graphql-ws', {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });

    this.ws.on('open', () => {
      log.info('WebSocket connected');
      this.retryCount = 0;
      this.reconnecting = false;

      this.ws!.send(JSON.stringify({
        type: 'connection_init',
        payload: {},
      }));
    });

    this.ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as {
          type: string;
          id?: string;
          payload?: { data?: unknown; errors?: Array<{ message: string }> };
        };

        switch (msg.type) {
          case 'connection_ack':
            log.info('WebSocket handshake complete, sending subscriptions');
            for (const [id, sub] of this.subscriptions) {
              this.sendSubscribe(id, sub.gql, sub.variables);
            }
            break;

          case 'data':
          case 'next':
            if (msg.id && this.subscriptions.has(msg.id)) {
              const sub = this.subscriptions.get(msg.id)!;
              if (msg.payload?.errors?.length) {
                sub.onError(new Error(msg.payload.errors.map(e => e.message).join(', ')));
              } else if (msg.payload?.data) {
                sub.onData(msg.payload.data);
              }
            }
            break;

          case 'error':
            log.error({ msg }, 'WebSocket subscription error');
            if (msg.id && this.subscriptions.has(msg.id)) {
              this.subscriptions.get(msg.id)!.onError(
                new Error(JSON.stringify(msg.payload))
              );
            }
            break;

          case 'ka':
          case 'connection_keep_alive':
            break;

          default:
            log.debug({ type: msg.type }, 'Unhandled WS message type');
        }
      } catch (err) {
        log.error({ err }, 'Failed to parse WS message');
      }
    });

    this.ws.on('close', () => {
      log.warn('WebSocket disconnected');
      this.ws = null;
      this.scheduleReconnect();
    });

    this.ws.on('error', (err) => {
      log.error({ err: err.message }, 'WebSocket error');
      this.ws?.close();
      this.ws = null;
      this.scheduleReconnect();
    });
  }

  private sendSubscribe(id: string, gql: string, variables?: Record<string, unknown>): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({
      type: 'start',
      id,
      payload: { query: gql, variables },
    }));
    log.info({ id }, 'Subscription sent');
  }

  private scheduleReconnect(): void {
    if (this.reconnecting) return;
    if (this.retryCount >= this.maxRetries) {
      log.error('Max reconnection attempts reached');
      for (const sub of this.subscriptions.values()) {
        sub.onError(new Error('Max reconnection attempts reached'));
      }
      return;
    }

    this.reconnecting = true;
    const delay = Math.pow(2, this.retryCount) * 1000;
    this.retryCount++;
    log.info({ delay, attempt: this.retryCount }, 'Scheduling reconnect');
    setTimeout(() => {
      this.reconnecting = false;
      this.connect();
    }, delay);
  }

  disconnect(): void {
    this.subscriptions.clear();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
