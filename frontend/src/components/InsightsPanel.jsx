import React, { useEffect, useState } from 'react';
import { Alert } from 'antd';
import { useWeatherStore } from '../store/weatherStore';
import { handleApiError } from '../utils/errorHandler';

export const InsightsPanel = () => {
  const isOffline = useWeatherStore((state) => state.isOffline);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchInsights = async () => {
      if (isOffline) return;
      
      setLoading(true);
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await fetch(`${API_URL}/api/weather-insights/`);
        if (response.ok) {
          const data = await response.json();
          setInsights(data);
          setCurrentIndex(0); // Reiniciar el slider cuando llegan nuevos datos
        } else {
          handleApiError(response.status, "motor de insights");
        }
      } catch (err) {
        console.error("Error fetching insights:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
    
    // Polling every 5 minutes
    const interval = setInterval(fetchInsights, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isOffline]);

  // Efecto para el slider de insights (cada 10 segundos)
  useEffect(() => {
    if (insights.length <= 1) return; // No rotar si hay 1 o 0 insights

    const slideInterval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % insights.length);
    }, 10000); // 10 segundos

    return () => clearInterval(slideInterval);
  }, [insights]);

  if (isOffline || (!loading && insights.length === 0)) {
    return null; // Ocultar si estamos offline o no hay alertas
  }

  const getAlertProps = (color) => {
    switch (color) {
      case 'yellow': return { type: 'warning', className: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-400 text-yellow-800 dark:text-yellow-200' };
      case 'orange': return { type: 'error', className: 'bg-orange-50 dark:bg-orange-900/30 border-orange-500 text-orange-800 dark:text-orange-200' };
      case 'green': return { type: 'success', className: 'bg-green-50 dark:bg-green-900/30 border-green-400 text-green-800 dark:text-green-200' };
      default: return { type: 'info', className: 'bg-blue-50 dark:bg-blue-900/30 border-brand-blue text-blue-800 dark:text-blue-200' };
    }
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Insights de Telemetría Automáticos</h3>
        {insights.length > 1 && (
          <div className="flex gap-1">
            {insights.map((_, idx) => (
              <span 
                key={idx} 
                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-6 bg-brand-blue' : 'w-2 bg-gray-300 dark:bg-slate-600'}`}
              />
            ))}
          </div>
        )}
      </div>
      
      <div className="relative overflow-hidden" style={{ minHeight: '60px' }}>
        {loading && insights.length === 0 ? (
          <div className="animate-pulse flex space-x-4">
            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
          </div>
        ) : (
          <div 
            className="flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {insights.map((insight, idx) => {
              const { type, className } = getAlertProps(insight.color);
              return (
                <div key={idx} className="w-full flex-shrink-0 px-1">
                  <Alert
                    title={
                      <div className="flex justify-between w-full">
                        <span>{insight.message}</span>
                        <span className="text-xs opacity-70 ml-4 hidden sm:block">Actualizado en tiempo real</span>
                      </div>
                    }
                    type={type}
                    showIcon
                    className={`border-l-4 rounded-md shadow-sm ${className} h-full`}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
