import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { type Manual } from '../../data/manuals';
import { Send, Bot, User, Sparkles, Maximize2, Minimize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface ManualReaderProps {
  manual: Manual;
  onBack: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const ManualReader: React.FC<ManualReaderProps> = ({ manual, onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hello! I am Dr. HydroAI. I see you are reading about **${manual.title}**. Ask me any questions, or click one of the quick prompts below!`
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isChatMaximized, setIsChatMaximized] = useState(false);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const typingIndicatorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAiLoading) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isAiLoading]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (isAiLoading && typingIndicatorRef.current) {
        typingIndicatorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (lastMessageRef.current) {
        lastMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  useEffect(() => {
    scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isAiLoading) return;
    
    const userMsg: ChatMessage = { role: 'user', content: text };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputMessage('');
    setIsAiLoading(true);

    try {
      const res = await axios.post('/api/v1/ai/chat', {
        history: newHistory,
        context: {
          topic: manual.title,
          aim: manual.content.aim,
          principle: manual.content.principle
        }
      });
      
      setMessages([...newHistory, { role: 'assistant', content: res.data.data.reply }]);
    } catch (error) {
      console.error(error);
      setMessages([...newHistory, { role: 'assistant', content: 'Sorry, my systems are currently analyzing other samples. Please try again later.' }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const quickPrompts = [
    `Summarize the principle of ${manual.title}`,
    `What are the safety precautions?`,
    `Explain the calculations simply`
  ];

  const renderChatUI = (isMaximized: boolean) => (
    <>
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(139, 92, 246, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>Dr. HydroAI</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-purple)' }}>Context-Aware Lab Assistant</span>
            </div>
          </div>
          
          <button 
            onClick={() => setIsChatMaximized(!isChatMaximized)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              width: '36px', height: '36px',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            {isChatMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map((msg, idx) => (
            <div key={idx} ref={isMaximized ? (idx === messages.length - 1 ? lastMessageRef : null) : null} style={{ display: 'flex', gap: '12px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
              <div style={{ 
                width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                background: msg.role === 'user' ? 'rgba(14, 165, 233, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: msg.role === 'user' ? 'var(--accent-cyan)' : 'var(--accent-purple)'
              }}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div style={{
                background: msg.role === 'user' ? 'rgba(14, 165, 233, 0.1)' : 'rgba(255,255,255,0.03)',
                padding: '12px 16px',
                borderRadius: '12px',
                borderTopRightRadius: msg.role === 'user' ? '2px' : '12px',
                borderTopLeftRadius: msg.role === 'assistant' ? '2px' : '12px',
                color: '#e2e8f0',
                fontSize: '0.95rem',
                lineHeight: 1.5,
                maxWidth: '85%'
              }}>
                <div className="markdown-chat">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm, remarkMath]} 
                    rehypePlugins={[rehypeKatex]}
                  >
                    {msg.content.replace(/\\\[/g, '$$$$').replace(/\\\]/g, '$$$$').replace(/\\\(/g, '$').replace(/\\\)/g, '$')}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          
          {isAiLoading && (
            <div ref={isMaximized ? typingIndicatorRef : null} style={{ display: 'flex', gap: '12px' }}>
               <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-purple)' }}>
                <Bot size={16} />
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 20px', borderRadius: '12px', borderTopLeftRadius: '2px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span className="dot-anim" style={{ animationDelay: '0s' }}></span>
                <span className="dot-anim" style={{ animationDelay: '0.2s' }}></span>
                <span className="dot-anim" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {messages.length === 1 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {quickPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(prompt)}
                  style={{
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '20px',
                    padding: '6px 12px',
                    color: '#c4b5fd',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            background: 'rgba(255, 255, 255, 0.05)', 
            backdropFilter: 'blur(8px)',
            padding: '6px', 
            borderRadius: '16px', 
            border: '1px solid rgba(139, 92, 246, 0.2)' 
          }}>
            <input
              ref={isMaximized ? inputRef : null}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputMessage)}
              placeholder="Ask Dr. HydroAI about this experiment..."
              disabled={isAiLoading}
              autoFocus={isMaximized}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: '#fff',
                padding: '0 16px',
                height: '44px',
                outline: 'none',
                fontSize: '0.95rem',
                fontFamily: 'inherit',
                lineHeight: 'normal'
              }}
            />
            <button
              onClick={() => handleSendMessage(inputMessage)}
              disabled={isAiLoading || !inputMessage.trim()}
              style={{
                background: 'var(--accent-purple)',
                border: 'none',
                borderRadius: '12px',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: (isAiLoading || !inputMessage.trim()) ? 'not-allowed' : 'pointer',
                opacity: (isAiLoading || !inputMessage.trim()) ? 0.5 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
    </>
  );

  return (
    <div style={{ display: 'flex', width: '100%', height: 'calc(100vh - 120px)', gap: '24px' }}>
      
      {/* Left Pane - Manual Content */}
      <div style={{ 
        flex: '1.5',
        overflowY: 'auto',
        background: 'rgba(15, 23, 42, 0.4)',
        border: '1px solid rgba(14, 165, 233, 0.15)',
        borderRadius: '24px',
        padding: '40px',
        animation: 'fadeIn 0.5s ease-out',
        position: 'relative'
      }}>
        <button 
          onClick={onBack}
          style={{ 
            marginBottom: '30px', 
            padding: '8px 16px', 
            background: 'rgba(255,255,255,0.05)', 
            border: '1px solid rgba(255,255,255,0.1)', 
            borderRadius: '8px',
            color: '#fff', 
            cursor: 'pointer', 
            fontSize: '0.9rem',
            fontWeight: 500,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        >
          &larr; Return to Library
        </button>
        
        <h1 style={{ fontSize: '2.8rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.5px', marginBottom: '16px', lineHeight: 1.2 }}>
          {manual.title}
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--accent-cyan)', marginBottom: '40px', lineHeight: 1.6, fontWeight: 500 }}>
          {manual.description}
        </p>
        
        <div className="manual-content" style={{ lineHeight: '1.8', fontSize: '1.05rem', color: '#cbd5e1' }}>
          
          <SectionTitle>Aim</SectionTitle>
          <p style={{ marginBottom: '32px' }}>{manual.content.aim}</p>
          
          <SectionTitle>Apparatus & Reagents</SectionTitle>
          <ul style={{ paddingLeft: '24px', marginBottom: '32px' }}>
            {manual.content.apparatusAndReagents.map((item, idx) => (
              <li key={idx} style={{ marginBottom: '8px' }}>{item}</li>
            ))}
          </ul>

          <SectionTitle>Principle</SectionTitle>
          <p style={{ marginBottom: '32px', textAlign: 'justify' }}>{manual.content.principle}</p>
          
          <SectionTitle>Procedure</SectionTitle>
          <ol style={{ paddingLeft: '24px', marginBottom: '32px' }}>
            {manual.content.procedure.map((step, idx) => (
              <li key={idx} style={{ marginBottom: '12px', paddingLeft: '8px' }}>{step}</li>
            ))}
          </ol>
          
          <SectionTitle>Observations</SectionTitle>
          <p style={{ marginBottom: '32px', padding: '16px', background: 'rgba(14, 165, 233, 0.05)', borderRadius: '8px', borderLeft: '4px solid var(--accent-cyan)' }}>
            {manual.content.observations}
          </p>

          <SectionTitle>Calculations</SectionTitle>
          <div style={{ marginBottom: '32px', padding: '20px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', fontFamily: 'monospace', fontSize: '1rem', whiteSpace: 'pre-wrap' }}>
            {manual.content.calculations}
          </div>

          <SectionTitle>Safety Precautions</SectionTitle>
          <ul style={{ paddingLeft: '24px', marginBottom: '32px', color: '#ef4444' }}>
            {manual.content.safetyPrecautions.map((item, idx) => (
              <li key={idx} style={{ marginBottom: '8px' }}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Backdrop for Maximized Chat */}
      <div 
        onClick={() => setIsChatMaximized(false)}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 90,
          opacity: isChatMaximized ? 1 : 0,
          pointerEvents: isChatMaximized ? 'auto' : 'none',
          transition: 'all 0.3s ease'
        }}
      />

      {/* Right Pane - AI Assistant Container */}
      <div style={{ flex: '1', position: 'relative' }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', flexDirection: 'column',
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '24px',
          overflow: 'hidden',
          backdropFilter: 'blur(10px)',
          opacity: isChatMaximized ? 0 : 1,
          pointerEvents: isChatMaximized ? 'none' : 'auto',
          transform: isChatMaximized ? 'scale(0.95)' : 'scale(1)',
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {renderChatUI(false)}
        </div>
      </div>

      {/* Maximized AI Assistant */}
      <div style={{
        position: 'fixed',
        top: '5vh', bottom: '5vh', left: '10vw', right: '10vw', zIndex: 100,
        display: 'flex', flexDirection: 'column',
        background: 'rgba(15, 23, 42, 0.45)',
        border: '1px solid rgba(139, 92, 246, 0.5)',
        borderRadius: '24px',
        overflow: 'hidden',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        opacity: isChatMaximized ? 1 : 0,
        pointerEvents: isChatMaximized ? 'auto' : 'none',
        transform: isChatMaximized ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {renderChatUI(true)}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .manual-content h3 { color: #fff; }
        .dot-anim {
          width: 6px;
          height: 6px;
          background: var(--accent-purple);
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

const SectionTitle: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <h3 style={{ fontSize: '1.4rem', fontWeight: 600, color: '#fff', marginTop: '40px', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
    {children}
  </h3>
);

export default ManualReader;
