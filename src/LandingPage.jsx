import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ArrowRight, ShieldCheck, Activity, TrendingUp, Cpu } from 'lucide-react'
import './App.css' // Ensure we have access to variables

const LandingPage = ({ onStart }) => {
    const heroRef = useRef(null)
    const featuresRef = useRef(null)

    useEffect(() => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } })

        // Hero Animation
        tl.fromTo(".hero-text-1",
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, duration: 1, delay: 0.2 }
        )
            .fromTo(".hero-text-2",
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8 },
                "-=0.6"
            )
            .fromTo(".cta-btn",
                { scale: 0.8, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.5 },
                "-=0.4"
            )

        // Features Stagger
        tl.fromTo(".feature-card",
            { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, stagger: 0.2 },
            "-=0.2"
        )

    }, [])

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-app)', display: 'flex', flexDirection: 'column' }}>

            {/* Navigation (Simple) */}
            <nav style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '800', fontSize: '1.25rem', color: 'var(--primary)' }}>
                    <Activity size={28} />
                    <span>MediMind</span>
                </div>
                <button className="btn-outlined" onClick={onStart}>Log In</button>
            </nav>

            {/* Hero Section */}
            <div ref={heroRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 2rem', gap: '2rem' }}>

                <h1 className="hero-text-1" style={{ fontSize: '4rem', lineHeight: '1.1', maxWidth: '800px', background: '-webkit-linear-gradient(45deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Your Health, <br /> Decoded Intelligently.
                </h1>

                <p className="hero-text-2" style={{ fontSize: '1.25rem', color: 'var(--text-muted)', maxWidth: '600px', lineHeight: '1.6' }}>
                    Transform complex medical reports into clear, actionable insights using advanced AI comparisons and trend analysis.
                </p>

                <button className="btn-primary cta-btn" onClick={onStart} style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem', boxShadow: '0 10px 30px rgba(0, 122, 255, 0.3)' }}>
                    Analyze My Report <ArrowRight size={20} />
                </button>

            </div>

            {/* Features Preview */}
            <div ref={featuresRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>

                <div className="clean-card feature-card" style={{ padding: '2rem', borderTop: '4px solid var(--primary)' }}>
                    <div style={{ background: 'rgba(0, 122, 255, 0.1)', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <TrendingUp size={24} color="var(--primary)" />
                    </div>
                    <h3>Smart Trends</h3>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        Visualize how your biomarkers change over time with direct "Previous vs Current" comparisons.
                    </p>
                </div>

                <div className="clean-card feature-card" style={{ padding: '2rem', borderTop: '4px solid var(--success)' }}>
                    <div style={{ background: 'rgba(52, 199, 89, 0.1)', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <ShieldCheck size={24} color="var(--success)" />
                    </div>
                    <h3>Safe & Secure</h3>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        Built with strict guardrails. No medical hallucinations—just data-backed, verifiable explanations.
                    </p>
                </div>

                <div className="clean-card feature-card" style={{ padding: '2rem', borderTop: '4px solid var(--secondary)' }}>
                    <div style={{ background: 'rgba(88, 86, 214, 0.1)', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <Cpu size={24} color="var(--secondary)" />
                    </div>
                    <h3>AI Assistant</h3>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        Ask questions like "What does high ALT mean?" and get instant, simplified answers from your report coverage.
                    </p>
                </div>

            </div>

            <footer style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                © 2024 MediMind Intelligence. Secure & Private.
            </footer>

        </div>
    )
}

export default LandingPage
