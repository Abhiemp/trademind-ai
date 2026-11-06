import numpy as np
import pandas as pd
from typing import Dict, Any, List


def calculate_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    """
    Calculate the Relative Strength Index (RSI) using Wilder's Smoothing.
    """
    if len(series) < period:
        return pd.Series(np.nan, index=series.index)

    delta = series.diff()
    gain = delta.clip(lower=0)
    loss = -1 * delta.clip(upper=0)

    # Wilder's exponential moving average
    avg_gain = gain.ewm(alpha=1 / period, min_periods=period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1 / period, min_periods=period, adjust=False).mean()

    rs = avg_gain / avg_loss.replace(0, np.nan)
    rsi = 100 - (100 / (1 + rs))
    # Where loss was 0 and gain > 0, RSI is 100
    rsi = rsi.fillna(100.0)
    return rsi.round(2)


def calculate_macd(
    series: pd.Series,
    fast_period: int = 12,
    slow_period: int = 26,
    signal_period: int = 9,
) -> Dict[str, pd.Series]:
    """
    Calculate MACD, Signal Line, and MACD Histogram.
    """
    ema_fast = series.ewm(span=fast_period, adjust=False).mean()
    ema_slow = series.ewm(span=slow_period, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal_period, adjust=False).mean()
    histogram = macd_line - signal_line

    return {
        "macd": macd_line.round(2),
        "signal": signal_line.round(2),
        "histogram": histogram.round(2),
    }


def calculate_sma(series: pd.Series, window: int) -> pd.Series:
    """Simple Moving Average"""
    return series.rolling(window=window).mean().round(2)


def calculate_ema(series: pd.Series, span: int) -> pd.Series:
    """Exponential Moving Average"""
    return series.ewm(span=span, adjust=False).mean().round(2)


def compute_all_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """
    Takes a DataFrame with 'Close' column and computes all technical indicators.
    """
    if df.empty or "Close" not in df.columns:
        return df

    data = df.copy()
    close = data["Close"]

    # Moving Averages
    data["SMA_20"] = calculate_sma(close, 20)
    data["SMA_50"] = calculate_sma(close, 50)
    data["SMA_200"] = calculate_sma(close, 200)

    data["EMA_9"] = calculate_ema(close, 9)
    data["EMA_21"] = calculate_ema(close, 21)
    data["EMA_50"] = calculate_ema(close, 50)

    # RSI (14)
    data["RSI_14"] = calculate_rsi(close, 14)

    # MACD (12, 26, 9)
    macd_data = calculate_macd(close, 12, 26, 9)
    data["MACD"] = macd_data["macd"]
    data["MACD_Signal"] = macd_data["signal"]
    data["MACD_Hist"] = macd_data["histogram"]

    return data


def generate_technical_summary(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Analyzes the latest computed technical indicators to produce rule-based signals.
    """
    if df.empty or len(df) < 2:
        return {
            "overall_signal": "NEUTRAL",
            "score": 0,
            "rsi_signal": "NEUTRAL",
            "macd_signal": "NEUTRAL",
            "moving_averages_signal": "NEUTRAL",
            "signals_breakdown": [],
        }

    latest = df.iloc[-1]
    prev = df.iloc[-2]
    close = float(latest["Close"])

    signals: List[Dict[str, str]] = []
    bullish_count = 0
    bearish_count = 0

    # 1. RSI Analysis
    rsi = float(latest.get("RSI_14", 50)) if not pd.isna(latest.get("RSI_14")) else 50.0
    if rsi < 30:
        rsi_signal = "OVERSOLD (BULLISH REVERSAL POTENTIAL)"
        signals.append({"indicator": "RSI (14)", "value": f"{rsi:.1f}", "signal": "BULLISH", "note": "RSI below 30 indicates oversold territory."})
        bullish_count += 1
    elif rsi > 70:
        rsi_signal = "OVERBOUGHT (BEARISH PULLBACK RISK)"
        signals.append({"indicator": "RSI (14)", "value": f"{rsi:.1f}", "signal": "BEARISH", "note": "RSI above 70 indicates overbought conditions."})
        bearish_count += 1
    elif rsi > 50:
        rsi_signal = "MOMENTUM BULLISH"
        signals.append({"indicator": "RSI (14)", "value": f"{rsi:.1f}", "signal": "MILD_BULLISH", "note": "RSI above 50 indicates positive upward momentum."})
        bullish_count += 0.5
    else:
        rsi_signal = "MOMENTUM BEARISH"
        signals.append({"indicator": "RSI (14)", "value": f"{rsi:.1f}", "signal": "MILD_BEARISH", "note": "RSI below 50 indicates negative downward momentum."})
        bearish_count += 0.5

    # 2. MACD Analysis
    macd = float(latest.get("MACD", 0)) if not pd.isna(latest.get("MACD")) else 0.0
    signal = float(latest.get("MACD_Signal", 0)) if not pd.isna(latest.get("MACD_Signal")) else 0.0
    prev_macd = float(prev.get("MACD", 0)) if not pd.isna(prev.get("MACD")) else 0.0
    prev_signal = float(prev.get("MACD_Signal", 0)) if not pd.isna(prev.get("MACD_Signal")) else 0.0

    if prev_macd <= prev_signal and macd > signal:
        macd_signal = "BULLISH CROSSOVER"
        signals.append({"indicator": "MACD", "value": f"{macd:.2f} vs {signal:.2f}", "signal": "BULLISH", "note": "Fresh bullish crossover: MACD crossed above signal line."})
        bullish_count += 1.5
    elif prev_macd >= prev_signal and macd < signal:
        macd_signal = "BEARISH CROSSOVER"
        signals.append({"indicator": "MACD", "value": f"{macd:.2f} vs {signal:.2f}", "signal": "BEARISH", "note": "Fresh bearish crossover: MACD crossed below signal line."})
        bearish_count += 1.5
    elif macd > signal:
        macd_signal = "BULLISH"
        signals.append({"indicator": "MACD", "value": f"{macd:.2f}", "signal": "BULLISH", "note": "MACD is trading above signal line."})
        bullish_count += 1
    else:
        macd_signal = "BEARISH"
        signals.append({"indicator": "MACD", "value": f"{macd:.2f}", "signal": "BEARISH", "note": "MACD is trading below signal line."})
        bearish_count += 1

    # 3. EMA & SMA Trend Alignment
    ema_9 = latest.get("EMA_9")
    ema_21 = latest.get("EMA_21")
    sma_50 = latest.get("SMA_50")
    sma_200 = latest.get("SMA_200")

    ma_score = 0
    if not pd.isna(ema_9) and not pd.isna(ema_21):
        if ema_9 > ema_21:
            signals.append({"indicator": "EMA 9 / 21", "value": f"{ema_9:.1f} > {ema_21:.1f}", "signal": "BULLISH", "note": "Short-term EMA 9 is above EMA 21."})
            ma_score += 1
        else:
            signals.append({"indicator": "EMA 9 / 21", "value": f"{ema_9:.1f} < {ema_21:.1f}", "signal": "BEARISH", "note": "Short-term EMA 9 is below EMA 21."})
            ma_score -= 1

    if not pd.isna(sma_50):
        if close > sma_50:
            signals.append({"indicator": "SMA 50", "value": f"₹{close:.1f} > ₹{sma_50:.1f}", "signal": "BULLISH", "note": "Price is above medium-term 50-day moving average."})
            ma_score += 1
        else:
            signals.append({"indicator": "SMA 50", "value": f"₹{close:.1f} < ₹{sma_50:.1f}", "signal": "BEARISH", "note": "Price is below medium-term 50-day moving average."})
            ma_score -= 1

    if not pd.isna(sma_200):
        if close > sma_200:
            signals.append({"indicator": "SMA 200", "value": f"₹{close:.1f} > ₹{sma_200:.1f}", "signal": "BULLISH", "note": "Long-term bullish trend: Price trading above 200 SMA."})
            ma_score += 1.5
        else:
            signals.append({"indicator": "SMA 200", "value": f"₹{close:.1f} < ₹{sma_200:.1f}", "signal": "BEARISH", "note": "Long-term bearish trend: Price trading below 200 SMA."})
            ma_score -= 1.5

    if ma_score > 1:
        ma_summary = "BULLISH"
        bullish_count += 1
    elif ma_score < -1:
        ma_summary = "BEARISH"
        bearish_count += 1
    else:
        ma_summary = "NEUTRAL"

    # Overall Consensus
    total_score = bullish_count - bearish_count
    if total_score >= 2.0:
        overall = "BUY"
    elif total_score <= -2.0:
        overall = "SELL"
    else:
        overall = "HOLD"

    return {
        "overall_signal": overall,
        "score": round(total_score, 1),
        "rsi": round(rsi, 2),
        "rsi_signal": rsi_signal,
        "macd": round(macd, 2),
        "macd_signal": macd_signal,
        "moving_averages_signal": ma_summary,
        "signals_breakdown": signals,
    }

