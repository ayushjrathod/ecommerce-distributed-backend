import React, { useState } from 'react';

interface Product {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

interface ProductSearchProps {
  products: Product[];
  onFilter: (filteredProducts: Product[]) => void;
}

const ProductSearch: React.FC<ProductSearchProps> = ({ products, onFilter }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  // Get unique categories from products
  const categories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);

  const handleSearch = () => {
    let filtered = products;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((product) => product.category === selectedCategory);
    }

    // Filter by price range
    if (priceRange.min) {
      filtered = filtered.filter((product) => product.price >= parseFloat(priceRange.min));
    }
    if (priceRange.max) {
      filtered = filtered.filter((product) => product.price <= parseFloat(priceRange.max));
    }

    onFilter(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setPriceRange({ min: '', max: '' });
    onFilter(products);
  };

  React.useEffect(() => {
    handleSearch();
  }, [searchTerm, selectedCategory, priceRange, products]);

  return (
    <div className="card mb-3">
      <h3 style={{ color: '#2c3e50', marginBottom: '1rem' }}>🔍 Search & Filter Products</h3>

      <div className="grid grid-cols-4" style={{ gap: '1rem', alignItems: 'end' }}>
        {/* Search Term */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Search</label>
          <input
            type="text"
            className="form-input"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Category Filter */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Category</label>
          <select
            className="form-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Price Range */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Price Range</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="number"
              className="form-input"
              placeholder="Min"
              value={priceRange.min}
              onChange={(e) => setPriceRange((prev) => ({ ...prev, min: e.target.value }))}
            />
            <input
              type="number"
              className="form-input"
              placeholder="Max"
              value={priceRange.max}
              onChange={(e) => setPriceRange((prev) => ({ ...prev, max: e.target.value }))}
            />
          </div>
        </div>

        {/* Clear Filters Button */}
        <div>
          <button onClick={clearFilters} className="btn btn-secondary" style={{ width: '100%' }}>
            Clear Filters
          </button>
        </div>
      </div>

      {/* Active Filters Display */}
      {(searchTerm || selectedCategory || priceRange.min || priceRange.max) && (
        <div
          style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: '#f8f9fa',
            borderRadius: '6px',
          }}
        >
          <div style={{ fontSize: '0.9rem', color: '#6c757d', marginBottom: '0.5rem' }}>
            Active Filters:
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {searchTerm && (
              <span
                style={{
                  background: '#3498db',
                  color: 'white',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                }}
              >
                Search: "{searchTerm}"
              </span>
            )}
            {selectedCategory && (
              <span
                style={{
                  background: '#27ae60',
                  color: 'white',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                }}
              >
                Category: {selectedCategory}
              </span>
            )}
            {(priceRange.min || priceRange.max) && (
              <span
                style={{
                  background: '#f39c12',
                  color: 'white',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                }}
              >
                Price: ${priceRange.min || '0'} - ${priceRange.max || '∞'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductSearch;
