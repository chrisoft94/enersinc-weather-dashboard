import { useEffect, useRef } from 'react';
import { useWeatherStore } from '../store/weatherStore';

export const useWeatherSocket = () => {
  const addRealtimeData = useWeatherStore((state) => state.addRealtimeData);
  const isOffline = useWeatherStore((state) => state.isOffline);
  const ws = useRef(null);
  const reconnectAttempt = useRef(0);

  useEffect(() => {
    // Si estamos desconectados físicamente, no intentar hacer polling o conexiones
    if (isOffline) return;

    // Conectar a Channels (Ajustar dominio en prod)
    const websocketUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/weather/';
    
    const connect = () => {
      ws.current = new WebSocket(websocketUrl);

      ws.current.onopen = () => {
        console.log('🔗 Conectado al canal de clima (WebSockets)');
        reconnectAttempt.current = 0; // Reset en conexión exitosa
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          // Escuchar el evento que configuramos en signals.py y consumers.py
          if (message.type === 'weather_update' && message.data) {
            console.log('⚡ Nuevo dato en tiempo real:', message.data);
            addRealtimeData(message.data);
          }
        } catch (error) {
          console.error('Error parseando WebSocket payload', error);
        }
      };

      ws.current.onclose = () => {
        // Estrategia de reconexión con Exponential Backoff
        if (!isOffline) {
          const baseDelay = 1000;
          const maxDelay = 30000; // Máximo 30 segundos
          const delay = Math.min(baseDelay * Math.pow(2, reconnectAttempt.current), maxDelay);
          
          console.log(`Desconectado de WebSockets. Intentando reconectar en ${delay/1000}s...`);
          
          setTimeout(() => {
            reconnectAttempt.current += 1;
            connect();
          }, delay);
        }
      };
    };

    connect();

    return () => {
      if (ws.current) {
        // Para evitar reconexiones falsas en el unmount
        ws.current.onclose = null; 
        ws.current.close();
      }
    };
  }, [addRealtimeData, isOffline]);

  return ws.current;
};
