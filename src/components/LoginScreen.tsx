import React, { useState } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider,
  signInAnonymously,
  signInWithEmailAndPassword
} from "firebase/auth";
import { auth } from "../services/firebase";

interface LoginScreenProps {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onLogin();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        return;
      }
      setError(err.message);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLogin();
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') {
        setError("Email ou mot de passe incorrect.");
      } else {
        setError(err.message);
      }
    }
  };

  const handleAnonymousSignIn = async () => {
    setError(null);
    try {
      await signInAnonymously(auth);
      onLogin();
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError("L'accès invité n'est pas activé dans Firebase. Activez 'Anonyme' dans la console Firebase (Authentication > Sign-in method).");
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white text-center">
          <h1 className="text-3xl font-extrabold mb-2">Bienvenue au Québec</h1>
          <p className="text-blue-100 font-medium">Connectez-vous pour commencer</p>
        </div>
        <div className="p-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium mb-6">
              {error}
            </div>
          )}
          
          <form onSubmit={handleEmailLogin} className="mb-6 flex flex-col gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                placeholder="votre@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-900 transition"
            >
              Connexion par email
            </button>
          </form>

          <div className="flex items-center mb-6">
            <div className="flex-1 border-t border-slate-200"></div>
            <div className="px-3 text-slate-400 text-sm font-medium">OU</div>
            <div className="flex-1 border-t border-slate-200"></div>
          </div>
          
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Se connecter avec Google
          </button>

          <button
            onClick={handleAnonymousSignIn}
            className="mt-4 w-full bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200 transition"
          >
            Continuer comme invité
          </button>
        </div>
      </div>
    </div>
  );
}
