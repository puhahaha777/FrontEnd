import { useEffect, useState } from "react";
import { LoginForm } from "./components/LoginForm";
import { OnboardingPage } from "./components/OnboardingPage";
import { DashboardPage } from "./components/DashboardPage";
import { VideoPlayerPage } from "./components/VideoPlayerPage";
import { AnalysisReportPage } from "./components/AnalysisReportPage";
import { AccountPage } from "./components/AccountPage";
import "../styles/index.css";
import { AuthModal } from "./components/ui/AuthModal";

type Page = "onboarding" | "dashboard" | "video" | "report" | "account";

interface UserInfo {
  id?: number;
  nickname?: string;
  email?: string;
  avatarUrl?: string;
}

function buildUrl(page: Page, videoId?: string | null) {
  switch (page) {
    case "onboarding": return "/";
    case "dashboard": return "/dashboard";
    case "video": return videoId ? `/video/${videoId}` : "/video";
    case "report": return videoId ? `/report/${videoId}` : "/report";
    case "account": return "/account";
    default: return "/";
  }
}

function parseLocation(): { page: Page; videoId: string | null } {
  const parts = window.location.pathname.split("/").filter(Boolean);
  if (parts.length === 0) return { page: "onboarding", videoId: null };
  const [first, second] = parts;
  if (first === "dashboard") return { page: "dashboard", videoId: null };
  if (first === "account") return { page: "account", videoId: null };
  if (first === "video") return { page: "video", videoId: second ?? null };
  if (first === "report") return { page: "report", videoId: second ?? null };
  return { page: "onboarding", videoId: null };
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("onboarding");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialView, setAuthInitialView] = useState<"login" | "signup" | "forgot">("login");
  const [user, setUser] = useState<UserInfo | null>(null);

  const openLoginModal = () => { setAuthInitialView("login"); setIsAuthOpen(true); };
  const openSignupModal = () => { setAuthInitialView("signup"); setIsAuthOpen(true); };
  const closeAuthModal = () => setIsAuthOpen(false);

  // localStorage에서 유저 정보 로드
  const loadUserFromStorage = () => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser({
          id: parsed.id,
          nickname: parsed.nickname,
          email: parsed.email,
          avatarUrl: parsed.avatarUrl ?? undefined,
        });
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      setIsLoggedIn(true);
      loadUserFromStorage();
    }
  }, []);

  useEffect(() => {
    const apply = () => {
      const { page, videoId } = parseLocation();
      setCurrentPage(page);
      setSelectedVideoId(videoId);
    };
    apply();
    window.addEventListener("popstate", apply);
    return () => window.removeEventListener("popstate", apply);
  }, []);

  useEffect(() => {
    const onForceLogout = () => handleLogout();
    window.addEventListener("auth:logout", onForceLogout);
    return () => window.removeEventListener("auth:logout", onForceLogout);
  }, []);

  const go = (page: Page, videoId?: string | null) => {
    const url = buildUrl(page, videoId ?? selectedVideoId);
    window.history.pushState({ page, videoId: videoId ?? selectedVideoId }, "", url);
    setCurrentPage(page);
    if (typeof videoId !== "undefined") setSelectedVideoId(videoId);
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    loadUserFromStorage();
    closeAuthModal();
    go("dashboard", selectedVideoId);
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setUser(null);
    setSelectedVideoId(null);
    go("onboarding", null);
  };

  const handleViewVideo = (videoId: string) => {
    setSelectedVideoId(videoId);
    go("video", videoId);
  };

  const handleViewReport = (videoId: string) => {
    setSelectedVideoId(videoId);
    go("report", videoId);
  };

  const handleNavigate = (page: "dashboard" | "video" | "report" | "account") => {
    if ((page === "video" || page === "report") && !selectedVideoId) return;
    go(page, selectedVideoId);
  };

  const handleJumpToVideo = (time: number) => {
    go("video", selectedVideoId);
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token && currentPage !== "onboarding") {
      openLoginModal();
      go("onboarding", null);
    }
  }, [currentPage]);

  // Header에 전달할 user prop
  const headerUser = user ?? undefined;

  return (
    <>
      {currentPage === "onboarding" && (
        <OnboardingPage
          onGetStarted={openLoginModal}
          onOpenLogin={openLoginModal}
          onOpenSignup={openSignupModal}
          isModalOpen={isAuthOpen}
        />
      )}

      {currentPage === "dashboard" && (
        <DashboardPage
          onLogout={handleLogout}
          onViewVideo={handleViewVideo}
          onViewReport={handleViewReport}
          onNavigate={handleNavigate}
          hasSelectedVideo={!!selectedVideoId}
          user={headerUser}
        />
      )}

      {currentPage === "video" && selectedVideoId && (
        <VideoPlayerPage
          videoId={selectedVideoId}
          onBack={() => window.history.back()}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          user={headerUser}
        />
      )}

      {currentPage === "report" && selectedVideoId && (
        <AnalysisReportPage
          videoId={selectedVideoId}
          onBack={() => window.history.back()}
          onJumpToVideo={handleJumpToVideo}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          user={headerUser}
        />
      )}

      {currentPage === "account" && (
        <AccountPage
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          hasSelectedVideo={!!selectedVideoId}
          user={headerUser}
        />
      )}

      <AuthModal
        open={isAuthOpen}
        onClose={closeAuthModal}
        onLoginSuccess={handleLoginSuccess}
        initialView={authInitialView}
      />
    </>
  );
}