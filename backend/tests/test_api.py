import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.core.database import Base, engine

Base.metadata.create_all(bind=engine)
client = TestClient(app)

def test_health():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "NSE / BSE" in data["target_market"]

def test_stock_search():
    res = client.get("/api/v1/stocks/search?q=Reliance")
    assert res.status_code == 200
    results = res.json()
    assert len(results) > 0
    assert any("RELIANCE" in r["symbol"] for r in results)

def test_agent_prompts():
    res = client.get("/api/v1/agent/prompts")
    assert res.status_code == 200
    prompts = res.json()
    assert len(prompts) >= 4

def test_portfolio_lifecycle():
    r_reset = client.post("/api/v1/portfolio/reset")
    assert r_reset.status_code == 200
    assert r_reset.json()["cash_balance"] == 1000000.0

    r_buy = client.post("/api/v1/portfolio/order", json={
        "symbol": "INFY.NS",
        "transaction_type": "BUY",
        "quantity": 5,
        "notes": "CIA-2 Test Buy"
    })
    assert r_buy.status_code == 200

    r_summary = client.get("/api/v1/portfolio")
    assert len(r_summary.json()["holdings"]) == 1

def test_strategy_backtest():
    res = client.post("/api/v1/backtest/run", json={
        "symbol": "TCS.NS",
        "strategy_type": "SMA_CROSSOVER",
        "period": "6mo",
        "initial_capital": 100000.0,
        "fast_period": 10,
        "slow_period": 30
    })
    assert res.status_code == 200
    data = res.json()
    assert "strategy_return_pct" in data
    assert "equity_curve" in data
    assert len(data["equity_curve"]) > 10
