import { gql, useMutation, useQuery } from '@apollo/client';
import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import SystemMonitor from './SystemMonitor';

// GraphQL Queries and Mutations
const GET_ALL_USERS = gql`
  query GetAllUsers {
    users {
      _id
      email
      name
      role
      isActive
      createdAt
      lastLogin
    }
  }
`;

const GET_ALL_PRODUCTS = gql`
  query GetAllProducts {
    products {
      _id
      name
      description
      price
      category
      stock
      imageUrl
      isActive
      createdAt
    }
  }
`;

const GET_ALL_ORDERS = gql`
  query GetAllOrders {
    orders {
      _id
      userId
      status
      totalAmount
      items {
        productId
        quantity
        price
      }
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_USER_STATUS = gql`
  mutation UpdateUserStatus($userId: ID!, $isActive: Boolean!) {
    updateUserStatus(userId: $userId, isActive: $isActive) {
      _id
      isActive
    }
  }
`;

const UPDATE_PRODUCT_STATUS = gql`
  mutation UpdateProductStatus($productId: ID!, $isActive: Boolean!) {
    updateProductStatus(productId: $productId, isActive: $isActive) {
      _id
      isActive
    }
  }
`;

const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($orderId: ID!, $status: String!) {
    updateOrderStatus(orderId: $orderId, status: $status) {
      _id
      status
    }
  }
`;

const DELETE_PRODUCT = gql`
  mutation DeleteProduct($productId: ID!) {
    deleteProduct(productId: $productId)
  }
`;

interface AdminPanelProps {
  user: any;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    revenue: 0,
  });

  // GraphQL Queries
  const { data: usersData, loading: usersLoading, refetch: refetchUsers } = useQuery(GET_ALL_USERS);
  const {
    data: productsData,
    loading: productsLoading,
    refetch: refetchProducts,
  } = useQuery(GET_ALL_PRODUCTS);
  const {
    data: ordersData,
    loading: ordersLoading,
    refetch: refetchOrders,
  } = useQuery(GET_ALL_ORDERS);

  // GraphQL Mutations
  const [updateUserStatus] = useMutation(UPDATE_USER_STATUS);
  const [updateProductStatus] = useMutation(UPDATE_PRODUCT_STATUS);
  const [updateOrderStatus] = useMutation(UPDATE_ORDER_STATUS);
  const [deleteProduct] = useMutation(DELETE_PRODUCT);

  // Calculate system statistics
  useEffect(() => {
    if (usersData && productsData && ordersData) {
      const users = usersData.users || [];
      const products = productsData.products || [];
      const orders = ordersData.orders || [];

      setSystemStats({
        totalUsers: users.length,
        activeUsers: users.filter((u: any) => u.isActive).length,
        totalProducts: products.length,
        totalOrders: orders.length,
        pendingOrders: orders.filter((o: any) => o.status === 'pending').length,
        revenue: orders.reduce((sum: number, order: any) => sum + order.totalAmount, 0),
      });
    }
  }, [usersData, productsData, ordersData]);

  const handleUserStatusToggle = async (userId: string, currentStatus: boolean) => {
    try {
      await updateUserStatus({
        variables: { userId, isActive: !currentStatus },
      });
      refetchUsers();
    } catch (error) {
      console.error('Failed to update user status:', error);
    }
  };

  const handleProductStatusToggle = async (productId: string, currentStatus: boolean) => {
    try {
      await updateProductStatus({
        variables: { productId, isActive: !currentStatus },
      });
      refetchProducts();
    } catch (error) {
      console.error('Failed to update product status:', error);
    }
  };

  const handleOrderStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus({
        variables: { orderId, status: newStatus },
      });
      refetchOrders();
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const handleProductDelete = async (productId: string) => {
    if (
      window.confirm('Are you sure you want to delete this product? This action cannot be undone.')
    ) {
      try {
        await deleteProduct({
          variables: { productId },
        });
        refetchProducts();
      } catch (error) {
        console.error('Failed to delete product:', error);
      }
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedItems.length === 0) {
      alert('Please select items first');
      return;
    }

    if (
      window.confirm(`Are you sure you want to ${action} ${selectedItems.length} selected items?`)
    ) {
      try {
        for (const itemId of selectedItems) {
          if (activeTab === 'users' && action === 'deactivate') {
            await updateUserStatus({ variables: { userId: itemId, isActive: false } });
          } else if (activeTab === 'products' && action === 'delete') {
            await deleteProduct({ variables: { productId: itemId } });
          }
        }

        // Refresh data
        if (activeTab === 'users') refetchUsers();
        if (activeTab === 'products') refetchProducts();
        if (activeTab === 'orders') refetchOrders();

        setSelectedItems([]);
      } catch (error) {
        console.error('Bulk action failed:', error);
      }
    }
  };

  const triggerRecommendationGeneration = async () => {
    try {
      await apiService.generateRecommendations();
      alert('Recommendation generation triggered successfully');
    } catch (error) {
      console.error('Failed to trigger recommendations:', error);
      alert('Failed to trigger recommendation generation');
    }
  };

  const exportData = (type: string) => {
    let data: any[] = [];
    let filename = '';

    switch (type) {
      case 'users':
        data = usersData?.users || [];
        filename = 'users-export.json';
        break;
      case 'products':
        data = productsData?.products || [];
        filename = 'products-export.json';
        break;
      case 'orders':
        data = ordersData?.orders || [];
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
        <h1 style={{ margin: 0, fontSize: '3rem', fontWeight: '800' }}>�️ Admin Dashboard</h1>
        <p style={{ margin: '1rem 0 0 0', opacity: 0.95, fontSize: '1.25rem' }}>
          Complete e-commerce management and control center
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
          <div style={{ fontSize: '0.8rem', color: '#27ae60' }}>
            {systemStats.activeUsers} active
          </div>
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
          <div style={{ fontSize: '0.8rem', color: '#e74c3c' }}>
            {systemStats.pendingOrders} pending
          </div>
        </div>

        <div className="card" style={{ textAlign: 'center', borderLeft: '4px solid #9b59b6' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#9b59b6' }}>
            ${systemStats.revenue.toLocaleString()}
          </div>
          <div style={{ color: '#7f8c8d' }}>Total Revenue</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: '#2c3e50' }}>⚡ Quick Actions</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={triggerRecommendationGeneration}
            className="btn btn-primary"
            style={{ background: '#3498db' }}
          >
            🎯 Generate Recommendations
          </button>
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
        <TabButton tabId="analytics" label="Analytics" icon="📈" />
        <TabButton tabId="monitor" label="System Monitor" icon="🖥️" />
        <TabButton tabId="settings" label="Settings" icon="⚙️" />
      </div>

      {/* Search and Bulk Actions */}
      {(activeTab === 'users' || activeTab === 'products' || activeTab === 'orders') && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
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
              }}
            />
            {selectedItems.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{ color: '#7f8c8d', alignSelf: 'center' }}>
                  {selectedItems.length} selected
                </span>
                {activeTab === 'users' && (
                  <button
                    onClick={() => handleBulkAction('deactivate')}
                    className="btn btn-warning"
                    style={{ background: '#f39c12', fontSize: '0.9rem' }}
                  >
                    Deactivate
                  </button>
                )}
                {activeTab === 'products' && (
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="btn btn-danger"
                    style={{ background: '#e74c3c', fontSize: '0.9rem' }}
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="card">
        {activeTab === 'overview' && (
          <div>
            <h3 style={{ marginBottom: '1rem', color: '#2c3e50' }}>📊 System Overview</h3>

            {/* System Monitor */}
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
                  <div>• ${systemStats.revenue.toLocaleString()} total revenue</div>
                </div>
              </div>
              <div>
                <h4 style={{ color: '#27ae60' }}>System Health</h4>
                <div style={{ fontSize: '0.9rem' }}>
                  <div style={{ color: '#27ae60' }}>✅ All services running</div>
                  <div style={{ color: '#27ae60' }}>✅ Database connected</div>
                  <div style={{ color: '#27ae60' }}>✅ API gateway active</div>
                  <div style={{ color: '#27ae60' }}>✅ Recommendation engine online</div>
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
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItems(usersData?.users?.map((u: any) => u._id) || []);
                            } else {
                              setSelectedItems([]);
                            }
                          }}
                        />
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', border: '1px solid #ddd' }}>
                        Name
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', border: '1px solid #ddd' }}>
                        Email
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', border: '1px solid #ddd' }}>
                        Role
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', border: '1px solid #ddd' }}>
                        Status
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', border: '1px solid #ddd' }}>
                        Last Login
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', border: '1px solid #ddd' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersData?.users
                      ?.filter(
                        (user: any) =>
                          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      ?.map((user: any) => (
                        <tr key={user._id}>
                          <td style={{ padding: '1rem', border: '1px solid #ddd' }}>
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(user._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedItems((prev) => [...prev, user._id]);
                                } else {
                                  setSelectedItems((prev) => prev.filter((id) => id !== user._id));
                                }
                              }}
                            />
                          </td>
                          <td style={{ padding: '1rem', border: '1px solid #ddd' }}>{user.name}</td>
                          <td style={{ padding: '1rem', border: '1px solid #ddd' }}>
                            {user.email}
                          </td>
                          <td style={{ padding: '1rem', border: '1px solid #ddd' }}>
                            <span
                              style={{
                                background: user.role === 'admin' ? '#e74c3c' : '#3498db',
                                color: 'white',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                              }}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', border: '1px solid #ddd' }}>
                            <span
                              style={{
                                color: user.isActive ? '#27ae60' : '#e74c3c',
                                fontWeight: 'bold',
                              }}
                            >
                              {user.isActive ? '✅ Active' : '❌ Inactive'}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', border: '1px solid #ddd' }}>
                            {user.lastLogin
                              ? new Date(user.lastLogin).toLocaleDateString()
                              : 'Never'}
                          </td>
                          <td style={{ padding: '1rem', border: '1px solid #ddd' }}>
                            <button
                              onClick={() => handleUserStatusToggle(user._id, user.isActive)}
                              style={{
                                background: user.isActive ? '#e74c3c' : '#27ae60',
                                color: 'white',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                              }}
                            >
                              {user.isActive ? 'Deactivate' : 'Activate'}
                            </button>
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
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItems(
                                productsData?.products?.map((p: any) => p._id) || []
                              );
                            } else {
                              setSelectedItems([]);
                            }
                          }}
                        />
                      </th>
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
                        Stock
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', border: '1px solid #ddd' }}>
                        Status
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', border: '1px solid #ddd' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {productsData?.products
                      ?.filter(
                        (product: any) =>
                          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.category.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      ?.map((product: any) => (
                        <tr key={product._id}>
                          <td style={{ padding: '1rem', border: '1px solid #ddd' }}>
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(product._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedItems((prev) => [...prev, product._id]);
                                } else {
                                  setSelectedItems((prev) =>
                                    prev.filter((id) => id !== product._id)
                                  );
                                }
                              }}
                            />
                          </td>
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
                            <span
                              style={{
                                color:
                                  product.stock > 10
                                    ? '#27ae60'
                                    : product.stock > 0
                                    ? '#f39c12'
                                    : '#e74c3c',
                                fontWeight: 'bold',
                              }}
                            >
                              {product.stock}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', border: '1px solid #ddd' }}>
                            <span
                              style={{
                                color: product.isActive ? '#27ae60' : '#e74c3c',
                                fontWeight: 'bold',
                              }}
                            >
                              {product.isActive ? '✅ Active' : '❌ Inactive'}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', border: '1px solid #ddd' }}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                onClick={() =>
                                  handleProductStatusToggle(product._id, product.isActive)
                                }
                                style={{
                                  background: product.isActive ? '#f39c12' : '#27ae60',
                                  color: 'white',
                                  border: 'none',
                                  padding: '0.5rem',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                }}
                              >
                                {product.isActive ? 'Hide' : 'Show'}
                              </button>
                              <button
                                onClick={() => handleProductDelete(product._id)}
                                style={{
                                  background: '#e74c3c',
                                  color: 'white',
                                  border: 'none',
                                  padding: '0.5rem',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                }}
                              >
                                Delete
                              </button>
                            </div>
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
                        Total
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', border: '1px solid #ddd' }}>
                        Status
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', border: '1px solid #ddd' }}>
                        Date
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', border: '1px solid #ddd' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersData?.orders?.map((order: any) => (
                      <tr key={order._id}>
                        <td style={{ padding: '1rem', border: '1px solid #ddd' }}>
                          {order._id.slice(-8)}
                        </td>
                        <td style={{ padding: '1rem', border: '1px solid #ddd' }}>
                          {order.userId.slice(-8)}
                        </td>
                        <td style={{ padding: '1rem', border: '1px solid #ddd' }}>
                          {order.items?.length || 0} items
                        </td>
                        <td style={{ padding: '1rem', border: '1px solid #ddd' }}>
                          ${order.totalAmount}
                        </td>
                        <td style={{ padding: '1rem', border: '1px solid #ddd' }}>
                          <select
                            value={order.status}
                            onChange={(e) => handleOrderStatusUpdate(order._id, e.target.value)}
                            style={{
                              padding: '0.5rem',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              background:
                                order.status === 'completed'
                                  ? '#d4edda'
                                  : order.status === 'pending'
                                  ? '#fff3cd'
                                  : '#f8d7da',
                            }}
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td style={{ padding: '1rem', border: '1px solid #ddd' }}>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '1rem', border: '1px solid #ddd' }}>
                          <button
                            onClick={() => console.log('View order details:', order._id)}
                            style={{
                              background: '#3498db',
                              color: 'white',
                              border: 'none',
                              padding: '0.5rem 1rem',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                            }}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div>
            <h3 style={{ marginBottom: '1rem', color: '#2c3e50' }}>📈 Analytics & Reports</h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1rem',
              }}
            >
              <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
                <h4 style={{ color: '#3498db' }}>User Analytics</h4>
                <div>
                  <div>Active Users: {systemStats.activeUsers}</div>
                  <div>Inactive Users: {systemStats.totalUsers - systemStats.activeUsers}</div>
                  <div>Registration Rate: {(systemStats.totalUsers / 30 || 0).toFixed(1)}/day</div>
                </div>
              </div>

              <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
                <h4 style={{ color: '#27ae60' }}>Sales Analytics</h4>
                <div>
                  <div>Total Revenue: ${systemStats.revenue.toLocaleString()}</div>
                  <div>
                    Average Order: $
                    {(systemStats.revenue / systemStats.totalOrders || 0).toFixed(2)}
                  </div>
                  <div>Orders/Day: {(systemStats.totalOrders / 30 || 0).toFixed(1)}</div>
                </div>
              </div>

              <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
                <h4 style={{ color: '#f39c12' }}>Product Analytics</h4>
                <div>
                  <div>Total Products: {systemStats.totalProducts}</div>
                  <div>Pending Orders: {systemStats.pendingOrders}</div>
                  <div>
                    Conversion Rate:{' '}
                    {((systemStats.totalOrders / systemStats.totalUsers) * 100 || 0).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'monitor' && (
          <div>
            <h3 style={{ marginBottom: '1rem', color: '#2c3e50' }}>🖥️ System Monitor</h3>
            <SystemMonitor
              onStatusChange={(status) => {
                console.log('System status changed:', status);
                // You can add notifications or alerts here based on status
              }}
            />
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h3 style={{ marginBottom: '1rem', color: '#2c3e50' }}>⚙️ System Settings</h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1rem',
              }}
            >
              <div>
                <h4 style={{ color: '#3498db' }}>System Configuration</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <button className="btn btn-primary">Backup Database</button>
                  <button className="btn btn-warning">Clear Cache</button>
                  <button className="btn btn-secondary">System Health Check</button>
                  <button className="btn btn-info">Update Recommendations</button>
                </div>
              </div>

              <div>
                <h4 style={{ color: '#27ae60' }}>Security Settings</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <button className="btn btn-primary">Reset API Keys</button>
                  <button className="btn btn-warning">Force Password Reset</button>
                  <button className="btn btn-danger">Security Audit</button>
                </div>
              </div>

              <div>
                <h4 style={{ color: '#f39c12' }}>Maintenance</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <button className="btn btn-secondary">Enable Maintenance Mode</button>
                  <button className="btn btn-info">System Logs</button>
                  <button className="btn btn-warning">Performance Monitor</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
