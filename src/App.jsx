import React, { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import {
  Activity, UploadCloud, FileText, AlertTriangle,
  User, Calendar, Heart, Thermometer, Pill,
  MessageCircle, X, Send, Stethoscope, Search,
  Clipboard, LayoutDashboard, Settings, Bell,
  Download, FileOutput, ArrowUp, ArrowDown, Minus,
  ToggleLeft, ToggleRight, Loader2, MapPin, ChevronDown, ChevronUp, ExternalLink, Star,
  Mic, Volume2, Globe, Clock, TrendingUp, Cpu
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, AreaChart, Area
} from 'recharts'
import { gsap } from 'gsap'
import axios from 'axios'
import './App.css'
import LandingPage from './LandingPage'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://ai-medical-report-backend.vercel.app'

// --- Premium UI Components ---

const LabTrendChart = ({ lab }) => {
  if (!lab.previous_value) return null

  const data = [
    { name: 'Previous', value: parseFloat(lab.previous_value) },
    { name: 'Current', value: parseFloat(lab.value) }
  ]

  return (
    <div style={{ height: '60px', width: '120px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={lab.status === 'Normal' ? '#10b981' : '#ef4444'} stopOpacity={0.3} />
              <stop offset="95%" stopColor={lab.status === 'Normal' ? '#10b981' : '#ef4444'} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={lab.status === 'Normal' ? '#10b981' : '#ef4444'}
            fillOpacity={1}
            fill="url(#colorVal)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

const ProcessingOverlay = ({ status }) => (
  <div style={{
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(20px)',
    zIndex: 9999, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center'
  }}>
    <div className="pulse-container" style={{ marginBottom: '2rem' }}>
      <Activity className="spin-slow" size={80} color="var(--primary)" />
    </div>
    <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: '1rem', letterSpacing: '-0.04em' }}>
      Analyzing Medical Record
    </h2>

    <div style={{ width: '400px', height: '6px', background: '#e2e8f0', borderRadius: '100px', overflow: 'hidden', marginBottom: '1.5rem', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
      <div className="progress-bar-fill" style={{ width: '100%', height: '100%' }}></div>
    </div>

    <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: 600 }}>
      {status}...
    </p>
    <div style={{ marginTop: '2rem', padding: '0.75rem 1.5rem', background: 'var(--primary-light)', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <Clock size={18} color="var(--primary)" />
      <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem' }}>Estimated time: 15s</span>
    </div>
  </div>
)

const HealthTimeline = ({ events }) => {
  useEffect(() => {
    gsap.fromTo(".timeline-item",
      { x: -50, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease: "back.out(1.7)" }
    )
  }, [events])

  return (
    <div className="timeline-container" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', position: 'relative' }}>
      <div style={{ position: 'absolute', left: '2.5rem', top: '2rem', bottom: '2rem', width: '2px', background: 'var(--border)', zIndex: 0 }}></div>
      {events.map((ev, i) => (
        <div key={i} className="timeline-item" style={{ display: 'flex', gap: '2rem', position: 'relative', zIndex: 1 }}>
          <div style={{
            width: '1.5rem', height: '1.5rem', borderRadius: '50%',
            background: ev.impact === 'Alert' ? '#ef4444' : ev.impact === 'Improving' ? '#10b981' : 'var(--primary)',
            border: '4px solid white', boxShadow: 'var(--shadow-sm)', marginTop: '0.25rem'
          }}></div>
          <div className="card" style={{ flex: 1, marginBottom: 0, padding: '1.5rem', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{ev.date}</span>
                <h4 style={{ margin: '4px 0', fontSize: '1.1rem', fontWeight: 900 }}>{ev.event}</h4>
              </div>
              <span className={`badge ${ev.status === 'Completed' ? 'stat-normal' : 'stat-high'}`} style={{ fontSize: '0.7rem' }}>{ev.status}</span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5 }}>{ev.details}</p>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'var(--bg-app)', borderRadius: '100px', fontWeight: 700, color: 'var(--text-muted)' }}>{ev.category}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function App() {
  const [showLanding, setShowLanding] = useState(true)
  const [currentFile, setCurrentFile] = useState(null)
  const [location, setLocation] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState("Initializing")
  const [data, setData] = useState(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [viewMode, setViewMode] = useState('patient')
  const [activeTab, setActiveTab] = useState('dash')
  const [timelineData, setTimelineData] = useState([])
  const [messages, setMessages] = useState([{ role: 'system', content: 'I am your Medical AI Assistant. I can analyze the report and answer clinical questions.' }])
  const [inputMsg, setInputMsg] = useState('')
  const [previousFile, setPreviousFile] = useState(null)
  const [expandedLab, setExpandedLab] = useState(null)
  const [isListening, setIsListening] = useState(false)

  const chatEndRef = useRef(null)
  const dashboardRef = useRef(null)

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/timeline`)
        setTimelineData(res.data)
      } catch (err) { console.error("Timeline fetch failed") }
    }
    fetchTimeline()
  }, [])

  useEffect(() => {
    if (data && dashboardRef.current) {
      gsap.fromTo(".card",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.15, ease: "power2.out" }
      )
    }
  }, [data])

  const handleCurrentFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) setCurrentFile(e.target.files[0])
  }

  const handlePreviousFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) setPreviousFile(e.target.files[0])
  }

  const handleAnalyze = async () => {
    if (!currentFile) return
    setAnalyzing(true)
    setLoadingStatus("Uploading & Scanning")

    const statusInterval = setInterval(() => {
      setLoadingStatus(prev => {
        if (prev === "Uploading & Scanning") return "Extracting Clinical Data"
        if (prev === "Extracting Clinical Data") return "Running AI Models"
        if (prev === "Running AI Models") return "Synthesizing Insights"
        if (prev === "Synthesizing Insights") return "Locating Specialists"
        return prev
      })
    }, 3000)

    const formData = new FormData()
    formData.append('current_file', currentFile)
    if (previousFile) formData.append('previous_file', previousFile)
    if (location) formData.append('location', location)

    try {
      const res = await axios.post(`${API_BASE_URL}/analyze`, formData)
      setData(res.data)
    } catch (e) {
      alert("Analysis Failed: " + (e.response?.data?.error || e.message))
    } finally {
      clearInterval(statusInterval)
      setAnalyzing(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!data) return
    try {
      const res = await axios.post(`${API_BASE_URL}/generate-pdf`, data, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'MediMind_Report.pdf')
      document.body.appendChild(link)
      link.click()
    } catch (err) { alert("PDF Generation Failed") }
  }

  const handleDownloadReferral = async () => {
    if (!data) return
    try {
      const res = await axios.post(`${API_BASE_URL}/generate-referral`, data, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'Referral_Letter.pdf')
      document.body.appendChild(link)
      link.click()
    } catch (err) { alert("Referral Generation Failed") }
  }

  const sendMessage = async () => {
    if (!inputMsg.trim()) return
    const newMsg = { role: 'user', content: inputMsg }
    setMessages(p => [...p, newMsg])
    setInputMsg('')

    try {
      const res = await axios.post(`${API_BASE_URL}/chat`, { question: newMsg.content })
      setMessages(p => [...p, { role: 'system', content: res.data.answer, sources: res.data.sources }])
    } catch (err) {
      setMessages(p => [...p, { role: 'system', content: "Agent Connection Error." }])
    }
  }

  const toggleSpeech = () => {
    setIsListening(!isListening)
    if (!isListening) {
      // Mock Speech recognition
      setTimeout(() => {
        setInputMsg("What do these results mean for my heart health?")
        setIsListening(false)
      }, 2000)
    }
  }

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  if (showLanding) return <LandingPage onStart={() => setShowLanding(false)} />

  return (
    <div className="dashboard-container">
      {analyzing && <ProcessingOverlay status={loadingStatus} />}

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand" onClick={() => setShowLanding(true)}>
          <div style={{ background: 'var(--primary)', padding: '6px', borderRadius: '10px' }}>
            <Activity color="white" size={24} />
          </div>
          <span>MediMind</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
          <div className={`nav-item ${!data ? 'active' : ''}`} onClick={() => { setData(null); setActiveTab('dash'); }}>
            <UploadCloud size={20} /> Upload New
          </div>
          {data && (
            <>
              <div className={`nav-item ${activeTab === 'dash' ? 'active' : ''}`} onClick={() => setActiveTab('dash')}>
                <LayoutDashboard size={20} /> Smart Dash
              </div>
              <div className={`nav-item ${activeTab === 'journey' ? 'active' : ''}`} onClick={() => setActiveTab('journey')}>
                <Globe size={20} /> Health Journey
              </div>

              <hr style={{ margin: '1rem 0', borderColor: 'var(--border)', opacity: 0.5 }} />

              <div className="nav-item" onClick={handleDownloadPDF}>
                <Download size={20} /> Export PDF
              </div>
              <div className="nav-item" onClick={handleDownloadReferral}>
                <FileOutput size={20} /> Referral
              </div>
            </>
          )}
        </nav>

        <div style={{ marginTop: 'auto', padding: '1.25rem', background: 'var(--primary-light)', borderRadius: '16px', border: '1px solid rgba(37, 99, 235, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></div>
            <strong style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>AI Agent Active</strong>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            Clinical guidelines (GLP-1, ACC/AHA) integrated for analysis.
          </p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-area">
        {data ? (
          <header className="top-bar">
            <div className="patient-info">
              <div className="info-item">
                <span className="info-label">Patient</span>
                <span className="info-value" style={{ fontSize: '1.1rem' }}>{data.demographics?.name || "John Doe"}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Age/Sex</span>
                <span className="info-value">{data.demographics?.age || "45"}Y • {data.demographics?.gender || "M"}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Location</span>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }} className="info-value">
                  <MapPin size={14} color="var(--primary)" /> {location || "NYC, USA"}
                </div>
              </div>

              <div className="view-toggle" style={{ marginLeft: '1rem', background: 'var(--bg-app)', padding: '6px', borderRadius: '100px', display: 'flex', border: '1px solid var(--border)' }}>
                <button
                  onClick={() => setViewMode('patient')}
                  style={{
                    padding: '6px 16px', borderRadius: '100px', border: 'none', fontSize: '0.8rem', fontWeight: 700,
                    background: viewMode === 'patient' ? 'white' : 'transparent',
                    color: viewMode === 'patient' ? 'var(--primary)' : 'var(--text-muted)',
                    boxShadow: viewMode === 'patient' ? 'var(--shadow-sm)' : 'none',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}>Patient</button>
                <button
                  onClick={() => setViewMode('doctor')}
                  style={{
                    padding: '6px 16px', borderRadius: '100px', border: 'none', fontSize: '0.8rem', fontWeight: 700,
                    background: viewMode === 'doctor' ? 'white' : 'transparent',
                    color: viewMode === 'doctor' ? 'var(--primary)' : 'var(--text-muted)',
                    boxShadow: viewMode === 'doctor' ? 'var(--shadow-sm)' : 'none',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}>Doctor</button>
              </div>
            </div>

            <button className="btn-primary" onClick={() => setIsChatOpen(!isChatOpen)}>
              <MessageCircle size={18} style={{ marginRight: '8px' }} /> Discuss Results
            </button>
          </header>
        ) : (
          <header className="top-bar">
            <h3 style={{ fontWeight: 800, letterSpacing: '-0.02em' }}>Intelligence Core</h3>
          </header>
        )}

        {data && data.vitals && (
          <div className="vitals-bar">
            {data.vitals.map((v, i) => (
              <div className="vital-card" key={i}>
                <div style={{
                  padding: '10px',
                  background: v.status === 'Normal' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  borderRadius: '14px'
                }}>
                  {v.name.includes('Heart') ? <Heart size={20} color={v.status === 'Normal' ? '#10b981' : '#ef4444'} /> :
                    v.name.includes('Temp') ? <Thermometer size={20} color="#f59e0b" /> :
                      <Activity size={20} color="var(--primary)" />}
                </div>
                <div>
                  <div className="info-label" style={{ fontSize: '0.65rem' }}>{v.name}</div>
                  <div style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>
                    {v.value}<span style={{ fontSize: '0.7em', color: 'var(--text-muted)', marginLeft: '2px' }}>{v.unit}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="content-view" ref={dashboardRef}>
          {!data && (
            <div className="upload-container" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '2rem' }}>
              <div className="card" style={{ flex: 1, minWidth: '400px', textAlign: 'center', padding: '3rem' }}>
                <div style={{ background: 'var(--primary-light)', width: '80px', height: '80px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                  <UploadCloud size={40} color="var(--primary)" />
                </div>
                <h2 style={{ marginBottom: '1rem', fontWeight: 900 }}>Standard Ingestion</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>Drop your latest laboratory or radiology report here.</p>

                <div style={{ padding: '3rem', border: '2px dashed var(--border)', borderRadius: '24px', background: 'var(--bg-app)', position: 'relative', cursor: 'pointer' }}>
                  <input type="file" onChange={handleCurrentFileChange} id="current-file" style={{ display: 'none' }} />
                  <label htmlFor="current-file" style={{ cursor: 'pointer' }}>
                    <div className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      {currentFile ? currentFile.name : "Choose File"} <ChevronDown size={16} />
                    </div>
                  </label>
                </div>

                <div style={{ marginTop: '2.5rem', textAlign: 'left' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', textTransform: 'uppercase' }}>Service Location</label>
                  <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-app)', padding: '0.85rem 1.25rem', borderRadius: '12px', marginTop: '0.75rem', border: '1px solid var(--border)' }}>
                    <MapPin size={18} color="var(--text-muted)" />
                    <input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. San Francisco, CA"
                      style={{ border: 'none', background: 'transparent', outline: 'none', marginLeft: '0.75rem', width: '100%', fontSize: '1rem', fontWeight: 500 }}
                    />
                  </div>
                </div>
              </div>

              <div className="card" style={{ flex: 1, minWidth: '400px', textAlign: 'center', padding: '3rem' }}>
                <div style={{ background: 'var(--primary-light)', width: '80px', height: '80px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                  <TrendingUp size={40} color="var(--primary)" />
                </div>
                <h2 style={{ marginBottom: '1rem', fontWeight: 900 }}>Trend Analysis</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>Upload a previous report to see your progress.</p>

                <div style={{ padding: '3rem', border: '2px dashed var(--border)', borderRadius: '24px', background: 'var(--bg-app)' }}>
                  <input type="file" onChange={handlePreviousFileChange} id="prev-file" style={{ display: 'none' }} />
                  <label htmlFor="prev-file" style={{ cursor: 'pointer' }}>
                    <div className="btn-secondary">
                      {previousFile ? previousFile.name : "Select Historical Data"}
                    </div>
                  </label>
                </div>
              </div>

              <div style={{ width: '100%', textAlign: 'center' }}>
                <button className="btn-primary" onClick={handleAnalyze} disabled={!currentFile || analyzing} style={{ padding: '1.25rem 4rem', fontSize: '1.2rem' }}>
                  {analyzing ? <><Loader2 className="spin-slow" style={{ marginRight: '12px' }} /> Processing</> : "Run Intelligence Sync"}
                </button>
              </div>
            </div>
          )}

          {data && activeTab === 'dash' && (
            <div className="dashboard-grid">
              <div className="intelligence-grid">
                <div className="card widget-full">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <FileText size={24} color="var(--primary)" />
                      {viewMode === 'patient' ? "Health Narrative" : "Clinical Synthesis"}
                    </h3>
                    <div className="badge stat-normal" style={{ fontSize: '0.7rem' }}>AI Verified</div>
                  </div>

                  {viewMode === 'patient' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                      <div style={{ padding: '1.5rem', background: 'var(--primary-light)', borderRadius: '20px' }}>
                        <h4 style={{ color: 'var(--primary)', marginBottom: '0.75rem', fontWeight: 800 }}>Key Findings</h4>
                        <p style={{ lineHeight: 1.6, fontSize: '1rem' }}>{data.patient_view?.findings}</p>
                      </div>
                      <div style={{ padding: '1.5rem', background: '#f0fdf4', borderRadius: '20px' }}>
                        <h4 style={{ color: '#166534', marginBottom: '0.75rem', fontWeight: 800 }}>AI Impression</h4>
                        <p style={{ lineHeight: 1.6, fontSize: '1rem' }}>{data.patient_view?.impression}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="markdown-body" style={{ lineHeight: 1.7, color: 'var(--text-main)', fontSize: '1.05rem' }}>
                      <ReactMarkdown>{data.summary}</ReactMarkdown>
                    </div>
                  )}
                </div>

                {data.risks.length > 0 && (
                  <div className="card widget-full" style={{ border: 'none', background: 'linear-gradient(135deg, #fff1f2 0%, #fff 100%)', boxShadow: '0 10px 30px rgba(225, 29, 72, 0.05)' }}>
                    <h3 style={{ color: '#e11d48', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <AlertTriangle size={24} /> Critical Markers & Risks
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                      {data.risks.map((r, i) => (
                        <div key={i} style={{ padding: '1.25rem', borderLeft: '4px solid #e11d48', background: 'white', borderRadius: '0 16px 16px 0', boxShadow: 'var(--shadow-sm)' }}>
                          <div style={{ fontWeight: 800, color: '#9f1239', fontSize: '0.9rem' }}>{r.level || 'Attention Required'}</div>
                          <div style={{ color: '#4c0519', marginTop: '4px', fontWeight: 500 }}>{r.detail}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <h3 style={{ margin: 0 }}>Laboratory Analytics</h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div className="badge stat-normal">Stable</div>
                    <div className="badge stat-high">Needs Action</div>
                  </div>
                </div>

                <table className="clean-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                  <thead>
                    <tr>
                      <th>Analyte</th>
                      <th>Value</th>
                      <th>Trend</th>
                      <th>Reference</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.structured_labs?.map((lab, i) => (
                      <React.Fragment key={i}>
                        <tr
                          onClick={() => lab.status !== 'Normal' ? setExpandedLab(expandedLab === i ? null : i) : null}
                          style={{
                            background: lab.status === 'Normal' ? 'white' : '#fff5f5',
                            cursor: lab.status !== 'Normal' ? 'pointer' : 'default',
                            boxShadow: 'var(--shadow-sm)'
                          }}
                          className={lab.status !== 'Normal' ? 'row-abnormal' : ''}
                        >
                          <td style={{ fontWeight: 800, color: 'var(--text-main)' }}>{lab.name}</td>
                          <td>
                            <div style={{ fontWeight: 700 }}>{lab.value} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lab.unit}</span></div>
                          </td>
                          <td style={{ width: '150px' }}>
                            <LabTrendChart lab={lab} />
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{lab.reference}</td>
                          <td>
                            <span className={`badge ${lab.status === 'Normal' ? 'stat-normal' : 'stat-high'}`}>
                              {lab.status}
                            </span>
                          </td>
                          <td>
                            {lab.status !== 'Normal' && (
                              expandedLab === i ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />
                            )}
                          </td>
                        </tr>

                        {expandedLab === i && (
                          <tr>
                            <td colSpan={6} style={{ padding: 0 }}>
                              <div style={{ background: 'white', border: '2px solid #fee2e2', borderRadius: '24px', padding: '2rem', margin: '0 1rem 1rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                                      <Search size={20} color="#e11d48" />
                                      <h5 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#9f1239' }}>Pathophysiology</h5>
                                    </div>
                                    <p style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>{lab.insight_what}</p>
                                    <p style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>{lab.insight_why}</p>
                                  </div>
                                  <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '20px' }}>
                                    <h5 style={{ color: 'var(--primary)', marginBottom: '1rem', fontWeight: 800 }}>Clinical Action Plan</h5>
                                    <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                      <li><strong>Immediate:</strong> {lab.insight_action}</li>
                                      <li><strong>Monitoring:</strong> {lab.insight_monitor}</li>
                                      <li><strong>Follow-up:</strong> {lab.insight_next_steps}</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {data.specialists && (
                <div className="card" style={{ background: 'var(--primary-light)', border: 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h3 style={{ margin: 0, color: 'var(--primary)' }}>Network Referrals</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem' }}>
                      <MapPin size={18} /> {location || "Local Specialists"}
                    </div>
                  </div>

                  {data.specialists.map((spec, i) => (
                    <div key={i} style={{ marginBottom: '2.5rem' }}>
                      <h4 style={{ color: 'var(--text-main)', marginBottom: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Stethoscope size={20} /> {spec.role}s
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {spec.profiles?.map((doc, j) => (
                          <div key={j} className="card" style={{ marginBottom: 0, padding: '1.25rem', display: 'flex', gap: '1.25rem', alignItems: 'center', background: 'white' }}>
                            <img src={doc.image} style={{ width: '70px', height: '70px', borderRadius: '18px', objectFit: 'cover' }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>{doc.name}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                <Star size={14} fill="#fbbf24" color="#fbbf24" />
                                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{doc.rating}</span>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>({doc.reviews})</span>
                              </div>
                              <button className="btn-primary" style={{ marginTop: '1rem', padding: '6px 12px', fontSize: '0.75rem', width: '100%', justifyContent: 'center' }}>
                                Book Consult
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {data && activeTab === 'journey' && (
            <div className="journey-view">
              <div style={{ padding: '0 2rem', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>Your Health Journey</h2>
                <p style={{ color: 'var(--text-muted)' }}>Historical timeline of visits, labs, and clinical milestones.</p>
              </div>
              <HealthTimeline events={timelineData} />
            </div>
          )}
        </div>
      </main>

      {/* CHAT SIDEBAR (Slide-Out) */}
      {isChatOpen && (
        <div className="chat-panel">
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'var(--primary-light)', padding: '8px', borderRadius: '12px' }}>
                <Cpu size={20} color="var(--primary)" />
              </div>
              <strong style={{ fontSize: '1.1rem', letterSpacing: '-0.02em' }}>MediMind Intelligence</strong>
            </div>
            <button onClick={() => setIsChatOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={24} />
            </button>
          </div>

          <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                {m.content}
                {m.sources && (
                  <div style={{ fontSize: '0.7rem', marginTop: '0.75rem', opacity: 0.8, paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                    Verified via <strong>{m.sources[0]}</strong>
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef}></div>
          </div>

          <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', background: 'white' }}>
            <div style={{ display: 'flex', gap: '0.75rem', position: 'relative' }}>
              <button
                onClick={toggleSpeech}
                style={{
                  padding: '8px', borderRadius: '12px', border: '1px solid var(--border)',
                  background: isListening ? '#fee2e2' : 'white', cursor: 'pointer',
                  transition: 'all 0.2s'
                }}>
                <Mic size={20} color={isListening ? '#ef4444' : 'var(--text-muted)'} />
              </button>
              <input
                value={inputMsg}
                onChange={e => setInputMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Ask about biomarkers, diet, or risks..."
                style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-app)', outline: 'none', fontSize: '0.95rem' }}
              />
              <button onClick={sendMessage} className="btn-primary" style={{ padding: '0 12px', borderRadius: '12px' }}>
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
