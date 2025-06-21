import { useQuery } from '@apollo/client';
import React from 'react';
import { Link } from 'react-router-dom';
import { FETCH_ALL_ORDERS, FETCH_ALL_PRODUCTS, FETCH_ALL_USERS } from '../graphql/operations';

interface DashboardProps {
  user: any;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const { data: usersData, loading: usersLoading } = useQuery(FETCH_ALL_USERS);
  const { data: productsData, loading: productsLoading } = useQuery(FETCH_ALL_PRODUCTS);
  const { data: ordersData, loading: ordersLoading } = useQuery(FETCH_ALL_ORDERS);

  const recentOrders = ordersData?.fetchAllOrders?.slice(-5) || [];
  const recentProducts = productsData?.fetchAllProducts?.slice(-5) || [];

  return (
    <div>
      {/* Welcome Section */}
      <div
        className="card mb-4"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center',
        }}
      >
        <h1 style={{ marginBottom: '0.5rem', fontSize: '2.5rem' }}>
          👋 Welcome back, {user?.name}!
        </h1>
        <p style={{ opacity: 0.9, fontSize: '1.2rem', margin: 0 }}>
          Here's what's happening in your e-commerce world
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 mb-4">
        <div className="card stats-card" style={{ borderLeft: '4px solid #3498db' }}>
          <div className="stats-number" style={{ color: '#3498db' }}>
            {usersLoading ? '...' : usersData?.fetchAllUsers?.length || 0}
          </div>
          <div className="stats-label">Total Users</div>
        </div>

        <div className="card stats-card" style={{ borderLeft: '4px solid #27ae60' }}>
          <div className="stats-number" style={{ color: '#27ae60' }}>
            {productsLoading ? '...' : productsData?.fetchAllProducts?.length || 0}
          </div>
          <div className="stats-label">Total Products</div>
        </div>

        <div className="card stats-card" style={{ borderLeft: '4px solid #e74c3c' }}>
          <div className="stats-number" style={{ color: '#e74c3c' }}>
            {ordersLoading ? '...' : ordersData?.fetchAllOrders?.length || 0}
          </div>
          <div className="stats-label">Total Orders</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card mb-4">
        <h3 style={{ color: '#2c3e50', marginBottom: '1rem' }}>🚀 Quick Actions</h3>
        <div className="grid grid-cols-4">
          <Link to="/products" className="btn btn-primary">
            🛍️ Browse Products
          </Link>
          <Link to="/add-product" className="btn btn-success">
            ➕ Add Product
          </Link>
          <Link to="/orders" className="btn btn-secondary">
            📦 View Orders
          </Link>
          <Link
            to="/recommendations"
            className="btn"
            style={{
              background: 'linear-gradient(135deg, #f39c12, #e67e22)',
              color: 'white',
            }}
          >
            🎯 Recommendations
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-2">
        <div className="card">
          <h3 style={{ color: '#2c3e50', marginBottom: '1rem' }}>📦 Recent Orders</h3>
          {ordersLoading ? (
            <div className="loading">Loading orders...</div>
          ) : recentOrders.length > 0 ? (
            <div>
              {recentOrders.map((order: any) => (
                <div
                  key={order._id}
                  style={{
                    padding: '0.75rem',
                    borderBottom: '1px solid #ecf0f1',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', color: '#2c3e50' }}>
                      Order #{order._id.slice(-6)}
                    </div>
                    <div style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>
                      {order.products?.length || 0} items
                    </div>
                  </div>
                  <div
                    style={{
                      background: '#27ae60',
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                    }}
                  >
                    Completed
                  </div>
                </div>
              ))}
              <div style={{ marginTop: '1rem' }}>
                <Link to="/orders" className="btn btn-primary" style={{ width: '100%' }}>
                  View All Orders
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#7f8c8d', padding: '2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
              <p>No orders yet</p>
              <Link to="/products" className="btn btn-primary">
                Start Shopping
              </Link>
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ color: '#2c3e50', marginBottom: '1rem' }}>🆕 Latest Products</h3>
          {productsLoading ? (
            <div className="loading">Loading products...</div>
          ) : recentProducts.length > 0 ? (
            <div>
              {recentProducts.map((product: any) => (
                <div
                  key={product._id}
                  style={{
                    padding: '0.75rem',
                    borderBottom: '1px solid #ecf0f1',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', color: '#2c3e50' }}>{product.name}</div>
                    <div style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>{product.category}</div>
                  </div>
                  <div
                    style={{
                      color: '#27ae60',
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                    }}
                  >
                    ${product.price}
                  </div>
                </div>
              ))}
              <div style={{ marginTop: '1rem' }}>
                <Link to="/products" className="btn btn-primary" style={{ width: '100%' }}>
                  Browse All Products
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#7f8c8d', padding: '2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
              <p>No products available</p>
              <Link to="/add-product" className="btn btn-success">
                Add First Product
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
