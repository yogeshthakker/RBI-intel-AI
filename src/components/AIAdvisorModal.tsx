import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  User,
  ShieldAlert,
  HelpCircle,
  Copy,
  Check,
  Building2,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { api } from '../services/api';

interface AIAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  institution: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const AIAdvisorModal: React.FC<AIAdvisorModalProps> = ({
  isOpen,
  onClose,
  institution
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello! I am your **SAMA Rulebook Regulatory Intelligence Advisor**, grounded in the official Saudi Central Bank (SAMA) Rulebook (https://rulebook.sama.gov.sa/en), SAMA Cyber Security Framework (CSF v3.0), AML/CFT Rules, Consumer Protection Principles, and Banking Control Law for **${institution}**.

How can I assist your compliance, risk management, or internal audit teams today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const samplePrompts = [
    'What are the mandatory KYC Ultimate Beneficial Ownership (UBO 5%) threshold rules under SAMA AML Rules 2026?',
    'What is the statutory incident notification timeline for critical cyber breaches under SAMA CSF v3.0?',
    'What are the 3 Lines of Defense accountability boundaries for Open Banking payment initiation APIs?',
    'Draft an operational remediation checklist for retail Debt Burden Ratio (DBR 33.33%) compliance.'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isLoading) return;

    const userMsg: Message = {
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        content: m.content
      }));

      const res = await api.askAIAdvisor({
        query,
        history,
        institution
      });

      const assistantMsg: Message = {
        role: 'assistant',
        content: res.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Error processing compliance advisory query: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-3xl w-full h-[85vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <Bot className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm text-white">SAMA Rulebook Regulatory Intelligence AI Advisor</h3>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                  SAMA Rulebook Grounded
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Advising for: <strong className="text-slate-200">{institution}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg text-lg font-bold transition"
          >
            ✕
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50 text-xs">
          {messages.map((msg, idx) => {
            const isAI = msg.role === 'assistant';
            return (
              <div
                key={idx}
                className={`flex items-start space-x-3 ${isAI ? '' : 'flex-row-reverse space-x-reverse'}`}
              >
                <div
                  className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isAI ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-white'
                  }`}
                >
                  {isAI ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl p-4 space-y-2 shadow-xs ${
                    isAI
                      ? 'bg-white border border-slate-200 text-slate-800'
                      : 'bg-slate-900 text-white'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="font-semibold">{isAI ? 'SAMA Compliance Intelligence' : 'You (Compliance Officer)'}</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div className="leading-relaxed whitespace-pre-wrap font-sans">
                    {msg.content}
                  </div>

                  {isAI && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                        <BookOpen className="h-3 w-3 text-emerald-600" />
                        <span>Referenced to SAMA Rulebook & Saudi Central Bank Circulars</span>
                      </span>
                      <button
                        onClick={() => copyToClipboard(msg.content, idx)}
                        className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center space-x-1 font-medium transition"
                      >
                        {copiedIdx === idx ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
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

          {isLoading && (
            <div className="flex items-start space-x-3">
              <div className="h-7 w-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 animate-spin" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 text-slate-500 flex items-center space-x-2 text-xs">
                <div className="h-2 w-2 bg-emerald-600 rounded-full animate-ping" />
                <span>Consulting SAMA Rulebook knowledge base & supervisory guidelines...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Questions */}
        <div className="p-3 bg-white border-t border-slate-200">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center space-x-1">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span>Suggested Inquiries:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {samplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              placeholder="Ask any question about SAMA Rulebook, CSF, AML rules, Consumer Protection, Nafath..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1 text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-xl transition disabled:opacity-50 shadow-sm"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
