import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { createChildLogger } from '../utils/logger.js';

const log = createChildLogger('websocket');

type Channel = 'curve-updates' | 'whale-alerts' | 'graduations' | 'scores';

interface ClientState {
  channels: Set<Channel>;
  alive: boolean;
}

export class WSPublisher {
  private wss: WebSocketServer;
  private clients = new Map<WebSocket, ClientState>();
  private throttle = new Map<string, number>(); // token -> last send time

  constructor(server: http.Server) {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws) => {
      this.clients.set(ws, { channels: new Set(), alive: true });
      log.info({ connections: this.clients.size }, 'Client connected');

      ws.on('message', (raw) => {
        try {
          const msg = JSON.parse(raw.toString()) as { subscribe?: Channel; unsubscribe?: Channel; type?: string };
          const state = this.clients.get(ws)!;

          if (msg.subscribe) {
            state.channels.add(msg.subscribe);
          }
          if (msg.unsubscribe) {
            state.channels.delete(msg.unsubscribe);
          }
          if (msg.type === 'pong') {
            state.alive = true;
          }
        } catch { /* ignore invalid messages */ }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        log.info({ connections: this.clients.size }, 'Client disconnected');
      });

      ws.on('error', () => {
        this.clients.delete(ws);
      });
    });

    // Heartbeat every 30s
    setInterval(() => {
      for (const [ws, state] of this.clients) {
        if (!state.alive) {
          ws.terminate();
          this.clients.delete(ws);
          continue;
        }
        state.alive = false;
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }
    }, 30000);

    // Log connection count every 60s
    setInterval(() => {
      if (this.clients.size > 0) {
        log.info({ connections: this.clients.size }, 'Active WS connections');
      }
    }, 60000);
  }

  broadcast(channel: Channel, data: unknown, throttleKey?: string): void {
    // Throttle curve-updates: max 1/sec per token
    if (channel === 'curve-updates' && throttleKey) {
      const now = Date.now();
      const last = this.throttle.get(throttleKey) || 0;
      if (now - last < 1000) return;
      this.throttle.set(throttleKey, now);
    }

    const msg = JSON.stringify({ channel, data, timestamp: new Date().toISOString() });

    for (const [ws, state] of this.clients) {
      if (state.channels.has(channel) && ws.readyState === WebSocket.OPEN) {
        ws.send(msg);
      }
    }
  }

  get connectionCount(): number {
    return this.clients.size;
  }
}
