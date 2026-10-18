/**
 * Smart Parking AI - Frontend API Configuration
 * Centralized configuration for FastAPI backend communication.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  HEALTH: `${API_BASE_URL}/health`,
  ANALYZE: `${API_BASE_URL}/analyze`,
};
