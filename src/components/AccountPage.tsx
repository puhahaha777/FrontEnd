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
import { Header, type Page } from "./Header";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface UserInfo {
  nickname?: string;
  email?: string;
  avatarUrl?: string;
}

interface AccountPageProps {
  onLogout: () => void;
  onNavigate: (page: "dashboard" | "video" | "report" | "account") => void;
  hasSelectedVideo: boolean;
  user?: UserInfo;
}

export function AccountPage({
  onLogout,
  onNavigate,
  hasSelectedVideo,
  user,
}: AccountPageProps) {
  const [notifications, setNotifications] = useState({
    analysis: true,
    performance: false,
    marketing: true,
  });

  const stats = [
    { label: "참여 경기", value: "42", icon: Activity, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "승률", value: "64%", icon: Trophy, color: "text-yellow-600", bg: "bg-yellow-50" },
    { label: "획득 뱃지", value: "12", icon: Award, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  const displayName = user?.nickname ?? "이기용";
  const displayEmail = user?.email ?? "giyong.leesin@example.com";

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        currentPage="account"
        onNavigate={onNavigate}
        onLogout={onLogout}
        hasSelectedVideo={hasSelectedVideo}
        user={user}
      />

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">계정 관리</h1>
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
                        {user?.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt="Profile"
                            className="size-full object-cover"
                          />
                        ) : (
                          <ImageWithFallback
                            src="https://images.unsplash.com/photo-1733141732172-3abba91f4db2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWRtaW50b24lMjBwbGF5ZXIlMjBwb3J0cmFpdCUyMHByb2ZpbGV8ZW58MXx8fHwxNzY4MDI3MjEzfDA&ixlib=rb-4.1.0&q=80&w=1080"
                            alt="Profile"
                            className="size-full object-cover"
                          />
                        )}
                      </div>
                      <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors">
                        <Camera className="size-4" />
                      </button>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">{displayName}</h2>
                      <p className="text-gray-500 mb-4">{displayEmail}</p>
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
                        <div className={`size-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                          <stat.icon className="size-5" />
                        </div>
                        <div className="text-lg font-bold text-gray-900">{stat.value}</div>
                        <div className="text-xs text-gray-500">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Form Fields */}
                  <div className="mt-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">이름</label>
                        <input
                          type="text"
                          defaultValue={displayName}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">소속 클럽</label>
                        <input
                          type="text"
                          defaultValue="한국공학대 배드민턴 클럽"
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">이메일</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <input
                          type="email"
                          defaultValue={displayEmail}
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">자기소개</label>
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

              {/* Notification Preferences */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Bell className="size-5 text-blue-600" />
                  알림 수신 설정
                </h3>

                <div className="space-y-4">
                  {[
                    { id: "analysis", label: "영상 분석 완료 알림", desc: "업로드한 영상의 AI 분석이 완료되면 알려드립니다." },
                    { id: "performance", label: "주간 리포트 알림", desc: "한 주간의 경기 성적 요약 리포트를 보내드립니다." },
                    { id: "marketing", label: "이벤트 및 공지사항", desc: "새로운 기능 업데이트 및 이벤트 소식을 전해드립니다." },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2">
                      <div>
                        <div className="font-semibold text-gray-900">{item.label}</div>
                        <div className="text-xs text-gray-500">{item.desc}</div>
                      </div>
                      <button
                        onClick={() =>
                          setNotifications((prev) => ({
                            ...prev,
                            [item.id]: !prev[item.id as keyof typeof notifications],
                          }))
                        }
                        className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                          notifications[item.id as keyof typeof notifications]
                            ? "bg-blue-600"
                            : "bg-gray-200"
                        }`}
                      >
                        <div
                          className={`absolute top-1 left-1 size-4 bg-white rounded-full transition-transform duration-200 ${
                            notifications[item.id as keyof typeof notifications]
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


/*import { useEffect, useMemo, useState } from "react";

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
  CheckCircle2,
  Globe,
  Smartphone,
  MonitorPlay,
  LogOut,
  Eye,
  EyeOff,
} from "lucide-react";
import { Header, type Page } from "./Header";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface AccountPageProps {
  onLogout: () => void;
  onNavigate: (page: Page) => void;
  hasSelectedVideo: boolean;
}

type NotificationsState = {
  analysis: boolean;
  performance: boolean;
  marketing: boolean;
};

type ProfileState = {
  name: string;
  club: string;
  email: string;
  bio: string;
  profileImage: string;
};

type SecuritySettingsState = {
  twoFactorAuth: boolean;
  newLoginAlert: boolean;
  sessionProtect: boolean;
};

type ServiceSettingsState = {
  autoPlayVideo: boolean;
  emailNewsletter: boolean;
  dataCollection: boolean;
  language: "ko" | "en";
};

type AccountStorageData = {
  profile: ProfileState;
  notifications: NotificationsState;
  securitySettings: SecuritySettingsState;
  serviceSettings: ServiceSettingsState;
};

type AccountSection =
  | "profile"
  | "notifications"
  | "password"
  | "security"
  | "service";

const ACCOUNT_STORAGE_KEY = "rallytrack-account-profile";

const DEFAULT_PROFILE: ProfileState = {
  name: "이기용",
  club: "한국공학대 배드민턴 클럽",
  email: "giyong.leesin@example.com",
  bio: "백핸드 드라이브가 주특기인 7년차 배드민턴 동호인입니다.",
  profileImage:
    "https://images.unsplash.com/photo-1733141732172-3abba91f4db2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWRtaW50b24lMjBwbGF5ZXIlMjBwb3J0cmFpdCUyMHByb2ZpbGV8ZW58MXx8fHwxNzY4MDI3MjEzfDA&ixlib=rb-4.1.0&q=80&w=1080",
};

const DEFAULT_NOTIFICATIONS: NotificationsState = {
  analysis: true,
  performance: false,
  marketing: true,
};

const DEFAULT_SECURITY_SETTINGS: SecuritySettingsState = {
  twoFactorAuth: false,
  newLoginAlert: true,
  sessionProtect: true,
};

const DEFAULT_SERVICE_SETTINGS: ServiceSettingsState = {
  autoPlayVideo: true,
  emailNewsletter: true,
  dataCollection: false,
  language: "ko",
};

function loadAccountData(): AccountStorageData {
  try {
    const raw = localStorage.getItem(ACCOUNT_STORAGE_KEY);
    if (!raw) {
      return {
        profile: DEFAULT_PROFILE,
        notifications: DEFAULT_NOTIFICATIONS,
        securitySettings: DEFAULT_SECURITY_SETTINGS,
        serviceSettings: DEFAULT_SERVICE_SETTINGS,
      };
    }

    const parsed = JSON.parse(raw) as Partial<AccountStorageData>;

    return {
      profile: {
        ...DEFAULT_PROFILE,
        ...(parsed.profile ?? {}),
      },
      notifications: {
        ...DEFAULT_NOTIFICATIONS,
        ...(parsed.notifications ?? {}),
      },
      securitySettings: {
        ...DEFAULT_SECURITY_SETTINGS,
        ...(parsed.securitySettings ?? {}),
      },
      serviceSettings: {
        ...DEFAULT_SERVICE_SETTINGS,
        ...(parsed.serviceSettings ?? {}),
      },
    };
  } catch (error) {
    console.error("계정 정보를 불러오는 중 오류가 발생했습니다.", error);
    return {
      profile: DEFAULT_PROFILE,
      notifications: DEFAULT_NOTIFICATIONS,
      securitySettings: DEFAULT_SECURITY_SETTINGS,
      serviceSettings: DEFAULT_SERVICE_SETTINGS,
    };
  }
}

function SectionToggle({
  checked,
  onClick,
}: {
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? "bg-blue-600" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-8">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

export function AccountPage({
  onLogout,
  onNavigate,
  hasSelectedVideo,
}: AccountPageProps) {
  const initialData = useMemo(() => loadAccountData(), []);
  const [activeSection, setActiveSection] =
    useState<AccountSection>("profile");

  const [profile, setProfile] = useState<ProfileState>(initialData.profile);
  const [notifications, setNotifications] = useState<NotificationsState>(
    initialData.notifications,
  );
  const [securitySettings, setSecuritySettings] =
    useState<SecuritySettingsState>(initialData.securitySettings);
  const [serviceSettings, setServiceSettings] =
    useState<ServiceSettingsState>(initialData.serviceSettings);

  const [saveMessage, setSaveMessage] = useState("");

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    next: false,
    confirm: false,
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

  useEffect(() => {
    const savedData = loadAccountData();
    setProfile(savedData.profile);
    setNotifications(savedData.notifications);
    setSecuritySettings(savedData.securitySettings);
    setServiceSettings(savedData.serviceSettings);
  }, []);

  const updateProfileField = <K extends keyof ProfileState>(
    key: K,
    value: ProfileState[K],
  ) => {
    setProfile((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const toggleNotification = (key: keyof NotificationsState) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleSecuritySetting = (key: keyof SecuritySettingsState) => {
    setSecuritySettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleServiceSetting = (key: keyof Omit<ServiceSettingsState, "language">) => {
    setServiceSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const saveAccountData = (message: string) => {
    try {
      const dataToSave: AccountStorageData = {
        profile,
        notifications,
        securitySettings,
        serviceSettings,
      };

      localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(dataToSave));
      setSaveMessage(message);

      window.setTimeout(() => {
        setSaveMessage("");
      }, 2500);
    } catch (error) {
      console.error("계정 정보를 저장하는 중 오류가 발생했습니다.", error);
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  const handlePasswordSave = () => {
    setPasswordMessage("");
    setPasswordError("");

    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      setPasswordError("모든 비밀번호 항목을 입력해주세요.");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError("새 비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
      return;
    }

    setPasswordMessage(
      "비밀번호 변경 UI 검증이 완료되었습니다. 실제 변경 적용은 백엔드 연동이 필요합니다.",
    );

    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleLogoutAllSessions = () => {
    alert("모든 기기 로그아웃은 백엔드 연동 후 실제 동작하도록 연결하면 됩니다.");
  };

  const menuItems = [
    {
      key: "profile" as const,
      label: "프로필 설정",
      icon: User,
    },
    {
      key: "notifications" as const,
      label: "알림 설정",
      icon: Bell,
    },
    {
      key: "password" as const,
      label: "비밀번호 변경",
      icon: Lock,
    },
    {
      key: "security" as const,
      label: "보안 및 비밀번호",
      icon: Shield,
    },
    {
      key: "service" as const,
      label: "서비스 이용 설정",
      icon: Settings,
    },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return (
          <SectionCard
            title="프로필 설정"
            description="기본 프로필 정보를 수정하고 저장할 수 있습니다."
          >
            <div className="flex items-start gap-6 mb-8">
              <div className="relative group">
                <div className="size-24 rounded-full overflow-hidden border-4 border-white shadow-md">
                  <ImageWithFallback
                    src={profile.profileImage}
                    alt={`${profile.name} 프로필 이미지`}
                    className="size-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
                  title="프로필 이미지 변경"
                >
                  <Camera className="size-4" />
                </button>
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">
                  {profile.name || "이름 미입력"}
                </h2>
                <p className="text-gray-500 mt-1">
                  {profile.email || "이메일 미입력"}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {profile.club || "소속 클럽 미입력"}
                </p>

                <div className="grid grid-cols-3 gap-4 mt-6">
                  {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <div
                        key={stat.label}
                        className="bg-gray-50 rounded-xl p-4 text-center"
                      >
                        <div
                          className={`inline-flex p-2 rounded-lg ${stat.bg} mb-2`}
                        >
                          <Icon className={`size-4 ${stat.color}`} />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          {stat.value}
                        </div>
                        <div className="text-xs text-gray-500">{stat.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    이름
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => updateProfileField("name", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="이름을 입력하세요"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    소속 클럽
                  </label>
                  <input
                    type="text"
                    value={profile.club}
                    onChange={(e) => updateProfileField("club", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="소속 클럽을 입력하세요"
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
                    value={profile.email}
                    onChange={(e) => updateProfileField("email", e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="example@email.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  자기소개
                </label>
                <textarea
                  rows={3}
                  value={profile.bio}
                  onChange={(e) => updateProfileField("bio", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="자기소개를 입력하세요"
                />
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <div className="text-sm text-green-600 font-medium">
                {saveMessage}
              </div>

              <button
                type="button"
                onClick={() => saveAccountData("프로필 정보가 저장되었습니다.")}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
              >
                변경사항 저장
              </button>
            </div>
          </SectionCard>
        );

      case "notifications":
        return (
          <SectionCard
            title="알림 설정"
            description="받고 싶은 알림 유형을 켜고 끌 수 있습니다."
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4 py-2">
                <div>
                  <p className="font-semibold text-gray-900">분석 완료 알림</p>
                  <p className="text-sm text-gray-500">
                    영상 분석이 완료되면 알림을 받습니다.
                  </p>
                </div>
                <SectionToggle
                  checked={notifications.analysis}
                  onClick={() => toggleNotification("analysis")}
                />
              </div>

              <div className="flex items-center justify-between gap-4 py-2">
                <div>
                  <p className="font-semibold text-gray-900">경기 성과 리포트</p>
                  <p className="text-sm text-gray-500">
                    주간 또는 요약 리포트 알림을 받습니다.
                  </p>
                </div>
                <SectionToggle
                  checked={notifications.performance}
                  onClick={() => toggleNotification("performance")}
                />
              </div>

              <div className="flex items-center justify-between gap-4 py-2">
                <div>
                  <p className="font-semibold text-gray-900">
                    마케팅 및 공지 알림
                  </p>
                  <p className="text-sm text-gray-500">
                    이벤트, 공지사항, 서비스 업데이트를 받습니다.
                  </p>
                </div>
                <SectionToggle
                  checked={notifications.marketing}
                  onClick={() => toggleNotification("marketing")}
                />
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <div className="text-sm text-green-600 font-medium">
                {saveMessage}
              </div>
              <button
                type="button"
                onClick={() => saveAccountData("알림 설정이 저장되었습니다.")}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
              >
                알림 설정 저장
              </button>
            </div>
          </SectionCard>
        );

      case "password":
        return (
          <SectionCard
            title="비밀번호 변경"
            description="비밀번호 변경은 현재 프론트 UI와 검증까지만 연결되어 있습니다."
          >
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  현재 비밀번호
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        currentPassword: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 pr-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="현재 비밀번호를 입력하세요"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords((prev) => ({
                        ...prev,
                        current: !prev.current,
                      }))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.current ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  새 비밀번호
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.next ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 pr-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="8자 이상 입력하세요"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords((prev) => ({
                        ...prev,
                        next: !prev.next,
                      }))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.next ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  새 비밀번호 확인
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 pr-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="새 비밀번호를 다시 입력하세요"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords((prev) => ({
                        ...prev,
                        confirm: !prev.confirm,
                      }))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {passwordError && (
              <div className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {passwordError}
              </div>
            )}

            {passwordMessage && (
              <div className="mt-5 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
                {passwordMessage}
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={handlePasswordSave}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
              >
                비밀번호 변경
              </button>
            </div>
          </SectionCard>
        );

      case "security":
        return (
          <SectionCard
            title="보안 및 비밀번호"
            description="계정 보안을 위한 추가 옵션을 설정할 수 있습니다."
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4 py-2">
                <div className="flex items-start gap-3">
                  <Smartphone className="size-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      2단계 인증 사용
                    </p>
                    <p className="text-sm text-gray-500">
                      로그인 시 추가 인증을 요구해 계정을 더 안전하게 보호합니다.
                    </p>
                  </div>
                </div>
                <SectionToggle
                  checked={securitySettings.twoFactorAuth}
                  onClick={() => toggleSecuritySetting("twoFactorAuth")}
                />
              </div>

              <div className="flex items-center justify-between gap-4 py-2">
                <div className="flex items-start gap-3">
                  <Bell className="size-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      새로운 로그인 알림
                    </p>
                    <p className="text-sm text-gray-500">
                      새로운 기기나 브라우저에서 로그인하면 이메일 알림을 받습니다.
                    </p>
                  </div>
                </div>
                <SectionToggle
                  checked={securitySettings.newLoginAlert}
                  onClick={() => toggleSecuritySetting("newLoginAlert")}
                />
              </div>

              <div className="flex items-center justify-between gap-4 py-2">
                <div className="flex items-start gap-3">
                  <Shield className="size-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">세션 보호 강화</p>
                    <p className="text-sm text-gray-500">
                      비정상적인 접속이 감지되면 재인증을 요구합니다.
                    </p>
                  </div>
                </div>
                <SectionToggle
                  checked={securitySettings.sessionProtect}
                  onClick={() => toggleSecuritySetting("sessionProtect")}
                />
              </div>
            </div>

            <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900">
                    모든 기기에서 로그아웃
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    현재 로그인된 다른 기기의 세션을 모두 종료합니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLogoutAllSessions}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium"
                >
                  <LogOut className="size-4" />
                  로그아웃
                </button>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <div className="text-sm text-green-600 font-medium">
                {saveMessage}
              </div>
              <button
                type="button"
                onClick={() => saveAccountData("보안 설정이 저장되었습니다.")}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
              >
                보안 설정 저장
              </button>
            </div>
          </SectionCard>
        );

      case "service":
        return (
          <SectionCard
            title="서비스 이용 설정"
            description="서비스 사용 경험과 관련된 옵션을 조정할 수 있습니다."
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4 py-2">
                <div className="flex items-start gap-3">
                  <MonitorPlay className="size-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      영상 자동 재생
                    </p>
                    <p className="text-sm text-gray-500">
                      영상 보기 페이지에서 영상을 자동으로 재생합니다.
                    </p>
                  </div>
                </div>
                <SectionToggle
                  checked={serviceSettings.autoPlayVideo}
                  onClick={() => toggleServiceSetting("autoPlayVideo")}
                />
              </div>

              <div className="flex items-center justify-between gap-4 py-2">
                <div className="flex items-start gap-3">
                  <Mail className="size-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      뉴스레터 및 운영 메일 수신
                    </p>
                    <p className="text-sm text-gray-500">
                      서비스 소식과 운영 관련 이메일을 받습니다.
                    </p>
                  </div>
                </div>
                <SectionToggle
                  checked={serviceSettings.emailNewsletter}
                  onClick={() => toggleServiceSetting("emailNewsletter")}
                />
              </div>

              <div className="flex items-center justify-between gap-4 py-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="size-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      사용 데이터 수집 동의
                    </p>
                    <p className="text-sm text-gray-500">
                      서비스 품질 향상을 위한 익명 사용 데이터를 수집합니다.
                    </p>
                  </div>
                </div>
                <SectionToggle
                  checked={serviceSettings.dataCollection}
                  onClick={() => toggleServiceSetting("dataCollection")}
                />
              </div>

              <div className="pt-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                  <Globe className="size-4" />
                  언어 설정
                </label>
                <select
                  value={serviceSettings.language}
                  onChange={(e) =>
                    setServiceSettings((prev) => ({
                      ...prev,
                      language: e.target.value as "ko" | "en",
                    }))
                  }
                  className="w-full md:w-60 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="ko">한국어</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <div className="text-sm text-green-600 font-medium">
                {saveMessage}
              </div>
              <button
                type="button"
                onClick={() => saveAccountData("서비스 이용 설정이 저장되었습니다.")}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
              >
                서비스 설정 저장
              </button>
            </div>
          </SectionCard>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        currentPage="account"
        onNavigate={onNavigate}
        onLogout={onLogout}
        hasSelectedVideo={hasSelectedVideo}
      />

      <div className="flex flex-1 overflow-hidden">

        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 py-8">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">계정 관리</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    프로필, 알림, 보안, 서비스 이용 설정을 관리할 수 있습니다.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.key;

                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setActiveSection(item.key)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl shadow-sm border transition-colors ${
                          isActive
                            ? "bg-white border-blue-200 text-blue-600 font-semibold"
                            : "bg-white border-transparent text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="size-5" />
                          <span>{item.label}</span>
                        </div>
                        <ChevronRight className="size-4" />
                      </button>
                    );
                  })}
                </div>

                <div className="md:col-span-2">{renderContent()}</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
*/