import React, { useEffect, useState } from 'react';
import { apiService, Recommendation, RecommendationFeedback } from '../services/api';

interface User {
  _id: string;
  email: string;
  name: string;
}

interface RecommendationCenterProps {
  user: User | null;
}

const RecommendationCenter: React.FC<RecommendationCenterProps> = ({ user }) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ [key: string]: boolean | null }>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchRecommendations = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const recs = await apiService.getRecommendations(user._id);
      setRecommendations(recs);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRecommendations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleFeedback = async (productId: string, isPositive: boolean) => {
    if (!user) return;

    try {
      const feedbackData: RecommendationFeedback = {
        userId: user._id,
        productId,
        isPositive,
        timestamp: new Date().toISOString(),
      };

      const result = await apiService.submitFeedback(feedbackData);

      if (result.success) {
        setFeedback((prev) => ({
          ...prev,
          [productId]: isPositive,
        }));

        // Show success message
        console.log(`Feedback recorded: ${isPositive ? 'liked' : 'disliked'} product ${productId}`);
      } else {
        console.error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const triggerNewRecommendations = async () => {
    if (!user) return;

    setIsGenerating(true);
    try {
      const newRecommendations = await apiService.generateRecommendations();
      if (newRecommendations && newRecommendations.length > 0) {
        setRecommendations(newRecommendations);
      } else {
        // Fallback to fetching existing recommendations
        await fetchRecommendations();
      }
    } catch (error) {
      console.error('Failed to trigger new recommendations:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return '#7f8c8d';
    if (score >= 0.9) return '#27ae60';
    if (score >= 0.8) return '#f39c12';
    return '#e74c3c';
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading personalized recommendations...
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
          }}
        >
          <div>
            <h1 style={{ color: '#2c3e50', marginBottom: '0.5rem' }}>
              🎯 Personalized Recommendations
            </h1>
            <p style={{ color: '#7f8c8d', fontSize: '1.1rem', margin: 0 }}>
              Discover products tailored just for you, {user?.name}
            </p>
          </div>
          <button
            onClick={triggerNewRecommendations}
            disabled={isGenerating}
            className="btn btn-primary"
            style={{ minWidth: '150px' }}
          >
            {isGenerating ? (
              <>
                <span
                  className="spinner"
                  style={{ width: '16px', height: '16px', marginRight: '8px' }}
                ></span>
                Generating...
              </>
            ) : (
              '🔄 Refresh'
            )}
          </button>
        </div>
      </div>

      {recommendations.length === 0 ? (
        <div className="card text-center">
          <h3>No recommendations available</h3>
          <p style={{ color: '#7f8c8d' }}>
            Start shopping to get personalized product recommendations!
          </p>
        </div>
      ) : (
        <>
          <div className="alert alert-info mb-3">
            <strong>💡 How it works:</strong> Our AI analyzes your purchase history and preferences
            to suggest products you might love. Give feedback to improve future recommendations!
          </div>

          <div className="grid grid-cols-2">
            {recommendations.map((product) => (
              <div key={product._id} className="card recommendation-card">
                <div className="product-image">📦</div>
                <div className="product-content">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '1rem',
                    }}
                  >
                    <div className="recommendation-badge">Recommended</div>
                    {product.score && (
                      <div
                        style={{
                          color: getScoreColor(product.score),
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                        }}
                      >
                        {Math.round(product.score * 100)}% Match
                      </div>
                    )}
                  </div>

                  <h3 className="product-title">{product.name}</h3>
                  <div className="product-price">${product.price}</div>
                  <span className="product-category">{product.category}</span>

                  {product.reason && (
                    <p
                      style={{
                        color: '#7f8c8d',
                        fontSize: '0.9rem',
                        fontStyle: 'italic',
                        marginBottom: '1rem',
                      }}
                    >
                      {product.reason}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button className="btn btn-primary" style={{ flex: 1 }}>
                      Add to Cart
                    </button>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleFeedback(product._id, true)}
                        style={{
                          background: feedback[product._id] === true ? '#27ae60' : '#ecf0f1',
                          color: feedback[product._id] === true ? 'white' : '#7f8c8d',
                          border: 'none',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '1.2rem',
                        }}
                        title="I like this recommendation"
                      >
                        👍
                      </button>
                      <button
                        onClick={() => handleFeedback(product._id, false)}
                        style={{
                          background: feedback[product._id] === false ? '#e74c3c' : '#ecf0f1',
                          color: feedback[product._id] === false ? 'white' : '#7f8c8d',
                          border: 'none',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '1.2rem',
                        }}
                        title="I don't like this recommendation"
                      >
                        👎
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card mt-4">
            <h3 style={{ color: '#2c3e50', marginBottom: '1rem' }}>📊 Recommendation Insights</h3>
            <div className="grid grid-cols-3">
              <div className="text-center">
                <div style={{ fontSize: '2rem', color: '#3498db', fontWeight: 'bold' }}>
                  {recommendations.length}
                </div>
                <div style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>Total Recommendations</div>
              </div>
              <div className="text-center">
                <div style={{ fontSize: '2rem', color: '#27ae60', fontWeight: 'bold' }}>
                  {Math.round(
                    (recommendations.reduce((sum, r) => sum + (r.score || 0), 0) /
                      recommendations.length) *
                      100
                  )}
                  %
                </div>
                <div style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>Average Match Score</div>
              </div>
              <div className="text-center">
                <div style={{ fontSize: '2rem', color: '#f39c12', fontWeight: 'bold' }}>
                  {new Set(recommendations.map((r) => r.category)).size}
                </div>
                <div style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>Categories Covered</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RecommendationCenter;
