import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Spin } from 'antd';
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

  // Derivar datos del dashboard global (caché más reciente) para el BarChart
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

  // Hacer fetch histórico solo para el LineChart (Si estamos online)
  useEffect(() => {
    const fetchHistoryForCharts = async () => {
      if (isOffline) return;
      
      setLoading(true);
      try {
        // Pedir los últimos 10 registros de cada ciudad para la curva temporal
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const res1 = await fetch(`${API_URL}/api/weather/?city=${selectedCity1}&size=10`);
        const res2 = await fetch(`${API_URL}/api/weather/?city=${selectedCity2}&size=10`);
        
        const data1 = res1.ok ? await res1.json() : { results: [] };
        const data2 = res2.ok ? await res2.json() : { results: [] };

        // Ordenarlos cronológicamente (de más antiguo a más nuevo)
        const rev1 = data1.results.reverse();
        const rev2 = data2.results.reverse();
        
        // Unificar ambas líneas temporales (simulación de timeline compartida)
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
    <div style={{ marginTop: '24px', marginBottom: '24px' }}>
      <Row gutter={[24, 24]}>
        
        {/* 1. 📈 Gráfico de Líneas (Series de Tiempo Históricas) */}
        <Col xs={24} lg={14}>
          <Card 
            title={`Evolución Histórica: ${selectedCity1} vs ${selectedCity2}`} 
            variant="borderless" 
            style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.04)', borderRadius: '12px' }}
          >
            <Spin spinning={loading} description="Calculando línea de tiempo...">
              <div style={{ height: 350 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <LineChart data={historyTimeline} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="time" tick={{ fill: '#8c8c8c' }} />
                    <YAxis yAxisId="left" tick={{ fill: '#8c8c8c' }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: '#8c8c8c' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    
                    {/* Líneas Ciudad 1 */}
                    <Line yAxisId="left" type="monotone" dataKey={`temp_${selectedCity1}`} name={`Temp ${selectedCity1}`} stroke="#1890ff" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} connectNulls />
                    <Line yAxisId="right" type="monotone" dataKey={`hum_${selectedCity1}`} name={`Hum ${selectedCity1}`} stroke="#13c2c2" strokeWidth={2} strokeDasharray="5 5" connectNulls />
                    
                    {/* Líneas Ciudad 2 */}
                    <Line yAxisId="left" type="monotone" dataKey={`temp_${selectedCity2}`} name={`Temp ${selectedCity2}`} stroke="#f5222d" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} connectNulls />
                    <Line yAxisId="right" type="monotone" dataKey={`hum_${selectedCity2}`} name={`Hum ${selectedCity2}`} stroke="#eb2f96" strokeWidth={2} strokeDasharray="5 5" connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Spin>
          </Card>
        </Col>

        {/* 2. 📊 Gráfico de Barras (Comparación Directa Actual) */}
        <Col xs={24} lg={10}>
          <Card 
            title="Comparación Actual" 
            variant="borderless" 
            style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.04)', borderRadius: '12px' }}
          >
            <div style={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fill: '#8c8c8c' }} />
                  <YAxis tick={{ fill: '#8c8c8c' }} />
                  <Tooltip 
                    cursor={{fill: '#f5f5f5'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey={selectedCity1} fill="#1890ff" radius={[4, 4, 0, 0]} barSize={40} />
                  <Bar dataKey={selectedCity2} fill="#f5222d" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        
      </Row>
    </div>
  );
};
