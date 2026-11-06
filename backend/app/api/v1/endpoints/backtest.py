from fastapi import APIRouter, HTTPException
from app.schemas.backtest import BacktestRequest, BacktestResponse
from app.services.backtest_service import run_strategy_backtest

router = APIRouter()


@router.post("/run", response_model=BacktestResponse)
def execute_backtest(req: BacktestRequest):
    """
    Run quantitative algorithmic strategy backtesting on historical Indian stock candles (NSE/BSE).
    Supports SMA Crossover, EMA Crossover, RSI Mean Reversion, and MACD Crossover.
    """
    try:
        return run_strategy_backtest(req)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backtest execution error: {str(e)}")

