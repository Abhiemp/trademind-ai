from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field


class StockSearchResult(BaseModel):
    symbol: str
    name: str
    sector: str
    exchange: str


class StockQuote(BaseModel):
    symbol: str
    company_name: str
    current_price: float
    previous_close: float
    change: float
    percent_change: float
    open: float
    high: float
    low: float
    volume: int
    fifty_two_week_high: Optional[float] = None
    fifty_two_week_low: Optional[float] = None
    pe_ratio: Optional[float] = None
    market_cap: Optional[float] = None
    currency: str = "INR"


class OHLCVRecord(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int


class IndicatorDataPoint(BaseModel):
    date: str
    close: float
    volume: int
    sma_20: Optional[float] = None
    sma_50: Optional[float] = None
    sma_200: Optional[float] = None
    ema_9: Optional[float] = None
    ema_21: Optional[float] = None
    rsi_14: Optional[float] = None
    macd: Optional[float] = None
    macd_signal: Optional[float] = None
    macd_hist: Optional[float] = None


class IndicatorSignalDetail(BaseModel):
    indicator: str
    value: str
    signal: str
    note: str


class TechnicalSummary(BaseModel):
    overall_signal: str = Field(description="BUY, SELL, or HOLD")
    score: float
    rsi: float
    rsi_signal: str
    macd: float
    macd_signal: str
    moving_averages_signal: str
    signals_breakdown: List[IndicatorSignalDetail]


class StockIndicatorsResponse(BaseModel):
    symbol: str
    period: str
    count: int
    summary: TechnicalSummary
    chart_data: List[IndicatorDataPoint]

