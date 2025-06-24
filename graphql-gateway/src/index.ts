import { config } from 'dotenv';
import express from 'express';
import client from 'prom-client';
import app from './app';
import { consumer } from './infrastructure/kafka';
import { cacheClient } from './infrastructure/redis';

config();

const PORT = parseInt(process.env.PORT || '4000', 10);
const METRICS_PORT = process.env.METRICS_PORT;

const setupMetrics = () => {
  const register = new client.Registry();
  register.setDefaultLabels({ app: 'graphql-gateway' });
  client.collectDefaultMetrics({ register });

  const metricsApp = express();
  metricsApp.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  return { metricsApp, register };
};

const setupKafkaConsumer = async () => {
  await consumer.subscribe({ topic: 'inventory-events' });
  await consumer.run({
    eachMessage: async ({ topic, partition }) => {
      console.log(`[TOPIC]: [${topic}] | PART: ${partition}`);
      await cacheClient.del('products/');
    },
  });
};

const main = async () => {
  try {
    await Promise.all([
      cacheClient.connect(),
      consumer.connect()
    ]);
    await setupKafkaConsumer();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 GraphQL API server running at ${PORT}/graphql`);
    });

    const { metricsApp } = setupMetrics();
    metricsApp.listen(METRICS_PORT, () => {
      console.log(`📊 Metrics available at ${METRICS_PORT}/metrics`);
    });
  } catch (error) {
    console.error('Failed to start the server:', error);
    await Promise.all([
      consumer.disconnect(),
      cacheClient.disconnect()
    ]);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM. Performing graceful shutdown...');
  await Promise.all([
    consumer.disconnect(),
    cacheClient.disconnect()
  ]);
  process.exit(0);
});

main().catch(console.error);
