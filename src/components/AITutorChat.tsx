import { auth } from '../services/firebase';
import { secureFetch } from '../utils/secureFetch';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, X, Bot, User, Sparkles } from 'lucide-react';
import { useTheme } from '../store/useTheme';
import { useSettings } from '../store/useSettings';
import { useSrs } from '../store/useSrs';
import { contentProvider } from '../services/contentProvider';
import { useProgression } from '../store/useProgression';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface AITutorChatProps {
  onClose: () => void;
  gameContext?: string;
}

export default function AITutorChat({ onClose, gameContext }: AITutorChatProps) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { apiKey, persona, context } = useSettings();
  const { recentFailures } = useSrs();
  const niveau = useProgression(state => state.getNiveau());
  
  // Récupérer le contenu réel des items échoués récemment
  const recentFailedItemsContext = useMemo(() => {
    if (recentFailures.length === 0) return '';
    const allItems = contentProvider.getItemsByNiveau(niveau);
    const failedContent = recentFailures
      .map(id => allItems.find(i => i.id === id))
      .filter(Boolean)
      .map(i => `- ${i!.payload?.answer || i!.id} (Module: ${i!.module})`)
      .join('\n');
    return `Note au tuteur : L'apprenant a récemment eu des difficultés avec les concepts suivants :\n${failedContent}\nUtilise ce contexte pour mieux cibler tes explications si la question est vague.`;
  }, [recentFailures, niveau]);
  
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'model', 
      text: "Allô ! Je suis ton tuteur IA. Je peux t'aider à comprendre un concept ponctuel ou t'expliquer une règle que tu viens de voir. Garde en tête que je n'ai pas une vision globale de tout ton parcours. Qu'est-ce qui te pose problème ?" 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      // Prepare history (excluding the new user message we just added, as it's passed in `message`)
      const historyForApi = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      // Combine global context with game specific context and recent failures
      const fullContext = [context, gameContext, recentFailedItemsContext].filter(Boolean).join('\n\nContexte actuel: ');

      const res = await secureFetch('/api/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', 'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`,
          ...(apiKey ? { 'x-api-key': apiKey } : {})
        },
        body: JSON.stringify({
          message: userMessage,
          history: historyForApi,
          persona,
          context: fullContext
        })
      });

      if (!res.ok) {
        throw new Error('Erreur de réseau');
      }

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'model', text: data.text }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: 'Oups, il y a eu un problème avec la connexion. Peux-tu réessayer ?' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-0 right-0 sm:bottom-4 sm:right-4 w-full sm:w-96 h-[80vh] sm:h-[500px] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border border-slate-200">
      {/* Header */}
      <div 
        className="p-4 text-white flex items-center justify-between"
        style={{ background: c.header }}
      >
        <div className="flex items-center gap-2">
          <Bot size={20} />
          <h3 className="font-bold" style={{ fontFamily: theme.fonts.display }}>Assistant IA</h3>
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg, i) => (
          <div 
            key={i}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
              {msg.role === 'user' ? <User size={16} /> : <Sparkles size={16} />}
            </div>
            <div 
              className={`p-3 rounded-2xl max-w-[75%] text-sm ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-sm' 
                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
             <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-100 text-purple-600">
              <Sparkles size={16} className="animate-spin" />
            </div>
            <div className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-500 rounded-tl-sm text-sm flex items-center gap-2">
               <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" />
               <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
               <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-slate-200">
        <div className="flex items-center gap-2 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Posez votre question..."
            className="flex-1 bg-slate-100 border-none rounded-full px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm pr-12"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="absolute right-1 w-10 h-10 rounded-full flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-400 transition-colors"
          >
            <Send size={16} className="ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
