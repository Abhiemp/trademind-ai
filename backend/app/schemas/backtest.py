from typing import List, Optional
from pydantic import BaseModel, Field


class BacktestRequest(BaseModel):
    symbol: str = Field(default="RELIANCE.NS", description="Indian stock symbol (NSE/BSE)")
    strategy_type: str = Field(
        default="SMA_CROSSOVER",
        description="Strategy: 'SMA_CROSSOVER', 'EMA_CROSSOVER', 'RSI_MEAN_REVERSION', 'MACD_CROSSOVER'",
    )
    period: str = Field(default="1y", description="Historical period: '6mo', '1y', '2y', '5y'")
    initial_capital: float = Field(default=100000.0, ge=1000.0, description="Initial starting capital in INR")
    
    # Strategy-specific parameters
    fast_period: Optional[int] = Field(default=20, ge=2, le=100)
    slow_period: Optional[int] = Field(default=50, ge=5, le=300)
    rsi_period: Optional[int] = Field(default=14, ge=2, le=50)
    rsi_oversold: Optional[float] = Field(default=30.0, ge=5.0, le=50.0)
    rsi_overbought: Optional[float] = Field(default=70.0, ge=50.0, le=95.0)


class TradeRecord(BaseModel):
    entry_date: str
    entry_price: float
    exit_date: str
    exit_price: float
    shares: int
    pnl: float
    return_pct: float
    exit_reason: str


class EquityPoint(BaseModel):
    date: str
    strategy_equity: float
    benchmark_equity: float
    close_price: float


class BacktestResponse(BaseModel):
    symbol: str
    company_name: str
    strategy_name: str
    period: str
    initial_capital: float
    final_equity: float
    strategy_return_pct: float
    benchmark_return_pct: float
    outperformance_pct: float
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    max_drawdown: float
    profit_factor: float
    trades: List[TradeRecord]
    equity_curve: List[EquityPoint]

