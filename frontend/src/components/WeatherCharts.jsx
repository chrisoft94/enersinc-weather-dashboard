import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useWeatherStore } from '../store/weatherStore';

export const WeatherCharts = () => {
  const selectedCity1 = useWeatherStore((state) => state.selectedCity1);
  const selectedCity2 = useWeatherStore((state) => state.selectedCity2);
  const dashboardData = useWeatherStore((state) => state.dashboardData);
  const isOffline = useWeatherStore((state) => state.isOffline);

  const [historyTimeline, setHistoryTimeline] = useState([]);
  const [loading, setLoading] = useState(false);

  const dataCity1 = dashboardData.find(d => d.city?.toLowerCase() === selectedCity1.toLowerCase());
  const dataCity2 = dashboardData.find(d => d.city?.toLowerCase() === selectedCity2.toLowerCase());

  const barChartData = [
    {
      name: 'Temperatura (°C)',
      [selectedCity1]: dataCity1 ? dataCity1.temperature : 0,
      [selectedCity2]: dataCity2 ? dataCity2.temperature : 0,
    },
    {
      name: 'Viento (m/s)',
      [selectedCity1]: dataCity1 ? dataCity1.wind_speed : 0,
      [selectedCity2]: dataCity2 ? dataCity2.wind_speed : 0,
    }
  ];

  useEffect(() => {
    const fetchHistoryForCharts = async () => {
      if (isOffline) return;
      
      setLoading(true);
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const res1 = await fetch(`${API_URL}/api/weather/?city=${selectedCity1}&size=10`);
        const res2 = await fetch(`${API_URL}/api/weather/?city=${selectedCity2}&size=10`);
        
        const data1 = res1.ok ? await res1.json() : { results: [] };
        const data2 = res2.ok ? await res2.json() : { results: [] };

        const rev1 = data1.results.reverse();
        const rev2 = data2.results.reverse();
        
        const maxLength = Math.max(rev1.length, rev2.length);
        const mergedTimeline = [];
        
        for (let i = 0; i < maxLength; i++) {
          const item1 = rev1[i] || null;
          const item2 = rev2[i] || null;
          
          mergedTimeline.push({
            time: item1 ? new Date(item1.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                        : (item2 ? new Date(item2.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : `T${i}`),
            [`temp_${selectedCity1}`]: item1 ? item1.temperature : null,
            [`hum_${selectedCity1}`]: item1 ? item1.humidity : null,
            [`temp_${selectedCity2}`]: item2 ? item2.temperature : null,
            [`hum_${selectedCity2}`]: item2 ? item2.humidity : null,
          });
        }
        
        setHistoryTimeline(mergedTimeline);
      } catch (err) {
        console.error("Error obteniendo datos para el gráfico:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoryForCharts();
  }, [selectedCity1, selectedCity2, isOffline]);

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico de Líneas */}
        <div className="lg:col-span-2 bg-surface-card dark:bg-slate-800 border border-surface-border dark:border-slate-700 rounded-lg p-6 shadow-sm relative">
          {loading && (
            <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center z-10 rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
            </div>
          )}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Evolución Histórica</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyTimeline} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                <XAxis dataKey="time" tick={{ fill: '#808080', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fill: '#808080', fontSize: 12, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#808080', fontSize: 12, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E293B', color: '#fff', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ fontFamily: 'monospace' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#808080', paddingTop: '10px' }} />
                
                <Line yAxisId="left" type="monotone" dataKey={`temp_${selectedCity1}`} name={`Temp ${selectedCity1}`} stroke="#007BFF" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} connectNulls />
                <Line yAxisId="right" type="monotone" dataKey={`hum_${selectedCity1}`} name={`Hum ${selectedCity1}`} stroke="#87CEFA" strokeWidth={2} strokeDasharray="5 5" connectNulls />
                
                <Line yAxisId="left" type="monotone" dataKey={`temp_${selectedCity2}`} name={`Temp ${selectedCity2}`} stroke="#808080" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} connectNulls />
                <Line yAxisId="right" type="monotone" dataKey={`hum_${selectedCity2}`} name={`Hum ${selectedCity2}`} stroke="#4A5568" strokeWidth={2} strokeDasharray="5 5" connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Barras */}
        <div className="lg:col-span-1 bg-surface-card dark:bg-slate-800 border border-surface-border dark:border-slate-700 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Comparación Actual</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                <XAxis dataKey="name" tick={{ fill: '#808080', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#808080', fontSize: 12, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: '#CBD5E1', opacity: 0.2}}
                  contentStyle={{ backgroundColor: '#1E293B', color: '#fff', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ fontFamily: 'monospace' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#808080', paddingTop: '10px' }} />
                <Bar dataKey={selectedCity1} fill="#007BFF" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey={selectedCity2} fill="#808080" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
      </div>
    </div>
  );
};
