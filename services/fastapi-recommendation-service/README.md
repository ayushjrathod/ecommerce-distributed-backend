# FastAPI Microservice

A high-performance FastAPI microservice integrated with the e-commerce microservices architecture.

## Features

- **FastAPI**: Modern, fast web framework for building APIs
- **Async/Await**: Full asynchronous support for high performance
- **Pydantic**: Data validation using Python type annotations
- **Kafka Integration**: Event-driven communication with other services
- **Redis Caching**: High-performance caching layer
- **MongoDB**: Document database integration
- **Prometheus Metrics**: Observability and monitoring
- **JWT Authentication**: Secure API access
- **Auto-generated Documentation**: Interactive API docs at `/docs`

## Quick Start

### Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run in development mode with auto-reload
npm run dev
# or
uvicorn src.main:app --reload
```

### Production

```bash
# Build and run with Docker
docker build -t fastapi-service .
docker run -p 8000:8000 fastapi-service
```

## API Documentation

Once running, visit:

- Interactive docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- OpenAPI schema: http://localhost:8000/openapi.json

## Environment Variables

Create a `.env` file in the root directory:

```env
MONGODB_URL=mongodb://localhost:27017
REDIS_URL=redis://localhost:6379
KAFKA_BROKERS=localhost:9092
JWT_SECRET=your-secret-key
SERVICE_NAME=fastapi-service
LOG_LEVEL=INFO
```

## Testing

```bash
npm run test
# or
pytest tests/
```

## Code Quality

```bash
# Format code
npm run format

# Lint code
npm run lint
```
