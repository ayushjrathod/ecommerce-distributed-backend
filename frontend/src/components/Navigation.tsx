import React from 'react';
import { Link } from 'react-router-dom';

interface NavigationProps {
  isAuthenticated: boolean;
  user: any;
  onLogout: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ isAuthenticated, user, onLogout }) => {
  return (
    <header className="header">
      <div className="container">
        <nav className="nav">
          <Link to="/" className="nav-brand">
            🛒 E-Commerce Hub
          </Link>

          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <ul className="nav-links">
                <li>
                  <Link to="/dashboard" className="nav-link">
                    📊 Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/products" className="nav-link">
                    🛍️ Products
                  </Link>
                </li>
                <li>
                  <Link to="/orders" className="nav-link">
                    📦 Orders
                  </Link>
                </li>
                <li>
                  <Link to="/recommendations" className="nav-link">
                    🎯 For You
                  </Link>
                </li>
                <li>
                  <Link to="/add-product" className="nav-link">
                    ➕ Add Product
                  </Link>
                </li>
              </ul>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ color: '#2c3e50', fontWeight: '500' }}>👋 {user?.name}</span>
                <button onClick={onLogout} className="btn-logout">
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <ul className="nav-links">
              <li>
                <Link to="/login" className="nav-link">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="nav-link">
                  Register
                </Link>
              </li>
            </ul>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navigation;
