import { useMutation, useQuery } from '@apollo/client';
import React, { useState } from 'react';
import { FETCH_ALL_PRODUCTS, PLACE_ORDER_MUTATION } from '../graphql/operations';

interface Product {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

interface CartItem {
  _id: string;
  quantity: number;
}

const ProductList: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  const { data, loading, error } = useQuery(FETCH_ALL_PRODUCTS);

  const [placeOrder, { loading: orderLoading }] = useMutation(PLACE_ORDER_MUTATION, {
    onCompleted: () => {
      setCart([]);
      setShowCart(false);
      alert('Order placed successfully!');
    },
    onError: (error) => {
      alert(`Error placing order: ${error.message}`);
    },
  });

  const addToCart = (productId: string) => {
    setCart((prev) => {
      const existingItem = prev.find((item) => item._id === productId);
      if (existingItem) {
        return prev.map((item) =>
          item._id === productId ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prev, { _id: productId, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item._id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prev) => prev.map((item) => (item._id === productId ? { ...item, quantity } : item)));
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    try {
      await placeOrder({
        variables: {
          products: cart,
        },
      });
    } catch (err) {
      // Error handled by onError callback
    }
  };

  const getCartTotal = () => {
    if (!data) return 0;
    return cart.reduce((total, cartItem) => {
      const product = data.fetchAllProducts.find((p: Product) => p._id === cartItem._id);
      return total + (product ? product.price * cartItem.quantity : 0);
    }, 0);
  };

  if (loading)
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading amazing products for you...
      </div>
    );
  if (error) return <div className="error">Error loading products: {error.message}</div>;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}
      >
        <div>
          <h1 style={{ color: '#2c3e50', marginBottom: '0.5rem' }}>🛍️ Product Catalog</h1>
          <p style={{ color: '#7f8c8d', margin: 0 }}>Discover our curated collection of products</p>
        </div>
        <button
          onClick={() => setShowCart(true)}
          className="cart-button"
          style={{ position: 'relative' }}
        >
          🛒
          {cart.length > 0 && (
            <span className="cart-badge">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
          )}
        </button>
      </div>

      {showCart && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>Shopping Cart</h3>
          {cart.length === 0 ? (
            <p>Your cart is empty</p>
          ) : (
            <>
              {cart.map((cartItem) => {
                const product = data.fetchAllProducts.find((p: Product) => p._id === cartItem._id);
                if (!product) return null;

                return (
                  <div
                    key={cartItem._id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.5rem 0',
                      borderBottom: '1px solid #eee',
                    }}
                  >
                    <div>
                      <strong>{product.name}</strong>
                      <div>${product.price} each</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <input
                        type="number"
                        min="1"
                        value={cartItem.quantity}
                        onChange={(e) => updateCartQuantity(cartItem._id, parseInt(e.target.value))}
                        style={{ width: '60px', padding: '0.25rem' }}
                      />
                      <button
                        className="btn btn-danger"
                        onClick={() => removeFromCart(cartItem._id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '2px solid #eee' }}>
                <strong>Total: ${getCartTotal().toFixed(2)}</strong>
                <button
                  className="btn"
                  style={{ marginLeft: '1rem' }}
                  onClick={handlePlaceOrder}
                  disabled={orderLoading}
                >
                  {orderLoading ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-3">
        {data?.fetchAllProducts?.map((product: Product) => (
          <div key={product._id} className="product-card">
            <div className="product-info">
              <h3 className="product-title">{product.name}</h3>
              <p className="product-price">${product.price}</p>
              <p className="product-category">{product.category}</p>
              <p style={{ color: product.quantity > 0 ? '#27ae60' : '#e74c3c' }}>
                {product.quantity > 0 ? `${product.quantity} in stock` : 'Out of stock'}
              </p>
              <button
                className="btn"
                style={{ width: '100%' }}
                onClick={() => addToCart(product._id)}
                disabled={product.quantity === 0}
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductList;
