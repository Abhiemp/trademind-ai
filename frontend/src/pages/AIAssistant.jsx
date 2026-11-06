import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  User,
  Send,
  Loader2,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Wrench,
  TrendingUp,
  Cpu,
  Copy,
  Check,
} from 'lucide-react';
import { sendChatMessage, getPromptSuggestions } from '../services/api';

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: `Hello, I am TradeMind AI, your financial market analyst for the Indian stock market.

I help you understand market trends, analyse stocks and make sense of important financial indicators using market data and AI.

You can ask me to analyse stock performance, examine RSI and MACD indicators, compare companies, evaluate market trends or assess potential trading opportunities.

I aim to provide clear insights backed by data so you can make more informed decisions.

Ask me about any NSE or BSE listed stock to get started.`,
  tools_used: [],
};

export default function AIAssistant() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [selectedStockContext, setSelectedStockContext] = useState('');
  const [prompts, setPrompts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedTools, setExpandedTools] = useState({});
  const [copiedIndex, setCopiedIndex] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    const loadPrompts = async () => {
      const { data } = await getPromptSuggestions();
      if (data && data.length > 0) {
        setPrompts(data);
      }
    };
    loadPrompts();
  }, []);

  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isLoading) return;

    const userMsg = { role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputPrompt('');
    setIsLoading(true);

    // Prepare message history for backend
    const apiMessages = updatedMessages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.content }));

    const { data, error } = await sendChatMessage(apiMessages, selectedStockContext || null);

    if (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ **Analysis Error**: ${error}. Please check if the backend is running and the stock ticker is valid.`,
          tools_used: [],
        },
      ]);
    } else if (data) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.content,
          tools_used: data.tools_used || [],
          groq_active: data.groq_active,
        },
      ]);
    }

    setIsLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleToolView = (msgIdx) => {
    setExpandedTools((prev) => ({
      ...prev,
      [msgIdx]: !prev[msgIdx],
    }));
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleReset = () => {
    setMessages([INITIAL_MESSAGE]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] max-h-[880px] bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Top Header */}
      <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-400 flex items-center justify-center shadow-md shadow-indigo-600/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                TradeMind AI Market Analyst
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center gap-1">
                <Cpu className="w-3 h-3 text-indigo-400" />
                Quant Tool Calling
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live Indian stock data verification with zero numeric hallucination.
            </p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-colors"
          title="Reset conversation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Suggested Prompts Banner */}
      {prompts.length > 0 && messages.length <= 2 && (
        <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs shrink-0">
          <span className="text-slate-400 flex items-center gap-1 shrink-0 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Ideas:
          </span>
          {prompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p.prompt)}
              className="px-3 py-1 rounded-lg bg-slate-800/60 hover:bg-indigo-950 hover:border-indigo-700 hover:text-indigo-200 text-slate-300 border border-slate-700/60 transition-all shrink-0 font-medium"
            >
              {p.title}
            </button>
          ))}
        </div>
      )}

      {/* Messages Stream */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          const hasTools = msg.tools_used && msg.tools_used.length > 0;
          const isToolsExpanded = !!expandedTools[idx];

          return (
            <div
              key={idx}
              className={`flex gap-3.5 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white shadow-xs ${
                  isUser
                    ? 'bg-gradient-to-tr from-indigo-500 to-indigo-600'
                    : 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Content Container */}
              <div className="flex-1 space-y-2">
                {/* Tool Executions Badge */}
                {hasTools && (
                  <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-2.5 text-xs">
                    <button
                      onClick={() => toggleToolView(idx)}
                      className="flex items-center justify-between w-full text-indigo-300 font-semibold hover:text-indigo-200"
                    >
                      <span className="flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-indigo-400" />
                        Executed {msg.tools_used.length} Backend Financial Tools (Deterministic Data)
                      </span>
                      {isToolsExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {isToolsExpanded && (
                      <div className="mt-2.5 pt-2.5 border-t border-slate-800 space-y-2">
                        {msg.tools_used.map((t, tIdx) => (
                          <div key={tIdx} className="bg-slate-900 p-2 rounded border border-slate-800/80">
                            <div className="flex justify-between items-center text-slate-300 font-mono text-[11px]">
                              <span className="text-indigo-400 font-bold">{t.tool}()</span>
                              <span className="text-emerald-400 text-[10px]">Verified NSE</span>
                            </div>
                            {t.arguments && (
                              <p className="text-[10px] text-slate-400 mt-1 font-mono">
                                Args: {JSON.stringify(t.arguments)}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-xs'
                      : 'bg-slate-950/90 border border-slate-800 text-slate-200 rounded-tl-xs whitespace-pre-line'
                  }`}
                >
                  {msg.content}
                </div>

                {/* Copy button */}
                {!isUser && (
                  <div className="flex items-center gap-2 pl-1">
                    <button
                      onClick={() => copyToClipboard(msg.content, idx)}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3.5 max-w-xl mr-auto">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shrink-0 text-white">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl rounded-tl-xs p-4 flex items-center gap-3 text-slate-400 text-xs shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Querying Indian market data and computing RSI/MACD indicators...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-2 shrink-0">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Target Context:</span>
          {['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'TATAMOTORS.NS'].map((sym) => (
            <button
              key={sym}
              onClick={() => setSelectedStockContext(selectedStockContext === sym ? '' : sym)}
              className={`px-2 py-0.5 rounded border font-mono transition-colors ${
                selectedStockContext === sym
                  ? 'bg-indigo-600 text-white border-indigo-500 font-semibold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {sym.replace('.NS', '')}
            </button>
          ))}
          {selectedStockContext && (
            <button
              onClick={() => setSelectedStockContext('')}
              className="text-slate-400 hover:text-white underline text-[11px]"
            >
              Clear
            </button>
          )}
        </div>

        <div className="relative flex items-center">
          <textarea
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask TradeMind AI about Indian stocks, indicators, or ratings (e.g., 'What is TCS RSI and MACD?')..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-12 py-3 text-sm text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none shadow-inner"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputPrompt.trim() || isLoading}
            className="absolute right-2.5 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
