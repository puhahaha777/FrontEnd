import { useState } from "react";
import {
  User,
  Settings,
  Bell,
  Lock,
  Shield,
  Mail,
  Camera,
  ChevronRight,
  Trophy,
  Activity,
  Award,
} from "lucide-react";
import { Header } from "./Header";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface AccountPageProps {
  onLogout: () => void;
  onNavigate: (
    page: "dashboard" | "video" | "report" | "account",
  ) => void;
  hasSelectedVideo: boolean;
}

export function AccountPage({
  onLogout,
  onNavigate,
  hasSelectedVideo,
}: AccountPageProps) {
  const [notifications, setNotifications] = useState({
    analysis: true,
    performance: false,
    marketing: true,
  });

  const stats = [
    {
      label: "참여 경기",
      value: "42",
      icon: Activity,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "승률",
      value: "64%",
      icon: Trophy,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },
    {
      label: "획득 뱃지",
      value: "12",
      icon: Award,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        currentPage="account"
        onNavigate={onNavigate}
        onLogout={onLogout}
        hasSelectedVideo={hasSelectedVideo}
      />

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              계정 관리
            </h1>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Sidebar Navigation */}
            <div className="space-y-2">
              <button className="w-full flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-blue-100 text-blue-600 font-semibold">
                <div className="flex items-center gap-3">
                  <User className="size-5" />
                  <span>프로필 설정</span>
                </div>
                <ChevronRight className="size-4" />
              </button>
              <button className="w-full flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-transparent text-gray-600 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <Bell className="size-5" />
                  <span>알림 설정</span>
                </div>
                <ChevronRight className="size-4" />
              </button>
              <button className="w-full flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-transparent text-gray-600 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <Shield className="size-5" />
                  <span>보안 및 비밀번호</span>
                </div>
                <ChevronRight className="size-4" />
              </button>
              <button className="w-full flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-transparent text-gray-600 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <Settings className="size-5" />
                  <span>서비스 이용 설정</span>
                </div>
                <ChevronRight className="size-4" />
              </button>
            </div>

            {/* Content Area */}
            <div className="md:col-span-2 space-y-6">
              {/* Profile Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8">
                  <div className="flex items-start gap-6 mb-8">
                    <div className="relative group">
                      <div className="size-24 rounded-full overflow-hidden border-4 border-white shadow-md">
                        <ImageWithFallback
                          src="https://images.unsplash.com/photo-1733141732172-3abba91f4db2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWRtaW50b24lMjBwbGF5ZXIlMjBwb3J0cmFpdCUyMHByb2ZpbGV8ZW58MXx8fHwxNzY4MDI3MjEzfDA&ixlib=rb-4.1.0&q=80&w=1080"
                          alt="Profile"
                          className="size-full object-cover"
                        />
                      </div>
                      <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors">
                        <Camera className="size-4" />
                      </button>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">
                        이기용
                      </h2>
                      <p className="text-gray-500 mb-4">
                        minsu.kim@example.com
                      </p>
                      <div className="flex gap-2">
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider">
                          Elite Player
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold uppercase tracking-wider">
                          Club Member
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-4 py-6 border-y border-gray-50">
                    {stats.map((stat, i) => (
                      <div key={i} className="text-center">
                        <div
                          className={`size-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-2`}
                        >
                          <stat.icon className="size-5" />
                        </div>
                        <div className="text-lg font-bold text-gray-900">
                          {stat.value}
                        </div>
                        <div className="text-xs text-gray-500">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Form Fields */}
                  <div className="mt-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">
                          이름
                        </label>
                        <input
                          type="text"
                          defaultValue="이기용"
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">
                          소속 클럽
                        </label>
                        <input
                          type="text"
                          defaultValue="한국공학대 배드민턴 클럽"
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">
                        이메일
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <input
                          type="email"
                          defaultValue="giyong.leesin@example.com"
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">
                        자기소개
                      </label>
                      <textarea
                        rows={3}
                        defaultValue="백핸드 드라이브가 주특기인 7년차 배드민턴 동호인입니다."
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      />
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-100">
                      변경사항 저장
                    </button>
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Bell className="size-5 text-blue-600" />
                  알림 수신 설정
                </h3>

                <div className="space-y-4">
                  {[
                    {
                      id: "analysis",
                      label: "영상 분석 완료 알림",
                      desc: "업로드한 영상의 AI 분석이 완료되면 알려드립니다.",
                    },
                    {
                      id: "performance",
                      label: "주간 리포트 알림",
                      desc: "한 주간의 경기 성적 요약 리포트를 보내드립니다.",
                    },
                    {
                      id: "marketing",
                      label: "이벤트 및 공지사항",
                      desc: "새로운 기능 업데이트 및 이벤트 소식을 전해드립니다.",
                    },
                  ].map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-2"
                    >
                      <div>
                        <div className="font-semibold text-gray-900">
                          {item.label}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.desc}
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          setNotifications((prev) => ({
                            ...prev,
                            [item.id]:
                              !prev[
                                item.id as keyof typeof notifications
                              ],
                          }))
                        }
                        className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                          notifications[
                            item.id as keyof typeof notifications
                          ]
                            ? "bg-blue-600"
                            : "bg-gray-200"
                        }`}
                      >
                        <div
                          className={`absolute top-1 left-1 size-4 bg-white rounded-full transition-transform duration-200 ${
                            notifications[
                              item.id as keyof typeof notifications
                            ]
                              ? "translate-x-6"
                              : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}