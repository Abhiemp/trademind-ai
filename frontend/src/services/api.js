import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export const checkHealth = async () => {
  try {
    const response = await apiClient.get('/health');
    return { data: response.data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error.response?.data?.message || error.message || 'Cannot reach TradeMind backend server',
    };
  }
};

export const searchStocks = async (query = '') => {
  try {
    const response = await apiClient.get('/stocks/search', {
      params: { q: query },
    });
    return { data: response.data, error: null };
  } catch (error) {
    return {
      data: [],
      error: error.response?.data?.detail || error.message || 'Error searching stocks',
    };
  }
};

export const getStockQuote = async (symbol) => {
  try {
    const response = await apiClient.get(`/stocks/${encodeURIComponent(symbol)}/quote`);
    return { data: response.data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error.response?.data?.detail || error.message || `Error fetching quote for ${symbol}`,
    };
  }
};

export const getStockHistory = async (symbol, period = '6mo', interval = '1d') => {
  try {
    const response = await apiClient.get(`/stocks/${encodeURIComponent(symbol)}/history`, {
      params: { period, interval },
    });
    return { data: response.data, error: null };
  } catch (error) {
    return {
      data: [],
      error: error.response?.data?.detail || error.message || `Error fetching history for ${symbol}`,
    };
  }
};

export const getStockIndicators = async (symbol, period = '6mo') => {
  try {
    const response = await apiClient.get(`/stocks/${encodeURIComponent(symbol)}/indicators`, {
      params: { period },
    });
    return { data: response.data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error.response?.data?.detail || error.message || `Error calculating indicators for ${symbol}`,
    };
  }
};

export const sendChatMessage = async (messages, symbol = null) => {
  try {
    const response = await apiClient.post('/agent/chat', {
      messages,
      symbol,
    });
    return { data: response.data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error.response?.data?.detail || error.message || 'Error communicating with AI Financial Analyst',
    };
  }
};

export const getPromptSuggestions = async () => {
  try {
    const response = await apiClient.get('/agent/prompts');
    return { data: response.data, error: null };
  } catch (error) {
    return {
      data: [],
      error: error.response?.data?.detail || error.message || 'Error fetching prompts',
    };
  }
};

export const getPortfolio = async () => {
  try {
    const response = await apiClient.get('/portfolio');
    return { data: response.data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error.response?.data?.detail || error.message || 'Error fetching portfolio summary',
    };
  }
};

export const placeOrder = async ({ symbol, transaction_type, quantity, notes = null }) => {
  try {
    const response = await apiClient.post('/portfolio/order', {
      symbol,
      transaction_type,
      quantity: Number(quantity),
      notes,
    });
    return { data: response.data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error.response?.data?.detail || error.message || 'Order execution failed',
    };
  }
};

export const getTransactions = async (limit = 50) => {
  try {
    const response = await apiClient.get('/portfolio/transactions', {
      params: { limit },
    });
    return { data: response.data, error: null };
  } catch (error) {
    return {
      data: [],
      error: error.response?.data?.detail || error.message || 'Error fetching transactions',
    };
  }
};

export const resetPortfolio = async () => {
  try {
    const response = await apiClient.post('/portfolio/reset');
    return { data: response.data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error.response?.data?.detail || error.message || 'Error resetting portfolio',
    };
  }
};

export const runBacktest = async (params) => {
  try {
    const response = await apiClient.post('/backtest/run', params);
    return { data: response.data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error.response?.data?.detail || error.message || 'Error executing strategy backtest',
    };
  }
};

export default apiClient;
