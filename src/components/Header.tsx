import { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard,
  LogOut,
  User,
  Settings,
  ChevronDown,
} from "lucide-react";

export type Page = "dashboard" | "video" | "report" | "account";

interface UserInfo {
  nickname?: string;
  email?: string;
  avatarUrl?: string;
}

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  hasSelectedVideo?: boolean;
  user?: UserInfo;
}

export function Header({
  currentPage,
  onNavigate,
  onLogout,
  hasSelectedVideo,
  user,
}: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [time, setTime] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  void hasSelectedVideo;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const date = now.toISOString().split("T")[0];
      const timePart = now.toTimeString().split(" ")[0];
      setTime(`${date} ${timePart}:`);
    };

    updateTime();
    const iv = setInterval(updateTime, 1000);
    return () => clearInterval(iv);
  }, []);

  const initials = user?.nickname ? user.nickname.slice(0, 2).toUpperCase() : "?";

  return (
    <>
      <style>{`
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .header-dropdown { animation: dropIn 0.15s ease-out; }
      `}</style>

      <header
        className="sticky top-0 z-50 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200"
        style={{ boxShadow: "0 1px 0 0 rgba(0,0,0,0.04)" }}
      >
        <div className="relative h-full max-w-[1600px] mx-auto px-6">
          {/* 좌측 상태 영역 */}
          <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-4 font-mono text-xs uppercase tracking-widest overflow-hidden">
            <span className="text-[#6bba00] font-bold whitespace-nowrap">● REC</span>
            <span className="text-slate-400 hidden sm:inline-block whitespace-nowrap">
              SYS_STATUS: ONLINE
            </span>
            <span className="text-slate-500 font-bold hidden md:inline-block whitespace-nowrap tabular-nums">
              {time}
            </span>
          </div>

          {/* 중앙 로고 */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <button
              onClick={() => onNavigate("dashboard")}
              className="flex items-center shrink-0 focus:outline-none"
              aria-label="홈으로"
            >
              <img
                src="/RallyTrack.svg"
                alt="RallyTrack"
                className="h-12 w-auto object-contain"
              />
            </button>
          </div>

          {/* 우측 액션 */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-3">
            <button
              onClick={() => onNavigate("dashboard")}
              className={`
                flex items-center gap-2 rounded-full px-3 py-2 text-xs font-mono font-bold uppercase tracking-widest transition-colors
                ${currentPage === "dashboard"
                  ? "bg-slate-100 text-[#1a2b4c]"
                  : "text-slate-500 hover:bg-slate-100 hover:text-[#1a2b4c]"
                }
              `}
            >
              <LayoutDashboard className="size-3.5" />
              <span className="hidden sm:inline">대시보드</span>
            </button>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center gap-2.5 pl-1 pr-2.5 py-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <div className="relative">
                  {user?.avatarUrl && (
                    <img
                      src={user.avatarUrl}
                      alt={user.nickname ?? "프로필"}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}

                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white ring-2 ring-white shadow-sm"
                    style={{
                      background: "linear-gradient(135deg, #1a2b4c, #3b82f6)",
                      display: user?.avatarUrl ? "none" : "flex",
                    }}
                  >
                    {initials}
                  </div>

                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-[#6bba00] rounded-full ring-1 ring-white" />
                </div>

                {user?.nickname && (
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-widest max-w-[80px] truncate font-mono">
                    {user.nickname}
                  </span>
                )}

                <ChevronDown
                  className={`size-3.5 text-slate-400 transition-transform duration-200 ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {dropdownOpen && (
                <div className="header-dropdown absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-50 font-mono">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                        style={{ background: "linear-gradient(135deg, #1a2b4c, #3b82f6)" }}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#1a2b4c] uppercase tracking-widest truncate">
                          {user?.nickname ?? "사용자"}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {user?.email ?? ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="py-1.5 font-mono text-xs uppercase tracking-widest">
                    <button
                      onClick={() => {
                        onNavigate("account");
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-600 hover:bg-slate-50 transition-colors text-left"
                    >
                      <Settings className="size-3.5 text-slate-400" />
                      계정 설정
                    </button>

                    <button
                      onClick={() => {
                        onNavigate("account");
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-600 hover:bg-slate-50 transition-colors text-left"
                    >
                      <User className="size-3.5 text-slate-400" />
                      프로필 보기
                    </button>
                  </div>

                  <div className="border-t border-slate-50 py-1.5 font-mono text-xs uppercase tracking-widest">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-red-500 hover:bg-red-50 transition-colors text-left font-bold"
                    >
                      <LogOut className="size-3.5" />
                      로그아웃
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}