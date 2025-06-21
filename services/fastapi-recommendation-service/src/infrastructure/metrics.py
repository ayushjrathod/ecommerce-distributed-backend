from prometheus_client import Counter, Histogram, Summary, Histogram, Gauge
import time
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from fastapi import APIRouter, Response
from collections import Counter as CounterType

request_count = Counter(
    "total_recommendation_requests",
    "Total number of recommendation requests",
    ["method", "endpoint", "status_code", "app"]
)

request_duration = Histogram(
    "recommendation_request_duration_seconds",
    "Duration of recommendation requests in seconds",
    ["method", "endpoint", "app"]
)

recommendation_generated = Counter(
    "recommendation_generated_total",
    "Total number of recommendations generated",
    ["app"]
)

active_connections = Gauge(
    "active_connections",
    "Number of active connections to the recommendation service",
    ["app"]
)

class PrometheusInstrumentor:
  @staticmethod
  def instrument(app):
    @app.middleware("http")
    async def prometheus_middleware(request, call_next):
      start_time = time.time()
      active_connections.labels(app="recommendation-service").inc()
      try:
        response = await call_next(request)
        duration = time.time() - start_time
        request_count.labels(
            method=request.method,
            endpoint=request.url.path,
            status_code=response.status_code,
            app="recommendation-service"
        ).inc()
        request_duration.labels(
            method=request.method,
            endpoint=request.url.path,
            app="recommendation-service"
        ).observe(duration)
        return response
      finally:
        active_connections.labels(app="recommendation-service").dec()
        
metrics_router = APIRouter()

@metrics_router.get("/metrics")
async def get_metrics():
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )
