import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import ReactMarkdown from 'react-markdown'
import {
  UploadCloud, FileText, Activity, AlertTriangle,
  CheckCircle, MessageCircle, X,
  Send, User, Layout, TrendingUp, MapPin, ArrowRight
} from 'lucide-react'
import axios from 'axios'
import './App.css'
import LandingPage from './LandingPage'

function App() {
  // State
  const [showLanding, setShowLanding] = useState(true)
  const [currentFile, setCurrentFile] = useState(null)
  const [previousFile, setPreviousFile] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [data, setData] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [error, setError] = useState(null)
  const [location, setLocation] = useState(null)
  const [viewMode, setViewMode] = useState('patient') // 'patient' | 'doctor'

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [messages, setMessages] = useState([{ role: 'system', content: 'Hello. I am ready to answer questions about these reports.' }])
  const [inputMsg, setInputMsg] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef(null)

  // Handlers - Current File
  const onDropCurrent = useCallback(acceptedFiles => {
    setCurrentFile(acceptedFiles[0])
    setError(null)
  }, [])
  const { getRootProps: gpCurrent, getInputProps: ipCurrent } = useDropzone({
    onDrop: onDropCurrent,
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg'] }
  })

  // Handlers - Previous File (Comparison)
  const onDropPrevious = useCallback(acceptedFiles => {
    setPreviousFile(acceptedFiles[0])
  }, [])
  const { getRootProps: gpPrev, getInputProps: ipPrev } = useDropzone({
    onDrop: onDropPrevious,
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.png', ' .jpg', '.jpeg'] }
  })

  const handleAnalyze = async () => {
    if (!currentFile) return
    setAnalyzing(true)
    setError(null)

    const formData = new FormData()
    formData.append('current_file', currentFile)
    if (previousFile) {
      formData.append('previous_file', previousFile)
    }

    try {
      const response = await axios.post('http://localhost:8000/analyze', formData)
      setData(response.data)
      setMessages([{ role: 'system', content: `Analysis complete. I have processed ${currentFile.name}.` }])
    } catch (err) {
      setError(err.response?.data?.error || "Analysis failed. Please try again.")
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSendMessage = async () => {
    if (!inputMsg.trim()) return
    const newMsg = { role: 'user', content: inputMsg }
    setMessages(prev => [...prev, newMsg])
    setInputMsg('')
    setChatLoading(true)

    try {
      const res = await axios.post('http://localhost:8000/chat', { question: newMsg.content })
      const answer = res.data.answer || res.data
      const sources = res.data.sources || []
      setMessages(prev => [...prev, { role: 'system', content: answer, sources: sources }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'system', content: "Connection error." }])
    } finally {
      setChatLoading(false)
    }
  }

  const handleGenerateQuestions = async () => {
    setChatLoading(true)
    try {
      const res = await axios.post('http://localhost:8000/generate-questions')
      setMessages(prev => [...prev, {
        role: 'system',
        content: `Suggested Questions for Doctor:\n${res.data.questions}`
      }])
      setIsChatOpen(true)
    } finally {
      setChatLoading(false)
    }
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // --- RENDER ---
  if (showLanding) {
    return <LandingPage onStart={() => setShowLanding(false)} />
  }

  return (
    <div className="dashboard-container">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand" onClick={() => setShowLanding(true)} style={{ cursor: 'pointer' }}>
          <Activity size={24} className="text-primary" />
          <span>MediMind</span>
        </div>

        <nav style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div className={`nav-item ${!data ? 'active' : ''}`} onClick={() => setData(null)}>
            <UploadCloud size={20} /> Upload Reports
          </div>
          {data && (
            <div className={`nav-item active`} style={{ cursor: 'default' }}>
              <FileText size={20} /> Analysis Results
            </div>
          )}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-area">
        {/* HEADER */}
        {!data && (
          <div className="header">
            <div>
              <h1 className="page-title">New Analysis</h1>
              <p className="subtitle">Upload PDF reports, X-Rays, or MRI scans.</p>
            </div>
          </div>
        )}
        {data && (
          <div className="header" style={{ alignItems: 'flex-start' }}>
            <div>
              <h1 className="page-title">
                {data.report_type === 'Visual' ? 'Visual Analysis' :
                  (data.report_type === 'Radiology' ? 'Imaging Report' : 'Lab Results')}
              </h1>
              <p className="subtitle">Analyzed: {currentFile.name} {previousFile ? `vs ${previousFile.name}` : ''}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-end' }}>
              {/* MODE TOGGLE */}
              <div style={{ background: '#e5e7eb', padding: '4px', borderRadius: '20px', display: 'flex' }}>
                <button
                  onClick={() => setViewMode('patient')}
                  style={{
                    padding: '6px 16px', borderRadius: '16px',
                    border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                    background: viewMode === 'patient' ? 'white' : 'transparent',
                    color: viewMode === 'patient' ? 'var(--primary)' : '#666',
                    boxShadow: viewMode === 'patient' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  Patient View
                </button>
                <button
                  onClick={() => setViewMode('doctor')}
                  style={{
                    padding: '6px 16px', borderRadius: '16px',
                    border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                    background: viewMode === 'doctor' ? 'white' : 'transparent',
                    color: viewMode === 'doctor' ? 'var(--primary)' : '#666',
                    boxShadow: viewMode === 'doctor' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  Doctor View
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn-outlined"
                  onClick={async () => {
                    try {
                      const response = await axios.post('http://localhost:8000/generate-referral', data, { responseType: 'blob' })
                      const url = window.URL.createObjectURL(new Blob([response.data]))
                      const link = document.createElement('a')
                      link.href = url
                      link.setAttribute('download', 'Referral_Letter.pdf')
                      document.body.appendChild(link)
                      link.click()
                    } catch (e) {
                      alert("Failed to generate referral letter.")
                    }
                  }}
                >
                  📄 Doctor Note
                </button>
                <button className="btn-outlined" onClick={() => setData(null)}>New Upload</button>
              </div>
            </div>
          </div>
        )}

        {/* UPLOAD VIEW */}
        {!data && (
          <div className="upload-container">
            <div className="upload-grid">
              {/* 1. CURRENT REPORT */}
              <div className="upload-zone" {...gpCurrent()}>
                <input {...ipCurrent()} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '50%' }}>
                    <UploadCloud size={32} color="var(--primary)" />
                  </div>
                  <h3>Latest Report</h3>
                  <p style={{ color: 'var(--text-muted)' }}>Drag & drop PDF or Image here</p>
                  {currentFile && (
                    <div className="file-preview">
                      <CheckCircle size={16} color="var(--success)" />
                      {currentFile.name}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. PREVIOUS REPORT (COMPARISON) */}
              <div className="upload-zone" {...gpPrev()} style={{ borderStyle: 'dashed', borderColor: previousFile ? 'var(--success)' : 'var(--border)' }}>
                <input {...ipPrev()} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: '#f2f2f7', padding: '1rem', borderRadius: '50%' }}>
                    <TrendingUp size={32} color={previousFile ? "var(--success)" : "var(--text-muted)"} />
                  </div>
                  <h3>Previous Report (Optional)</h3>
                  <p style={{ color: 'var(--text-muted)' }}>For trend analysis</p>
                  {previousFile && (
                    <div className="file-preview">
                      <CheckCircle size={16} color="var(--success)" />
                      {previousFile.name}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="action-bar">
              <button
                className="btn-primary btn-analyze"
                onClick={handleAnalyze}
                disabled={!currentFile || analyzing}
              >
                {analyzing ? "Analyzing..." : "Analyze Reports"}
              </button>
            </div>
            {error && <div style={{ marginTop: '1rem', color: 'var(--danger)', textAlign: 'center' }}>{error}</div>}
          </div>
        )}

        {/* UNIFIED DASHBOARD VIEW */}
        {data && (
          <div className="intelligence-grid">

            {/* 1. EXECUTIVE SUMMARY */}
            <div className="clean-card widget-full" style={{ padding: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Executive Summary</h3>
              <div style={{ lineHeight: '1.7', fontSize: '1.05rem', color: '#333' }}>
                <ReactMarkdown>{data.summary}</ReactMarkdown>
              </div>
              {viewMode === 'patient' && (
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={16} /> PATIENT EXPLANATION
                  </h4>
                  <p style={{ lineHeight: 1.6 }}>{data.patient_view.findings}</p>
                </div>
              )}
            </div>

            {/* 2. CRITICAL FINDINGS (What is Off) */}
            {(data.risks.length > 0 || (data.radiology && data.radiology.abnormalities && data.radiology.abnormalities.length > 0)) && (
              <div className="clean-card widget-full" style={{ padding: '0', overflow: 'hidden', border: '1px solid #fca5a5' }}>
                <div style={{ background: '#fee2e2', padding: '1.5rem', borderBottom: '1px solid #fca5a5' }}>
                  <h3 style={{ color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <AlertTriangle size={24} /> Critical Findings
                  </h3>
                  <p style={{ color: '#7f1d1d', marginTop: '0.5rem', opacity: 0.9 }}>
                    The following results require attention.
                  </p>
                </div>
                <div style={{ padding: '1.5rem' }}>
                  {/* Risks/Abnormal Labs */}
                  {data.risks.map((risk, i) => (
                    <div key={i} style={{
                      display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem',
                      padding: '1rem', background: '#fff', border: '1px solid #fee2e2', borderRadius: '12px',
                      boxShadow: '0 2px 4px rgba(220, 38, 38, 0.05)'
                    }}>
                      <div style={{
                        background: '#fee2e2', color: '#991b1b', width: '32px', height: '32px',
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>!</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '1.1rem', color: '#1f2937' }}>Abnormal Result Detected</div>
                        <p style={{ margin: '0.25rem 0 0 0', color: '#4b5563' }}>{risk.detail}</p>
                      </div>
                    </div>
                  ))}
                  {/* Radiology Abnormalities */}
                  {data.radiology?.abnormalities?.map((item, i) => (
                    <div key={'rad' + i} style={{
                      display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem',
                      padding: '1rem', background: '#fff', border: '1px solid #fee2e2', borderRadius: '12px'
                    }}>
                      <div style={{
                        background: '#fee2e2', color: '#991b1b', width: '32px', height: '32px',
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>!</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '1.1rem', color: '#1f2937' }}>Radiology Finding</div>
                        <p style={{ margin: '0.25rem 0 0 0', color: '#4b5563' }}>{item}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. DETAILED ANALYSIS (Full Labs or Imaging) */}
            <div className="clean-card widget-full" style={{ padding: viewMode === 'patient' ? '2rem' : '0' }}>
              <div style={{ padding: viewMode === 'patient' ? '0 0 1.5rem 0' : '1.5rem 1.5rem 0 1.5rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {data.report_type === 'Radiology' || data.report_type === 'Visual' ? <Activity size={24} /> : <FileText size={24} />}
                  {data.report_type === 'Radiology' || data.report_type === 'Visual' ? 'Imaging Details' : 'Full Lab Results'}
                </h3>
              </div>

              {/* A. RADIOLOGY/VISUAL CONTENT */}
              {(data.report_type === 'Radiology' || data.report_type === 'Visual') && (
                <div style={{ padding: viewMode === 'patient' ? '0' : '0 1.5rem 2rem 1.5rem' }}>
                  {/* Radiology Text */}
                  {data.report_type === 'Radiology' && (
                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', lineHeight: 1.7 }}>
                      {data.sections.impression || data.sections.findings}
                    </div>
                  )}
                  {/* Visual AI */}
                  {data.report_type === 'Visual' && (
                    <div>
                      {data.radiology.visual_findings.map((item, i) => (
                        <div key={i} style={{
                          padding: '1rem', marginBottom: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                          <span style={{ fontWeight: 600 }}>{item.label}</span>
                          <span style={{
                            background: item.confidence > 80 ? '#dcfce7' : '#fff7ed',
                            color: item.confidence > 80 ? '#166534' : '#c2410c',
                            padding: '0.25rem 0.75rem', borderRadius: '20px', fontWeight: 700, fontSize: '0.9rem'
                          }}>{item.confidence}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* B. LAB RESULTS CONTENT */}
              {(data.report_type !== 'Radiology' && data.report_type !== 'Visual') && (
                <>
                  {viewMode === 'patient' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                      {data.labs.map((lab, i) => {
                        // Skip abnormal ones here? No, show ALL, but style normals differently
                        // Actually user said "Show what is off and what is normal". We showed "Off" above.
                        // Let's show everything here but maybe dim the abnormals if they are duplicates?
                        // No, just show standard cards.
                        let width = '50%';
                        let markerPos = '50%';
                        let color = '#166534'; // Green

                        const match = lab.reference?.match(/([\d\.]+)\s*-\s*([\d\.]+)/);
                        if (match) {
                          const min = parseFloat(match[1]);
                          const max = parseFloat(match[2]);
                          const val = parseFloat(lab.value);
                          const span = max - min;
                          const pct = 20 + ((val - min) / span) * 60;
                          markerPos = Math.max(5, Math.min(95, pct)) + '%';
                        } // ... logic same as before ... 

                        if (lab.status === 'High') color = '#dc2626';
                        if (lab.status === 'Low') color = '#ea580c';

                        return (
                          <div key={i} style={{
                            padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0',
                            background: '#fff',
                            opacity: lab.status !== 'Normal' ? 1 : 0.9 // Subtle difference
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                              <span style={{ fontWeight: 600, color: '#374151' }}>{lab.name}</span>
                              <span style={{
                                fontWeight: 700, fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px',
                                background: lab.status === 'Normal' ? '#dcfce7' : '#fee2e2',
                                color: lab.status === 'Normal' ? '#166534' : '#991b1b'
                              }}>{lab.status}</span>
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: '#111827' }}>
                              {lab.value} <span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 500 }}>{lab.unit}</span>
                            </div>
                            <div style={{ position: 'relative', height: '6px', background: '#f3f4f6', borderRadius: '3px', margin: '1rem 0 0.5rem 0' }}>
                              <div style={{ position: 'absolute', left: '20%', width: '60%', height: '100%', background: '#dcfce7', borderRadius: '2px' }}></div>
                              <div style={{ position: 'absolute', left: markerPos, top: '-3px', width: '12px', height: '12px', borderRadius: '50%', background: color, border: '2px solid white', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}></div>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center' }}>Ref: {lab.reference}</div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <table className="clean-table">
                      <thead>
                        <tr>
                          <th>Test Name</th>
                          <th>Result</th>
                          <th>Reference</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.labs.map((lab, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 600 }}>{lab.name}</td>
                            <td style={{ fontWeight: 700 }}>{lab.value} {lab.unit}</td>
                            <td style={{ color: '#6b7280' }}>{lab.reference}</td>
                            <td>
                              <span style={{
                                padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600,
                                background: lab.status === 'Normal' ? '#dcfce7' : '#fee2e2',
                                color: lab.status === 'Normal' ? '#166534' : '#991b1b'
                              }}>{lab.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              )}
            </div>

            {/* 4. NEXT STEPS (Patient Only) */}
            {data.specialists && data.specialists.length > 0 && viewMode === 'patient' && (
              <div className="clean-card widget-full" style={{ padding: '2rem', borderLeft: '6px solid var(--primary)', background: '#eff6ff' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#1e3a8a' }}>
                  <MapPin size={24} /> Next Steps: Recommended Care
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                  {data.specialists.map((spec, i) => (
                    <div key={i} style={{
                      background: '#fff', padding: '1.5rem', borderRadius: '16px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid rgba(255,255,255,0.5)'
                    }}>
                      <div style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '1rem', color: '#1e40af' }}>{spec}</div>
                      {!location ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input
                            placeholder="Zip Code"
                            className="location-input"
                            onKeyDown={(e) => { if (e.key === 'Enter') setLocation(e.target.value) }}
                            style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                          />
                          <button className="btn-primary" onClick={(e) => setLocation(e.previousSibling.value)}>Find</button>
                        </div>
                      ) : (
                        <a
                          href={`https://www.zocdoc.com/search?searchQuery=${spec}&location=${location}`}
                          target="_blank" rel="noreferrer"
                          className="btn-primary"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none' }}
                        >
                          Book {spec} <ArrowRight size={16} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* CHAT TRIGGER */}
      <div className="chat-trigger" onClick={() => setIsChatOpen(!isChatOpen)}>
        {isChatOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </div>

      {/* CHAT PANEL */}
      {isChatOpen && (
        <div className="chat-panel">
          <div style={{ padding: '1rem', borderBottom: '1px solid #e5e5ea', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
            <span style={{ fontWeight: 600 }}>Medical Assistant</span>
            <button onClick={handleGenerateQuestions} style={{ background: '#f2f2f7', border: 'none', color: 'var(--primary)', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
              Suggest Questions
            </button>
          </div>
          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#f9f9fa' }}>
            {messages.map((msg, i) => (
              <div key={i} className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                {msg.content}
                {msg.sources && (
                  <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(0,0,0,0.1)', fontSize: '0.75rem', opacity: 0.7 }}>
                    <strong>Sources:</strong>
                    <ul style={{ paddingLeft: '1rem', margin: '0.25rem 0' }}>
                      {msg.sources.map((s, idx) => <li key={idx}>{s.substring(0, 60)}...</li>)}
                    </ul>
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div style={{ padding: '1rem', background: 'white', borderTop: '1px solid #e5e5ea', display: 'flex', gap: '0.5rem' }}>
            <input
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask anything..."
              style={{ flex: 1, border: '1px solid #e5e5ea', borderRadius: '20px', padding: '0.75rem 1rem', fontSize: '0.9rem', outline: 'none' }}
            />
            <button onClick={handleSendMessage} style={{ background: 'var(--primary)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
