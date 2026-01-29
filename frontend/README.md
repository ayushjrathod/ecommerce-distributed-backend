# E-Commerce Frontend

A React-based frontend application for the E-Commerce Microservices Backend system.

## Features

- **User Authentication**: Login and registration with JWT tokens
- **Product Management**: Browse products, add to cart, and place orders
- **Order Management**: View order history and details
- **Admin Features**: Add new products to the catalog
- **Dashboard**: Overview of users, products, and orders
- **Responsive Design**: Mobile-friendly interface

## Tech Stack

- **React 18** with TypeScript
- **Apollo Client** for GraphQL integration
- **React Router** for navigation
- **CSS3** with responsive design

## Getting Started

### Prerequisites

Make sure the GraphQL Gateway is running on `http://localhost:4000/graphql`.

### Installation

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm start
   ```

4. Open your browser and visit `http://localhost:3000`

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm eject` - Ejects from Create React App (one-way operation)

## GraphQL Integration

The application connects to the GraphQL Gateway at `/graphql` (proxied to `http://localhost:4000/graphql`).

### Available Operations

- **User Operations**: Sign up, sign in, fetch users, update preferences
- **Product Operations**: Fetch all products, fetch by ID, add new products
- **Order Operations**: Place orders, fetch all orders, fetch by ID

## Authentication

The app uses JWT tokens stored in localStorage for authentication. The Apollo Client automatically includes the token in the Authorization header for authenticated requests.

## Key Components

- **Navigation**: Header with navigation links and user info
- **Login/Register**: Authentication forms
- **Dashboard**: Overview page with statistics and recent activity
- **ProductList**: Product catalog with shopping cart functionality
- **OrderList**: Order history display
- **AddProduct**: Form to add new products (admin feature)

## Styling

The application uses a modern, clean design with:

- Responsive grid layout
- Card-based components
- Color-coded status indicators
- Mobile-first approach

## API Endpoints Used

The frontend communicates with these GraphQL operations:

### Queries

- `fetchAllUsers`
- `fetchUserById`
- `fetchAllProducts`
- `fetchProductById`
- `fetchAllOrders`
- `fetchOrdersById`

### Mutations

- `signin`
- `signup`
- `updateUserPreferences`
- `addProduct`
- `placeOrder`

## Development Notes

This is a basic implementation focusing on core functionality. Future improvements could include:

- Enhanced error handling
- Loading states
- Form validation
- Shopping cart persistence
- Product search and filtering
- User profile management
- Order status tracking
- Real-time updates
- Image upload for products
- Better responsive design
- Accessibility improvements
