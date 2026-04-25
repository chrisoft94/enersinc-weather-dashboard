import React, { useEffect, useState } from 'react';
import { useWeatherStore } from '../store/weatherStore';
import { KPICard } from './KPICard';

const CITIES = ["Bogota", "Medellin", "Cali", "Barranquilla", "Cartagena"];

export const Dashboard = () => {
  const dashboardData = useWeatherStore((state) => state.dashboardData);
  const isOffline = useWeatherStore((state) => state.isOffline);
  const addRealtimeData = useWeatherStore((state) => state.addRealtimeData);

  const city1 = useWeatherStore((state) => state.selectedCity1);
  const city2 = useWeatherStore((state) => state.selectedCity2);
  const setCity1 = useWeatherStore((state) => state.setSelectedCity1);
  const setCity2 = useWeatherStore((state) => state.setSelectedCity2);

  const [loading, setLoading] = useState(false);

  const safeDashboardData = Array.isArray(dashboardData) ? dashboardData : [];
  const dataCity1 = safeDashboardData.find(d => d?.city?.toLowerCase() === city1?.toLowerCase()) || null;
  const dataCity2 = safeDashboardData.find(d => d?.city?.toLowerCase() === city2?.toLowerCase()) || null;

  const fetchCityData = async (cityName) => {    
    if (isOffline) return;

    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/weather/?city=${cityName}&size=1`);
      if (response.ok) {
        const result = await response.json();
        if (result.results && result.results.length > 0) {
          addRealtimeData(result.results[0]);
        }
      }
    } catch (err) {
      console.error(`Error fetching data for ${cityName}`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCityData(city1);
    fetchCityData(city2);
    // eslint-disable-next-line
  }, []);

  const handleCity1Change = (e) => {
    const value = e.target.value;
    setCity1(value);
    fetchCityData(value);
  };

  const handleCity2Change = (e) => {
    const value = e.target.value;
    setCity2(value);
    fetchCityData(value);
  };

  const determineStatus = (temp) => {
    if (!temp) return 'unknown';
    if (temp > 30) return 'critical';
    if (temp > 25) return 'warning';
    return 'ok';
  };

  return (
    <div className="mt-8">
      {isOffline && (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 p-4 mb-6 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Modo Sin Conexión Activado</h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>Navegando sin internet. Los datos mostrados son respaldos de tu última sesión en vivo.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selectores */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center mb-8 bg-surface-card dark:bg-slate-800 p-6 rounded-lg border border-surface-border dark:border-slate-700 shadow-sm">
        <div>
          <label className="block text-sm font-semibold text-brand-gray dark:text-gray-400 mb-2 uppercase tracking-wide">Punto de Medición 1</label>
          <select 
            value={city1} 
            onChange={handleCity1Change}
            className="w-full bg-surface-bg dark:bg-slate-900 border border-surface-border dark:border-slate-700 text-gray-900 dark:text-white rounded-md py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-blue"
          >
            {CITIES.map(city => <option key={city} value={city}>{city}</option>)}
          </select>
        </div>
        
        <div className="hidden md:flex flex-col items-center justify-center pt-6">
          <span className="px-4 py-1 bg-gray-100 dark:bg-slate-700 rounded-full text-xs font-bold text-brand-gray dark:text-gray-300 border border-gray-200 dark:border-slate-600">VS</span>
        </div>

        <div>
          <label className="block text-sm font-semibold text-brand-gray dark:text-gray-400 mb-2 uppercase tracking-wide">Punto de Medición 2</label>
          <select 
            value={city2} 
            onChange={handleCity2Change}
            className="w-full bg-surface-bg dark:bg-slate-900 border border-surface-border dark:border-slate-700 text-gray-900 dark:text-white rounded-md py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-blue"
          >
            {CITIES.map(city => <option key={city} value={city}>{city}</option>)}
          </select>
        </div>
      </div>

      <div className="mb-6 pb-2 border-b border-surface-border dark:border-slate-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Comparativa de Telemetría</h2>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        
        {/* Columna Ciudad 1 */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-bold text-brand-blue mb-2 uppercase tracking-wider">{city1}</h3>
          <KPICard 
            title="Temperatura" 
            value={dataCity1?.temperature ?? '--'} 
            unit="°C" 
            status={determineStatus(dataCity1?.temperature)}
            isLoading={loading && !dataCity1}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <KPICard 
              title="Humedad" 
              value={dataCity1?.humidity ?? '--'} 
              unit="%" 
              status="ok"
              isLoading={loading && !dataCity1}
            />
            <KPICard 
              title="Viento" 
              value={dataCity1?.wind_speed ?? '--'} 
              unit="m/s" 
              status="ok"
              isLoading={loading && !dataCity1}
            />
          </div>
        </div>

        {/* Columna Ciudad 2 */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-bold text-brand-blue mb-2 uppercase tracking-wider">{city2}</h3>
          <KPICard 
            title="Temperatura" 
            value={dataCity2?.temperature ?? '--'} 
            unit="°C" 
            status={determineStatus(dataCity2?.temperature)}
            isLoading={loading && !dataCity2}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <KPICard 
              title="Humedad" 
              value={dataCity2?.humidity ?? '--'} 
              unit="%" 
              status="ok"
              isLoading={loading && !dataCity2}
            />
            <KPICard 
              title="Viento" 
              value={dataCity2?.wind_speed ?? '--'} 
              unit="m/s" 
              status="ok"
              isLoading={loading && !dataCity2}
            />
          </div>
        </div>

      </div>
    </div>
  );
};
