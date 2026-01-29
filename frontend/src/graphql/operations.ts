import { gql } from '@apollo/client';

// User Queries and Mutations
export const SIGNIN_MUTATION = gql`
  mutation Signin($input: SigninInput!) {
    signin(input: $input) {
      access_token
      user {
        _id
        email
        name
        preferences {
          promotions
          orderUpdates
          recommendations
        }
        createdAt
        updatedAt
      }
    }
  }
`;

export const SIGNUP_MUTATION = gql`
  mutation Signup($input: CreateUserInput!) {
    signup(input: $input) {
      access_token
      user {
        _id
        email
        name
        preferences {
          promotions
          orderUpdates
          recommendations
        }
        createdAt
        updatedAt
      }
    }
  }
`;

export const FETCH_ALL_USERS = gql`
  query FetchAllUsers {
    fetchAllUsers {
      _id
      email
      name
      preferences {
        promotions
        orderUpdates
        recommendations
      }
      createdAt
      updatedAt
    }
  }
`;

export const FETCH_USER_BY_ID = gql`
  query FetchUserById($id: ID!) {
    fetchUserById(_id: $id) {
      _id
      email
      name
      preferences {
        promotions
        orderUpdates
        recommendations
      }
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_USER_PREFERENCES = gql`
  mutation UpdateUserPreferences($id: ID!, $preferences: UpdateUserPreferencesInput!) {
    updateUserPreferences(id: $id, preferences: $preferences) {
      _id
      email
      name
      preferences {
        promotions
        orderUpdates
        recommendations
      }
      createdAt
      updatedAt
    }
  }
`;

// Product Queries and Mutations
export const FETCH_ALL_PRODUCTS = gql`
  query FetchAllProducts {
    fetchAllProducts {
      _id
      name
      price
      quantity
      category
    }
  }
`;

export const FETCH_PRODUCT_BY_ID = gql`
  query FetchProductById($id: ID!) {
    fetchProductById(id: $id) {
      _id
      name
      price
      quantity
      category
    }
  }
`;

export const ADD_PRODUCT_MUTATION = gql`
  mutation AddProduct($input: CreateProductInput!) {
    addProduct(input: $input) {
      _id
      name
      price
      quantity
      category
    }
  }
`;

// Order Queries and Mutations
export const FETCH_ALL_ORDERS = gql`
  query FetchAllOrders {
    fetchAllOrders {
      _id
      userId
      products {
        _id
        quantity
        name
        category
        price
      }
    }
  }
`;

export const FETCH_ORDER_BY_ID = gql`
  query FetchOrderById($id: ID!) {
    fetchOrdersById(id: $id) {
      _id
      userId
      products {
        _id
        quantity
        name
        category
        price
      }
    }
  }
`;

export const PLACE_ORDER_MUTATION = gql`
  mutation PlaceOrder($products: [OrderProductInput]!) {
    placeOrder(products: $products) {
      _id
      userId
      products {
        _id
        quantity
        name
        category
        price
      }
    }
  }
`;
