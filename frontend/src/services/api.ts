import axios from 'axios';

// API Base Configuration
const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8000';
const GRAPHQL_URL = import.meta.env?.VITE_GRAPHQL_URL || 'http://localhost:4000/graphql';

// Create axios instance for FastAPI recommendation service
const recommendationAPI = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Create axios instance for GraphQL
const graphqlAPI = axios.create({
  baseURL: GRAPHQL_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Add auth interceptor
recommendationAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

graphqlAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Types
export interface User {
  _id: string;
  email: string;
  name: string;
  preferences?: {
    promotions: boolean;
    orderUpdates: boolean;
    recommendations: boolean;
  };
}

export interface Product {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

export interface Recommendation {
  _id: string;
  name: string;
  price: number;
  category: string;
  quantity?: number;
  score?: number;
  reason?: string;
  description?: string;
}

export interface RecommendationResponse {
  userId: string;
  recommendations: Recommendation[];
  timestamp: string;
}

export interface FeedbackPayload {
  userId: string;
  productId: string;
  isPositive: boolean;
  timestamp: string;
}

export interface RecommendationFeedback {
  userId: string;
  productId: string;
  isPositive: boolean;
  timestamp: string;
}

// API Service Class
export class APIService {
  // Recommendation Service Methods
  static async getRecommendations(userId: string): Promise<Recommendation[]> {
    try {
      // First try the FastAPI recommendation service
      const response = await recommendationAPI.get(`/recommendations/${userId}`);
      const data = response.data as RecommendationResponse;
      return data.recommendations;
    } catch (error) {
      console.warn('FastAPI recommendation service unavailable, using fallback');
      // Fallback to mock data if service is unavailable
      return this.getMockRecommendations();
    }
  }

  static async submitFeedback(
    feedback: FeedbackPayload
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await recommendationAPI.post('/recommendations/feedback', feedback);
      return response.data as { success: boolean; message: string };
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      return { success: false, message: 'Failed to submit feedback' };
    }
  }

  static async generateRecommendations(): Promise<Recommendation[]> {
    try {
      const response = await recommendationAPI.post('/test');
      const data = response.data as { recommendations?: Recommendation[] };
      return data.recommendations || [];
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      return this.getMockRecommendations();
    }
  }

  // Health check for recommendation service
  static async checkRecommendationServiceHealth(): Promise<boolean> {
    try {
      const response = await recommendationAPI.get('/');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  // Mock data fallback
  static getMockRecommendations(): Recommendation[] {
    return [
      {
        _id: 'mock-1',
        name: 'Wireless Bluetooth Headphones',
        price: 79.99,
        category: 'Electronics',
        quantity: 15,
        score: 0.95,
        reason: 'Based on your recent electronics purchases',
      },
      {
        _id: 'mock-2',
        name: 'Smartphone Case',
        price: 24.99,
        category: 'Electronics',
        quantity: 32,
        score: 0.88,
        reason: 'Frequently bought together',
      },
      {
        _id: 'mock-3',
        name: 'Portable Power Bank',
        price: 49.99,
        category: 'Electronics',
        quantity: 8,
        score: 0.82,
        reason: 'Popular in your category',
      },
      {
        _id: 'mock-4',
        name: 'Gaming Mechanical Keyboard',
        price: 129.99,
        category: 'Electronics',
        quantity: 5,
        score: 0.78,
        reason: 'Trending in Electronics',
      },
    ];
  }

  // Helper methods for error handling
  static handleError(error: unknown): string {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as {
        response?: {
          data?: { message?: string; detail?: string };
          status?: number;
        };
        request?: unknown;
      };

      if (axiosError.response) {
        return (
          axiosError.response.data?.message ||
          axiosError.response.data?.detail ||
          'Server error occurred'
        );
      } else if (axiosError.request) {
        return 'Unable to connect to server. Please check your internet connection.';
      }
    }
    return 'An unexpected error occurred';
  }
}

// Export the class as apiService for convenience
export const apiService = APIService;

export default APIService;
