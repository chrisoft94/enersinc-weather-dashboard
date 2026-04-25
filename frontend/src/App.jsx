import { useEffect, useState } from 'react';
import { message, Alert } from 'antd';
import { useWeatherStore } from './store/weatherStore';
import { useWeatherSocket } from './hooks/useWeatherSocket';
import { handleApiError } from './utils/errorHandler';
import { Dashboard } from './components/Dashboard';
import { WeatherCharts } from './components/WeatherCharts';
import { WeatherTable } from './components/WeatherTable';
import { InsightsPanel } from './components/InsightsPanel';
import './App.css';

function App() {
  const isOffline = useWeatherStore((state) => state.isOffline);
  const setIsOffline = useWeatherStore((state) => state.setIsOffline);
  const setDashboardData = useWeatherStore((state) => state.setDashboardData);
  const [messageApi, contextHolder] = message.useMessage();
  const [isDarkMode, setIsDarkMode] = useState(false);

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
        } else {
          handleApiError(response.status, "la sincronización de datos");
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

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  return (
    <div className="min-h-screen font-sans text-brand-gray bg-surface-bg dark:bg-slate-900 transition-colors duration-200">
      <div className="max-w-7xl mx-auto p-6">
        {contextHolder}
        
        {/* 2 y 3. 🛑 Indicador Visual y Fallback (Zustand provee los datos locales) */}
        {isOffline && (
          <Alert
            title="Modo Offline Activado"
            description="No hay conexión a Internet. Estás navegando con el último estado guardado localmente (Fallback). La interfaz se re-sincronizará automáticamente al detectar conexión."
            type="warning"
            showIcon
            banner
            style={{ marginBottom: '20px' }}
          />
        )}

        {/* Header Corporativo Enersinc */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Plataforma de Telemetría ETRM</h1>
            <p className="text-sm font-medium text-brand-gray dark:text-gray-400">Operaciones y Despacho Energético</p>
          </div>
          
          <button 
            onClick={toggleDarkMode}
            className="px-4 py-2 rounded-full border border-surface-border dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 shadow-sm hover:shadow-md transition-all flex items-center gap-2 font-medium"
          >
            {isDarkMode ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}
          </button>
        </header>

        <InsightsPanel />
        <Dashboard />
        <WeatherCharts />
        <WeatherTable />
      </div>
    </div>
  );
}

export default App;
