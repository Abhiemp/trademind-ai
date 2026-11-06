import json
import logging
from typing import List, Dict, Any, Optional
from groq import Groq
from app.core.config import settings
from app.services.market_data import (
    get_stock_quote,
    get_stock_indicators_data,
    search_stocks,
    normalize_symbol,
)

logger = logging.getLogger(__name__)

# System prompt enforcing strict tool use and SEBI educational disclaimer
SYSTEM_PROMPT = """You are TradeMind AI, a senior quantitative financial analyst specializing in Indian equity markets (NSE and BSE).
Your primary goal is to provide objective, data-backed financial analysis for college-level research and simulated trading.

CRITICAL RULES:
1. NEVER hallucinate or invent numerical stock data, prices, RSI values, or moving averages.
2. ALWAYS call the available tools (`get_stock_quote`, `get_stock_indicators`, `compare_stocks`, `search_stocks`) to retrieve authentic figures before answering questions about specific Indian companies.
3. When analyzing a stock, structure your output clearly:
   - 📊 **Executive Summary**: Company name, current price (₹), and day's percentage change.
   - 📈 **Technical Momentum**: Detail the 14-period RSI, MACD signal/line, and Moving Average alignments (SMA 50/200, EMA 9/21).
   - 🎯 **Consensus Assessment**: State a clear rating (BUY, SELL, or HOLD) based strictly on the retrieved indicators.
   - ⚠️ **Educational Disclaimer**: Mention that this is simulated financial modeling for the AI for Finance CIA-2 assignment and not SEBI-registered financial advice.
4. Keep your tone professional, concise, and analytical.
"""

# Tool schemas following OpenAI / Groq tool calling specification
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_stock_quote",
            "description": "Fetch real-time or latest closing market quote for an Indian stock (NSE/BSE), including current price in INR, day high/low, 52-week range, and P/E ratio.",
            "parameters": {
                "type": "object",
                "properties": {
                    "symbol": {
                        "type": "string",
                        "description": "The Indian stock ticker symbol (e.g. 'RELIANCE', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS'). Defaults to .NS if exchange is omitted.",
                    }
                },
                "required": ["symbol"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_stock_indicators",
            "description": "Calculate deterministic technical indicators (RSI 14, MACD 12/26/9, SMA 20/50/200, EMA 9/21) and generate a rule-based BUY/SELL/HOLD consensus rating.",
            "parameters": {
                "type": "object",
                "properties": {
                    "symbol": {
                        "type": "string",
                        "description": "The Indian stock ticker symbol (e.g. 'RELIANCE.NS', 'TCS.NS').",
                    },
                    "period": {
                        "type": "string",
                        "enum": ["1mo", "3mo", "6mo", "1y"],
                        "description": "Historical time period to evaluate indicators over. Default is '6mo'.",
                    },
                },
                "required": ["symbol"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "compare_stocks",
            "description": "Compare 2 to 3 Indian equities side-by-side using real quotes and technical ratings.",
            "parameters": {
                "type": "object",
                "properties": {
                    "symbols": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of 2 to 3 stock tickers (e.g. ['TCS.NS', 'INFY.NS']).",
                    }
                },
                "required": ["symbols"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_stocks",
            "description": "Search the Indian stock catalog for symbol names, company names, or industry sectors.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search term, company name, or sector (e.g., 'Tata', 'Banking', 'Pharma').",
                    }
                },
                "required": ["query"],
            },
        },
    },
]


def execute_tool(tool_name: str, args: Dict[str, Any]) -> Dict[str, Any]:
    """
    Executes a deterministic backend financial tool and returns JSON-compatible results.
    """
    try:
        if tool_name == "get_stock_quote":
            symbol = args.get("symbol", "")
            return get_stock_quote(symbol)

        elif tool_name == "get_stock_indicators":
            symbol = args.get("symbol", "")
            period = args.get("period", "6mo")
            res = get_stock_indicators_data(symbol, period=period)
            # Return summary and latest values to keep context token-efficient
            return {
                "symbol": res["symbol"],
                "period": res["period"],
                "summary": res["summary"],
                "latest_metrics": res["chart_data"][-1] if res["chart_data"] else {},
            }

        elif tool_name == "compare_stocks":
            symbols = args.get("symbols", [])
            comparisons = []
            for s in symbols[:3]:
                try:
                    q = get_stock_quote(s)
                    ind = get_stock_indicators_data(s, period="3mo")
                    comparisons.append({
                        "symbol": q["symbol"],
                        "name": q["company_name"],
                        "price": q["current_price"],
                        "change_pct": q["percent_change"],
                        "rsi": ind["summary"]["rsi"],
                        "signal": ind["summary"]["overall_signal"],
                        "score": ind["summary"]["score"],
                    })
                except Exception as e:
                    comparisons.append({"symbol": s, "error": str(e)})
            return {"comparisons": comparisons}

        elif tool_name == "search_stocks":
            query = args.get("query", "")
            return {"results": search_stocks(query)}

        else:
            return {"error": f"Unknown tool: {tool_name}"}

    except Exception as e:
        logger.error(f"Error executing tool {tool_name} with args {args}: {e}")
        return {"error": str(e)}


def generate_mock_analysis(user_message: str, symbol: Optional[str] = None) -> Dict[str, Any]:
    """
    Graceful fallback when GROQ_API_KEY is not configured:
    Executes actual backend tools deterministically, computes authentic indicators,
    and formats an analytical response while advising how to enable Groq.
    """
    target_symbol = symbol or "RELIANCE.NS"
    # Try to detect any stock symbol in the message if not passed
    tokens = user_message.upper().replace("?", "").replace(",", "").split()
    for t in tokens:
        if t.endswith(".NS") or t.endswith(".BO") or t in ["RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK", "TATAMOTORS", "SBIN", "ITC"]:
            target_symbol = t
            break

    try:
        norm_sym = normalize_symbol(target_symbol)
        quote = get_stock_quote(norm_sym)
        indicators = get_stock_indicators_data(norm_sym, period="6mo")
        summary = indicators["summary"]
        signal = summary["overall_signal"]

        tools_used = [
            {"tool": "get_stock_quote", "symbol": norm_sym, "output": quote},
            {"tool": "get_stock_indicators", "symbol": norm_sym, "output": {"summary": summary}},
        ]

        content = f"""### 📊 Executive Market Summary: {quote['company_name']} ({quote['symbol']})
- **Current Price**: ₹{quote['current_price']:,.2f}
- **Change**: {quote['change']:+,.2f} ({quote['percent_change']:+,.2f}%)
- **Day's Range**: ₹{quote['low']:,.2f} – ₹{quote['high']:,.2f}
- **52-Week Range**: ₹{quote['fifty_two_week_low']} – ₹{quote['fifty_two_week_high']}
- **P/E Ratio**: {quote['pe_ratio']}x

---

### 📈 Technical Momentum Indicators (Deterministic Quant Engine)
- **RSI (14-period)**: `{summary['rsi']}` — **{summary['rsi_signal']}**
- **MACD (12, 26, 9)**: `{summary['macd']}` — **{summary['macd_signal']}**
- **Moving Average Alignment**: **{summary['moving_averages_signal']}** (SMA 50/200 & EMA 9/21)
- **Consensus Quantitative Score**: `{summary['score']}` / +5.0

---

### 🎯 Algorithmic Assessment: **{signal}**
Based on real-time historical data from the National Stock Exchange of India (NSE), the technical indicators indicate a **{signal}** posture. 
{ 'Upward price momentum remains strong with positive moving average slope.' if signal == 'BUY' else 'Momentum is neutral; consider range trading or waiting for breakout confirmation.' if signal == 'HOLD' else 'Bearish signals dominate; exercise caution or consider setting stop-loss levels.' }

---

> [!NOTE]
> **Groq API Status**: This analysis was computed directly via the TradeMind quant engine tools. To activate conversational LLM synthesis with Llama 3.3, add your free Groq API key in `backend/.env` (`GROQ_API_KEY="gsk_..."`).

*Disclaimer: Generated for educational simulated research (AI for Finance CIA-2). Not SEBI-registered financial advisory.*"""

        return {
            "content": content,
            "tools_used": tools_used,
            "groq_active": False,
        }

    except Exception as e:
        return {
            "content": f"I was unable to analyze {target_symbol}: {str(e)}. Please specify a valid NSE/BSE stock symbol (e.g. RELIANCE, TCS, INFY).",
            "tools_used": [],
            "groq_active": False,
        }


def process_chat_message(
    messages: List[Dict[str, str]],
    symbol: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Main entry point for AI analysis:
    - If GROQ_API_KEY is present, runs multi-turn tool calling with Groq.
    - If GROQ_API_KEY is absent, executes backend tools deterministically with the mock analyst.
    """
    api_key = settings.GROQ_API_KEY.strip()
    if not api_key:
        last_message = messages[-1]["content"] if messages else ""
        return generate_mock_analysis(last_message, symbol)

    try:
        client = Groq(api_key=api_key)
        groq_messages = [{"role": "system", "content": SYSTEM_PROMPT}] + messages

        # First LLM call: LLM decides whether to call tools
        response = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=groq_messages,
            tools=TOOLS,
            tool_choice="auto",
            temperature=0.2,
            max_tokens=1500,
        )

        response_message = response.choices[0].message
        tool_calls = response_message.tool_calls
        tools_executed = []

        # If the model requested tool calls, execute them
        if tool_calls:
            # Append model's tool call intention to history
            groq_messages.append(response_message)

            for tool_call in tool_calls:
                function_name = tool_call.function.name
                try:
                    function_args = json.loads(tool_call.function.arguments)
                except Exception:
                    function_args = {}

                tool_output = execute_tool(function_name, function_args)
                tools_executed.append({
                    "tool": function_name,
                    "arguments": function_args,
                    "output": tool_output,
                })

                # Append tool result to conversation
                groq_messages.append({
                    "tool_call_id": tool_call.id,
                    "role": "tool",
                    "name": function_name,
                    "content": json.dumps(tool_output),
                })

            # Second call: LLM synthesizes final reasoned response using tool data
            final_response = client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=groq_messages,
                temperature=0.3,
                max_tokens=1500,
            )

            final_content = final_response.choices[0].message.content
            return {
                "content": final_content,
                "tools_used": tools_executed,
                "groq_active": True,
            }

        else:
            # Direct response without tools
            return {
                "content": response_message.content,
                "tools_used": [],
                "groq_active": True,
            }

    except Exception as e:
        logger.error(f"Groq API call failed: {e}. Falling back to deterministic quant engine.")
        last_message = messages[-1]["content"] if messages else ""
        fallback = generate_mock_analysis(last_message, symbol)
        fallback["content"] = f"> [!WARNING]\n> Groq API connection error: {str(e)}. Operating in local fallback quant mode.\n\n" + fallback["content"]
        return fallback

