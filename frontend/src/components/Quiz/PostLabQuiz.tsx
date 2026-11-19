import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface PostLabQuizProps {
  moduleName: string;
  mistakes: string[];
  onExit: () => void;
}

export const PostLabQuiz: React.FC<PostLabQuizProps> = ({ moduleName, mistakes, onExit }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/v1/ai/generate-quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ module: moduleName, mistakes })
        });
        const json = await res.json();
        
        const fetchedQuestions = json.data?.quiz?.quiz || json.data?.quiz || [];
        setQuestions(fetchedQuestions.slice(0, 5));
      } catch (err) {
        console.error("Quiz Gen Error:", err);
        setQuestions([{
            question: "What is the primary purpose of an indicator in titration?",
            options: ["To heat the solution", "To show the endpoint", "To dissolve the solute", "To cool the flask"],
            correctIndex: 1,
            explanation: "Indicators change color near the equivalence point."
        }]);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [moduleName, mistakes]);

  const handleSelect = (idx: number) => {
    if (showResult) return;
    setSelectedOpt(idx);
  };

  const handleSubmit = () => {
    if (selectedOpt === null) return;
    setShowResult(true);
    if (selectedOpt === questions[currentIdx].correctIndex) {
      setScore(s => s + 1);
    }
  };

  const handleNext = async () => {
    // Save the answer for the current question
    const updatedAnswers = [...userAnswers];
    updatedAnswers[currentIdx] = selectedOpt !== null ? selectedOpt : -1;
    setUserAnswers(updatedAnswers);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1);
      setSelectedOpt(null);
      setShowResult(false);
    } else {
      setQuizFinished(true);
      // Submit the quiz score and data to the backend
      try {
        // Build the quizData payload
        const quizDataPayload = questions.map((q, idx) => ({
          question: q.question || '',
          options: q.options || [],
          correctIndex: q.correctIndex !== undefined ? q.correctIndex : -1,
          userSelectedIndex: updatedAnswers[idx] !== undefined ? updatedAnswers[idx] : -1,
          isCorrect: updatedAnswers[idx] === q.correctIndex,
          explanation: q.explanation || 'No explanation provided.'
        }));
        const finalScore = score + (selectedOpt === questions[currentIdx].correctIndex && !showResult ? 1 : 0);
        // We use the already computed state `score` because handleNext is called AFTER handleSubmit, 
        // so score is already updated. But just in case, we use `score`.
        const percentage = (finalScore / questions.length) * 100;
        await axios.post('/api/v1/student/session/quiz', {
          module: moduleName,
          score: percentage,
          quizData: quizDataPayload
        });
      } catch (err: any) {
        console.error("Failed to submit quiz score:", err);
        alert("Failed to submit quiz score: " + (err.response?.data?.message || err.message));
      }
    }
  };

  // Modern styling for Option Buttons
  const getButtonStyle = (idx: number) => {
    let bg = selectedOpt === idx ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.2)';
    let border = selectedOpt === idx ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.05)';
    
    if (showResult) {
      if (idx === currentQ?.correctIndex) {
        bg = 'rgba(16, 185, 129, 0.15)'; // success color
        border = 'rgba(16, 185, 129, 0.5)';
      } else if (selectedOpt === idx) {
        bg = 'rgba(239, 68, 68, 0.15)'; // danger color
        border = 'rgba(239, 68, 68, 0.5)';
      }
    }
    
    return {
      width: '100%',
      textAlign: 'left' as const,
      padding: '16px 20px',
      marginBottom: '12px',
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: '8px',
      color: 'var(--text-main)',
      fontSize: '1rem',
      cursor: showResult ? 'default' : 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    };
  };

  if (loading) {
    return (
      <div className="modal-backdrop" style={{ zIndex: 1050 }}>
        <div className="modal-content" style={{ textAlign: 'center', padding: '50px 40px', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            marginBottom: '20px',
            position: 'relative'
          }}>
            <svg
              style={{ width: '100%', height: '100%', animation: 'spin 1.5s linear infinite' }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--accent-purple)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <svg 
              style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '24px', height: '24px', color: 'var(--accent-cyan)' }}
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M2 12h4l3-9 5 18 3-9h5" />
            </svg>
          </div>
          <h2 style={{ color: 'white', marginBottom: '10px', fontSize: '1.4rem' }}>Generating Quiz</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>Analyzing your mistakes and building questions...</p>
        </div>
      </div>
    );
  }

  if (quizFinished) {
    return (
      <div className="modal-backdrop" style={{ zIndex: 1050 }}>
        <div className="modal-content" style={{ textAlign: 'center', padding: '50px 40px', maxWidth: '500px' }}>
          <div style={{ marginBottom: '20px' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
              <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
            </svg>
          </div>
          <h2 style={{ color: 'white', marginBottom: '10px', fontSize: '1.8rem' }}>Quiz Completed!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '30px', fontSize: '1.1rem' }}>
            You scored <strong style={{ color: 'white' }}>{score}</strong> out of {questions.length}
          </p>
          <button className="btn btn-primary" onClick={onExit} style={{ width: '100%', padding: '14px' }}>
            Exit to Modules
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIdx];

  return (
    <div className="modal-backdrop" style={{ zIndex: 1050 }}>
      <div className="modal-content" style={{ maxWidth: '650px', padding: 0 }}>
        <div className="modal-header" style={{ padding: '24px 30px', borderBottom: '1px solid var(--panel-border)' }}>
          <div>
            <h2 style={{ color: 'var(--accent-purple)', fontSize: '1.4rem', margin: '0 0 8px 0' }}>Post-Lab Assessment</h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Question {currentIdx + 1} of {questions.length}
            </p>
          </div>
        </div>
        
        <div className="modal-body" style={{ padding: '30px' }}>
          <div style={{ marginBottom: '30px', fontSize: '1.15rem', lineHeight: 1.6, color: 'white', fontWeight: 500 }}>
            {currentQ?.question}
          </div>
          
          <div>
            {currentQ?.options.map((opt, i) => (
              <button 
                key={i}
                style={getButtonStyle(i)}
                onClick={() => handleSelect(i)}
              >
                <span>{opt}</span>
                {showResult && i === currentQ.correctIndex && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
                {showResult && selectedOpt === i && i !== currentQ.correctIndex && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                )}
              </button>
            ))}
          </div>

          {showResult && (
            <div style={{
              marginTop: '24px',
              padding: '16px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '8px',
              borderLeft: `4px solid ${selectedOpt === currentQ.correctIndex ? 'var(--success)' : 'var(--danger)'}`,
            }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: selectedOpt === currentQ.correctIndex ? 'var(--success)' : 'var(--danger)' }}>
                {selectedOpt === currentQ.correctIndex ? 'Correct!' : 'Incorrect'}
              </h4>
              <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {currentQ.explanation}
              </p>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ padding: '20px 30px', borderTop: '1px solid var(--panel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Score: <span style={{ color: 'white', fontWeight: 600 }}>{score}</span>
          </div>
          {!showResult ? (
            <button 
              className={`btn ${selectedOpt === null ? '' : 'btn-primary'}`}
              disabled={selectedOpt === null}
              onClick={handleSubmit}
              style={{ padding: '10px 24px', opacity: selectedOpt === null ? 0.5 : 1 }}
            >
              Check Answer
            </button>
          ) : (
            <button 
              className="btn btn-secondary"
              onClick={handleNext}
              style={{ padding: '10px 24px' }}
            >
              {currentIdx < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
