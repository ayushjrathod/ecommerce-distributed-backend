from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from dotenv import load_dotenv
from .api.routes import api_router
import schedule
from .services import genrateReommendations
from .services import genrateReommendations
import os 
from .infrastructure.metrics import PrometheusInstrumentor, metrics_router

load_dotenv()

# Configure logging
logging.basicConfig(
    level=getattr(logging, "LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)
    

# Create FastAPI app
app = FastAPI(
    title="FastAPI Recommendation Service",
    version="1.0.0",
    docs_url="/docs" if os.getenv("NODE_ENV") == "development" else "1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PrometheusInstrumentor.instrument(app)

# Include API routes
app.include_router(api_router, prefix="/api/v1")
app.include_router(metrics_router)

async def schedule_recommendation():
    try:
        await schedule.every(10).minutes.do(genrateReommendations.genrateRecommendations)
        logger.info("Scheduled recommendation generation task started.")
    except Exception as e:
        logger.error(f"Error occurred while scheduling recommendations: {e}")
        
    
app.on_event("startup")
async def startup_event():
    logger.info("Starting FastAPI Recommendation Service...")
    await schedule_recommendation()

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "FastAPI Recommendation Service is up!",
        "docs": "/docs",
    }

@app.get("/test")
async def test():
    recommendations = genrateReommendations.genrateRecommendations()
    return {"message": "Recommendations generated successfully", "recommendations": recommendations}

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )
