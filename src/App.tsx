import { useEffect, useState } from "react";
import { LoginPage } from "./components/LoginPage";
import { OnboardingPage } from "./components/OnboardingPage2";
import { DashboardPage } from "./components/DashboardPage";
import { VideoPlayerPage } from "./components/VideoPlayerPage";
import { AnalysisReportPage } from "./components/AnalysisReportPage";
import { AccountPage } from "./components/AccountPage";

type Page = "onboarding" | "login" | "dashboard" | "video" | "report" | "account";

function buildUrl(page: Page, videoId?: string | null) {
  switch (page) {
    case "onboarding":
      return "/";
    case "login":
      return "/login";
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

  // /  (no parts)
  if (parts.length === 0) return { page: "onboarding", videoId: null };

  const [first, second] = parts;

  if (first === "login") return { page: "login", videoId: null };
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

  // ✅ URL -> state (새로고침/직접접속/뒤로가기 대응)
  useEffect(() => {
    const apply = () => {
      const { page, videoId } = parseLocation();
      setCurrentPage(page);
      setSelectedVideoId(videoId);
    };

    apply(); // 초기 진입 시 한번
    window.addEventListener("popstate", apply);
    return () => window.removeEventListener("popstate", apply);
  }, []);

  // ✅ state -> URL (화면 전환 시 history 쌓기)
  const go = (page: Page, videoId?: string | null) => {
    const url = buildUrl(page, videoId ?? selectedVideoId);
    window.history.pushState({ page, videoId: videoId ?? selectedVideoId }, "", url);

    setCurrentPage(page);
    if (typeof videoId !== "undefined") setSelectedVideoId(videoId);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    go("dashboard", selectedVideoId);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setSelectedVideoId(null);
    go("onboarding", null);
  };

  const handleViewVideo = (videoId: string) => {
    go("video", videoId);
  };

  const handleViewReport = (videoId: string) => {
    go("report", videoId);
  };

  const handleBackToDashboard = () => {
    go("dashboard", selectedVideoId);
  };

  const handleNavigate = (page: "dashboard" | "video" | "report" | "account") => {
    // video/report는 선택된 video가 없으면 못 가게(기존 Header disabled와 동일한 논리)
    if ((page === "video" || page === "report") && !selectedVideoId) return;
    go(page, selectedVideoId);
  };

  const handleJumpToVideo = (time: number) => {
    // 실제로는 video player seek 해야 하지만, 지금은 video 페이지로 이동만
    go("video", selectedVideoId);
  };

  return (
    <div className="size-full">
      {currentPage === "onboarding" && (
        <OnboardingPage onGetStarted={() => go("login", null)} />
      )}

      {currentPage === "login" && <LoginPage onLogin={handleLogin} />}

      {currentPage === "dashboard" && (
        <DashboardPage
          onLogout={handleLogout}
          onViewVideo={handleViewVideo}
          onViewReport={handleViewReport}
          onNavigate={handleNavigate}
          hasSelectedVideo={!!selectedVideoId}
        />
      )}

      {currentPage === "video" && selectedVideoId && (
        <VideoPlayerPage
          videoId={selectedVideoId}
          onBack={() => window.history.back()} // ✅ “진짜 뒤로가기”
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )}

      {currentPage === "report" && selectedVideoId && (
        <AnalysisReportPage
          videoId={selectedVideoId}
          onBack={() => window.history.back()} // ✅ “진짜 뒤로가기”
          onJumpToVideo={handleJumpToVideo}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )}

      {currentPage === "account" && (
        <AccountPage
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          hasSelectedVideo={!!selectedVideoId}
        />
      )}
    </div>
  );
}
