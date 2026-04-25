import React, { useState, useEffect } from 'react';
import { Table, Button, message, Typography } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useWeatherStore } from '../store/weatherStore';

const { Title } = Typography;

export const WeatherTable = () => {
  const isOffline = useWeatherStore((state) => state.isOffline);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // 2. 📄 Estado para Paginación Real (Server-side)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  
  // Estado para filtros remotos
  const [cityFilter, setCityFilter] = useState(null);

  // Función para consumir el endpoint DRF con paginación
  const fetchData = async (page = 1, pageSize = 10, city = null) => {
    if (isOffline) {
      // Si estamos offline, podríamos cargar datos cacheados, pero el historial completo 
      // generalmente reside en el servidor.
      return;
    }
    
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      let url = `${API_URL}/api/weather/?page=${page}&size=${pageSize}`;
      if (city) {
        url += `&city=${city}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        // El formato de DRF PageNumberPagination retorna: count, next, previous, results
        setData(result.results);
        setPagination({
          current: page,
          pageSize: pageSize,
          total: result.count,
        });
      } else {
        message.error('Error al obtener el historial climático del servidor.');
      }
    } catch (error) {
      console.error(error);
      message.error('Excepción de red al intentar obtener el historial.');
    } finally {
      setLoading(false);
    }
  };

  // Re-hacer fetch automático si cambian la página, el tamaño o el filtro
  useEffect(() => {
    fetchData(pagination.current, pagination.pageSize, cityFilter);
    // eslint-disable-next-line
  }, [pagination.current, pagination.pageSize, cityFilter, isOffline]);

  // Manejador nativo de la tabla Ant Design cuando cambian filtros o páginas
  const handleTableChange = (newPagination, filters, sorter) => {
    // Manejar el filtro por ciudad extraído de la cabecera
    const newCityFilter = filters.city ? filters.city[0] : null;
    
    if (newCityFilter !== cityFilter) {
      setCityFilter(newCityFilter);
      // Cuando aplicamos un filtro nuevo, la paginación debe resetearse a la página 1
      setPagination(prev => ({ ...prev, current: 1 }));
    } else {
      // Solamente cambió de página o tamaño
      setPagination({
        ...pagination,
        current: newPagination.current,
        pageSize: newPagination.pageSize,
      });
    }
  };

  // 4. 📥 Exportación: Llamar al endpoint CSV
  const handleExportCSV = () => {
    if (isOffline) {
      message.warning('Debes tener conexión a Internet para descargar el histórico CSV.');
      return;
    }
    // Al abrir la URL, el navegador intercepta el header Content-Disposition y descarga el archivo
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    window.open(`${API_URL}/api/export/`, '_blank');
  };

  // Definición de Columnas de Ant Design
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: '8%',
    },
    {
      title: 'Ciudad',
      dataIndex: 'city',
      key: 'city',
      // 3. 🔍 Filtros en Cabecera
      filters: [
        { text: 'Bogota', value: 'Bogota' },
        { text: 'Medellin', value: 'Medellin' },
        { text: 'Cali', value: 'Cali' },
        { text: 'Barranquilla', value: 'Barranquilla' },
        { text: 'Cartagena', value: 'Cartagena' },
      ],
      filterMultiple: false, // Forzar una ciudad a la vez para mapear fácil al query `?city=`
    },
    {
      title: 'Temperatura',
      dataIndex: 'temperature',
      key: 'temperature',
      render: (val) => <strong style={{ color: '#1890ff' }}>{val} °C</strong>
    },
    {
      title: 'Humedad',
      dataIndex: 'humidity',
      key: 'humidity',
      render: (val) => `${val} %`
    },
    {
      title: 'Viento',
      dataIndex: 'wind_speed',
      key: 'wind_speed',
      render: (val) => `${val} m/s`
    },
    {
      title: 'Fecha y Hora',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text) => new Date(text).toLocaleString(),
    },
  ];

  return (
    <div style={{ marginTop: '40px', background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <Title level={3} style={{ margin: 0, color: '#262626' }}>Historial de Registros</Title>
        <Button 
          type="primary" 
          size="large"
          icon={<DownloadOutlined />} 
          onClick={handleExportCSV}
          disabled={isOffline}
          style={{ background: '#52c41a', borderColor: '#52c41a' }}
        >
          Exportar CSV
        </Button>
      </div>
      
      {/* 1. 📊 Tabla de Ant Design */}
      <Table 
        columns={columns} 
        dataSource={data} 
        rowKey="id" 
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          pageSizeOptions: ['5', '10', '20', '50'],
        }}
        loading={loading}
        onChange={handleTableChange}
        scroll={{ x: 'max-content' }} 
        bordered
      />
    </div>
  );
};
