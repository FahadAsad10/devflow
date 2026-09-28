import { useEffect, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import CookieBanner from "./components/CookieBanner";
import Footer from "./components/Footer";
import Dashboard from "./components/Dashboard";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailsPage from "./pages/ProjectDetailsPage";
import TasksPage from "./pages/TasksPage";
import TeamsPage from "./pages/TeamsPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import NotFoundPage from "./pages/NotFoundPage";
import AuthPage from "./pages/AuthPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { trackPageView } from "./lib/analytics";

function RouteMetadata() {
  const location = useLocation();

  useEffect(() => {
    const titles: Record<string, string> = {
      "/dashboard": "Dashboard | DevFlow",
      "/projects": "Projects | DevFlow",
      "/tasks": "Tasks | DevFlow",
      "/teams": "Teams | DevFlow",
      "/login": "Sign in | DevFlow",
      "/privacy": "Privacy Policy | DevFlow",
      "/terms": "Terms & Conditions | DevFlow",
    };

    document.title = titles[location.pathname] ?? "DevFlow | Developer Project Management";
    trackPageView(location.pathname);
  }, [location.pathname]);

  return null;
}

function PrivateRoute({ children }: { children: ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

function AppLayout() {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login";

  if (isAuthPage) {
    return (
      <>
        <RouteMetadata />
        <Routes>
          <Route path="/login" element={<AuthPage />} />
        </Routes>
      </>
    );
  }

  return (
    <div className="app">
      <RouteMetadata />
      <Navbar />

      <div className="app-layout">
        <Sidebar />

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/projects" element={<PrivateRoute><ProjectsPage /></PrivateRoute>} />
            <Route path="/projects/:id" element={<PrivateRoute><ProjectDetailsPage /></PrivateRoute>} />
            <Route path="/tasks" element={<PrivateRoute><TasksPage /></PrivateRoute>} />
            <Route path="/teams" element={<PrivateRoute><TeamsPage /></PrivateRoute>} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>

      <CookieBanner />
      <Footer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
