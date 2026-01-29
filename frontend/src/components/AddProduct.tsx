import { useMutation } from '@apollo/client';
import React, { useState } from 'react';
import { ADD_PRODUCT_MUTATION, FETCH_ALL_PRODUCTS } from '../graphql/operations';

const AddProduct: React.FC = () => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [category, setCategory] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [addProduct, { loading }] = useMutation(ADD_PRODUCT_MUTATION, {
    refetchQueries: [{ query: FETCH_ALL_PRODUCTS }],
    onCompleted: () => {
      setName('');
      setPrice('');
      setQuantity('');
      setCategory('');
      setSuccess('Product added successfully!');
      setError('');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (error) => {
      setError(error.message);
      setSuccess('');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await addProduct({
        variables: {
          input: {
            name,
            price: parseFloat(price),
            quantity: parseInt(quantity),
            category,
          },
        },
      });
    } catch (err) {
      // Error is handled by onError callback
    }
  };

  return (
    <div>
      <h1>Add New Product</h1>

      <div className="card" style={{ maxWidth: '600px' }}>
        {success && <div className="success">{success}</div>}

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Product Name
            </label>
            <input
              type="text"
              id="name"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Enter product name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="price" className="form-label">
              Price ($)
            </label>
            <input
              type="number"
              id="price"
              className="form-input"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              step="0.01"
              min="0"
              placeholder="0.00"
            />
          </div>

          <div className="form-group">
            <label htmlFor="quantity" className="form-label">
              Quantity
            </label>
            <input
              type="number"
              id="quantity"
              className="form-input"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              min="0"
              placeholder="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="category" className="form-label">
              Category
            </label>
            <select
              id="category"
              className="form-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="">Select a category</option>
              <option value="Electronics">Electronics</option>
              <option value="Clothing">Clothing</option>
              <option value="Books">Books</option>
              <option value="Home">Home</option>
              <option value="Sports">Sports</option>
              <option value="Beauty">Beauty</option>
              <option value="Food">Food</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <button type="submit" className="btn" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Adding Product...' : 'Add Product'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
