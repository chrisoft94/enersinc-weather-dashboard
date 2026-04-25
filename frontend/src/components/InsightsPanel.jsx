import React, { useEffect, useState } from 'react';
import { Alert } from 'antd';
import { useWeatherStore } from '../store/weatherStore';

export const InsightsPanel = () => {
  const isOffline = useWeatherStore((state) => state.isOffline);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);

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
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Insights de Telemetría Automáticos</h3>
      <div className="flex flex-col gap-3">
        {loading && insights.length === 0 ? (
          <div className="animate-pulse flex space-x-4">
            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
          </div>
        ) : (
          insights.map((insight, idx) => {
            const { type, className } = getAlertProps(insight.color);
            return (
              <Alert
                key={idx}
                message={insight.message}
                type={type}
                showIcon
                className={`border-l-4 rounded-md shadow-sm ${className}`}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
