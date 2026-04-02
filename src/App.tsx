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

const ACCOUNT_STORAGE_KEY = "rallytrack-account-profile";

function buildUrl(page: Page, videoId?: string | null) {
  switch (page) {
    case "onboarding":
      return "/";
    case "dashboard":
      return "/dashboard";
    case "video":
      return videoId ? `/video/${videoId}` : "/video";
    case "report":
      return videoId ? `/report/${videoId}` : "/report";
    case "account":
      return "/account";
    default:
      return "/";
  }
}

function parseLocation(): { page: Page; videoId: string | null } {
  const parts = window.location.pathname.split("/").filter(Boolean);

  if (parts.length === 0) {
    return { page: "onboarding", videoId: null };
  }

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

  const openLoginModal = () => {
    setAuthInitialView("login");
    setIsAuthOpen(true);
  };

  const openSignupModal = () => {
    setAuthInitialView("signup");
    setIsAuthOpen(true);
  };

  const closeAuthModal = () => setIsAuthOpen(false);

  /**
   * localStorage에서 유저 정보 로드
   *
   * 문제였던 부분:
   * - 기존에는 localStorage["user"] 만 읽어서 헤더 아바타를 구성
   * - 하지만 AccountPage는 rallytrack-account-profile에도 따로 저장
   * - 그래서 재실행 시 값이 어긋날 수 있었음
   *
   * 해결:
   * - user와 account-profile을 함께 읽어서 병합
   * - avatarUrl / nickname / email은 account-profile 값을 우선 사용
   */
  const loadUserFromStorage = () => {
    try {
      const rawUser = localStorage.getItem("user");
      const rawAccountProfile = localStorage.getItem(ACCOUNT_STORAGE_KEY);

      const parsedUser = rawUser ? JSON.parse(rawUser) : {};
      const parsedAccountProfile = rawAccountProfile ? JSON.parse(rawAccountProfile) : {};

      const mergedUser: UserInfo = {
        id: parsedUser.id,
        nickname: parsedAccountProfile.name ?? parsedUser.nickname,
        email: parsedAccountProfile.email ?? parsedUser.email,
        avatarUrl: parsedAccountProfile.profileImage ?? parsedUser.avatarUrl ?? undefined,
      };

      // 최소 하나라도 의미 있는 값이 있을 때만 setUser
      if (mergedUser.id || mergedUser.nickname || mergedUser.email || mergedUser.avatarUrl) {
        setUser(mergedUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("유저 정보 로드 실패:", error);
      setUser(null);
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

  /**
   * 같은 탭 안에서 localStorage가 수정됐을 때
   * App의 user state도 다시 동기화하고 싶으면 이 이벤트를 사용할 수 있음
   */
  useEffect(() => {
    const syncUser = () => loadUserFromStorage();

    window.addEventListener("user:updated", syncUser);
    return () => window.removeEventListener("user:updated", syncUser);
  }, []);

  const go = (page: Page, videoId?: string | null) => {
    const url = buildUrl(page, videoId ?? selectedVideoId);
    window.history.pushState({ page, videoId: videoId ?? selectedVideoId }, "", url);
    setCurrentPage(page);

    if (typeof videoId !== "undefined") {
      setSelectedVideoId(videoId);
    }
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
    if ((page === "video" || page === "report") && !selectedVideoId) {
      return;
    }

    go(page, selectedVideoId);
  };

  const handleJumpToVideo = (time: number) => {
    void time;
    go("video", selectedVideoId);
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token && currentPage !== "onboarding") {
      openLoginModal();
      go("onboarding", null);
    }
  }, [currentPage]);

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
          onUserUpdate={setUser}
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