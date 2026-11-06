from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str = Field(description="'user' or 'assistant' or 'system'")
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    symbol: Optional[str] = Field(None, description="Optional default stock ticker to analyze")


class ToolCallRecord(BaseModel):
    tool: str
    arguments: Optional[Dict[str, Any]] = None
    output: Optional[Dict[str, Any]] = None


class ChatResponse(BaseModel):
    role: str = "assistant"
    content: str
    tools_used: List[ToolCallRecord] = []
    groq_active: bool = False


class PromptSuggestion(BaseModel):
    title: str
    prompt: str
    category: str

