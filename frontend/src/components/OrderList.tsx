import { useQuery } from '@apollo/client';
import React from 'react';
import { FETCH_ALL_ORDERS } from '../graphql/operations';

interface Order {
  _id: string;
  userId: string;
  products: Array<{
    _id: string;
    quantity: number;
    name?: string;
    category?: string;
    price?: number;
  }>;
}

const OrderList: React.FC = () => {
  const { data, loading, error } = useQuery(FETCH_ALL_ORDERS);

  if (loading) return <div className="loading">Loading orders...</div>;
  if (error) return <div className="error">Error loading orders: {error.message}</div>;

  return (
    <div>
      <h1>Your Orders</h1>

      {data?.fetchAllOrders?.length === 0 ? (
        <div className="card">
          <p>You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1">
          {data?.fetchAllOrders?.map((order: Order) => (
            <div key={order._id} className="card">
              <h3 style={{ marginBottom: '1rem', color: '#2c3e50' }}>
                Order #{order._id.slice(-8)}
              </h3>

              <div className="grid grid-cols-1" style={{ gap: '0.5rem' }}>
                {order.products.map((product, index) => (
                  <div
                    key={`${product._id}-${index}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '4px',
                    }}
                  >
                    <div>
                      <strong>{product.name || `Product ${product._id}`}</strong>
                      {product.category && (
                        <div style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>
                          {product.category}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div>Quantity: {product.quantity}</div>
                      {product.price && (
                        <div style={{ color: '#27ae60', fontWeight: 'bold' }}>
                          ${(product.price * product.quantity).toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: '1rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid #eee',
                  textAlign: 'right',
                }}
              >
                <strong style={{ color: '#2c3e50' }}>
                  Total: $
                  {order.products
                    .reduce((total, product) => total + (product.price || 0) * product.quantity, 0)
                    .toFixed(2)}
                </strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderList;
