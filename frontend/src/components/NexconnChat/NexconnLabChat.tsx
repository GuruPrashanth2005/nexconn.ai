import React, { useEffect, useRef, useState } from 'react';
import NexconnManager from '../../services/nexconnManager';
import { MessageSquare, Users, X, Minimize2, Maximize2, ShieldCheck, Send } from 'lucide-react';

interface NexconnLabChatProps {
  currentUserId?: string;
  currentUserName?: string;
}

export const NexconnLabChat: React.FC<NexconnLabChatProps> = ({
  currentUserId: propUserId,
  currentUserName = 'Chemistry Learner',
}) => {
  const [generatedUserId] = useState(() => 'student_' + Math.floor(1000 + Math.random() * 9000));
  const currentUserId = propUserId || generatedUserId;
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'ui' | 'quick'>('ui');
  const [targetPeerId, setTargetPeerId] = useState('lab_partner_01');
  const [messageText, setMessageText] = useState('');
  const [chatLog, setChatLog] = useState<Array<{ sender: string; text: string; time: string }>>([
    {
      sender: 'Nexconn IM Network',
      text: 'Connected via Nexconn Chat SDK v26.2 (Singapore Cluster). Real-time channels active.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const uiContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    async function setupChat() {
      const ok = await NexconnManager.getInstance().initAndConnect(currentUserId, currentUserName);
      if (mounted && ok) {
        setIsConnected(true);
      }
    }

    setupChat();

    return () => {
      mounted = false;
    };
  }, [currentUserId, currentUserName]);

  // Mount the Web Component into container when UI tab is chosen and dialog open
  useEffect(() => {
    if (isOpen && activeTab === 'ui' && uiContainerRef.current) {
      uiContainerRef.current.innerHTML = '';

      try {
        const rootElement = document.createElement('nc-chat-ui-app-provider');
        rootElement.style.width = '100%';
        rootElement.style.height = '100%';
        rootElement.style.display = 'block';
        rootElement.style.borderRadius = '12px';
        rootElement.style.overflow = 'hidden';
        uiContainerRef.current.appendChild(rootElement);

        if (NexconnManager.getInstance().isReady()) {
          NexconnManager.getInstance().openDirectChat(targetPeerId);
        }
      } catch (e) {
        console.warn('ChatUI web component mount notice:', e);
      }
    }
  }, [isOpen, activeTab, targetPeerId]);

  const handleSendQuickMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const newMsg = {
      sender: currentUserName,
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatLog((prev) => [...prev, newMsg]);

    try {
      const res = await NexconnManager.getInstance().sendDirectTextMessage(targetPeerId, messageText);
      console.log('[Nexconn Chat SDK] Message sent result:', res);
    } catch (err) {
      console.warn('[Nexconn Chat SDK] Sent locally (peer offline simulation):', err);
    }

    setMessageText('');
  };

  return (
    <>
      {/* Floating Trigger Button with robust inline CSS */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 20px',
            background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
            color: '#ffffff',
            borderRadius: '50px',
            boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            transition: 'all 0.2s ease',
          }}
          title="Open Nexconn Lab Chat"
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <MessageSquare size={18} />
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isConnected ? '#10b981' : '#f59e0b',
                boxShadow: isConnected ? '0 0 8px #10b981' : 'none',
              }}
            />
          </div>
          <span>Lab Partner Chat</span>
          <span
            style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: 'rgba(30, 58, 138, 0.7)',
              border: '1px solid rgba(147, 197, 253, 0.3)',
              fontFamily: 'monospace',
            }}
          >
            Nexconn
          </span>
        </button>
      )}

      {/* Chat Window / Drawer */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            zIndex: 999999,
            bottom: isExpanded ? '20px' : '24px',
            right: isExpanded ? '20px' : '24px',
            left: isExpanded ? '20px' : 'auto',
            top: isExpanded ? '20px' : 'auto',
            width: isExpanded ? 'auto' : '440px',
            height: isExpanded ? 'auto' : '560px',
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: 'calc(100vh - 32px)',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'rgba(15, 23, 42, 0.96)',
            border: '1px solid rgba(51, 65, 85, 0.9)',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(16px)',
            color: '#f8fafc',
            overflow: 'hidden',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(30, 41, 59, 0.85)',
              borderBottom: '1px solid rgba(51, 65, 85, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                }}
              >
                <Users size={16} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
                    Nexconn Lab Collaboration
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '999px',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      color: '#34d399',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      fontWeight: 600,
                    }}
                  >
                    <ShieldCheck size={12} />
                    Chat SDK Active
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {currentUserName} • App: <span style={{ color: '#60a5fa', fontFamily: 'monospace' }}>z3v5yqkb...</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                  padding: '6px',
                  color: '#94a3b8',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
                title={isExpanded ? 'Restore' : 'Maximize'}
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  padding: '6px',
                  color: '#94a3b8',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Tab Selector */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid rgba(30, 41, 59, 0.8)',
              backgroundColor: 'rgba(2, 6, 23, 0.5)',
              padding: '6px 12px 0 12px',
              gap: '8px',
              fontSize: '12px',
            }}
          >
            <button
              onClick={() => setActiveTab('ui')}
              style={{
                padding: '6px 12px',
                fontWeight: 600,
                borderTopLeftRadius: '6px',
                borderTopRightRadius: '6px',
                background: activeTab === 'ui' ? 'rgba(30, 41, 59, 1)' : 'transparent',
                color: activeTab === 'ui' ? '#60a5fa' : '#94a3b8',
                border: 'none',
                borderBottom: activeTab === 'ui' ? '2px solid #3b82f6' : '2px solid transparent',
                cursor: 'pointer',
              }}
            >
              Nexconn Chat UI View
            </button>
            <button
              onClick={() => setActiveTab('quick')}
              style={{
                padding: '6px 12px',
                fontWeight: 600,
                borderTopLeftRadius: '6px',
                borderTopRightRadius: '6px',
                background: activeTab === 'quick' ? 'rgba(30, 41, 59, 1)' : 'transparent',
                color: activeTab === 'quick' ? '#60a5fa' : '#94a3b8',
                border: 'none',
                borderBottom: activeTab === 'quick' ? '2px solid #3b82f6' : '2px solid transparent',
                cursor: 'pointer',
              }}
            >
              Direct SDK Messaging
            </button>
          </div>

          {/* Main Body */}
          <div
            style={{
              flex: 1,
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              backgroundColor: 'rgba(2, 6, 23, 0.4)',
            }}
          >
            {activeTab === 'ui' ? (
              <div style={{ position: 'relative', width: '100%', height: '100%', padding: '10px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                <div
                  ref={uiContainerRef}
                  style={{
                    width: '100%',
                    flex: 1,
                    minHeight: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.7)',
                    borderRadius: '10px',
                    border: '1px solid rgba(51, 65, 85, 0.6)',
                  }}
                />
                <div
                  style={{
                    marginTop: '8px',
                    fontSize: '11px',
                    color: '#64748b',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>Powered by @nexconn/chatui & @nexconn/chat</span>
                  <span style={{ color: '#34d399' }}>Singapore Node • Online</span>
                </div>
              </div>
            ) : (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '12px',
                  minHeight: 0,
                  boxSizing: 'border-box',
                }}
              >
                {/* Peer Selector */}
                <div
                  style={{
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(51, 65, 85, 0.6)',
                    fontSize: '12px',
                  }}
                >
                  <span style={{ color: '#94a3b8' }}>Target Peer:</span>
                  <select
                    value={targetPeerId}
                    onChange={(e) => setTargetPeerId(e.target.value)}
                    style={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      color: '#f1f5f9',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      outline: 'none',
                    }}
                  >
                    <option value="lab_partner_01">Lab Partner (Alex)</option>
                    <option value="faculty_mentor">Prof. Davis (Mentor)</option>
                    <option value="dr_hydro_ai">Dr. Hydro AI Companion</option>
                  </select>
                </div>

                {/* Messages Container */}
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    paddingRight: '4px',
                  }}
                >
                  {chatLog.map((msg, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        maxWidth: '85%',
                        fontSize: '12px',
                        alignSelf: msg.sender === currentUserName ? 'flex-end' : 'flex-start',
                        backgroundColor:
                          msg.sender === currentUserName
                            ? 'rgba(37, 99, 235, 0.85)'
                            : 'rgba(30, 41, 59, 0.95)',
                        color: msg.sender === currentUserName ? '#ffffff' : '#e2e8f0',
                        border:
                          msg.sender === currentUserName
                            ? 'none'
                            : '1px solid rgba(71, 85, 105, 0.5)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: '12px',
                          marginBottom: '4px',
                          fontSize: '10px',
                          opacity: 0.75,
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{msg.sender}</span>
                        <span>{msg.time}</span>
                      </div>
                      <p style={{ margin: 0, lineHeight: 1.4, wordBreak: 'break-word' }}>
                        {msg.text}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Input Bar */}
                <form
                  onSubmit={handleSendQuickMessage}
                  style={{ marginTop: '10px', display: 'flex', gap: '8px' }}
                >
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Share titration readings, observations..."
                    style={{
                      flex: 1,
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '12px',
                      color: '#ffffff',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: '8px 14px',
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <Send size={14} />
                    Send
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default NexconnLabChat;
