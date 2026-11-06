from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.schemas.stock import (
    StockSearchResult,
    StockQuote,
    OHLCVRecord,
    StockIndicatorsResponse,
)
from app.services.market_data import (
    search_stocks,
    get_stock_quote,
    get_historical_data,
    get_stock_indicators_data,
)

router = APIRouter()


@router.get("/search", response_model=List[StockSearchResult])
def search_indian_stocks(q: str = Query("", description="Query for stock symbol, company, or sector")):
    """
    Search Indian NSE/BSE stocks by symbol or company name.
    """
    return search_stocks(q)


@router.get("/{symbol}/quote", response_model=StockQuote)
def get_quote(symbol: str):
    """
    Retrieve live/latest closing market quote for an Indian security.
    """
    try:
        return get_stock_quote(symbol)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{symbol}/history", response_model=List[OHLCVRecord])
def get_history(
    symbol: str,
    period: str = Query("6mo", pattern="^(1mo|3mo|6mo|1y|2y|5y)$"),
    interval: str = Query("1d", pattern="^(1d|1wk)$"),
):
    """
    Retrieve historical OHLCV data for charting.
    """
    try:
        return get_historical_data(symbol, period=period, interval=interval)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{symbol}/indicators", response_model=StockIndicatorsResponse)
def get_indicators(
    symbol: str,
    period: str = Query("6mo", pattern="^(1mo|3mo|6mo|1y|2y|5y)$"),
):
    """
    Compute technical indicators (RSI 14, MACD 12/26/9, SMA 20/50/200, EMA 9/21)
    and produce deterministic BUY/SELL/HOLD technical signals.
    """
    try:
        return get_stock_indicators_data(symbol, period=period)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
