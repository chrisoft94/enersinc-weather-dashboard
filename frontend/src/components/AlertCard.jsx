import React from 'react';
import { ExclamationCircleOutlined, InfoCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

export const AlertCard = ({ title, description, type = 'info', className = '' }) => {
  const getAlertStyles = () => {
    switch (type) {
      case 'warning':
        return {
          container: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-400',
          icon: <ExclamationCircleOutlined style={{ fontSize: '18px', color: '#EAB308' }} />,
          title: 'text-yellow-800 dark:text-yellow-200',
          description: 'text-yellow-700 dark:text-yellow-300'
        };
      case 'error':
        return {
          container: 'bg-red-50 dark:bg-red-900/30 border-red-500',
          icon: <CloseCircleOutlined style={{ fontSize: '18px', color: '#EF4444' }} />,
          title: 'text-red-800 dark:text-red-200',
          description: 'text-red-700 dark:text-red-300'
        };
      case 'success':
        return {
          container: 'bg-green-50 dark:bg-green-900/30 border-green-500',
          icon: <CheckCircleOutlined style={{ fontSize: '18px', color: '#10B981' }} />,
          title: 'text-green-800 dark:text-green-200',
          description: 'text-green-700 dark:text-green-300'
        };
      case 'info':
      default:
        return {
          container: 'bg-blue-50 dark:bg-blue-900/30 border-brand-blue',
          icon: <InfoCircleOutlined style={{ fontSize: '18px', color: '#3B82F6' }} />,
          title: 'text-blue-800 dark:text-blue-200',
          description: 'text-blue-700 dark:text-blue-300'
        };
    }
  };

  const styles = getAlertStyles();

  return (
    <div className={`border-l-4 p-4 rounded-md shadow-sm transition-all duration-300 ${styles.container} ${className}`}>
      <div className={`flex w-full ${description ? 'items-start' : 'items-center'}`}>
        <div className={`flex-shrink-0 ${description ? 'mt-0.5' : ''}`}>
          {styles.icon}
        </div>
        <div className="ml-3 w-full">
          <h3 className={`text-sm font-semibold ${styles.title}`}>
            {title}
          </h3>
          {description && (
            <div className={`mt-1 text-sm ${styles.description}`}>
              {description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
