import React, { useState, useEffect } from 'react';
import { GraduationCap, Sparkles, CheckCircle2 } from 'lucide-react';

const SplashScreen = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setFadeOut(true);
            setTimeout(() => {
              if (onFinish) onFinish();
            }, 400); // fade animation duration
          }, 300);
          return 100;
        }
        return prev + 5;
      });
    }, 45); // ~1.3 seconds total

    return () => clearInterval(timer);
  }, [onFinish]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        backgroundColor: '#0d0e12',
        backgroundImage: 'radial-gradient(circle at 50% 40%, rgba(99, 102, 241, 0.18) 0%, rgba(13, 14, 18, 0.98) 70%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
        color: '#ffffff',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: fadeOut ? 'none' : 'all',
        padding: '24px'
      }}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: '420px',
        width: '100%',
        textAlign: 'center'
      }}>
        {/* Animated Brand Logo Icon */}
        <div style={{
          position: 'relative',
          width: '100px',
          height: '100px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px'
        }}>
          {/* Glowing pulse ring */}
          <div style={{
            position: 'absolute',
            inset: '-8px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            opacity: 0.3,
            filter: 'blur(16px)',
            animation: 'pulse 2s infinite alternate'
          }} />

          {/* Logo container displaying custom PWA icon */}
          <div style={{
            width: '88px',
            height: '88px',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 12px 32px rgba(99, 102, 241, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'scale(1)',
            transition: 'transform 0.3s ease',
            background: '#0f172a'
          }}>
            <img 
              src="/pwa-icon.jpg" 
              alt="AttendEase App Icon" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          </div>
        </div>

        {/* App Name Branding */}
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 800,
          letterSpacing: '-1px',
          margin: 0,
          background: 'linear-gradient(135deg, #ffffff 0%, #c7d2fe 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.1
        }}>
          AttendEase
        </h1>

        <p style={{
          fontSize: '0.95rem',
          color: '#94a3b8',
          marginTop: '8px',
          marginBottom: '36px',
          fontWeight: 500,
          letterSpacing: '0.2px'
        }}>
          Smart Academic & Attendance System
        </p>

        {/* Loading Progress Bar */}
        <div style={{
          width: '240px',
          height: '6px',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          overflow: 'hidden',
          position: 'relative',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)',
            borderRadius: '10px',
            boxShadow: '0 0 12px rgba(99, 102, 241, 0.8)',
            transition: 'width 0.08s linear'
          }} />
        </div>

        <div style={{
          marginTop: '16px',
          fontSize: '0.75rem',
          color: '#64748b',
          fontWeight: 600,
          letterSpacing: '1px',
          textTransform: 'uppercase'
        }}>
          {progress < 100 ? 'Initializing Session...' : 'Ready'}
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
