from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.portfolio import (
    OrderRequest,
    PortfolioSummaryResponse,
    TransactionResponse,
    ResetPortfolioResponse,
)
from app.models.portfolio import Transaction
from app.services.portfolio_service import (
    get_portfolio_summary,
    execute_order,
    reset_portfolio,
    get_or_create_default_portfolio,
)

router = APIRouter()


@router.get("", response_model=PortfolioSummaryResponse)
def get_portfolio(db: Session = Depends(get_db)):
    """
    Get primary paper trading portfolio summary, active holdings marked-to-market,
    and recent transaction logs.
    """
    try:
        return get_portfolio_summary(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/order")
def place_order(order: OrderRequest, db: Session = Depends(get_db)):
    """
    Execute a simulated BUY or SELL order using live Indian market prices.
    """
    try:
        return execute_order(db, order)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Order execution error: {str(e)}")


@router.get("/transactions", response_model=List[TransactionResponse])
def get_transactions(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """
    Get complete simulated transaction history.
    """
    portfolio = get_or_create_default_portfolio(db)
    txns = (
        db.query(Transaction)
        .filter(Transaction.portfolio_id == portfolio.id)
        .order_by(Transaction.timestamp.desc())
        .limit(limit)
        .all()
    )
    return txns


@router.post("/reset", response_model=ResetPortfolioResponse)
def reset_account(db: Session = Depends(get_db)):
    """
    Reset paper trading account back to ₹10,00,000 cash balance.
    """
    try:
        return reset_portfolio(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

