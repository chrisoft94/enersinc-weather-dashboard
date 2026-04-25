import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useWeatherStore = create(
  persist(
    (set) => ({
      dashboardData: [],
      historyData: [],
      isOffline: !navigator.onLine,
      selectedCity1: 'Bogota',
      selectedCity2: 'Medellin',
      
      setDashboardData: (data) => set({ dashboardData: data }),
      setHistoryData: (data) => set({ historyData: data }),
      setIsOffline: (status) => set({ isOffline: status }),
      setSelectedCity1: (city) => set({ selectedCity1: city }),
      setSelectedCity2: (city) => set({ selectedCity2: city }),
      
      // Cuando llega un evento de WebSockets, añadimos el dato y actualizamos el dashboard si aplica
      addRealtimeData: (newData) => set((state) => {
        const currentDashboard = Array.isArray(state.dashboardData) ? state.dashboardData : [];
        const cityExists = currentDashboard.some(item => item?.city?.toLowerCase() === newData?.city?.toLowerCase());
        const updatedDashboard = cityExists 
          ? currentDashboard.map(item => item?.city?.toLowerCase() === newData?.city?.toLowerCase() ? { ...newData } : item)
          : [...currentDashboard, { ...newData }];
        
        return {
          historyData: [newData, ...state.historyData],
          dashboardData: updatedDashboard
        };
      })
    }),
    {
      name: 'weather-storage', // La llave en localStorage donde se guardará todo
    }
  )
);
