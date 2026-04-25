import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import App from '../App';
import { useWeatherStore } from './weatherStore';

// Los mocks de JSdom ahora están centralizados en setupTests.js

describe('WeatherStore Offline State', () => {
  beforeEach(() => {
    // Resetear el estado antes de cada prueba
    useWeatherStore.setState({ isOffline: false });
  });

  it('debería cambiar isOffline a true cuando se dispara el evento offline de la ventana', () => {
    // Verificar estado inicial
    expect(useWeatherStore.getState().isOffline).toBe(false);

    // Montamos la App que contiene los EventListeners para online/offline
    render(<App />);

    // Simulamos la caída de red
    window.dispatchEvent(new Event('offline'));

    // Verificamos que Zustand se haya actualizado
    expect(useWeatherStore.getState().isOffline).toBe(true);
  });
  
  it('debería cambiar isOffline a false cuando se dispara el evento online de la ventana', () => {
    // Configurar estado inicial desconectado
    useWeatherStore.setState({ isOffline: true });
    expect(useWeatherStore.getState().isOffline).toBe(true);

    render(<App />);

    // Simulamos que vuelve el internet
    window.dispatchEvent(new Event('online'));

    // Verificamos que Zustand se haya actualizado
    expect(useWeatherStore.getState().isOffline).toBe(false);
  });
});
