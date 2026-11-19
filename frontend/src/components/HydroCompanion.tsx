/* eslint-disable */
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimulationStore } from '../state/simulationStore';
import { Canvas } from '@react-three/fiber';
import { ParrotModel } from './ParrotModel';
import { generateCompanionResponse } from '../services/aiService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NexconnManager from '../services/nexconnManager';

export const HydroCompanion: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    chatHistory, 
    isAiTyping, 
    addChatMessage, 
    setAiTyping, 
    activeMode, 
    isCompanionOpen,
    setCompanionOpen,
    companionPosition,
    popupMessage,
    triggerAIIntervention,
    triggerHazard,
    highlightEquipment,
    clearHighlight,
    pipetteDraw,
    pipetteDispense,
    addIndicatorToFlask,
    fillBurette,
    toggleStopcock,
    triggerSwirl,
    setFlowMode,
    switchCODStation,
    addK2Cr2O7,
    addH2SO4,
    startReflux,
    togglePHPower,
    cleanElectrode,
    moveElectrode,
    calibratePHMeter
  } = useSimulationStore();
  
  const [inputText, setInputText] = useState('');
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const typingIndicatorRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [nexconnConnected, setNexconnConnected] = useState(false);

  useEffect(() => {
    // Listen for custom dispatch events when user clicks "Share Reading to Nexconn Chat"
    const handleSharedReading = (e: any) => {
      if (e.detail?.text) {
        addChatMessage('user', e.detail.text);
        setCompanionOpen(true);
        setTimeout(() => {
          addChatMessage('assistant', `🔬 **Dr. Hydro AI:** Reading received via Nexconn Chat Engine! Dispensed volume is **${e.detail.volume} mL**. Looking good—continue with careful drops near the color endpoint!`);
        }, 600);
      }
    };

    window.addEventListener('nexconn:shared-reading', handleSharedReading);
    return () => window.removeEventListener('nexconn:shared-reading', handleSharedReading);
  }, []);

  useEffect(() => {
    const studentId = 'student_guru_2026';
    const studentName = 'Guru Prashanth';
    NexconnManager.getInstance().initAndConnect(studentId, studentName).then((ok) => {
      if (ok) setNexconnConnected(true);
    });
  }, [user]);

  useEffect(() => {
    if (isCompanionOpen && !isAiTyping) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isCompanionOpen, isAiTyping]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    setTimeout(() => {
      if (isAiTyping && typingIndicatorRef.current) {
        typingIndicatorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (lastMessageRef.current) {
        lastMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  }, [chatHistory, isAiTyping, isCompanionOpen]);

  // Idle Timer Logic
  const resetIdleTimer = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    
    // Only set idle timer if in practice mode
    if (activeMode === 'PRACTICE') {
      idleTimerRef.current = setTimeout(() => {
        triggerAIIntervention("has been completely idle for 45 seconds", "center");
      }, 45000); // 45 seconds
    }
  };

  // Reset timer on any mouse movement or click within the window
  useEffect(() => {
    const handleActivity = () => resetIdleTimer();
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('keydown', handleActivity);

    resetIdleTimer(); // start it initially

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [activeMode]);

  if (activeMode !== 'PRACTICE') return null;

  const handleSend = async () => {
    if (!inputText.trim() || isAiTyping) return;
    
    const userMsg = inputText.trim();
    setInputText('');
    addChatMessage('user', userMsg);
    setAiTyping(true);

    // Real-time dispatch to Dr. Hydro AND broadcast to peer lab partner
    NexconnManager.getInstance().sendDirectTextMessage('dr_hydro_ai', userMsg).catch(() => {});
    NexconnManager.getInstance().broadcastPeerChat({ role: 'user', content: userMsg }).catch(() => {});

    const state = useSimulationStore.getState();
    const stateSummary = `
Active Module: ${state.activeModule}
Mode: ${state.activeMode}
--- Hardness/Alkalinity ---
Burette Filled: ${state.isBuretteFilled}
Flask Has Sample: ${state.flaskHasSample}
Indicators in Flask: EBT=${state.flaskHasIndicator}, Phenolphthalein=${state.flaskHasPhenol}, Methyl Orange=${state.flaskHasMethyl}
Titrant Dropped: ${state.flaskTitrantVolume.toFixed(2)} mL
Stopcock Open: ${state.isStopcockOpen} (Mode: ${state.flowMode})
--- COD Module ---
Active Station: ${state.codActiveStation}
Sample Station: Water=${state.sampleHasWater}, K2Cr2O7=${state.sampleHasK2Cr2O7}, H2SO4=${state.sampleHasH2SO4}, Ferroin=${state.sampleHasFerroin}, Refluxing=${state.sampleIsRefluxing}, RefluxDone=${state.sampleRefluxCompleted}, BuretteFilled=${state.sampleBuretteFilled}, Titrant=${state.sampleTitrantVolume.toFixed(2)}mL
Blank Station: Water=${state.blankHasWater}, K2Cr2O7=${state.blankHasK2Cr2O7}, H2SO4=${state.blankHasH2SO4}, Ferroin=${state.blankHasFerroin}, Refluxing=${state.blankIsRefluxing}, RefluxDone=${state.blankRefluxCompleted}, BuretteFilled=${state.blankBuretteFilled}, Titrant=${state.blankTitrantVolume.toFixed(2)}mL
--- pH Module ---
pH Meter On: ${state.phMeterPowerOn}
pH Meter Calibrated: ${state.phMeterCalibrated}
Electrode Clean: ${state.phElectrodeClean}
Electrode Location: ${state.phElectrodeSubmergedIn}
Current pH Reading: ${state.phMeterCurrentReading}
---
Checklist Steps Completed: ${Object.entries(state.checklist).filter(([_, done]) => done).map(([k]) => k).join(', ')}
`;

    try {
      const response = await generateCompanionResponse(
        [...chatHistory, { role: 'user', content: userMsg }],
        stateSummary
      );
      
      // Handle Agentic Tool Calls!
      let generatedToolText = "";
      if (response.toolCalls && response.toolCalls.length > 0) {
        for (const toolCall of response.toolCalls) {
          const args = JSON.parse(toolCall.function.arguments || '{}');
          if (toolCall.function.name === 'triggerHazard') {
            triggerHazard(args.type);
            generatedToolText = `I have triggered a hazard simulation for a ${args.type}. Please look at your screen!`;
          } else if (toolCall.function.name === 'highlightEquipment') {
            highlightEquipment(args.itemName);
            generatedToolText = `I have highlighted the ${args.itemName} in the lab for you to see.`;
            // Auto clear highlight after 5 seconds
            setTimeout(() => {
              clearHighlight();
            }, 5000);
          } else if (toolCall.function.name === 'removeHighlight') {
            clearHighlight();
            generatedToolText = `I have turned off the highlight in the lab.`;
          } else if (toolCall.function.name === 'pipetteDraw') {
            pipetteDraw();
            generatedToolText = `I have drawn the liquid into the pipette for you.`;
          } else if (toolCall.function.name === 'pipetteDispense') {
            pipetteDispense();
            generatedToolText = `I have dispensed the liquid from the pipette.`;
          } else if (toolCall.function.name === 'addIndicatorToFlask') {
            addIndicatorToFlask(args.type);
            generatedToolText = `I have added the ${args.type} indicator to the flask.`;
          } else if (toolCall.function.name === 'fillBurette') {
            fillBurette();
            generatedToolText = `I have filled the burette to the zero mark for you.`;
          } else if (toolCall.function.name === 'toggleStopcock') {
            toggleStopcock();
            generatedToolText = `I have toggled the burette stopcock.`;
          } else if (toolCall.function.name === 'triggerSwirl') {
            triggerSwirl();
            generatedToolText = `I am swirling the flask for you.`;
          } else if (toolCall.function.name === 'setFlowMode') {
            setFlowMode(args.mode);
            generatedToolText = `I have set the burette flow to ${args.mode} mode.`;
          } else if (toolCall.function.name === 'switchCODStation') {
            switchCODStation(args.station);
            generatedToolText = `I have moved the camera to the ${args.station} station.`;
          } else if (toolCall.function.name === 'addK2Cr2O7') {
            addK2Cr2O7();
            generatedToolText = `I have added the Potassium Dichromate to the mixture.`;
          } else if (toolCall.function.name === 'addH2SO4') {
            addH2SO4();
            generatedToolText = `I have added the Sulfuric Acid. Please be careful, it's highly corrosive!`;
          } else if (toolCall.function.name === 'startReflux') {
            startReflux();
            generatedToolText = `I have started the heating mantle. The reflux process has begun.`;
          } else if (toolCall.function.name === 'togglePHPower') {
            togglePHPower();
            generatedToolText = `I have turned the pH meter power button for you.`;
          } else if (toolCall.function.name === 'cleanElectrode') {
            cleanElectrode();
            generatedToolText = `I have cleaned the pH electrode with distilled water.`;
          } else if (toolCall.function.name === 'moveElectrode') {
            moveElectrode(args.target === 'null' ? null : args.target);
            generatedToolText = `I have moved the pH electrode to the ${args.target || 'stand'}.`;
          } else if (toolCall.function.name === 'calibratePHMeter') {
            calibratePHMeter();
            generatedToolText = `I have pressed the calibrate button on the pH meter.`;
          } else if (toolCall.function.name === 'exitLab') {
            generatedToolText = `Exiting the lab... Returning you to the dashboard!`;
            setTimeout(() => {
              navigate(user?.role === 'FACULTY' ? '/faculty-dashboard/modules' : '/student-dashboard/modules');
            }, 1500);
          }
        }
      }

      // Add the text response
      const assistantReply = response.text || generatedToolText || '';
      if (assistantReply) {
        addChatMessage('assistant', assistantReply);
        // Broadcast Dr. Hydro's AI answer to partner too so both see the exact same AI advice
        NexconnManager.getInstance().broadcastPeerChat({ role: 'assistant', content: assistantReply }).catch(() => {});
      }

    } catch (error) {
      addChatMessage('assistant', "My neural pathways seem to be offline right now. Could you check your internet connection or API keys?");
    } finally {
      setAiTyping(false);
    }
  };

  // Define position variants for Framer Motion for the Flying Avatar
  const avatarVariants = {
    default: { top: '15px', left: '65%', bottom: 'auto', right: 'auto', x: '-50%' }, // Sitting on Navbar
    center: { top: '50%', left: '50%', bottom: 'auto', right: 'auto', x: '-50%', y: '-50%' },
    burette: { top: '30%', right: '25%', bottom: 'auto', left: 'auto' },
    flask: { bottom: '30%', left: '30%', top: 'auto', right: 'auto' },
  };

  return (
    <>
      <style>
        {`
          @keyframes hover {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-5px); }
            100% { transform: translateY(0px); }
          }
        `}
      </style>

      {/* FLYING AVATAR (ALWAYS VISIBLE) & CONDITIONAL POPUP SPEECH BUBBLE */}
      <motion.div
        initial="default"
        animate={companionPosition}
        variants={avatarVariants}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        style={{
          position: 'fixed',
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pointerEvents: 'none'
        }}
      >
        {/* Conditional Speech Bubble */}
        <AnimatePresence>
          {popupMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              transition={{ delay: 0.2 }}
              style={{
                background: 'var(--panel-bg)',
                backdropFilter: 'blur(10px)',
                border: '2px solid var(--accent-cyan)',
                borderRadius: '16px',
                padding: '12px 16px',
                color: 'var(--text-main)',
                maxWidth: '200px',
                textAlign: 'center',
                boxShadow: '0 10px 40px rgba(6, 182, 212, 0.3)',
                marginBottom: '12px',
                pointerEvents: 'auto',
                position: 'relative'
              }}
            >
              {popupMessage}
              <div style={{
                position: 'absolute',
                bottom: '-10px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '10px solid transparent',
                borderRight: '10px solid transparent',
                borderTop: '10px solid var(--accent-cyan)'
              }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3D Animated Parrot (R3F Canvas) */}
        <div style={{
          width: '100px',
          height: '100px',
          animation: 'hover 3s ease-in-out infinite'
        }}>
          <Canvas dpr={[1, 1.5]} performance={{ min: 0.5 }} camera={{ position: [0, 0, 5], fov: 50 }}>
            <ambientLight intensity={1.5} />
            <directionalLight position={[10, 10, 10]} intensity={2} />
            <ParrotModel 
              position={[0, -1, 0]} 
              scale={[0.05, 0.05, 0.05]} // Scale down significantly for the UI
              rotation={[0, -Math.PI / 4, 0]} // Face slightly left towards the user
            />
          </Canvas>
        </div>
      </motion.div>

      {/* DOCKED MAIN CHAT WINDOW */}
      <div style={{
        position: 'fixed',
        zIndex: 1000,
        bottom: '24px',
        right: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
      }}>
        
        <AnimatePresence>
          {isCompanionOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              style={{
                width: '350px',
                height: '450px',
                backgroundColor: 'var(--panel-bg)',
                border: '1px solid var(--panel-border)',
                borderRadius: '16px',
                boxShadow: '0 10px 40px rgba(6, 182, 212, 0.2)',
                marginBottom: '16px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                backdropFilter: 'blur(10px)'
              }}
            >
              {/* Header */}
              <div style={{
                background: 'linear-gradient(90deg, rgba(14,165,233,0.15) 0%, rgba(139,92,246,0.15) 100%)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                color: '#fff',
                padding: '16px',
                fontWeight: 600,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                letterSpacing: '0.5px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: nexconnConnected ? '#10b981' : 'var(--accent-neon)', boxShadow: nexconnConnected ? '0 0 10px #10b981' : '0 0 10px var(--accent-neon)' }} />
                  <span style={{ fontWeight: 700 }}>Dr. Hydro</span>
                  <span style={{ 
                    fontSize: '10px', 
                    padding: '2px 7px', 
                    borderRadius: '999px', 
                    backgroundColor: 'rgba(59, 130, 246, 0.2)', 
                    color: '#60a5fa', 
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    fontWeight: 600,
                    letterSpacing: '0.3px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: nexconnConnected ? '#34d399' : '#f59e0b' }} />
                    Nexconn Chat Engine
                  </span>
                </div>
                <button onClick={() => setCompanionOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}>×</button>
              </div>

              {/* Messages Area */}
              <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(0,0,0,0.2)' }}>
                {chatHistory.map((msg, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, x: msg.role === 'user' ? 10 : -10 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    key={idx} 
                    ref={idx === chatHistory.length - 1 ? lastMessageRef : null}
                    style={{
                      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      background: 'rgba(255,255,255,0.03)',
                      color: '#fff',
                      padding: '12px 16px',
                      borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: 'none',
                      maxWidth: '85%',
                      fontSize: '0.9rem',
                      lineHeight: '1.5'
                    }}
                  >
                    <div className="markdown-chat">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm, remarkMath]} 
                        rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]}
                      >
                        {msg.content.replace(/\\\[/g, '$$$$').replace(/\\\]/g, '$$$$').replace(/\\\(/g, '$').replace(/\\\)/g, '$')}
                      </ReactMarkdown>
                    </div>
                  </motion.div>
                ))}
                {isAiTyping && (
                  <motion.div 
                    ref={typingIndicatorRef}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '8px' }}
                  >
                    Dr. Hydro is analyzing...
                  </motion.div>
                )}
              </div>

              {/* Input Area */}
              {/* Nexconn Real-time sync indicator */}
              <div style={{ padding: '6px 16px', fontSize: '10px', color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.25)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span>Real-Time Chemistry Assistant</span>
                <span style={{ color: nexconnConnected ? '#34d399' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: nexconnConnected ? '#34d399' : '#94a3b8' }}></span>
                  Nexconn SG-Cluster Online
                </span>
              </div>
              <div style={{ borderTop: '1px solid var(--panel-border)', padding: '12px', display: 'flex', background: 'rgba(0,0,0,0.1)' }}>
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.05)', 
                  backdropFilter: 'blur(8px)',
                  padding: '6px', 
                  borderRadius: '16px', 
                  border: '1px solid rgba(14, 165, 233, 0.2)' 
                }}>
                  <input 
                    ref={inputRef}
                    type="text" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask Dr. Hydro..."
                    disabled={isAiTyping}
                    autoFocus
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
                    onClick={handleSend}
                    disabled={isAiTyping || !inputText.trim()}
                    style={{ 
                      background: 'var(--accent-cyan)',
                      border: 'none',
                      borderRadius: '12px',
                      width: '44px',
                      height: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#000',
                      cursor: 'pointer',
                      opacity: isAiTyping || !inputText.trim() ? 0.5 : 1,
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 15px rgba(14, 165, 233, 0.3)'
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Toggle Button (Always visible unless chat is open) */}
        {!isCompanionOpen && (
          <motion.button 
            whileHover={{ scale: 1.1, boxShadow: '0 0 30px rgba(14, 165, 233, 0.5), inset 0 0 20px rgba(139, 92, 246, 0.5)' }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCompanionOpen(true)}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(14, 165, 233, 0.4)',
              color: '#fff',
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(14, 165, 233, 0.2), inset 0 0 15px rgba(139, 92, 246, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-neon)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 5px var(--accent-neon))' }}>
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              <circle cx="9" cy="11" r="1" fill="currentColor"></circle>
              <circle cx="15" cy="11" r="1" fill="currentColor"></circle>
            </svg>
          </motion.button>
        )}

      </div>
    </>
  );
};

export default HydroCompanion;


