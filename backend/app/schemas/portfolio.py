from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class OrderRequest(BaseModel):
    symbol: str = Field(description="Indian stock symbol (e.g., RELIANCE.NS, TCS.NS)")
    transaction_type: str = Field(description="'BUY' or 'SELL'")
    quantity: int = Field(gt=0, description="Number of shares to trade")
    notes: Optional[str] = Field(None, description="Trade rationale or AI tag")


class HoldingResponse(BaseModel):
    id: int
    symbol: str
    company_name: str
    quantity: int
    average_buy_price: float
    current_price: float
    current_value: float
    invested_value: float
    unrealized_pnl: float
    unrealized_pnl_percent: float


class TransactionResponse(BaseModel):
    id: int
    symbol: str
    company_name: str
    transaction_type: str
    quantity: int
    price: float
    total_amount: float
    realized_pnl: float
    timestamp: datetime
    notes: Optional[str] = None


class PortfolioSummaryResponse(BaseModel):
    id: int
    name: str
    initial_balance: float
    cash_balance: float
    invested_value: float
    current_portfolio_value: float
    total_unrealized_pnl: float
    total_unrealized_pnl_percent: float
    total_realized_pnl: float
    net_pnl: float
    net_pnl_percent: float
    holdings: List[HoldingResponse]
    recent_transactions: List[TransactionResponse]


class ResetPortfolioResponse(BaseModel):
    message: str
    cash_balance: float

