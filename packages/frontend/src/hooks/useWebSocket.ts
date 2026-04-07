'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { WS_URL } from '../lib/constants';

type Channel = 'curve-updates' | 'whale-alerts' | 'graduations' | 'scores';

interface WSMessage {
  channel: Channel;
  data: unknown;
  timestamp: string;
}

export function useWebSocket(channels: Channel[]) {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Map<Channel, unknown>>(new Map());
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);

  const connect = useCallback(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      retryRef.current = 0;
      channels.forEach(ch => {
        ws.send(JSON.stringify({ subscribe: ch }));
      });
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as WSMessage | { type: string };
        if ('type' in msg && msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
          return;
        }
        if ('channel' in msg && 'data' in msg) {
          setMessages(prev => new Map(prev).set(msg.channel, msg.data));
        }
      } catch { /* ignore */ }
    };

    ws.onclose = () => {
      setConnected(false);
      wsRef.current = null;
      const delay = Math.min(Math.pow(2, retryRef.current) * 1000, 16000);
      retryRef.current++;
      setTimeout(connect, delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [channels]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  return { connected, messages };
}
