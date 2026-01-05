'use client';

import { useEffect, useState } from 'react';

interface HealthStatus {
    status: string;
    isDemoMode: boolean;
    mode: string;
    features: {
        idrxApi: string;
        blockchain: string;
        treasuryBot: string;
    };
}

export default function Home() {
    const [health, setHealth] = useState<HealthStatus | null>(null);

    useEffect(() => {
        fetch('/api/health')
            .then(res => res.json())
            .then(data => setHealth(data))
            .catch(err => console.error('Failed to fetch health:', err));
    }, []);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'system-ui, sans-serif',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
            {/* Demo Mode Banner */}
            {health?.isDemoMode && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    background: '#fbbf24',
                    color: '#000',
                    padding: '0.75rem',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    zIndex: 1000,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                }}>
                    🎭 DEMO MODE - Using simulated IDRX API responses (No real transactions)
                </div>
            )}

            <div style={{
                background: 'white',
                padding: '3rem',
                borderRadius: '1rem',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                maxWidth: '600px',
                textAlign: 'center',
                marginTop: health?.isDemoMode ? '60px' : '0'
            }}>
                <h1 style={{
                    fontSize: '2.5rem',
                    marginBottom: '1rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    🏦 AuRoom Backend API
                </h1>
                <p style={{
                    color: '#666',
                    fontSize: '1.1rem',
                    marginBottom: '2rem'
                }}>
                    IDRX → IDR Fiat Redemption Service
                </p>

                {/* Status Badge */}
                {health && (
                    <div style={{
                        display: 'inline-block',
                        background: health.isDemoMode ? '#fef3c7' : '#d1fae5',
                        color: health.isDemoMode ? '#92400e' : '#065f46',
                        padding: '0.5rem 1rem',
                        borderRadius: '9999px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        marginBottom: '1.5rem'
                    }}>
                        {health.isDemoMode ? '🎭 Demo Mode' : '🚀 Production Mode'}
                    </div>
                )}

                <div style={{
                    background: '#f7fafc',
                    padding: '1.5rem',
                    borderRadius: '0.5rem',
                    marginBottom: '1.5rem',
                    textAlign: 'left'
                }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#2d3748' }}>
                        📡 API Endpoints
                    </h2>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        <li style={{ marginBottom: '0.5rem' }}>
                            <code style={{
                                background: '#edf2f7',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.25rem',
                                fontSize: '0.9rem'
                            }}>
                                POST /api/redeem/self-service
                            </code>
                        </li>
                        <li style={{ marginBottom: '0.5rem' }}>
                            <code style={{
                                background: '#edf2f7',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.25rem',
                                fontSize: '0.9rem'
                            }}>
                                POST /api/redeem/treasury-assisted
                            </code>
                        </li>
                        <li style={{ marginBottom: '0.5rem' }}>
                            <code style={{
                                background: '#edf2f7',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.25rem',
                                fontSize: '0.9rem'
                            }}>
                                GET /api/redeem/status/[requestId]
                            </code>
                        </li>
                        <li style={{ marginBottom: '0.5rem' }}>
                            <code style={{
                                background: '#edf2f7',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.25rem',
                                fontSize: '0.9rem'
                            }}>
                                GET /api/health
                            </code>
                        </li>
                    </ul>
                </div>

                {/* Health Status */}
                {health && (
                    <div style={{
                        background: '#f7fafc',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        marginBottom: '1.5rem',
                        textAlign: 'left',
                        fontSize: '0.875rem'
                    }}>
                        <div style={{ marginBottom: '0.5rem' }}>
                            <strong>Status:</strong> <span style={{ color: '#10b981' }}>✓ {health.status}</span>
                        </div>
                        <div style={{ marginBottom: '0.5rem' }}>
                            <strong>IDRX API:</strong> {health.features.idrxApi}
                        </div>
                        <div style={{ marginBottom: '0.5rem' }}>
                            <strong>Blockchain:</strong> {health.features.blockchain}
                        </div>
                        <div>
                            <strong>Treasury Bot:</strong> {health.features.treasuryBot}
                        </div>
                    </div>
                )}

                <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'inline-block',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        padding: '0.75rem 2rem',
                        borderRadius: '0.5rem',
                        textDecoration: 'none',
                        fontWeight: '600',
                        transition: 'transform 0.2s'
                    }}
                >
                    📚 View Documentation
                </a>
            </div>
        </div>
    );
}
