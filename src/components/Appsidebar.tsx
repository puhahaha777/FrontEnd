import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Play,
  FileText,
  User,
  LogOut,
  Video,
  Sparkles,
  Map,
  type LucideIcon,
} from "lucide-react";
import type { Page } from "./Header";

type SidebarMode = "dashboard" | "video" | "report" | "account";

interface SidebarNavItem {
  id: Page;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}

interface AppSidebarProps {
  currentPage: SidebarMode;
  onNavigate: (page: Page) => void;
  onLogout: () => void;

  // video page 전용
  videoMode?: "original" | "analyzed";
  isAnalysisAvailable?: boolean;
  onSwitchToOriginal?: () => void;
  onSwitchToAnalyzed?: () => void;
  miniMap?: React.ReactNode;

  // report page 전용
  reportSections?: {
    id: string;
    label: string;
    icon: React.ReactNode;
    onClick?: () => void;
  }[];

  playerToggle?: React.ReactNode;
}

export function AppSidebar({
  currentPage,
  onNavigate,
  onLogout,
  videoMode,
  isAnalysisAvailable,
  onSwitchToOriginal,
  onSwitchToAnalyzed,
  miniMap,
  reportSections,
  playerToggle,
}: AppSidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [videoSectionOpen, setVideoSectionOpen] = useState(true);

  const navItems: SidebarNavItem[] = [
    {
      id: "dashboard",
      label: "대시보드",
      icon: LayoutDashboard,
      onClick: () => onNavigate("dashboard"),
    },
    {
      id: "video",
      label: "영상 보기",
      icon: Play,
      onClick: () => onNavigate("video"),
    },
    {
      id: "report",
      label: "결과 분석",
      icon: FileText,
      onClick: () => onNavigate("report"),
    },
    {
      id: "account",
      label: "계정 관리",
      icon: User,
      onClick: () => onNavigate("account"),
    },
  ];

  const isVideoPage = currentPage === "video";
  const isReportPage = currentPage === "report";

  return (
    <aside
      className={`
        relative flex flex-col bg-white border-r border-gray-200
        transition-all duration-300 ease-in-out shrink-0
        ${sidebarOpen ? "w-56" : "w-14"}
      `}
      style={{ minHeight: "calc(100vh - 64px)" }}
    >
      {/* toggle */}
      <button
        onClick={() => setSidebarOpen((v) => !v)}
        className="absolute -right-3 top-6 z-10 flex items-center justify-center w-6 h-6 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-shadow text-gray-500 hover:text-gray-700"
      >
        {sidebarOpen ? (
          <ChevronLeft className="size-3.5" />
        ) : (
          <ChevronRight className="size-3.5" />
        )}
      </button>

      <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden">
        {/* 공통 네비게이션 */}
        <div className={`px-3 pt-5 pb-2 ${!sidebarOpen && "px-2"}`}>
          {sidebarOpen && (
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-1">
              네비게이션
            </p>
          )}

          <div className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                (currentPage === "dashboard" && item.id === "dashboard") ||
                (currentPage === "video" && item.id === "video") ||
                (currentPage === "report" && item.id === "report") ||
                (currentPage === "account" && item.id === "account");

              return (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className={`
                    w-full flex items-center gap-2.5 rounded-lg transition-colors text-left
                    ${sidebarOpen ? "px-3 py-2" : "px-2 py-2 justify-center"}
                    ${
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                    }
                  `}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <Icon className="size-4 shrink-0" />
                  {sidebarOpen && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* video page 전용 section */}
        {isVideoPage && (
          <div
            className={`px-3 pt-1 pb-2 border-t border-gray-100 ${
              !sidebarOpen && "px-2"
            }`}
          >
            {sidebarOpen ? (
              <button
                onClick={() => setVideoSectionOpen((v) => !v)}
                className="w-full flex items-center justify-between px-1 py-2 text-left group"
              >
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  영상 페이지
                </p>
                <ChevronRight
                  className={`size-3 text-gray-300 transition-transform duration-200 ${
                    videoSectionOpen ? "rotate-90" : ""
                  }`}
                />
              </button>
            ) : (
              <div className="py-2 flex justify-center">
                <Video className="size-4 text-gray-400" />
              </div>
            )}

            {sidebarOpen && videoSectionOpen && (
              <div className="space-y-0.5 pl-1.5">
                <button
                  onClick={onSwitchToOriginal}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs font-medium transition-colors
                    ${
                      videoMode === "original"
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      videoMode === "original" ? "bg-emerald-500" : "bg-gray-300"
                    }`}
                  />
                  <span className="flex-1">원본 영상</span>
                </button>

                <button
                  onClick={onSwitchToAnalyzed}
                  disabled={!isAnalysisAvailable}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs font-medium transition-colors
                    ${
                      !isAnalysisAvailable
                        ? "text-gray-300 cursor-not-allowed"
                        : videoMode === "analyzed"
                        ? "bg-amber-50 text-amber-700"
                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      !isAnalysisAvailable
                        ? "bg-gray-200"
                        : videoMode === "analyzed"
                        ? "bg-amber-500"
                        : "bg-gray-300"
                    }`}
                  />
                  <span className="flex-1">스켈레톤 영상</span>
                  {!isAnalysisAvailable && (
                    <Sparkles className="size-3 text-gray-300" />
                  )}
                </button>

                {miniMap && <div className="px-1 pt-1">{miniMap}</div>}
              </div>
            )}

            {!sidebarOpen && (
              <div className="space-y-0.5">
                <button
                  onClick={onSwitchToOriginal}
                  className={`w-full flex justify-center px-2 py-2 rounded-lg transition-colors ${
                    videoMode === "original"
                      ? "bg-emerald-50 text-emerald-600"
                      : "text-gray-400 hover:bg-gray-100"
                  }`}
                  title="원본 영상"
                >
                  <Video className="size-4" />
                </button>

                <button
                  onClick={onSwitchToAnalyzed}
                  disabled={!isAnalysisAvailable}
                  className={`w-full flex justify-center px-2 py-2 rounded-lg transition-colors ${
                    !isAnalysisAvailable
                      ? "text-gray-200 cursor-not-allowed"
                      : videoMode === "analyzed"
                      ? "bg-amber-50 text-amber-600"
                      : "text-gray-400 hover:bg-gray-100"
                  }`}
                  title="스켈레톤 영상"
                >
                  <Sparkles className="size-4" />
                </button>

                <button
                  className="w-full flex justify-center px-2 py-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                  title="미니맵"
                >
                  <Map className="size-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* report page 전용 section */}
        {isReportPage && (
          <div
            className={`px-3 pt-4 pb-3 flex-1 overflow-y-auto ${
              sidebarOpen ? "" : "px-2"
            } border-t border-gray-100`}
          >
            {sidebarOpen && (
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                분석 섹션
              </p>
            )}

            <div className="space-y-0.5">
              {reportSections?.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => sec.onClick?.()}
                  className={`w-full flex items-center gap-2.5 rounded-lg transition-colors text-left text-gray-600 hover:bg-blue-50 hover:text-blue-600 ${
                    sidebarOpen ? "px-3 py-2" : "px-2 py-2 justify-center"
                  }`}
                  title={!sidebarOpen ? sec.label : undefined}
                >
                  {sec.icon}
                  {sidebarOpen && (
                    <span className="text-sm font-medium truncate">
                      {sec.label}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {sidebarOpen && playerToggle && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                  플레이어
                </p>
                {playerToggle}
              </div>
            )}
          </div>
        )}

        {/* logout */}
        <div className={`mt-auto border-t border-gray-100 p-3 ${!sidebarOpen && "px-2"}`}>
          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-2.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors
              ${sidebarOpen ? "px-3 py-2" : "px-2 py-2 justify-center"}`}
            title={!sidebarOpen ? "로그아웃" : undefined}
          >
            <LogOut className="size-4 shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">로그아웃</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}