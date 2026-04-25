import React from 'react';

const statusColors = {
  ok: 'bg-telemetry-ok',
  warning: 'bg-telemetry-warning',
  critical: 'bg-telemetry-critical',
  unknown: 'bg-gray-300'
};

export const KPICard = ({ title, value, unit, status = 'unknown', isLoading = false }) => {
  return (
    <div className="relative bg-surface-card border border-surface-border rounded-lg p-6 shadow-sm overflow-hidden h-full">
      {/* Indicador de Estado (Punto de Telemetría) */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <span className="text-xs font-semibold uppercase text-brand-gray">Estado</span>
        <div className={`w-3 h-3 rounded-full ${statusColors[status]} ${isLoading ? 'animate-pulse' : ''}`} />
      </div>

      {/* Degradado decorativo que emula el logo de enersinc */}
      <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-infinity" />

      <h3 className="text-sm font-medium text-brand-gray mb-2">{title}</h3>
      <div className="flex items-baseline gap-1 mt-4">
        <span className="text-4xl font-bold text-gray-900 font-mono tracking-tight">
          {isLoading ? '--' : value}
        </span>
        <span className="text-lg font-medium text-brand-gray">{unit}</span>
      </div>
    </div>
  );
};
