# TradeMind AI — Indian Stock Market Analysis & Paper-Trading

An AI-powered Indian stock market analysis and paper-trading platform engineered for the **AI for Finance (CIA-2)** assignment.

---

## 🏛️ Architecture Overview

```text
trademind/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/
│   │   │   ├── health.py          # Backend diagnostic & health-check
│   │   │   ├── stocks.py          # Indian equities quotes, search & indicators
│   │   │   ├── agent.py           # Conversational AI Analyst with tool calling
│   │   │   ├── portfolio.py       # Paper trading orders & portfolio management
│   │   │   └── backtest.py        # Algorithmic strategy backtesting
│   │   ├── core/
│   │   │   ├── config.py          # Pydantic Settings & environment variables
│   │   │   └── database.py        # SQLAlchemy SQLite engine & session management
│   │   ├── models/                # SQLAlchemy ORM models (Portfolios, Holdings, Trades)
│   │   ├── schemas/               # Pydantic request/response validation schemas
│   │   ├── services/
│   │   │   ├── indicators.py      # RSI, MACD, SMA 20/50/200, EMA 9/21 engine
│   │   │   ├── market_data.py     # Live NSE/BSE quotes & robust historical candles
│   │   │   ├── ai_agent.py        # Groq tool calling & deterministic quant bridge
│   │   │   ├── portfolio_service.py # Paper trading execution & mark-to-market
│   │   │   └── backtest_service.py  # Quantitative strategy simulation engine
│   │   └── main.py                # FastAPI entry point & CORS configuration
│   ├── .env                       # Environment credentials (GROQ_API_KEY)
│   ├── requirements.txt           # Python dependencies
│   ├── tests/                     # Automated integration test suite
│   └── run.py                     # Uvicorn development launcher
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── MetricCard.jsx # Reusable financial KPI card
│   │   │   │   └── StatusBadge.jsx# Live backend connection indicator
│   │   │   ├── layout/
│   │   │   │   ├── DashboardLayout.jsx
│   │   │   │   ├── Header.jsx     # Benchmark tickers & status ribbon
│   │   │   │   └── Sidebar.jsx    # Responsive collapsible sidebar navigation
│   │   │   ├── stocks/
│   │   │   │   ├── StockSearchBar.jsx
│   │   │   │   ├── StockChart.jsx # Recharts Price, Volume, RSI & MACD panels
│   │   │   │   └── TechnicalSignalsCard.jsx # Algorithmic BUY/SELL/HOLD
│   │   │   └── portfolio/
│   │   │       └── OrderModal.jsx # Buy/Sell order execution ticket
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx      # Overview KPIs, live bridge status, benchmarks
│   │   │   ├── MarketOverview.jsx # NSE/BSE securities & technical indicators
│   │   │   ├── Portfolio.jsx      # Paper-trading simulated holdings & PnL
│   │   │   ├── AIAssistant.jsx    # Conversational Groq analyst interface
│   │   │   └── Backtest.jsx       # Strategy backtesting engine
│   │   ├── services/
│   │   │   └── api.js             # Axios client with baseURL & health check
│   │   ├── App.jsx                # Client-side routing
│   │   ├── main.jsx               # React entry point
│   │   └── index.css              # Tailwind CSS directives & dark palette
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
└── README.md
```

---

## 📈 Quantitative Features

### 1. Indian Equity Data & Indicator Engine
- Authentic daily candlestick feeds for National Stock Exchange of India (NSE) & Bombay Stock Exchange (BSE).
- Technical indicators: **RSI (14)**, **MACD (12, 26, 9)**, **SMA (20, 50, 200)**, **EMA (9, 21)**.
- Deterministic, rule-based algorithmic scoring with explicit BUY, SELL, or HOLD signals.

### 2. Conversational AI Financial Analyst (Groq API)
- Powered by **Llama 3.3 70B** via Groq with OpenAI-compatible tool calling.
- Strictly forbidden from hallucinating numeric figures — retrieves live quotes and computes indicators through backend tools.
- Auto-fallback mode: if no `GROQ_API_KEY` is provided, automatically uses the local quant engine.

### 3. Paper Trading & Virtual Portfolio
- Initial capital: **₹10,00,000.00 virtual INR**.
- Instant simulated market orders (BUY and SELL).
- Automatic mark-to-market unrealized P&L, realized P&L, weighted average buy price, and complete transaction audit logs.

### 4. Historical Strategy Backtesting
- Quantitative simulation of algorithmic strategies against historical Indian candles:
  - **SMA Crossover** (e.g. 20/50 day)
  - **EMA Crossover** (e.g. 9/21 day)
  - **RSI Mean-Reversion** (Oversold bounce / Overbought exit)
  - **MACD Signal Line Crossover**
- Comprehensive analytics: Total Return %, Benchmark Buy & Hold Return %, Outperformance, Win Rate %, Profit Factor, Max Drawdown %, and interactive Equity Curve chart.

---

## 🚀 Running the Project

### 1. Backend (FastAPI)

```bash
cd backend
.\.venv\Scripts\activate
python run.py
```
- API Base URL: `http://localhost:8000`
- Interactive Swagger Documentation: `http://localhost:8000/api/v1/docs`

### 2. Frontend (React + Vite)

```bash
cd frontend
npm run dev
```
- Dashboard URL: `http://localhost:5173`

---

## 🧪 Automated Testing

Run the full end-to-end integration test suite:

```bash
backend\.venv\Scripts\python.exe -c "import sys, os; sys.path.insert(0, os.path.abspath('backend')); from tests.test_api import *; test_health(); test_stock_search(); test_agent_prompts(); test_portfolio_lifecycle(); test_strategy_backtest(); print('ALL TESTS PASSED')"
```
