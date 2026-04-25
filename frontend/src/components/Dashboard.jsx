import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Select, Typography, Divider, Spin, Skeleton, Alert } from 'antd';
import { useWeatherStore } from '../store/weatherStore';

const { Title } = Typography;
const { Option } = Select;

// Lista de ciudades soportadas (o podríamos buscar de una API externa)
const CITIES = ["Bogota", "Medellin", "Cali", "Barranquilla", "Cartagena"];

export const Dashboard = () => {
  // 3. 🧠 Integración de Estado (Zustand)
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

  // Fetch individual para popular el store en caso de no tener los datos
  const fetchCityData = async (cityName) => {    
    if (isOffline) {
        return; // Si estamos offline, solo mostramos lo de Zustand
    }

    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/weather/?city=${cityName}&size=1`);
      if (response.ok) {
        const result = await response.json();
        
        if (result.results && result.results.length > 0) {
          const newData = result.results[0];
          // Si llega data, la re-inyectamos al Store Global simulando un realtime update
          addRealtimeData(newData);
        }
      } else {
        console.error(`[fetchCityData] Error HTTP ${response.status} al buscar ${cityName}`);
      }
    } catch (err) {
      console.error(`Error fetching data for ${cityName}`, err);
    } finally {
      setLoading(false);
    }
  };

  // Traer los datos la primera vez que se monta
  useEffect(() => {
    fetchCityData(city1);

    fetchCityData(city2);
    // eslint-disable-next-line
  }, []);

  // Manejadores de los selectores
  const handleCity1Change = (value) => {
    console.log('value', value);
    setCity1(value);
    fetchCityData(value);
  };

  const handleCity2Change = (value) => {
    setCity2(value);
    fetchCityData(value);
  };

  return (
    <div style={{ marginTop: '30px' }}>

      {isOffline && (
        <Alert
          message="Modo Sin Conexión Activado"
          description="Actualmente estás navegando sin internet. Los datos mostrados en este dashboard son respaldos de tu última sesión en vivo gracias a Zustand."
          type="warning"
          showIcon
          style={{ marginBottom: '24px', borderRadius: '12px', border: '1px solid #ffe58f' }}
        />
      )}

      {/* 1. 🏙️ Selector de Ciudades */}
      <Row gutter={[16, 16]} justify="center" align="middle" style={{ marginBottom: '20px' }}>
        <Col xs={24} md={10}>
          <Title level={5} style={{ margin: '0 0 8px 0', color: '#595959' }}>Ciudad 1</Title>
          <Select
            value={city1}
            onChange={handleCity1Change}
            style={{ width: '100%' }}
            size="large"
          >
            {CITIES.map(city => <Option key={`c1-${city}`} value={city}>{city}</Option>)}
          </Select>
        </Col>

        <Col xs={24} md={4} style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-block',
            padding: '10px 20px',
            background: '#f0f2f5',
            borderRadius: '20px',
            fontWeight: 'bold',
            color: '#8c8c8c'
          }}>
            VS
          </div>
        </Col>

        <Col xs={24} md={10}>
          <Title level={5} style={{ margin: '0 0 8px 0', color: '#595959' }}>Ciudad 2</Title>
          <Select
            value={city2}
            onChange={handleCity2Change}
            style={{ width: '100%' }}
            size="large"
          >
            {CITIES.map(city => <Option key={`c2-${city}`} value={city}>{city}</Option>)}
          </Select>
        </Col>
      </Row>

      <Divider style={{ borderColor: '#d9d9d9' }} />

      <Spin spinning={loading} description="Sincronizando...">
        {/* 2 y 4. 🗂️ Tarjetas Comparativas (Responsive Grid) */}

        {/* Fila Temperatura */}
        <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12}>
            <Card variant="borderless" style={{ textAlign: 'center', background: 'linear-gradient(to bottom right, #ffffff, #e6f7ff)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <Skeleton loading={loading && !dataCity1} active paragraph={{ rows: 1 }} title={false}>
                <Statistic
                  title={`Temperatura en ${city1}`}
                  value={dataCity1?.temperature ?? '--'}
                  suffix="°C"
                  styles={{ content: { color: '#1890ff', fontSize: '32px', fontWeight: 600 } }}
                />
              </Skeleton>
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card variant="borderless" style={{ textAlign: 'center', background: 'linear-gradient(to bottom right, #ffffff, #fff1f0)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <Skeleton loading={loading && !dataCity2} active paragraph={{ rows: 1 }} title={false}>
                <Statistic
                  title={`Temperatura en ${city2}`}
                  value={dataCity2?.temperature ?? '--'}
                  suffix="°C"
                  styles={{ content: { color: '#f5222d', fontSize: '32px', fontWeight: 600 } }}
                />
              </Skeleton>
            </Card>
          </Col>
        </Row>

        {/* Fila Humedad */}
        <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12}>
            <Card variant="borderless" style={{ textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <Skeleton loading={loading && !dataCity1} active paragraph={{ rows: 1 }} title={false}>
                <Statistic
                  title={`Humedad en ${city1}`}
                  value={dataCity1?.humidity ?? '--'}
                  suffix="%"
                  styles={{ content: { color: '#13c2c2', fontSize: '28px' } }}
                />
              </Skeleton>
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card variant="borderless" style={{ textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <Skeleton loading={loading && !dataCity2} active paragraph={{ rows: 1 }} title={false}>
                <Statistic
                  title={`Humedad en ${city2}`}
                  value={dataCity2?.humidity ?? '--'}
                  suffix="%"
                  styles={{ content: { color: '#13c2c2', fontSize: '28px' } }}
                />
              </Skeleton>
            </Card>
          </Col>
        </Row>

        {/* Fila Viento */}
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12}>
            <Card variant="borderless" style={{ textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <Skeleton loading={loading && !dataCity1} active paragraph={{ rows: 1 }} title={false}>
                <Statistic
                  title={`Velocidad del Viento en ${city1}`}
                  value={dataCity1?.wind_speed ?? '--'}
                  suffix="m/s"
                  styles={{ content: { color: '#722ed1', fontSize: '28px' } }}
                />
              </Skeleton>
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card variant="borderless" style={{ textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <Skeleton loading={loading && !dataCity2} active paragraph={{ rows: 1 }} title={false}>
                <Statistic
                  title={`Velocidad del Viento en ${city2}`}
                  value={dataCity2?.wind_speed ?? '--'}
                  suffix="m/s"
                  styles={{ content: { color: '#722ed1', fontSize: '28px' } }}
                />
              </Skeleton>
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};
