from typing import List
from fastapi import APIRouter, HTTPException
from app.schemas.agent import ChatRequest, ChatResponse, PromptSuggestion
from app.services.ai_agent import process_chat_message

router = APIRouter()

PROMPT_SUGGESTIONS: List[PromptSuggestion] = [
    PromptSuggestion(
        title="Analyze RELIANCE Momentum",
        prompt="Analyze RELIANCE.NS. What are its current RSI (14), MACD status, and overall technical signal?",
        category="Technical Momentum",
    ),
    PromptSuggestion(
        title="Compare TCS vs INFY",
        prompt="Compare TCS.NS and INFY.NS on valuation and technical indicators. Which one exhibits stronger momentum?",
        category="Comparative Analysis",
    ),
    PromptSuggestion(
        title="HDFC Bank Oversold Check",
        prompt="Is HDFCBANK.NS currently trading in oversold territory based on its 14-day RSI and moving averages?",
        category="RSI & Reversals",
    ),
    PromptSuggestion(
        title="Tata Motors Breakout Analysis",
        prompt="Provide a BUY, SELL, or HOLD assessment for TATAMOTORS.NS using its 50-day and 200-day moving averages.",
        category="Trend & Moving Averages",
    ),
]


@router.post("/chat", response_model=ChatResponse)
def chat_with_analyst(payload: ChatRequest):
    """
    Conversational financial analyst endpoint.
    Invokes Groq with deterministic backend tool calling, retrieves authentic NSE/BSE
    quotes and indicators, and produces data-backed BUY/SELL/HOLD assessments.
    """
    if not payload.messages:
        raise HTTPException(status_code=400, detail="Messages history cannot be empty.")

    try:
        messages_dicts = [{"role": m.role, "content": m.content} for m in payload.messages]
        result = process_chat_message(messages_dicts, symbol=payload.symbol)
        return ChatResponse(
            role="assistant",
            content=result["content"],
            tools_used=result.get("tools_used", []),
            groq_active=result.get("groq_active", False),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Agent error: {str(e)}")


@router.get("/prompts", response_model=List[PromptSuggestion])
def get_prompt_suggestions():
    """
    Get recommended question templates for Indian stock market analysis.
    """
    return PROMPT_SUGGESTIONS

