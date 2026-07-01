import { useState } from 'react';
import { auth } from '../services/firebase';

interface SuggestionResult {
  mechanic: string;
  reason: string;
}

export function useSuggestMechanic() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggestMechanic = async (subject: string, description: string): Promise<SuggestionResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gemini/suggest-mechanic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
        },
        body: JSON.stringify({ subject, description })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suggestion de la mécanique.');
      }

      const data = await response.json();
      return data as SuggestionResult;
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Une erreur inconnue est survenue.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { suggestMechanic, isLoading, error };
}
