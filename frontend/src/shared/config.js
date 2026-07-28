/**
 * API base URL — ajuste para produção se a API estiver em outro host.
 * Padrão: mesmo domínio em /api (Hostinger).
 */
export const API_BASE_URL =
  (typeof window !== 'undefined' && window.__API_BASE_URL) ||
  (typeof location !== 'undefined' ? `${location.origin}/api` : '/api');

export const APP_NAME = 'Gimarry Bolos';
