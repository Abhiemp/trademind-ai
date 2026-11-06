import math
from typing import Dict, Any, List
import pandas as pd
from app.schemas.backtest import BacktestRequest, BacktestResponse, TradeRecord, EquityPoint
from app.services.market_data import normalize_symbol, get_stock_quote, fetch_history_robust
from app.services.indicators import calculate_rsi, calculate_sma, calculate_ema, calculate_macd


def run_strategy_backtest(req: BacktestRequest) -> BacktestResponse:
    """
    Simulates quantitative algorithmic strategies against authentic historical Indian stock data.
    """
    norm_symbol = normalize_symbol(req.symbol)
    
    # Retrieve historical daily data using robust fetcher
    hist = fetch_history_robust(norm_symbol, period=req.period, interval="1d")
    if hist.empty or len(hist) < 30:
        raise ValueError(f"Insufficient historical data for {norm_symbol} to backtest (period={req.period}).")

    # Get company name
    try:
        quote = get_stock_quote(norm_symbol)
        company_name = quote["company_name"]
    except Exception:
        company_name = norm_symbol

    df = hist.copy()
    close = df["Close"]

    # Calculate indicators according to strategy type
    strategy_type = req.strategy_type.upper().strip()
    strategy_name = strategy_type.replace("_", " ").title()

    if strategy_type == "SMA_CROSSOVER":
        fast_col = f"SMA_{req.fast_period}"
        slow_col = f"SMA_{req.slow_period}"
        df[fast_col] = calculate_sma(close, req.fast_period)
        df[slow_col] = calculate_sma(close, req.slow_period)
        strategy_name = f"SMA Crossover ({req.fast_period} / {req.slow_period})"

    elif strategy_type == "EMA_CROSSOVER":
        fast_col = f"EMA_{req.fast_period}"
        slow_col = f"EMA_{req.slow_period}"
        df[fast_col] = calculate_ema(close, req.fast_period)
        df[slow_col] = calculate_ema(close, req.slow_period)
        strategy_name = f"EMA Crossover ({req.fast_period} / {req.slow_period})"

    elif strategy_type == "RSI_MEAN_REVERSION":
        df["RSI"] = calculate_rsi(close, req.rsi_period)
        strategy_name = f"RSI Mean Reversion (14, {int(req.rsi_oversold)}/{int(req.rsi_overbought)})"

    elif strategy_type == "MACD_CROSSOVER":
        macd_data = calculate_macd(close, 12, 26, 9)
        df["MACD"] = macd_data["macd"]
        df["MACD_Signal"] = macd_data["signal"]
        strategy_name = "MACD Crossover (12, 26, 9)"

    else:
        raise ValueError(f"Unsupported strategy type: {req.strategy_type}")

    # Simulation Variables
    initial_capital = float(req.initial_capital)
    cash = initial_capital
    position_shares = 0
    entry_price = 0.0
    entry_date = ""

    trades: List[TradeRecord] = []
    equity_curve: List[EquityPoint] = []

    first_price = float(df.iloc[0]["Close"])
    benchmark_shares = initial_capital / first_price

    # Loop day by day
    for i in range(1, len(df)):
        current_bar = df.iloc[i]
        prev_bar = df.iloc[i - 1]
        
        current_date = current_bar.name.strftime("%Y-%m-%d")
        current_close = round(float(current_bar["Close"]), 2)
        
        # Check Entry / Exit signals
        buy_signal = False
        sell_signal = False
        exit_reason = ""

        if strategy_type in ["SMA_CROSSOVER", "EMA_CROSSOVER"]:
            prev_fast = prev_bar.get(fast_col)
            prev_slow = prev_bar.get(slow_col)
            curr_fast = current_bar.get(fast_col)
            curr_slow = current_bar.get(slow_col)

            if not pd.isna(prev_fast) and not pd.isna(prev_slow) and not pd.isna(curr_fast) and not pd.isna(curr_slow):
                # Bullish Crossover: Fast crossed above Slow
                if prev_fast <= prev_slow and curr_fast > curr_slow:
                    buy_signal = True
                # Bearish Crossover: Fast crossed below Slow
                elif prev_fast >= prev_slow and curr_fast < curr_slow:
                    sell_signal = True
                    exit_reason = "MA Bearish Crossover"

        elif strategy_type == "RSI_MEAN_REVERSION":
            prev_rsi = prev_bar.get("RSI")
            curr_rsi = current_bar.get("RSI")

            if not pd.isna(prev_rsi) and not pd.isna(curr_rsi):
                # Oversold bounce: crossed above oversold threshold
                if prev_rsi <= req.rsi_oversold and curr_rsi > req.rsi_oversold:
                    buy_signal = True
                # Overbought exit: crossed above overbought threshold
                elif curr_rsi >= req.rsi_overbought:
                    sell_signal = True
                    exit_reason = f"RSI Overbought (>{req.rsi_overbought})"

        elif strategy_type == "MACD_CROSSOVER":
            prev_m = prev_bar.get("MACD")
            prev_s = prev_bar.get("MACD_Signal")
            curr_m = current_bar.get("MACD")
            curr_s = current_bar.get("MACD_Signal")

            if not pd.isna(prev_m) and not pd.isna(prev_s) and not pd.isna(curr_m) and not pd.isna(curr_s):
                if prev_m <= prev_s and curr_m > curr_s:
                    buy_signal = True
                elif prev_m >= prev_s and curr_m < curr_s:
                    sell_signal = True
                    exit_reason = "MACD Bearish Crossover"

        # Execute Sell if holding shares
        if sell_signal and position_shares > 0:
            proceeds = round(position_shares * current_close, 2)
            cost_basis = round(position_shares * entry_price, 2)
            pnl = round(proceeds - cost_basis, 2)
            ret_pct = round((pnl / cost_basis) * 100, 2) if cost_basis > 0 else 0.0

            trades.append(
                TradeRecord(
                    entry_date=entry_date,
                    entry_price=entry_price,
                    exit_date=current_date,
                    exit_price=current_close,
                    shares=position_shares,
                    pnl=pnl,
                    return_pct=ret_pct,
                    exit_reason=exit_reason or "Strategy Exit Signal",
                )
            )

            cash = round(cash + proceeds, 2)
            position_shares = 0
            entry_price = 0.0
            entry_date = ""

        # Execute Buy if cash available and not currently invested
        elif buy_signal and position_shares == 0 and cash >= current_close:
            shares_to_buy = int(cash // current_close)
            if shares_to_buy > 0:
                cost = round(shares_to_buy * current_close, 2)
                cash = round(cash - cost, 2)
                position_shares = shares_to_buy
                entry_price = current_close
                entry_date = current_date

        # Record Daily Mark-to-Market Equity
        total_strategy_equity = round(cash + (position_shares * current_close), 2)
        total_benchmark_equity = round(benchmark_shares * current_close, 2)

        equity_curve.append(
            EquityPoint(
                date=current_date,
                strategy_equity=total_strategy_equity,
                benchmark_equity=total_benchmark_equity,
                close_price=current_close,
            )
        )

    # If still in open position on final bar, close trade at final price
    if position_shares > 0:
        final_bar = df.iloc[-1]
        final_date = final_bar.name.strftime("%Y-%m-%d")
        final_close = round(float(final_bar["Close"]), 2)
        proceeds = round(position_shares * final_close, 2)
        cost_basis = round(position_shares * entry_price, 2)
        pnl = round(proceeds - cost_basis, 2)
        ret_pct = round((pnl / cost_basis) * 100, 2) if cost_basis > 0 else 0.0

        trades.append(
            TradeRecord(
                entry_date=entry_date,
                entry_price=entry_price,
                exit_date=final_date,
                exit_price=final_close,
                shares=position_shares,
                pnl=pnl,
                return_pct=ret_pct,
                exit_reason="End of Backtest Period (Market Close)",
            )
        )
        cash = round(cash + proceeds, 2)
        position_shares = 0

    final_equity = round(equity_curve[-1].strategy_equity if equity_curve else initial_capital, 2)
    final_benchmark = round(equity_curve[-1].benchmark_equity if equity_curve else initial_capital, 2)

    strategy_return_pct = round(((final_equity - initial_capital) / initial_capital) * 100, 2)
    benchmark_return_pct = round(((final_benchmark - initial_capital) / initial_capital) * 100, 2)
    outperformance = round(strategy_return_pct - benchmark_return_pct, 2)

    # Trade statistics
    total_trades = len(trades)
    winning_trades = sum(1 for t in trades if t.pnl > 0)
    losing_trades = sum(1 for t in trades if t.pnl <= 0)
    win_rate = round((winning_trades / total_trades) * 100, 1) if total_trades > 0 else 0.0

    gross_profit = sum(t.pnl for t in trades if t.pnl > 0)
    gross_loss = abs(sum(t.pnl for t in trades if t.pnl < 0))
    profit_factor = round(gross_profit / gross_loss, 2) if gross_loss > 0 else (99.0 if gross_profit > 0 else 1.0)

    # Max Drawdown calculation
    peak = initial_capital
    max_dd = 0.0
    for pt in equity_curve:
        if pt.strategy_equity > peak:
            peak = pt.strategy_equity
        dd = (pt.strategy_equity - peak) / peak if peak > 0 else 0.0
        if dd < max_dd:
            max_dd = dd

    max_drawdown_pct = round(abs(max_dd) * 100, 2)

    return BacktestResponse(
        symbol=norm_symbol,
        company_name=company_name,
        strategy_name=strategy_name,
        period=req.period,
        initial_capital=initial_capital,
        final_equity=final_equity,
        strategy_return_pct=strategy_return_pct,
        benchmark_return_pct=benchmark_return_pct,
        outperformance_pct=outperformance,
        total_trades=total_trades,
        winning_trades=winning_trades,
        losing_trades=losing_trades,
        win_rate=win_rate,
        max_drawdown=max_drawdown_pct,
        profit_factor=profit_factor,
        trades=trades,
        equity_curve=equity_curve,
    )
