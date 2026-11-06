from fastapi import APIRouter
from app.api.v1.endpoints import health, stocks, agent, portfolio, backtest

api_router = APIRouter()

# Health & Diagnostic endpoint
api_router.include_router(health.router, tags=["Health"])

# Indian Stock Market & Indicators endpoints
api_router.include_router(stocks.router, prefix="/stocks", tags=["Indian Stocks"])

# Groq AI Financial Analyst Agent endpoints
api_router.include_router(agent.router, prefix="/agent", tags=["AI Analyst Agent"])

# Virtual Portfolio & Paper Trading endpoints
api_router.include_router(portfolio.router, prefix="/portfolio", tags=["Paper Trading & Portfolio"])

# Historical Strategy Backtesting endpoints
api_router.include_router(backtest.router, prefix="/backtest", tags=["Strategy Backtest"])
