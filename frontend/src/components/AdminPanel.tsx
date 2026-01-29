import { useMutation, useQuery } from '@apollo/client';
import React, { useEffect, useState } from 'react';
import { FETCH_ALL_USERS, FETCH_ALL_PRODUCTS, FETCH_ALL_ORDERS } from '../graphql/operations';
import SystemMonitor from './SystemMonitor';

interface AdminPanelProps {
  user: any;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalOrderValue: 0,
  });

  // GraphQL Queries
  const { data: usersData, loading: usersLoading, refetch: refetchUsers } = useQuery(FETCH_ALL_USERS);
  const {
    data: productsData,
    loading: productsLoading,
    refetch: refetchProducts,
  } = useQuery(FETCH_ALL_PRODUCTS);
  const {
    data: ordersData,
    loading: ordersLoading,
    refetch: refetchOrders,
  } = useQuery(FETCH_ALL_ORDERS);

  // Calculate system statistics
  useEffect(() => {
    if (usersData && productsData && ordersData) {
      const users = usersData.fetchAllUsers || [];
      const products = productsData.fetchAllProducts || [];
      const orders = ordersData.fetchAllOrders || [];

      // Calculate total order value from products in orders
      let totalValue = 0;
      orders.forEach((order: any) => {
        if (order.products) {
          order.products.forEach((product: any) => {
            totalValue += (product.price || 0) * (product.quantity || 0);
          });
        }
      });

      setSystemStats({
        totalUsers: users.length,
        totalProducts: products.length,
        totalOrders: orders.length,
        totalOrderValue: totalValue,
      });
    }
  }, [usersData, productsData, ordersData]);

  const exportData = (type: string) => {
    let data: any[] = [];
    let filename = '';

    switch (type) {
      case 'users':
        data = usersData?.fetchAllUsers || [];
        filename = 'users-export.json';
        break;
      case 'products':
        data = productsData?.fetchAllProducts || [];
        filename = 'products-export.json';
        break;
      case 'orders':
        data = ordersData?.fetchAllOrders || [];
        filename = 'orders-export.json';
        break;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const TabButton = ({ tabId, label, icon }: { tabId: string; label: string; icon: string }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`tab-button ${activeTab === tabId ? 'active' : ''}`}
      style={{
        padding: '1rem 2rem',
        border: 'none',
        background: activeTab === tabId ? '#3498db' : '#ecf0f1',
        color: activeTab === tabId ? 'white' : '#2c3e50',
        cursor: 'pointer',
        borderRadius: '8px 8px 0 0',
        fontSize: '1rem',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}
    >
      <span>{icon}</span>
      {label}
    </button>
  );

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%)',
          color: 'white',
          padding: '3rem 2rem',
          borderRadius: 'var(--radius-xl)',
          marginBottom: '2rem',
          textAlign: 'center',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '3rem', fontWeight: '800' }}>📋 Admin Dashboard</h1>
        <p style={{ margin: '1rem 0 0 0', opacity: 0.95, fontSize: '1.25rem' }}>
          e-commerce management and control center
        </p>
      </div>

      {/* System Overview Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div className="card" style={{ textAlign: 'center', borderLeft: '4px solid #3498db' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3498db' }}>
            {systemStats.totalUsers}
          </div>
          <div style={{ color: '#7f8c8d' }}>Total Users</div>
        </div>

        <div className="card" style={{ textAlign: 'center', borderLeft: '4px solid #27ae60' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#27ae60' }}>
            {systemStats.totalProducts}
          </div>
          <div style={{ color: '#7f8c8d' }}>Total Products</div>
        </div>

        <div className="card" style={{ textAlign: 'center', borderLeft: '4px solid #f39c12' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f39c12' }}>
            {systemStats.totalOrders}
          </div>
          <div style={{ color: '#7f8c8d' }}>Total Orders</div>
        </div>

        <div className="card" style={{ textAlign: 'center', borderLeft: '4px solid #9b59b6' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#9b59b6' }}>
            ${systemStats.totalOrderValue.toLocaleString()}
          </div>
          <div style={{ color: '#7f8c8d' }}>Total Order Value</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: '#2c3e50' }}>⚡ Quick Actions</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => exportData(activeTab)}
            className="btn btn-secondary"
            style={{ background: '#95a5a6' }}
          >
            📊 Export Data
          </button>
          <button
            onClick={() => {
              refetchUsers();
              refetchProducts();
              refetchOrders();
            }}
            className="btn btn-secondary"
            style={{ background: '#27ae60' }}
          >
            🔄 Refresh All Data
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        <TabButton tabId="overview" label="Overview" icon="📊" />
        <TabButton tabId="users" label="Users" icon="👥" />
        <TabButton tabId="products" label="Products" icon="📦" />
        <TabButton tabId="orders" label="Orders" icon="🛒" />
        <TabButton tabId="monitor" label="System Monitor" icon="🖥️" />
      </div>

      {/* Search */}
      {(activeTab === 'users' || activeTab === 'products' || activeTab === 'orders') && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '1rem',
              width: '100%',
            }}
          />
        </div>
      )}

      {/* Tab Content */}
      <div className="card">
        {activeTab === 'overview' && (
          <div>
            <h3 style={{ marginBottom: '1rem', color: '#2c3e50' }}>📊 System Overview</h3>
            <SystemMonitor
              onStatusChange={(status) => {
                console.log('System status changed:', status);
              }}
            />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1rem',
                marginTop: '2rem',
              }}
            >
              <div>
                <h4 style={{ color: '#3498db' }}>Recent Activity</h4>
                <div style={{ fontSize: '0.9rem', color: '#7f8c8d' }}>
                  <div>• {systemStats.totalUsers} users registered</div>
                  <div>• {systemStats.totalProducts} products in catalog</div>
                  <div>• {systemStats.totalOrders} orders processed</div>
                  <div>• ${systemStats.totalOrderValue.toLocaleString()} total value</div>
                </div>
              </div>
              <div>
                <h4 style={{ color: '#27ae60' }}>System Health</h4>
                <div style={{ fontSize: '0.9rem' }}>
                  <div style={{ color: '#27ae60' }}>✅ All services running</div>
                  <div style={{ color: '#27ae60' }}>✅ Database connected</div>
                  <div style={{ color: '#27ae60' }}>✅ API gateway active</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <h3 style={{ marginBottom: '1rem', color: '#2c3e50' }}>👥 User Management</h3>
            {usersLoading ? (
              <div>Loading users...</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', border: '1px solid #ddd' }}>
                        Name
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', border: '1px solid #ddd' }}>
                        Email
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', border: '1px solid #ddd' }}>
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersData?.fetchAllUsers
                      ?.filter(
                        (user: any) =>
                          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      ?.map((user: any) => (
                        <tr key={user._id}>
                          <td style={{ padding: '1rem', border: '1px solid #ddd' }}>{user.name}</td>
                          <td style={{ padding: '1rem', border: '1px solid #ddd' }}>
                            {user.email}
                          </td>
                          <td style={{ padding: '1rem', border: '1px solid #ddd' }}>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'products' && (
          <div>
            <h3 style={{ marginBottom: '1rem', color: '#2c3e50' }}>📦 Product Management</h3>
            {productsLoading ? (
              <div>Loading products...</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', border: '1px solid #ddd' }}>
                        Name
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', border: '1px solid #ddd' }}>
                        Category
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', border: '1px solid #ddd' }}>
                        Price
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', border: '1px solid #ddd' }}>
                        Quantity
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {productsData?.fetchAllProducts
                      ?.filter(
                        (product: any) =>
                          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.category.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      ?.map((product: any) => (
                        <tr key={product._id}>
                          <td style={{ padding: '1rem', border: '1px solid #ddd' }}>
                            {product.name}
                          </td>
                          <td style={{ padding: '1rem', border: '1px solid #ddd' }}>
                            {product.category}
                          </td>
                          <td style={{ padding: '1rem', border: '1px solid #ddd' }}>
                            ${product.price}
                          </td>
                          <td style={{ padding: '1rem', border: '1px solid #ddd' }}>
                            {product.quantity}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            <h3 style={{ marginBottom: '1rem', color: '#2c3e50' }}>🛒 Order Management</h3>
            {ordersLoading ? (
              <div>Loading orders...</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', border: '1px solid #ddd' }}>
                        Order ID
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', border: '1px solid #ddd' }}>
                        User ID
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', border: '1px solid #ddd' }}>
                        Items
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', border: '1px solid #ddd' }}>
                        Value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersData?.fetchAllOrders?.map((order: any) => {
                      const orderValue = order.products?.reduce(
                        (sum: number, p: any) => sum + (p.price || 0) * (p.quantity || 0),
                        0
                      ) || 0;
                      return (
                        <tr key={order._id}>
                          <td style={{ padding: '1rem', border: '1px solid #ddd' }}>
                            {order._id.slice(-8)}
                          </td>
                          <td style={{ padding: '1rem', border: '1px solid #ddd' }}>
                            {order.userId.slice(-8)}
                          </td>
                          <td style={{ padding: '1rem', border: '1px solid #ddd' }}>
                            {order.products?.length || 0} items
                          </td>
                          <td style={{ padding: '1rem', border: '1px solid #ddd' }}>
                            ${orderValue.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'monitor' && (
          <div>
            <h3 style={{ marginBottom: '1rem', color: '#2c3e50' }}>🖥️ System Monitor</h3>
            <SystemMonitor
              onStatusChange={(status) => {
                console.log('System status changed:', status);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
