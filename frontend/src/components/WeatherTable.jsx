import React, { useState, useEffect } from 'react';
import { Table, Button, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useWeatherStore } from '../store/weatherStore';

export const WeatherTable = () => {
  const isOffline = useWeatherStore((state) => state.isOffline);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  
  const [cityFilter, setCityFilter] = useState(null);

  const fetchData = async (page = 1, pageSize = 10, city = null) => {
    if (isOffline) {
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

  useEffect(() => {
    fetchData(pagination.current, pagination.pageSize, cityFilter);
    // eslint-disable-next-line
  }, [pagination.current, pagination.pageSize, cityFilter, isOffline]);

  const handleTableChange = (newPagination, filters, sorter) => {
    const newCityFilter = filters.city ? filters.city[0] : null;
    
    if (newCityFilter !== cityFilter) {
      setCityFilter(newCityFilter);
      setPagination(prev => ({ ...prev, current: 1 }));
    } else {
      setPagination({
        ...pagination,
        current: newPagination.current,
        pageSize: newPagination.pageSize,
      });
    }
  };

  const handleExportCSV = () => {
    if (isOffline) {
      message.warning('Debes tener conexión a Internet para descargar el histórico CSV.');
      return;
    }
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    window.open(`${API_URL}/api/export/`, '_blank');
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: '8%',
    },
    {
      title: 'Punto de Medición',
      dataIndex: 'city',
      key: 'city',
      filters: [
        { text: 'Bogota', value: 'Bogota' },
        { text: 'Medellin', value: 'Medellin' },
        { text: 'Cali', value: 'Cali' },
        { text: 'Barranquilla', value: 'Barranquilla' },
        { text: 'Cartagena', value: 'Cartagena' },
      ],
      filterMultiple: false,
    },
    {
      title: 'Temperatura',
      dataIndex: 'temperature',
      key: 'temperature',
      render: (val) => <strong className="text-brand-blue font-mono">{val} °C</strong>
    },
    {
      title: 'Humedad',
      dataIndex: 'humidity',
      key: 'humidity',
      render: (val) => <span className="font-mono text-gray-700">{val} %</span>
    },
    {
      title: 'Viento',
      dataIndex: 'wind_speed',
      key: 'wind_speed',
      render: (val) => <span className="font-mono text-gray-700">{val} m/s</span>
    },
    {
      title: 'Fecha y Hora',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text) => <span className="text-brand-gray text-sm">{new Date(text).toLocaleString()}</span>,
    },
  ];

  return (
    <div className="bg-surface-card border border-surface-border rounded-lg shadow-sm p-6">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-surface-border pb-4">
        <h3 className="text-xl font-semibold text-gray-900">Historial de Telemetría</h3>
        <Button 
          type="primary" 
          size="large"
          icon={<DownloadOutlined />} 
          onClick={handleExportCSV}
          disabled={isOffline}
          className="bg-brand-blue hover:bg-blue-700 border-none font-medium flex items-center"
        >
          Exportar Despachos (CSV)
        </Button>
      </div>
      
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
      />
    </div>
  );
};
