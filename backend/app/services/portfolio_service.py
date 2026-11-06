from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.portfolio import Portfolio, Holding, Transaction
from app.schemas.portfolio import OrderRequest
from app.services.market_data import get_stock_quote, normalize_symbol


def get_or_create_default_portfolio(db: Session) -> Portfolio:
    """
    Retrieves or initializes the primary paper-trading portfolio with ₹10,00,000 starting cash.
    """
    portfolio = db.query(Portfolio).first()
    if not portfolio:
        portfolio = Portfolio(
            name="Primary Paper Trading Account",
            initial_balance=1000000.0,
            cash_balance=1000000.0,
        )
        db.add(portfolio)
        db.commit()
        db.refresh(portfolio)
    return portfolio


def execute_order(db: Session, order: OrderRequest) -> Dict[str, Any]:
    """
    Executes a simulated BUY or SELL order using live Indian market quotes.
    Strictly prevents trades if insufficient funds or insufficient shares are held.
    """
    portfolio = get_or_create_default_portfolio(db)
    norm_symbol = normalize_symbol(order.symbol)
    trade_type = order.transaction_type.upper().strip()

    if trade_type not in ["BUY", "SELL"]:
        raise ValueError("Transaction type must be 'BUY' or 'SELL'.")

    # Fetch live/latest execution quote from NSE/BSE
    quote = get_stock_quote(norm_symbol)
    exec_price = float(quote["current_price"])
    company_name = quote["company_name"]
    total_trade_amount = round(exec_price * order.quantity, 2)

    # Find existing holding
    holding = (
        db.query(Holding)
        .filter(Holding.portfolio_id == portfolio.id, Holding.symbol == norm_symbol)
        .first()
    )

    realized_pnl = 0.0

    if trade_type == "BUY":
        # Check sufficient cash
        if portfolio.cash_balance < total_trade_amount:
            raise ValueError(
                f"Insufficient funds: Required ₹{total_trade_amount:,.2f}, available cash is ₹{portfolio.cash_balance:,.2f}."
            )

        # Deduct cash
        portfolio.cash_balance = round(portfolio.cash_balance - total_trade_amount, 2)

        if holding:
            # Recompute weighted average buy price
            total_shares = holding.quantity + order.quantity
            total_invested = (holding.quantity * holding.average_buy_price) + total_trade_amount
            holding.average_buy_price = round(total_invested / total_shares, 2)
            holding.quantity = total_shares
        else:
            # Create new holding record
            holding = Holding(
                portfolio_id=portfolio.id,
                symbol=norm_symbol,
                company_name=company_name,
                quantity=order.quantity,
                average_buy_price=exec_price,
            )
            db.add(holding)

    elif trade_type == "SELL":
        # Check sufficient shares
        if not holding or holding.quantity < order.quantity:
            avail = holding.quantity if holding else 0
            raise ValueError(
                f"Cannot sell {order.quantity} shares of {norm_symbol}. You only hold {avail} shares."
            )

        # Calculate realized PnL
        cost_basis = holding.average_buy_price * order.quantity
        proceeds = total_trade_amount
        realized_pnl = round(proceeds - cost_basis, 2)

        # Credit cash
        portfolio.cash_balance = round(portfolio.cash_balance + total_trade_amount, 2)

        # Update or delete holding
        remaining_qty = holding.quantity - order.quantity
        if remaining_qty > 0:
            holding.quantity = remaining_qty
        else:
            db.delete(holding)

    # Record the transaction
    txn = Transaction(
        portfolio_id=portfolio.id,
        symbol=norm_symbol,
        company_name=company_name,
        transaction_type=trade_type,
        quantity=order.quantity,
        price=exec_price,
        total_amount=total_trade_amount,
        realized_pnl=realized_pnl,
        notes=order.notes,
    )
    db.add(txn)

    db.commit()
    db.refresh(portfolio)
    db.refresh(txn)

    return {
        "message": f"Successfully executed {trade_type} order for {order.quantity} shares of {norm_symbol} at ₹{exec_price:,.2f}",
        "transaction_id": txn.id,
        "cash_balance": portfolio.cash_balance,
        "realized_pnl": realized_pnl,
    }


def get_portfolio_summary(db: Session) -> Dict[str, Any]:
    """
    Computes real-time portfolio performance, marking all active holdings to market.
    """
    portfolio = get_or_create_default_portfolio(db)
    holdings = db.query(Holding).filter(Holding.portfolio_id == portfolio.id).all()
    transactions = (
        db.query(Transaction)
        .filter(Transaction.portfolio_id == portfolio.id)
        .order_by(Transaction.timestamp.desc())
        .limit(20)
        .all()
    )

    holdings_response = []
    total_invested_value = 0.0
    total_current_market_value = 0.0

    for h in holdings:
        try:
            q = get_stock_quote(h.symbol)
            cur_price = float(q["current_price"])
        except Exception:
            cur_price = h.average_buy_price

        invested = round(h.quantity * h.average_buy_price, 2)
        cur_val = round(h.quantity * cur_price, 2)
        unrealized = round(cur_val - invested, 2)
        unrealized_pct = round((unrealized / invested) * 100, 2) if invested > 0 else 0.0

        total_invested_value += invested
        total_current_market_value += cur_val

        holdings_response.append({
            "id": h.id,
            "symbol": h.symbol,
            "company_name": h.company_name,
            "quantity": h.quantity,
            "average_buy_price": h.average_buy_price,
            "current_price": cur_price,
            "current_value": cur_val,
            "invested_value": invested,
            "unrealized_pnl": unrealized,
            "unrealized_pnl_percent": unrealized_pct,
        })

    # Total realized PnL from all past SELL transactions
    all_sell_txns = (
        db.query(Transaction)
        .filter(Transaction.portfolio_id == portfolio.id, Transaction.transaction_type == "SELL")
        .all()
    )
    total_realized_pnl = round(sum(t.realized_pnl for t in all_sell_txns), 2)

    total_unrealized_pnl = round(total_current_market_value - total_invested_value, 2)
    total_unrealized_pct = (
        round((total_unrealized_pnl / total_invested_value) * 100, 2)
        if total_invested_value > 0
        else 0.0
    )

    current_portfolio_value = round(portfolio.cash_balance + total_current_market_value, 2)
    net_pnl = round(current_portfolio_value - portfolio.initial_balance, 2)
    net_pnl_percent = round((net_pnl / portfolio.initial_balance) * 100, 2)

    return {
        "id": portfolio.id,
        "name": portfolio.name,
        "initial_balance": portfolio.initial_balance,
        "cash_balance": round(portfolio.cash_balance, 2),
        "invested_value": round(total_invested_value, 2),
        "current_portfolio_value": current_portfolio_value,
        "total_unrealized_pnl": total_unrealized_pnl,
        "total_unrealized_pnl_percent": total_unrealized_pct,
        "total_realized_pnl": total_realized_pnl,
        "net_pnl": net_pnl,
        "net_pnl_percent": net_pnl_percent,
        "holdings": holdings_response,
        "recent_transactions": [
            {
                "id": t.id,
                "symbol": t.symbol,
                "company_name": t.company_name,
                "transaction_type": t.transaction_type,
                "quantity": t.quantity,
                "price": t.price,
                "total_amount": t.total_amount,
                "realized_pnl": t.realized_pnl,
                "timestamp": t.timestamp,
                "notes": t.notes,
            }
            for t in transactions
        ],
    }


def reset_portfolio(db: Session) -> Dict[str, Any]:
    """
    Clears all holdings and transactions, resetting the cash balance to initial ₹10,00,000.
    """
    portfolio = get_or_create_default_portfolio(db)
    db.query(Holding).filter(Holding.portfolio_id == portfolio.id).delete()
    db.query(Transaction).filter(Transaction.portfolio_id == portfolio.id).delete()
    portfolio.cash_balance = portfolio.initial_balance
    db.commit()
    db.refresh(portfolio)
    return {
        "message": "Paper portfolio successfully reset to starting balance of ₹10,00,000.00.",
        "cash_balance": portfolio.cash_balance,
    }

