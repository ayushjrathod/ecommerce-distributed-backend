const GQL_URL = 'http://graphql-gateway:4000/graphql';

const users = [
  { name: 'Tech Enthusiast', email: 'tech@example.com', password: 'Password123!' },
  { name: 'Fashion Lover', email: 'fashion@example.com', password: 'Password123!' },
  { name: 'Home Decorator', email: 'home@example.com', password: 'Password123!' },
];

const userPreferences = [
  { promotions: true, orderUpdates: true, recommendations: true },
  { promotions: true, orderUpdates: true, recommendations: false },
  { promotions: false, orderUpdates: true, recommendations: false },
];

const products = [
  { name: 'Premium Smartphone', price: 999.99, quantity: 50, category: 'electronics' },
  { name: 'High-Performance Laptop', price: 1499.99, quantity: 30, category: 'computers' },
  { name: 'Designer Jeans', price: 129.99, quantity: 100, category: 'clothing' },
  { name: 'Modern Coffee Table', price: 349.99, quantity: 25, category: 'furniture' },
];

const orders = [
  [
    [0, 1],
    [0, 3],
  ], // User 1
  [
    [2, 0],
    [2, 3],
  ], // User 2
  [
    [3, 1],
    [3, 0],
  ], // User 3
];

async function waitForGateway() {
  let ready = false;
  while (!ready) {
    try {
      await fetch(GQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '{ __typename }' }),
      });
      ready = true;
    } catch {
      process.stdout.write('.');
      await new Promise((res) => setTimeout(res, 2000));
    }
  }
  console.log('\nGateway ready!');
}

async function isDbEmpty() {
  const queries = [
    { query: `query { fetchAllUsers { _id } }` },
    { query: `query { fetchAllProducts { _id } }` },
    { query: `query { fetchAllOrders { _id } }` },
  ];
  for (const q of queries) {
    const res = await fetch(GQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q.query }),
    });
    const data = await res.json();
    const key = Object.keys(data.data)[0];
    if (Array.isArray(data.data[key]) && data.data[key].length > 0) {
      return false;
    }
  }
  return true;
}

async function main() {
  await waitForGateway();
  const empty = await isDbEmpty();
  if (!empty) {
    console.log('Database is not empty. Skipping seeding.');
    return;
  }

  // 1. Create users
  const userTokens = [];
  const userIds = [];
  for (const user of users) {
    const res = await fetch(GQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `mutation signup($input: CreateUserInput!) { signup(input: $input) { access_token user { _id } } }`,
        variables: { input: user },
      }),
    });
    const data = await res.json();
    userTokens.push(data.data.signup.access_token);
    userIds.push(data.data.signup.user._id);
  }

  // 2. Set user preferences
  for (let i = 0; i < users.length; i++) {
    await fetch(GQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userTokens[i]}`,
      },
      body: JSON.stringify({
        query: `mutation updateUserPreferences($id: ID!, $preferences: UpdateUserPreferencesInput!) { updateUserPreferences(id: $id, preferences: $preferences) { _id } }`,
        variables: { id: userIds[i], preferences: userPreferences[i] },
      }),
    });
  }

  // 3. Add products (using user 1's token)
  const productIds = [];
  for (const product of products) {
    const res = await fetch(GQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userTokens[0]}`,
      },
      body: JSON.stringify({
        query: `mutation addProduct($input: CreateProductInput) { addProduct(input: $input) { _id } }`,
        variables: { input: product },
      }),
    });
    const data = await res.json();
    productIds.push(data.data.addProduct._id);
  }

  // 4. Place orders
  for (let userIdx = 0; userIdx < orders.length; userIdx++) {
    for (const order of orders[userIdx]) {
      const productsInput = order.map((prodIdx) => ({ _id: productIds[prodIdx], quantity: 1 }));
      await fetch(GQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userTokens[userIdx]}`,
        },
        body: JSON.stringify({
          query: `mutation placeOrder($products: [OrderProductInput]!) { placeOrder(products: $products) { _id } }`,
          variables: { products: productsInput },
        }),
      });
    }
  }

  console.log('Seeding complete!');
}

main().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
