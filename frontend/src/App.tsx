import { useEffect, useState } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import AddProduct from './components/AddProduct';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Navigation from './components/Navigation';
import OrderList from './components/OrderList';
import ProductList from './components/ProductList';
import RecommendationCenter from './components/RecommendationCenter';
import Register from './components/Register';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogin = (token: string, userData: any) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <Router>
      <div className="App">
        <Navigation isAuthenticated={isAuthenticated} user={user} onLogout={handleLogout} />

        <main className="main-content">
          <div className="container">
            <Routes>
              <Route
                path="/login"
                element={
                  !isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" />
                }
              />
              <Route
                path="/register"
                element={
                  !isAuthenticated ? (
                    <Register onLogin={handleLogin} />
                  ) : (
                    <Navigate to="/dashboard" />
                  )
                }
              />
              <Route
                path="/dashboard"
                element={isAuthenticated ? <Dashboard user={user} /> : <Navigate to="/login" />}
              />
              <Route
                path="/products"
                element={isAuthenticated ? <ProductList /> : <Navigate to="/login" />}
              />
              <Route
                path="/orders"
                element={isAuthenticated ? <OrderList /> : <Navigate to="/login" />}
              />
              <Route
                path="/add-product"
                element={isAuthenticated ? <AddProduct /> : <Navigate to="/login" />}
              />
              <Route
                path="/recommendations"
                element={
                  isAuthenticated ? <RecommendationCenter user={user} /> : <Navigate to="/login" />
                }
              />
              <Route
                path="/"
                element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
              />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
