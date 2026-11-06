import logging
from typing import List, Dict, Any, Optional
import requests
import pandas as pd
import yfinance as yf
from app.services.indicators import compute_all_indicators, generate_technical_summary

logger = logging.getLogger(__name__)

# Shared requests session with standard browser headers to prevent Yahoo Finance 429/crumb throttling
_MARKET_SESSION = None

def get_market_session() -> requests.Session:
    global _MARKET_SESSION
    if _MARKET_SESSION is None:
        _MARKET_SESSION = requests.Session()
        _MARKET_SESSION.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
        })
    return _MARKET_SESSION


# Curated catalog of top Indian Equities (NSE & BSE)
INDIAN_STOCKS_CATALOG = [
    {"symbol": "RELIANCE.NS", "name": "Reliance Industries Ltd", "sector": "Energy & Petrochemicals", "exchange": "NSE"},
    {"symbol": "TCS.NS", "name": "Tata Consultancy Services Ltd", "sector": "Information Technology", "exchange": "NSE"},
    {"symbol": "HDFCBANK.NS", "name": "HDFC Bank Ltd", "sector": "Banking & Financial Services", "exchange": "NSE"},
    {"symbol": "INFY.NS", "name": "Infosys Ltd", "sector": "Information Technology", "exchange": "NSE"},
    {"symbol": "ICICIBANK.NS", "name": "ICICI Bank Ltd", "sector": "Banking & Financial Services", "exchange": "NSE"},
    {"symbol": "BHARTIARTL.NS", "name": "Bharti Airtel Ltd", "sector": "Telecommunications", "exchange": "NSE"},
    {"symbol": "SBIN.NS", "name": "State Bank of India", "sector": "Public Sector Banking", "exchange": "NSE"},
    {"symbol": "ITC.NS", "name": "ITC Ltd", "sector": "Consumer Goods (FMCG)", "exchange": "NSE"},
    {"symbol": "LICI.NS", "name": "Life Insurance Corp of India", "sector": "Insurance", "exchange": "NSE"},
    {"symbol": "HINDUNILVR.NS", "name": "Hindustan Unilever Ltd", "sector": "Consumer Goods (FMCG)", "exchange": "NSE"},
    {"symbol": "LT.NS", "name": "Larsen & Toubro Ltd", "sector": "Infrastructure & Engineering", "exchange": "NSE"},
    {"symbol": "TATAMOTORS.NS", "name": "Tata Motors Ltd", "sector": "Automobile", "exchange": "NSE"},
    {"symbol": "BAJFINANCE.NS", "name": "Bajaj Finance Ltd", "sector": "Non-Banking Financial", "exchange": "NSE"},
    {"symbol": "SUNPHARMA.NS", "name": "Sun Pharmaceutical Industries", "sector": "Healthcare & Pharma", "exchange": "NSE"},
    {"symbol": "MARUTI.NS", "name": "Maruti Suzuki India Ltd", "sector": "Automobile", "exchange": "NSE"},
    {"symbol": "NTPC.NS", "name": "NTPC Ltd", "sector": "Power Generation", "exchange": "NSE"},
    {"symbol": "ONGC.NS", "name": "Oil & Natural Gas Corp", "sector": "Oil & Gas Exploration", "exchange": "NSE"},
    {"symbol": "KOTAKBANK.NS", "name": "Kotak Mahindra Bank Ltd", "sector": "Banking & Financial Services", "exchange": "NSE"},
    {"symbol": "TITAN.NS", "name": "Titan Company Ltd", "sector": "Consumer Discretionary", "exchange": "NSE"},
    {"symbol": "WIPRO.NS", "name": "Wipro Ltd", "sector": "Information Technology", "exchange": "NSE"},
    {"symbol": "^NSEI", "name": "NIFTY 50", "sector": "Benchmark Index", "exchange": "NSE"},
    {"symbol": "^BSESN", "name": "S&P BSE SENSEX", "sector": "Benchmark Index", "exchange": "BSE"},
    {"symbol": "^NSEBANK", "name": "NIFTY BANK", "sector": "Sectoral Index", "exchange": "NSE"},
]


def normalize_symbol(symbol: str) -> str:
    """
    Standardize Indian market symbols. Default to .NS if no exchange suffix is supplied.
    """
    cleaned = symbol.strip().upper()
    if cleaned.startswith("^"):
        return cleaned
    if not (cleaned.endswith(".NS") or cleaned.endswith(".BO")):
        return f"{cleaned}.NS"
    return cleaned


def fetch_history_robust(symbol: str, period: str = "6mo", interval: str = "1d") -> pd.DataFrame:
    """
    Robust historical candle fetcher using custom browser session and automatic multi-index handling.
    """
    norm_symbol = normalize_symbol(symbol)
    session = get_market_session()
    df = pd.DataFrame()

    # 1. Try standard Ticker history with configured session
    try:
        ticker = yf.Ticker(norm_symbol, session=session)
        df = ticker.history(period=period, interval=interval)
    except Exception as e:
        logger.warning(f"Ticker.history failed for {norm_symbol}: {e}")

    # 2. If empty, fallback to yf.download with session
    if df.empty:
        try:
            df = yf.download(norm_symbol, period=period, interval=interval, progress=False, session=session)
            if isinstance(df.columns, pd.MultiIndex):
                df.columns = df.columns.get_level_values(0)
        except Exception as e:
            logger.error(f"yf.download failed for {norm_symbol}: {e}")

    # 3. Clean up and validate
    if df.empty:
        raise ValueError(f"No historical market records returned for {norm_symbol} (period={period}).")

    # Ensure required columns exist
    for col in ["Close", "Open", "High", "Low", "Volume"]:
        if col not in df.columns:
            raise ValueError(f"Historical data missing '{col}' column for {norm_symbol}.")

    return df


def search_stocks(query: str) -> List[Dict[str, str]]:
    """
    Search Indian stocks catalog by symbol, company name, or sector.
    """
    q = query.strip().lower()
    if not q:
        return INDIAN_STOCKS_CATALOG[:12]

    results = []
    for item in INDIAN_STOCKS_CATALOG:
        if (
            q in item["symbol"].lower()
            or q in item["name"].lower()
            or q in item["sector"].lower()
        ):
            results.append(item)

    if not results:
        direct_sym = normalize_symbol(query)
        results.append({
            "symbol": direct_sym,
            "name": f"{query.upper()} (NSE/BSE)",
            "sector": "Indian Equities",
            "exchange": "BSE" if direct_sym.endswith(".BO") else "NSE",
        })

    return results


def get_stock_quote(symbol: str) -> Dict[str, Any]:
    """
    Fetch live or latest closing quote for an Indian stock.
    """
    norm_symbol = normalize_symbol(symbol)
    session = get_market_session()
    ticker = yf.Ticker(norm_symbol, session=session)

    try:
        hist = fetch_history_robust(norm_symbol, period="5d", interval="1d")
        latest = hist.iloc[-1]
        prev = hist.iloc[-2] if len(hist) > 1 else latest

        current_price = round(float(latest["Close"]), 2)
        prev_close = round(float(prev["Close"]), 2)
        price_change = round(current_price - prev_close, 2)
        pct_change = round((price_change / prev_close) * 100, 2) if prev_close != 0 else 0.0

        company_name = norm_symbol
        market_cap = None
        pe_ratio = None
        fifty_two_week_high = round(float(hist["High"].max()), 2)
        fifty_two_week_low = round(float(hist["Low"].min()), 2)

        try:
            info = ticker.info or {}
            company_name = info.get("shortName") or info.get("longName") or norm_symbol
            market_cap = info.get("marketCap")
            pe_ratio = info.get("trailingPE") or info.get("forwardPE")
            fifty_two_week_high = info.get("fiftyTwoWeekHigh") or fifty_two_week_high
            fifty_two_week_low = info.get("fiftyTwoWeekLow") or fifty_two_week_low
        except Exception:
            pass

        for item in INDIAN_STOCKS_CATALOG:
            if item["symbol"] == norm_symbol:
                company_name = item["name"]
                break

        return {
            "symbol": norm_symbol,
            "company_name": company_name,
            "current_price": current_price,
            "previous_close": prev_close,
            "change": price_change,
            "percent_change": pct_change,
            "open": round(float(latest["Open"]), 2),
            "high": round(float(latest["High"]), 2),
            "low": round(float(latest["Low"]), 2),
            "volume": int(latest["Volume"]),
            "fifty_two_week_high": round(float(fifty_two_week_high), 2) if fifty_two_week_high else None,
            "fifty_two_week_low": round(float(fifty_two_week_low), 2) if fifty_two_week_low else None,
            "pe_ratio": round(float(pe_ratio), 2) if pe_ratio else None,
            "market_cap": market_cap,
            "currency": "INR",
        }

    except Exception as e:
        logger.error(f"Error fetching quote for {norm_symbol}: {e}")
        raise ValueError(f"Could not retrieve real market data for '{norm_symbol}': {str(e)}")


def get_historical_data(
    symbol: str,
    period: str = "6mo",
    interval: str = "1d",
) -> List[Dict[str, Any]]:
    """
    Fetch historical OHLCV data for an Indian equity.
    """
    hist = fetch_history_robust(symbol, period=period, interval=interval)

    records = []
    for date_idx, row in hist.iterrows():
        date_str = date_idx.strftime("%Y-%m-%d")
        records.append({
            "date": date_str,
            "open": round(float(row["Open"]), 2),
            "high": round(float(row["High"]), 2),
            "low": round(float(row["Low"]), 2),
            "close": round(float(row["Close"]), 2),
            "volume": int(row["Volume"]),
        })

    return records


def get_stock_indicators_data(symbol: str, period: str = "6mo") -> Dict[str, Any]:
    """
    Retrieves historical OHLCV, computes all mathematical indicators (RSI, MACD, SMAs, EMAs),
    and produces rule-based BUY/SELL/HOLD signals without LLM hallucination.
    """
    norm_symbol = normalize_symbol(symbol)
    hist = fetch_history_robust(norm_symbol, period=period, interval="1d")

    if len(hist) < 15:
        raise ValueError(f"Insufficient historical data for {norm_symbol} to compute technical indicators.")

    df_indicators = compute_all_indicators(hist)
    summary = generate_technical_summary(df_indicators)

    chart_data = []
    for date_idx, row in df_indicators.iterrows():
        chart_data.append({
            "date": date_idx.strftime("%Y-%m-%d"),
            "close": round(float(row["Close"]), 2),
            "volume": int(row["Volume"]),
            "sma_20": None if pd.isna(row.get("SMA_20")) else round(float(row["SMA_20"]), 2),
            "sma_50": None if pd.isna(row.get("SMA_50")) else round(float(row["SMA_50"]), 2),
            "sma_200": None if pd.isna(row.get("SMA_200")) else round(float(row["SMA_200"]), 2),
            "ema_9": None if pd.isna(row.get("EMA_9")) else round(float(row["EMA_9"]), 2),
            "ema_21": None if pd.isna(row.get("EMA_21")) else round(float(row["EMA_21"]), 2),
            "rsi_14": None if pd.isna(row.get("RSI_14")) else round(float(row["RSI_14"]), 2),
            "macd": None if pd.isna(row.get("MACD")) else round(float(row["MACD"]), 2),
            "macd_signal": None if pd.isna(row.get("MACD_Signal")) else round(float(row["MACD_Signal"]), 2),
            "macd_hist": None if pd.isna(row.get("MACD_Hist")) else round(float(row["MACD_Hist"]), 2),
        })

    return {
        "symbol": norm_symbol,
        "period": period,
        "count": len(chart_data),
        "summary": summary,
        "chart_data": chart_data,
    }
