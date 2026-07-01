import React, { useState, useEffect } from 'react';
import { useTheme } from '../store/useTheme';

export interface InteractiveTeaserProps {
  children: React.ReactElement;
  maxInteractions?: number;
  timeLimitSeconds?: number;
  onSignupClick?: () => void;
  ctaTitle?: string;
  ctaDescription?: string;
  ctaButtonText?: string;
}

export function InteractiveTeaser({ 
  children, 
  maxInteractions = 3, 
  timeLimitSeconds,
  onSignupClick,
  ctaTitle = "Super début !",
  ctaDescription = "Vous avez terminé vos questions gratuites. Créez un compte pour débloquer toutes les leçons et suivre vos progrès.",
  ctaButtonText = "Créer mon compte gratuit"
}: InteractiveTeaserProps) {
  const [interactions, setInteractions] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(timeLimitSeconds || null);
  const { theme } = useTheme();
  
  const isInteractionLimitReached = interactions >= maxInteractions;
  const isTimeLimitReached = timeLeft !== null && timeLeft <= 0;
  const isLimitReached = isInteractionLimitReached || isTimeLimitReached;

  useEffect(() => {
    if (timeLimitSeconds === undefined || isLimitReached) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLimitSeconds, isLimitReached]);

  const handleResponse = (...args: any[]) => {
    if (React.isValidElement(children) && children.props && 'onResponse' in (children.props as object)) {
      (children.props as any).onResponse(...args);
    }
    // We increment after the child logic so the visual update happens smoothly
    setTimeout(() => {
      setInteractions((prev) => prev + 1);
    }, 400); // slight delay to let the user see the result of their action
  };

  const clonedChild = React.isValidElement(children) ? React.cloneElement(children as React.ReactElement, {
    onResponse: handleResponse,
  } as any) : children;

  const handleSignup = () => {
    if (onSignupClick) {
      onSignupClick();
    } else {
      window.location.href = '/register';
    }
  };

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden rounded-2xl">
      {/* Optional Time Indicator */}
      {timeLimitSeconds !== undefined && !isLimitReached && (
        <div className="absolute top-4 right-4 z-40 bg-black/50 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-bold animate-in fade-in">
          ⏳ {Math.floor((timeLeft || 0) / 60)}:{(timeLeft || 0) % 60 < 10 ? '0' : ''}{(timeLeft || 0) % 60}
        </div>
      )}

      <div 
        className={`w-full h-full transition-all duration-700 ${isLimitReached ? 'blur-sm pointer-events-none select-none opacity-60' : ''}`}
      >
        {clonedChild}
      </div>

      {isLimitReached && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-black/20 backdrop-blur-sm animate-in fade-in duration-500">
          <div 
            className="w-full max-w-md p-8 text-center rounded-3xl shadow-2xl transform transition-transform animate-in zoom-in-95 duration-500"
            style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${theme.colors.primary}20` }}>
              <span className="text-3xl">✨</span>
            </div>
            
            <h2 
              className="text-2xl font-bold font-display mb-3"
              style={{ color: theme.colors.ink }}
            >
              {ctaTitle}
            </h2>
            
            <p 
              className="text-[15px] mb-8 leading-relaxed"
              style={{ color: theme.colors.muted }}
            >
              {ctaDescription}
            </p>
            
            <button
              onClick={handleSignup}
              className="w-full py-4 rounded-2xl font-bold font-sans transition-transform active:scale-95 shadow-md hover:opacity-90"
              style={{ backgroundColor: theme.colors.primary, color: '#fff' }}
            >
              {ctaButtonText}
            </button>
            
            <p className="mt-4 text-xs font-medium opacity-60" style={{ color: theme.colors.ink }}>
              Déjà membre ? <a href="/login" className="underline hover:text-primary transition-colors">Connectez-vous</a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
