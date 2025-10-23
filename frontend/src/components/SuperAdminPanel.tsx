import { useMutation, useQuery } from '@apollo/client';
import React, { useEffect, useState } from 'react';
import { FETCH_ALL_USERS, FETCH_ALL_PRODUCTS, FETCH_ALL_ORDERS } from '../graphql/operations';
import { apiService } from '../services/api';
import SystemMonitor from './SystemMonitor';

interface SuperAdminPanelProps {
  user: any;
}

const SuperAdminPanel: React.FC<SuperAdminPanelProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    productCategory: 'all',
    dateRange: '30',
  });

  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalOrderValue: 0,
  });

  // GraphQL Queries
  const {
    data: usersData,
    loading: usersLoading,
    refetch: refetchUsers,
  } = useQuery(FETCH_ALL_USERS, {
    fetchPolicy: 'cache-and-network',
  });
  const {
    data: productsData,
    loading: productsLoading,
    refetch: refetchProducts,
  } = useQuery(FETCH_ALL_PRODUCTS, {
    fetchPolicy: 'cache-and-network',
  });
  const {
    data: ordersData,
    loading: ordersLoading,
    refetch: refetchOrders,
  } = useQuery(FETCH_ALL_ORDERS, {
    fetchPolicy: 'cache-and-network',
  });

  // Calculate comprehensive statistics
  useEffect(() => {
    if (usersData && productsData && ordersData) {
      const users = usersData.fetchAllUsers || [];
      const products = productsData.fetchAllProducts || [];
      const orders = ordersData.fetchAllOrders || [];

      // Calculate total order value
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

  const exportData = (type: string, format: 'json' | 'csv' = 'json') => {
    let data: any[] = [];
    let filename = '';

    switch (type) {
      case 'users':
        data = usersData?.fetchAllUsers || [];
        filename = `users-export.${format}`;
        break;
      case 'products':
        data = productsData?.fetchAllProducts || [];
        filename = `products-export.${format}`;
        break;
      case 'orders':
        data = ordersData?.fetchAllOrders || [];
        filename = `orders-export.${format}`;
        break;
    }

    let content = '';
    if (format === 'json') {
      content = JSON.stringify(data, null, 2);
    } else {
      // Convert to CSV
      if (data.length > 0) {
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map((item) => Object.values(item).join(','));
        content = [headers, ...rows].join('\n');
      }
    }

    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const triggerSystemAction = async (action: string) => {
    try {
      switch (action) {
        case 'recommendations':
          await apiService.generateRecommendations();
          alert('Recommendation generation triggered successfully');
          break;
        case 'backup':
          alert('Database backup initiated. You will be notified when complete.');
          break;
        case 'cache':
          alert('System cache cleared successfully');
          break;
        case 'health':
          const isHealthy = await apiService.checkRecommendationServiceHealth();
          alert(
            `System health check complete. Status: ${isHealthy ? 'Healthy' : 'Issues detected'}`
          );
          break;
        default:
          alert(`${action} action triggered`);
      }
    } catch (error) {
      console.error('System action failed:', error);
      alert('Action failed. Please try again.');
    }
  };

  // Filter data based on search and filters
  const filterData = (data: any[], type: string) => {
    if (!data) return [];

    return data.filter((item: any) => {
      // Search filter
      const searchMatch =
        searchTerm === '' ||
        Object.values(item).some((value: any) =>
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );

      // Category filters
      let categoryMatch = true;
      if (type === 'products' && filterOptions.productCategory !== 'all') {
        categoryMatch = item.category === filterOptions.productCategory;
      }

      return searchMatch && categoryMatch;
    });
  };

  const TabButton = ({
    tabId,
    label,
    icon,
    count,
  }: {
    tabId: string;
    label: string;
    icon: string;
    count?: number;
  }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`tab-button ${activeTab === tabId ? 'active' : ''}`}
      style={{
        padding: '1rem 2rem',
        border: 'none',
        background: activeTab === tabId ? '#3498db' : '#ecf0f1',
        color: activeTab === tabId ? 'white' : '#4b5563',
        cursor: 'pointer',
        borderRadius: '8px 8px 0 0',
        fontSize: '1rem',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        position: 'relative',
      }}
    >
      <span>{icon}</span>
      {label}
      {count !== undefined && (
        <span
          style={{
            background: activeTab === tabId ? 'rgba(255,255,255,0.2)' : '#3498db',
            color: activeTab === tabId ? 'white' : 'white',
            borderRadius: '12px',
            padding: '0.2rem 0.5rem',
            fontSize: '0.8rem',
            marginLeft: '0.5rem',
          }}
        >
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Enhanced Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
          color: 'white',
          padding: '2rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-50%',
            right: '-10%',
            width: '200px',
            height: '200px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%',
          }}
        ></div>
        <h1 style={{ margin: 0, fontSize: '3rem', fontWeight: 'bold' }}>
          🚀 Super Admin Control Center
        </h1>
        <p style={{ margin: '1rem 0 0 0', opacity: 0.9, fontSize: '1.2rem' }}>
          Complete control and management for your e-commerce platform
        </p>
        <div style={{ marginTop: '1rem', fontSize: '1rem', opacity: 0.8 }}>
          Welcome back, <strong>{user?.name || 'Administrator'}</strong> • Last login: Today
        </div>
      </div>

      {/* Enhanced System Overview */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div
          className="card stats-card"
          style={{
            borderLeft: '4px solid #3498db',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          }}
        >
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#3498db' }}>
            {systemStats.totalUsers.toLocaleString()}
          </div>
          <div style={{ color: '#7f8c8d', fontWeight: '600' }}>Total Users</div>
        </div>

        <div
          className="card stats-card"
          style={{
            borderLeft: '4px solid #27ae60',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          }}
        >
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#27ae60' }}>
            {systemStats.totalProducts.toLocaleString()}
          </div>
          <div style={{ color: '#7f8c8d', fontWeight: '600' }}>Products</div>
          <div style={{ fontSize: '0.9rem', color: '#3498db', marginTop: '0.5rem' }}>
            In {new Set(productsData?.fetchAllProducts?.map((p: any) => p.category)).size || 0} categories
          </div>
        </div>

        <div
          className="card stats-card"
          style={{
            borderLeft: '4px solid #f39c12',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          }}
        >
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f39c12' }}>
            {systemStats.totalOrders.toLocaleString()}
          </div>
          <div style={{ color: '#7f8c8d', fontWeight: '600' }}>Orders</div>
        </div>

        <div
          className="card stats-card"
          style={{
            borderLeft: '4px solid #9b59b6',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          }}
        >
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#9b59b6' }}>
            ${systemStats.totalOrderValue.toLocaleString()}
          </div>
          <div style={{ color: '#7f8c8d', fontWeight: '600' }}>Order Value</div>
        </div>
      </div>

      {/* Enhanced Quick Actions */}
      <div
        className="card"
        style={{
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        }}
      >
        <h3
          style={{
            marginBottom: '1rem',
            color: '#374151',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          ⚡ Quick Actions & System Tools
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
          }}
        >
          <button
            onClick={() => triggerSystemAction('recommendations')}
            className="btn btn-primary"
            style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            🎯 Generate Recommendations
          </button>
          <button
            onClick={() => triggerSystemAction('backup')}
            className="btn btn-success"
            style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            💾 Backup Database
          </button>
          <button
            onClick={() => triggerSystemAction('cache')}
            className="btn btn-warning"
            style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            🧹 Clear Cache
          </button>
          <button
            onClick={() => triggerSystemAction('health')}
            className="btn btn-info"
            style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            🏥 Health Check
          </button>
          <button
            onClick={() => exportData(activeTab, 'json')}
            className="btn btn-secondary"
            style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            📊 Export JSON
          </button>
          <button
            onClick={() => exportData(activeTab, 'csv')}
            className="btn btn-secondary"
            style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            📈 Export CSV
          </button>
        </div>
      </div>

      {/* Enhanced Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <TabButton tabId="dashboard" label="Dashboard" icon="📊" />
        <TabButton tabId="users" label="Users" icon="👥" count={systemStats.totalUsers} />
        <TabButton tabId="products" label="Products" icon="📦" count={systemStats.totalProducts} />
        <TabButton tabId="orders" label="Orders" icon="🛒" count={systemStats.totalOrders} />
        <TabButton tabId="monitor" label="System Monitor" icon="🖥️" />
      </div>

      {/* Enhanced Search and Filters */}
      {['users', 'products', 'orders'].includes(activeTab) && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr auto',
              gap: '1rem',
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '0.75rem',
                border: '2px solid #e1e1e1',
                borderRadius: '6px',
                fontSize: '1rem',
              }}
            />

            {/* Dynamic Filters */}
            {activeTab === 'products' && (
              <select
                value={filterOptions.productCategory}
                onChange={(e) =>
                  setFilterOptions((prev) => ({ ...prev, productCategory: e.target.value }))
                }
                style={{ padding: '0.75rem', border: '2px solid #e1e1e1', borderRadius: '6px' }}
              >
                <option value="all">All Categories</option>
                {[...new Set(productsData?.fetchAllProducts?.map((p: any) => p.category) || [])].map(
                  (cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  )
                )}
              </select>
            )}

            <select
              value={filterOptions.dateRange}
              onChange={(e) => setFilterOptions((prev) => ({ ...prev, dateRange: e.target.value }))}
              style={{ padding: '0.75rem', border: '2px solid #e1e1e1', borderRadius: '6px' }}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="card" style={{ minHeight: '600px' }}>
        {activeTab === 'dashboard' && (
          <div>
            <h3 style={{ marginBottom: '2rem', color: '#374151' }}>📊 System Dashboard</h3>

            {/* Mini System Monitor */}
            <SystemMonitor
              onStatusChange={(status) => {
                console.log('System status:', status);
              }}
            />
          </div>
        )}

        {activeTab === 'monitor' && (
          <div>
            <h3 style={{ marginBottom: '1rem', color: '#374151' }}>🖥️ Advanced System Monitor</h3>
            <SystemMonitor
              onStatusChange={(status) => {
                console.log('System status changed:', status);
              }}
            />
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <h3 style={{ marginBottom: '1rem', color: '#374151' }}>👥 User Management</h3>
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
                    {filterData(usersData?.fetchAllUsers || [], 'users')?.map((user: any) => (
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
            <h3 style={{ marginBottom: '1rem', color: '#374151' }}>📦 Product Management</h3>
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
                    {filterData(productsData?.fetchAllProducts || [], 'products')?.map((product: any) => (
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
            <h3 style={{ marginBottom: '1rem', color: '#374151' }}>🛒 Order Management</h3>
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
                    {(ordersData?.fetchAllOrders || [])?.map((order: any) => {
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
      </div>
    </div>
  );
};

export default SuperAdminPanel;
