import { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import LoadingSpinner from './components/LoadingSpinner';

const HomeScreen = lazy(() => import('./components/HomeScreen'));
const BlocsGrid = lazy(() => import('./features/blocs/BlocsGrid'));
const QuizScreen = lazy(() => import('./features/quiz/QuizScreen'));
const Game2048Screen = lazy(() => import('./features/2048/Game2048Screen'));
const SortScreen = lazy(() => import('./features/sort/SortScreen'));
const SwipeScreen = lazy(() => import('./features/swipe/SwipeScreen'));
const StoreScreen = lazy(() => import('./features/store/StoreScreen'));
const LeaderboardScreen = lazy(() => import('./features/leaderboard/LeaderboardScreen'));
const DevelopmentPlan = lazy(() => import('./components/DevelopmentPlan'));
const DepanneurScreen = lazy(() => import('./features/depanneur/DepanneurScreen'));
const AppartementScreen = lazy(() => import('./features/appartement/AppartementScreen'));
const EducationScreen = lazy(() => import('./features/education/EducationScreen'));
const DictionnaireScreen = lazy(() => import('./features/dictionnaire/DictionnaireScreen'));
const OnboardingScreen = lazy(() => import('./components/OnboardingScreen'));
import { useProgression } from './store/useProgression';
import { useTheme, AppTheme, applyThemeTokens } from './store/useTheme';
import { useTenant } from './store/useTenant';
import { useAuth } from './store/useAuth';
import { useAppConfig } from './store/useAppConfig';
import { useGames } from './store/useGames';
const LoginScreen = lazy(() => import('./components/LoginScreen'));
import { registerForPush, setupMessageListener } from './services/notifications';
import { auth, db } from './services/firebase';

const PenduScreen = lazy(() => import('./features/pendu/PenduScreen'));
const PortefeuilleScreen = lazy(() => import('./features/portefeuille/PortefeuilleScreen'));
const HacheScreen = lazy(() => import('./features/hache/HacheScreen'));
const AdminScreen = lazy(() => import('./features/admin/AdminScreen'));

const TuInterrogatifScreen = lazy(() => import('./features/tuinterrogatif/TuInterrogatifScreen'));
const ContractionsScreen = lazy(() => import('./features/contractions/ContractionsScreen'));
const TutoiementScreen = lazy(() => import('./features/tutoiement/TutoiementScreen'));
const ArcadeScreen = lazy(() => import('./features/arcade/ArcadeScreen'));
const SrsSessionScreen = lazy(() => import('./features/srs/SrsSessionScreen'));
const PaywallScreen = lazy(() => import('./features/paywall/PaywallScreen'));
const VilleScreen = lazy(() => import('./features/ville/VilleScreen'));
const SuccesScreen = lazy(() => import('./features/succes/SuccesScreen'));
const ApparenceScreen = lazy(() => import('./features/apparence/ApparenceScreen'));
const DashboardMemorielScreen = lazy(() => import('./features/memoire/DashboardMemorielScreen'));
const MarketingPreviewScreen = lazy(() => import('./features/admin/MarketingPreviewScreen'));
const DynamicGameScreen = lazy(() => import('./features/arcade/DynamicGameScreen').then(module => ({ default: module.DynamicGameScreen })));
const LessonGameScreen = lazy(() => import('./features/education/LessonGameScreen'));

import AppShell from './components/AppShell';

// Composant wrapper pour gérer les paramètres d'URL pour les jeux dynamiques
const DynamicGameWrapper = () => {
  const { gameId } = useParams();
  if (!gameId) return <Navigate to="/arcade" replace />;
  return <DynamicGameScreen gameId={gameId} onBack={() => window.history.back()} />;
};

// Composant wrapper pour gérer les paramètres d'URL pour les leçons
const LessonGameWrapper = () => {
  const { lessonId } = useParams();
  if (!lessonId) return <Navigate to="/ville" replace />;
  return <LessonGameScreen lessonId={lessonId} onBack={() => window.history.back()} />;
};

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const synchroniserDepuisFirebase = useProgression((state) => state.synchroniserDepuisFirebase);
  const sauvegarderVersFirebase = useProgression((state) => state.sauvegarderVersFirebase);
  const hasCompletedOnboarding = useProgression((state) => state.hasCompletedOnboarding);
  
  const theme = useTheme((state) => state.theme);
  const setPersonalTheme = useTheme((state) => state.setPersonalTheme);
  
  const resolveTenantFromDomain = useTenant((state) => state.resolveTenantFromDomain);
  const isLoadingTenant = useTenant((state) => state.isLoadingTenant);
  const currentTenant = useTenant((state) => state.currentTenant);

  const { setAuth, isLoading: isAuthLoading, setIsLoading: setIsAuthLoading, claims } = useAuth();

  const loadAppConfig = useAppConfig((state) => state.load);
  const loadGames = useGames((state) => state.load);

  // Résoudre le tenant basé sur le domaine au lancement
  useEffect(() => {
    resolveTenantFromDomain();
  }, [resolveTenantFromDomain]);

  // Appliquer les tokens CSS du thème
  useEffect(() => {
    applyThemeTokens(theme);
  }, [theme]);

  // Charger le thème global au démarrage
  useEffect(() => {
    const fetchGlobalTheme = async () => {
      try {
        if (currentTenant?.id && currentTenant.id !== 'eduforge') {
          // Charger le thème du tenant
          const docRef = doc(db, 'tenants', currentTenant.id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().appTheme) {
            setPersonalTheme(docSnap.data().appTheme as AppTheme);
            return;
          }
        }
        
        // Fallback: theme global
        const tenantId = currentTenant?.id || 'eduforge';
        const docRef = doc(db, 'tenants', tenantId, 'configuration', 'theme');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPersonalTheme(docSnap.data() as AppTheme);
        }
      } catch (e) {
        console.error("Erreur lors du chargement du thème", e);
      }
    };
    fetchGlobalTheme();
  }, [setPersonalTheme, currentTenant?.id]);

  // Charger la config app + jeux du tenant depuis Firestore (avec migration transparente du localStorage)
  useEffect(() => {
    if (!currentTenant?.id) return;
    loadAppConfig(currentTenant.id);
    loadGames(currentTenant.id);
  }, [currentTenant?.id, loadAppConfig, loadGames]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsAuthLoading(true);
      if (user) {
        try {
          const tokenResult = await user.getIdTokenResult();
          (window as any).firebaseToken = tokenResult.token;
          setAuth(user, tokenResult.claims as any);
        } catch (e) {
          console.error("Failed to get claims", e);
          (window as any).firebaseToken = null;
          setAuth(user, null);
        }
        setIsAuthenticated(true);
      } else {
        (window as any).firebaseToken = null;
        setAuth(null, null);
        setIsAuthenticated(false);
      }
      setIsAuthLoading(false);
      setIsInitializing(false);
    });
    return () => unsubscribe();
  }, [setAuth, setIsAuthLoading]);

  useEffect(() => {
    if (isAuthenticated) {
      setIsSyncing(true);
      synchroniserDepuisFirebase().then(() => {
        setIsSyncing(false);
        sauvegarderVersFirebase();
      }).catch((e) => {
        console.error(e);
        setIsSyncing(false);
      });
    }
  }, [isAuthenticated, synchroniserDepuisFirebase, sauvegarderVersFirebase]);

  useEffect(() => {
    if (isAuthenticated && hasCompletedOnboarding && auth.currentUser) {
       // On trigger la permission push uniquement après l'onboarding pour ne pas bloquer l'UX plus tôt
       registerForPush(auth.currentUser.uid).then(() => {
         setupMessageListener();
       }).catch((e) => {
         console.warn("Push registration failed", e);
       });
    }
  }, [isAuthenticated, hasCompletedOnboarding]);

  if (isInitializing || isSyncing || isLoadingTenant) {
    return <LoadingSpinner />;
  }

  // Fonction de protection des routes
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (!hasCompletedOnboarding) return <Navigate to="/onboarding" replace />;
    return <>{children}</>;
  };

  return (
    <BrowserRouter>
      {(!isAuthenticated) ? (
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="*" element={<LoginScreen onLogin={() => setIsAuthenticated(true)} />} />
          </Routes>
        </Suspense>
      ) : (!hasCompletedOnboarding) ? (
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="*" element={<OnboardingScreen onComplete={() => {}} />} />
          </Routes>
        </Suspense>
      ) : (
        <AppShell>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Hub Screens */}
              <Route path="/" element={<ProtectedRoute><HomeScreen /></ProtectedRoute>} />
              <Route path="/ville" element={<ProtectedRoute><VilleScreen onBack={() => window.history.back()} /></ProtectedRoute>} />
              <Route path="/arcade" element={<ProtectedRoute><ArcadeScreen onBack={() => window.history.back()} /></ProtectedRoute>} />
              <Route path="/portefeuille" element={<ProtectedRoute><PortefeuilleScreen onBack={() => window.history.back()} /></ProtectedRoute>} />
              
              {/* Secondary Screens */}
              <Route path="/store" element={<ProtectedRoute><StoreScreen onBack={() => window.history.back()} /></ProtectedRoute>} />
              <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardScreen onBack={() => window.history.back()} /></ProtectedRoute>} />
              <Route path="/dictionnaire" element={<ProtectedRoute><DictionnaireScreen onBack={() => window.history.back()} /></ProtectedRoute>} />
              <Route path="/succes" element={<ProtectedRoute><SuccesScreen onBack={() => window.history.back()} /></ProtectedRoute>} />
              <Route path="/apparence" element={<ProtectedRoute><ApparenceScreen onBack={() => window.history.back()} /></ProtectedRoute>} />
              <Route path="/memoire" element={<ProtectedRoute><DashboardMemorielScreen onBack={() => window.history.back()} /></ProtectedRoute>} />
              <Route path="/depanneur" element={<ProtectedRoute><DepanneurScreen onBack={() => window.history.back()} /></ProtectedRoute>} />
              <Route path="/appartement" element={<ProtectedRoute><AppartementScreen onBack={() => window.history.back()} /></ProtectedRoute>} />
              <Route path="/education" element={<ProtectedRoute><EducationScreen onBack={() => window.history.back()} /></ProtectedRoute>} />
              <Route path="/devplan" element={<ProtectedRoute><DevelopmentPlan onBack={() => window.history.back()} /></ProtectedRoute>} />
              <Route path="/srs" element={<ProtectedRoute><SrsSessionScreen onBack={() => window.history.back()} /></ProtectedRoute>} />
              <Route path="/paywall" element={<ProtectedRoute><PaywallScreen onBack={() => window.history.back()} trigger="direct" /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><AdminScreen onBack={() => window.history.back()} /></ProtectedRoute>} />
              <Route path="/marketing-preview" element={<ProtectedRoute><MarketingPreviewScreen onBack={() => window.history.back()} /></ProtectedRoute>} />

              {/* Games */}
              <Route path="/blocs" element={<ProtectedRoute><BlocsGrid onBack={() => window.history.back()} /></ProtectedRoute>} />
              <Route path="/quiz" element={<ProtectedRoute><QuizScreen onBack={() => window.history.back()} /></ProtectedRoute>} />
              <Route path="/2048" element={<ProtectedRoute><Game2048Screen onBack={() => window.history.back()} /></ProtectedRoute>} />
              <Route path="/sort" element={<ProtectedRoute><SortScreen onBack={() => window.history.back()} /></ProtectedRoute>} />
              <Route path="/swipe" element={<ProtectedRoute><SwipeScreen onBack={() => window.history.back()} /></ProtectedRoute>} />
              <Route path="/pendu" element={<ProtectedRoute><PenduScreen onBack={() => window.history.back()} /></ProtectedRoute>} />
              <Route path="/hache" element={<ProtectedRoute><HacheScreen onBack={() => window.history.back()} /></ProtectedRoute>} />
              <Route path="/tuinterrogatif" element={<ProtectedRoute><TuInterrogatifScreen onBack={() => window.history.back()} /></ProtectedRoute>} />
              <Route path="/contractions" element={<ProtectedRoute><ContractionsScreen onBack={() => window.history.back()} /></ProtectedRoute>} />
              <Route path="/tutoiement" element={<ProtectedRoute><TutoiementScreen onBack={() => window.history.back()} /></ProtectedRoute>} />
              
              {/* Dynamic Routes */}
              <Route path="/game/:gameId" element={<ProtectedRoute><DynamicGameWrapper /></ProtectedRoute>} />
              <Route path="/lesson/:lessonId" element={<ProtectedRoute><LessonGameWrapper /></ProtectedRoute>} />
              
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AppShell>
      )}
    </BrowserRouter>
  );
}
