import { useEffect } from 'react';
import { message, Alert } from 'antd';
import { useWeatherStore } from './store/weatherStore';
import { useWeatherSocket } from './hooks/useWeatherSocket';
import { Dashboard } from './components/Dashboard';
import { WeatherCharts } from './components/WeatherCharts';
import { WeatherTable } from './components/WeatherTable';
import './App.css';

function App() {
  const isOffline = useWeatherStore((state) => state.isOffline);
  const setIsOffline = useWeatherStore((state) => state.setIsOffline);
  const setDashboardData = useWeatherStore((state) => state.setDashboardData);
  const [messageApi, contextHolder] = message.useMessage();

  // Iniciar conexión WebSockets
  useWeatherSocket();

  // 1. 🔌 Escuchar eventos globales del navegador
  useEffect(() => {
    const handleOnline = async () => {
      setIsOffline(false);
      messageApi.success('Conexión restablecida. Sincronizando datos...');
      
      try {
        // 4. 🔄 Re-sincronización automática
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await fetch(`${API_URL}/api/dashboard-data/`);
        if (response.ok) {
          const freshData = await response.json();
          // Actualizamos masivamente el caché de Zustand
          setDashboardData(freshData);
          messageApi.success('Datos actualizados con éxito desde el servidor.');
        }
      } catch (error) {
        console.error('Error sincronizando al volver online', error);
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
      // 2. 🛑 Alerta visual configurada en el render, y un mensaje tostado aquí
      messageApi.error('Se perdió la conexión a Internet. Iniciando Modo Offline.', 5);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificación inicial montada
    if (!navigator.onLine && !isOffline) {
       handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOffline, isOffline, messageApi]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {contextHolder}
      
      {/* 2 y 3. 🛑 Indicador Visual y Fallback (Zustand provee los datos locales) */}
      {isOffline && (
        <Alert
          message="Modo Offline Activado"
          description="No hay conexión a Internet. Estás navegando con el último estado guardado localmente (Fallback). La interfaz se re-sincronizará automáticamente al detectar conexión."
          type="warning"
          showIcon
          banner
          style={{ marginBottom: '20px' }}
        />
      )}

      <h1>🌤️ Weather Dashboard</h1>
      <Dashboard />
      <WeatherCharts />
      <WeatherTable />
    </div>
  );
}

export default App;
