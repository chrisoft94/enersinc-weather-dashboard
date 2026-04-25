import { message } from 'antd';

export const handleApiError = (statusCode, context = "la operación") => {
  switch (statusCode) {
    case 401:
      message.error(`No autorizado (401). Verifica tus credenciales de API para ${context}.`);
      break;
    case 403:
      message.error(`Acceso denegado (403) para ${context}.`);
      break;
    case 404:
      message.warning(`Recurso no encontrado (404) al consultar ${context}. Posiblemente la ciudad no existe.`);
      break;
    case 429:
      message.warning(`Demasiadas peticiones (429) a ${context}. Por favor espera un momento.`);
      break;
    case 500:
    case 502:
    case 503:
    case 504:
      message.error(`Error del servidor (${statusCode}). Falló ${context}. El equipo de soporte ha sido notificado.`);
      break;
    default:
      message.error(`Error inesperado (${statusCode}) al realizar ${context}.`);
  }
};
