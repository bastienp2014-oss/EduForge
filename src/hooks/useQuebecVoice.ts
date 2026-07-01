/**
* HOOK useQuebecVoice — Mots & Blocs
*
* Sélection propre et honnête de la voix fr-CA.
*
* PORTE OUVERTE : Pour brancher Google Cloud TTS, ElevenLabs, ou OpenAI :
*   1. Crée une classe qui implémente AudioEngine (voir ci-dessous)
*   2. Dans AudioPlayer.tsx, instancie le nouveau moteur selon une config
*   → Zéro changement dans ce hook ni dans useProgression
*/
import { useState, useEffect, useRef } from 'react';

// ─── Interface AudioEngine (porte ouverte aux autres moteurs) ────
export interface AudioEngine {
  speak(text: string, speed: number, lang: string): Promise<void>;
  stop(): void;
  isAvailable(): boolean;
  readonly engineName: string;
}

// ─── Moteur Web Speech API ────────────────────────────────────────
export class WebSpeechEngine implements AudioEngine {
  readonly engineName = 'WebSpeech';
  private voice: SpeechSynthesisVoice | null = null;
  
  constructor(voice: SpeechSynthesisVoice | null) {
    this.voice = voice;
  }
  
  isAvailable(): boolean {
    return 'speechSynthesis' in window;
  }
  
  async speak(text: string, speed: number, lang: string): Promise<void> {
    if (!this.isAvailable()) return;
    window.speechSynthesis.cancel();
    
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = speed;
      if (this.voice) {
        utterance.voice = this.voice;
      }
      utterance.onend = () => resolve();
      utterance.onerror = (e) => reject(e);
      window.speechSynthesis.speak(utterance);
    });
  }
  
  stop(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

// ─── Résultat du hook ─────────────────────────────────────────────
export interface QuebecVoiceResult {
  hasNativeQuebecVoice: boolean;  // true si une vraie voix fr-CA est disponible
  engine: AudioEngine | null;
  isLoading: boolean;
  voiceLabel: string;             // Affichage honnête pour l'utilisateur
}

// ─── Hook principal ───────────────────────────────────────────────
export function useQuebecVoice(): QuebecVoiceResult {
  const [hasNativeQuebecVoice, setHasNativeQuebecVoice] = useState(false);
  const [engine, setEngine] = useState<AudioEngine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [voiceLabel, setVoiceLabel] = useState('Chargement…');
  const resolvedRef = useRef(false);
  
  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setIsLoading(false);
      setVoiceLabel('Non disponible sur cet appareil');
      return;
    }
    
    const resolve = () => {
      if (resolvedRef.current) return;
      resolvedRef.current = true;
      const voices = window.speechSynthesis.getVoices();
      
      // Cherche une voix fr-CA strictement (jamais fr-FR)
      const frCAVoice = voices.find(
        (v) =>
          v.lang === 'fr-CA' ||
          v.lang === 'fr_CA' ||
          (v.lang.startsWith('fr') && v.lang.includes('CA'))
      );
      
      if (frCAVoice) {
        setHasNativeQuebecVoice(true);
        setEngine(new WebSpeechEngine(frCAVoice));
        setVoiceLabel(`Voix québécoise — ${frCAVoice.name}`);
      } else {
        // Aucune voix fr-CA — on utilise quand même la synthèse mais on est HONNÊTE
        const anyVoice = voices.find((v) => v.lang.startsWith('fr')) ?? null;
        setHasNativeQuebecVoice(false);
        setEngine(new WebSpeechEngine(anyVoice));
        setVoiceLabel('Voix générée (fr-CA non disponible)');
      }
      setIsLoading(false);
    };
    
    // Les voix sont parfois disponibles immédiatement, parfois asynchrones
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve();
    } else {
      window.speechSynthesis.onvoiceschanged = resolve;
      // Timeout de sécurité si onvoiceschanged ne se déclenche jamais
      setTimeout(resolve, 2000);
    }
    
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);
  
  return { hasNativeQuebecVoice, engine, isLoading, voiceLabel };
}
