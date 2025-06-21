import axios from 'axios';

// Base API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000'; // GraphQL Gateway
const RECOMMENDATION_API_URL =
  process.env.REACT_APP_RECOMMENDATION_API_URL || 'http://localhost:8000'; // FastAPI service

// Create axios instances
const graphqlClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const recommendationClient = axios.create({
  baseURL: RECOMMENDATION_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptors to add auth tokens
const addAuthInterceptor = (client: any) => {
  client.interceptors.request.use(
    (config: any) => {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: any) => {
      return Promise.reject(error);
    }
  );
};

addAuthInterceptor(graphqlClient);
addAuthInterceptor(recommendationClient);

// Response interceptors for error handling
const addErrorInterceptor = (client: any) => {
  client.interceptors.response.use(
    (response: any) => response,
    (error: any) => {
      if (error.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
};

addErrorInterceptor(graphqlClient);
addErrorInterceptor(recommendationClient);

// Types
export interface Product {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

export interface Recommendation extends Product {
  score?: number;
  reason?: string;
  feedbackStats?: {
    positiveCount: number;
    negativeCount: number;
  };
}

export interface RecommendationFeedback {
  userId: string;
  productId: string;
  isPositive: boolean;
  timestamp?: string;
}

export interface User {
  _id: string;
  email: string;
  name: string;
  preferences: {
    promotions: boolean;
    orderUpdates: boolean;
    recommendations: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

// API Service Class
class ApiService {
  // Recommendation Service APIs (FastAPI)
  async getRecommendations(userId: string): Promise<Recommendation[]> {
    try {
      const response = await recommendationClient.get(`/api/v1/recommendations/${userId}`);
      const data = response.data as { recommendations: Recommendation[] };
      return data.recommendations || [];
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      // Return mock data as fallback
      return this.getMockRecommendations();
    }
  }

  async submitRecommendationFeedback(feedback: RecommendationFeedback): Promise<boolean> {
    try {
      await recommendationClient.post('/api/v1/feedback', {
        ...feedback,
        timestamp: feedback.timestamp || new Date().toISOString(),
      });
      return true;
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      return false;
    }
  }

  async triggerRecommendationGeneration(userId: string): Promise<boolean> {
    try {
      await recommendationClient.post('/api/v1/generate', { userId });
      return true;
    } catch (error) {
      console.error('Failed to trigger recommendation generation:', error);
      return false;
    }
  }

  // Product APIs (through GraphQL or direct service)
  async searchProducts(query: string, category?: string): Promise<Product[]> {
    try {
      const searchParams = new URLSearchParams();
      searchParams.append('query', query);
      if (category) {
        searchParams.append('category', category);
      }

      const response = await graphqlClient.get(`/products/search?${searchParams.toString()}`);
      const data = response.data as { products: Product[] };
      return data.products || [];
    } catch (error) {
      console.error('Failed to search products:', error);
      return [];
    }
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      const response = await graphqlClient.get(`/products/category/${category}`);
      const data = response.data as { products: Product[] };
      return data.products || [];
    } catch (error) {
      console.error('Failed to fetch products by category:', error);
      return [];
    }
  }

  // User preference management
  async updateUserPreferences(
    userId: string,
    preferences: Partial<User['preferences']>
  ): Promise<boolean> {
    try {
      await graphqlClient.patch(`/users/${userId}/preferences`, preferences);
      return true;
    } catch (error) {
      console.error('Failed to update user preferences:', error);
      return false;
    }
  }

  // Mock data for development/fallback
  private getMockRecommendations(): Recommendation[] {
    return [
      {
        _id: '1',
        name: 'Wireless Bluetooth Headphones',
        price: 79.99,
        quantity: 50,
        category: 'Electronics',
        score: 0.95,
        reason: 'Based on your recent electronics purchases',
        feedbackStats: { positiveCount: 45, negativeCount: 3 },
      },
      {
        _id: '2',
        name: 'Smartphone Case',
        price: 24.99,
        quantity: 100,
        category: 'Electronics',
        score: 0.88,
        reason: 'Frequently bought together with smartphones',
        feedbackStats: { positiveCount: 32, negativeCount: 5 },
      },
      {
        _id: '3',
        name: 'Portable Power Bank',
        price: 49.99,
        quantity: 75,
        category: 'Electronics',
        score: 0.82,
        reason: 'Popular in your preferred category',
        feedbackStats: { positiveCount: 28, negativeCount: 2 },
      },
      {
        _id: '4',
        name: 'Gaming Mechanical Keyboard',
        price: 129.99,
        quantity: 25,
        category: 'Electronics',
        score: 0.78,
        reason: 'Trending in Electronics',
        feedbackStats: { positiveCount: 15, negativeCount: 1 },
      },
    ];
  }

  // Health check for services
  async healthCheck(): Promise<{ graphql: boolean; recommendations: boolean }> {
    const results = { graphql: false, recommendations: false };

    try {
      await graphqlClient.get('/health');
      results.graphql = true;
    } catch (error) {
      console.warn('GraphQL service health check failed');
    }

    try {
      await recommendationClient.get('/health');
      results.recommendations = true;
    } catch (error) {
      console.warn('Recommendation service health check failed');
    }

    return results;
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
