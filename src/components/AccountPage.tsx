// AccountPage.tsx — Footer 추가 버전
// 변경 사항: import Footer, 최하단 <Footer /> 삽입
// (기존 코드 전체 유지, Footer만 추가)

import { useEffect, useMemo, useRef, useState } from "react";
import {
  User, Settings, Bell, Lock, Shield, Mail, Camera,
  ChevronRight, Trophy, Activity, Award, CheckCircle2,
  Globe, Smartphone, MonitorPlay, LogOut, Eye, EyeOff,
} from "lucide-react";
import { Header, type Page } from "./Header";
import { Footer } from "./ui/footer";

interface UserInfo {
  nickname?: string;
  email?: string;
  avatarUrl?: string;
}

interface AccountPageProps {
  onLogout: () => void;
  onNavigate: (page: Page) => void;
  hasSelectedVideo: boolean;
  user?: UserInfo;
  onUserUpdate?: (user: UserInfo) => void;
}

type NotificationsState = { analysis: boolean; performance: boolean; marketing: boolean };
type ProfileState = { name: string; club: string; email: string; bio: string; profileImage: string };
type SecuritySettingsState = { twoFactorAuth: boolean; newLoginAlert: boolean; sessionProtect: boolean };
type ServiceSettingsState = { autoPlayVideo: boolean; emailNewsletter: boolean; dataCollection: boolean; language: "ko" | "en" };
type AccountSection = "profile" | "notifications" | "password" | "security" | "service";

const ACCOUNT_STORAGE_KEY = "rallytrack-account-profile";

function SectionToggle({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-blue-600" : "bg-gray-300"}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-8">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

function getDefaultProfile(user?: UserInfo): ProfileState {
  return {
    name: user?.nickname ?? "admin",
    club: "한국공학대 배드민턴 클럽",
    email: user?.email ?? "test@naver.com",
    bio: "백핸드 드라이브가 주특기인 7년차 배드민턴 동호인입니다.",
    profileImage: user?.avatarUrl ?? "",
  };
}

function loadLocalAccountProfile(user?: UserInfo): ProfileState {
  try {
    const raw = localStorage.getItem(ACCOUNT_STORAGE_KEY);
    const fallback = getDefaultProfile(user);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return getDefaultProfile(user);
  }
}

export function AccountPage({ onLogout, onNavigate, hasSelectedVideo, user, onUserUpdate }: AccountPageProps) {
  const initialProfile = useMemo(() => loadLocalAccountProfile(user), [user]);
  const [activeSection, setActiveSection] = useState<AccountSection>("profile");
  const [profile, setProfile] = useState<ProfileState>(initialProfile);
  const [notifications, setNotifications] = useState<NotificationsState>({ analysis: true, performance: false, marketing: true });
  const [securitySettings, setSecuritySettings] = useState<SecuritySettingsState>({ twoFactorAuth: false, newLoginAlert: true, sessionProtect: true });
  const [serviceSettings, setServiceSettings] = useState<ServiceSettingsState>({ autoPlayVideo: true, emailNewsletter: true, dataCollection: false, language: "ko" });
  const [saveMessage, setSaveMessage] = useState("");
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPasswords, setShowPasswords] = useState({ current: false, next: false, confirm: false });
  const fileInputRef = useRef<HTMLInputElement>(null);

  void hasSelectedVideo;

  useEffect(() => { setProfile(loadLocalAccountProfile(user)); }, [user]);

  const stats = [
    { label: "참여 경기", value: "42", icon: Activity, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "승률", value: "64%", icon: Trophy, color: "text-yellow-600", bg: "bg-yellow-50" },
    { label: "획득 뱃지", value: "12", icon: Award, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  const menuItems = [
    { key: "profile" as const, label: "프로필 설정", icon: User },
    { key: "notifications" as const, label: "알림 설정", icon: Bell },
    { key: "password" as const, label: "비밀번호 변경", icon: Lock },
    { key: "security" as const, label: "보안 및 비밀번호", icon: Shield },
    { key: "service" as const, label: "서비스 이용 설정", icon: Settings },
  ];

  const updateProfileField = <K extends keyof ProfileState>(key: K, value: ProfileState[K]) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const persistProfileToStorage = (nextProfile: ProfileState) => {
    localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(nextProfile));
  };

  const saveBanner = (message: string) => {
    setSaveMessage(message);
    window.setTimeout(() => setSaveMessage(""), 2500);
  };

  const handleProfileImageClick = () => fileInputRef.current?.click();

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const imageUrl = reader.result as string;
      const nextProfile = { ...profile, profileImage: imageUrl };
      setProfile(nextProfile);
      persistProfileToStorage(nextProfile);
      const updatedUser = { ...(user ?? {}), nickname: nextProfile.name, email: nextProfile.email, avatarUrl: imageUrl };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      onUserUpdate?.(updatedUser);
      saveBanner("프로필 사진이 업데이트되었습니다.");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    persistProfileToStorage(profile);
    const updatedUser = { ...(user ?? {}), nickname: profile.name, email: profile.email, avatarUrl: profile.profileImage };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    onUserUpdate?.(updatedUser);
    saveBanner("프로필 정보가 저장되었습니다.");
  };

  const handlePasswordSave = () => {
    setPasswordMessage(""); setPasswordError("");
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError("모든 비밀번호 항목을 입력해주세요."); return;
    }
    if (passwordForm.newPassword.length < 8) { setPasswordError("새 비밀번호는 8자 이상이어야 합니다."); return; }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { setPasswordError("새 비밀번호와 확인 비밀번호가 일치하지 않습니다."); return; }
    setPasswordMessage("비밀번호 변경 UI 검증이 완료되었습니다. 실제 변경은 백엔드 연동 후 처리하면 됩니다.");
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  const handleLogoutAllSessions = () => alert("모든 기기 로그아웃은 백엔드 API 연동 후 연결하면 됩니다.");

  const renderProfileImage = () => {
    if (profile.profileImage) {
      return <img src={profile.profileImage} alt={`${profile.name} 프로필 이미지`} className="size-full object-cover" />;
    }
    return (
      <div className="size-full flex items-center justify-center bg-gray-100 text-2xl font-bold text-gray-500">
        {profile.name?.slice(0, 1).toUpperCase() || "A"}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return (
          <SectionCard title="프로필 설정" description="기본 프로필 정보를 수정하고 저장할 수 있습니다.">
            <div className="flex items-start gap-6 mb-8">
              <div className="relative group">
                <div className="size-24 rounded-full overflow-hidden border-4 border-white shadow-md">{renderProfileImage()}</div>
                <button type="button" onClick={handleProfileImageClick}
                  className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors" title="프로필 사진 업로드">
                  <Camera className="size-4" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleProfileImageChange} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{profile.name || "이름 미입력"}</h2>
                <p className="text-gray-500 mt-1">{profile.email || "이메일 미입력"}</p>
                <p className="text-sm text-gray-400 mt-1">{profile.club || "소속 클럽 미입력"}</p>
                <div className="flex gap-2 mt-4">
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider">Elite Player</span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold uppercase tracking-wider">Club Member</span>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <div key={stat.label} className="bg-gray-50 rounded-xl p-4 text-center">
                        <div className={`inline-flex p-2 rounded-lg ${stat.bg} mb-2`}><Icon className={`size-4 ${stat.color}`} /></div>
                        <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
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
                  <label className="text-sm font-semibold text-gray-700">이름</label>
                  <input type="text" value={profile.name} onChange={(e) => updateProfileField("name", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="이름을 입력하세요" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">소속 클럽</label>
                  <input type="text" value={profile.club} onChange={(e) => updateProfileField("club", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="소속 클럽을 입력하세요" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">이메일</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <input type="email" value={profile.email} onChange={(e) => updateProfileField("email", e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="example@email.com" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">자기소개</label>
                <textarea rows={3} value={profile.bio} onChange={(e) => updateProfileField("bio", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none" placeholder="자기소개를 입력하세요" />
              </div>
            </div>
            <div className="mt-8 flex items-center justify-between">
              <div className="text-sm text-green-600 font-medium">{saveMessage}</div>
              <button type="button" onClick={handleSaveProfile}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-100">변경사항 저장</button>
            </div>
          </SectionCard>
        );

      case "notifications":
        return (
          <SectionCard title="알림 설정" description="받고 싶은 알림 유형을 켜고 끌 수 있습니다.">
            <div className="space-y-5">
              {[
                { key: "analysis" as const, title: "분석 완료 알림", desc: "영상 분석이 완료되면 알림을 받습니다." },
                { key: "performance" as const, title: "주간 리포트 알림", desc: "주간 경기 성과 요약 리포트를 받습니다." },
                { key: "marketing" as const, title: "이벤트 및 공지 알림", desc: "이벤트, 공지사항, 업데이트 소식을 받습니다." },
              ].map(({ key, title, desc }) => (
                <div key={key} className="flex items-center justify-between gap-4 py-2">
                  <div><p className="font-semibold text-gray-900">{title}</p><p className="text-sm text-gray-500">{desc}</p></div>
                  <SectionToggle checked={notifications[key]} onClick={() => setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))} />
                </div>
              ))}
            </div>
            <div className="mt-8 flex items-center justify-between">
              <div className="text-sm text-green-600 font-medium">{saveMessage}</div>
              <button type="button" onClick={() => saveBanner("알림 설정이 저장되었습니다.")}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-100">알림 설정 저장</button>
            </div>
          </SectionCard>
        );

      case "password":
        return (
          <SectionCard title="비밀번호 변경" description="비밀번호 변경은 현재 프론트 UI와 검증까지만 연결되어 있습니다.">
            <div className="space-y-5">
              {[
                { label: "현재 비밀번호", field: "currentPassword" as const, show: showPasswords.current, toggle: () => setShowPasswords((p) => ({ ...p, current: !p.current })), ph: "현재 비밀번호를 입력하세요" },
                { label: "새 비밀번호", field: "newPassword" as const, show: showPasswords.next, toggle: () => setShowPasswords((p) => ({ ...p, next: !p.next })), ph: "8자 이상 입력하세요" },
                { label: "새 비밀번호 확인", field: "confirmPassword" as const, show: showPasswords.confirm, toggle: () => setShowPasswords((p) => ({ ...p, confirm: !p.confirm })), ph: "새 비밀번호를 다시 입력하세요" },
              ].map(({ label, field, show, toggle, ph }) => (
                <div key={field} className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">{label}</label>
                  <div className="relative">
                    <input type={show ? "text" : "password"} value={passwordForm[field]}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, [field]: e.target.value }))}
                      className="w-full px-4 py-2 pr-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder={ph} />
                    <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {passwordError && <div className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{passwordError}</div>}
            {passwordMessage && <div className="mt-5 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">{passwordMessage}</div>}
            <div className="mt-8 flex justify-end">
              <button type="button" onClick={handlePasswordSave}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-100">비밀번호 변경</button>
            </div>
          </SectionCard>
        );

      case "security":
        return (
          <SectionCard title="보안 및 비밀번호" description="계정 보안을 위한 추가 옵션을 설정할 수 있습니다.">
            <div className="space-y-5">
              {[
                { key: "twoFactorAuth" as const, icon: Smartphone, title: "2단계 인증 사용", desc: "로그인 시 추가 인증을 요구해 계정을 더 안전하게 보호합니다." },
                { key: "newLoginAlert" as const, icon: Bell, title: "새로운 로그인 알림", desc: "새로운 기기나 브라우저에서 로그인하면 이메일 알림을 받습니다." },
                { key: "sessionProtect" as const, icon: Shield, title: "세션 보호 강화", desc: "비정상적인 접속이 감지되면 재인증을 요구합니다." },
              ].map(({ key, icon: Icon, title, desc }) => (
                <div key={key} className="flex items-center justify-between gap-4 py-2">
                  <div className="flex items-start gap-3">
                    <Icon className="size-5 text-blue-600 mt-0.5" />
                    <div><p className="font-semibold text-gray-900">{title}</p><p className="text-sm text-gray-500">{desc}</p></div>
                  </div>
                  <SectionToggle checked={securitySettings[key]} onClick={() => setSecuritySettings((prev) => ({ ...prev, [key]: !prev[key] }))} />
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900">모든 기기에서 로그아웃</p>
                  <p className="text-sm text-gray-500 mt-1">현재 로그인된 다른 기기의 세션을 모두 종료합니다.</p>
                </div>
                <button type="button" onClick={handleLogoutAllSessions}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium">
                  <LogOut className="size-4" />로그아웃
                </button>
              </div>
            </div>
            <div className="mt-8 flex items-center justify-between">
              <div className="text-sm text-green-600 font-medium">{saveMessage}</div>
              <button type="button" onClick={() => saveBanner("보안 설정이 저장되었습니다.")}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-100">보안 설정 저장</button>
            </div>
          </SectionCard>
        );

      case "service":
        return (
          <SectionCard title="서비스 이용 설정" description="서비스 사용 경험과 관련된 옵션을 조정할 수 있습니다.">
            <div className="space-y-5">
              {[
                { key: "autoPlayVideo" as const, icon: MonitorPlay, title: "영상 자동 재생", desc: "영상 보기 페이지에서 영상을 자동으로 재생합니다." },
                { key: "emailNewsletter" as const, icon: Mail, title: "뉴스레터 및 운영 메일 수신", desc: "서비스 소식과 운영 관련 이메일을 받습니다." },
                { key: "dataCollection" as const, icon: CheckCircle2, title: "사용 데이터 수집 동의", desc: "서비스 품질 향상을 위한 익명 사용 데이터를 수집합니다." },
              ].map(({ key, icon: Icon, title, desc }) => (
                <div key={key} className="flex items-center justify-between gap-4 py-2">
                  <div className="flex items-start gap-3">
                    <Icon className="size-5 text-blue-600 mt-0.5" />
                    <div><p className="font-semibold text-gray-900">{title}</p><p className="text-sm text-gray-500">{desc}</p></div>
                  </div>
                  <SectionToggle checked={serviceSettings[key]} onClick={() => setServiceSettings((prev) => ({ ...prev, [key]: !prev[key] }))} />
                </div>
              ))}
              <div className="pt-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                  <Globe className="size-4" />언어 설정
                </label>
                <select value={serviceSettings.language}
                  onChange={(e) => setServiceSettings((prev) => ({ ...prev, language: e.target.value as "ko" | "en" }))}
                  className="w-full md:w-60 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white">
                  <option value="ko">한국어</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
            <div className="mt-8 flex items-center justify-between">
              <div className="text-sm text-green-600 font-medium">{saveMessage}</div>
              <button type="button" onClick={() => saveBanner("서비스 이용 설정이 저장되었습니다.")}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-100">서비스 설정 저장</button>
            </div>
          </SectionCard>
        );

      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header currentPage="account" onNavigate={onNavigate} onLogout={onLogout} hasSelectedVideo={hasSelectedVideo} user={user} />

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">계정 관리</h1>
                <p className="mt-1 text-sm text-gray-500">프로필, 알림, 보안, 서비스 이용 설정을 관리할 수 있습니다.</p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.key;
                  return (
                    <button key={item.key} type="button" onClick={() => setActiveSection(item.key)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl shadow-sm border transition-colors ${isActive ? "bg-white border-blue-200 text-blue-600 font-semibold" : "bg-white border-transparent text-gray-600 hover:bg-gray-50"}`}>
                      <div className="flex items-center gap-3"><Icon className="size-5" /><span>{item.label}</span></div>
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

      <Footer />
    </div>
  );
}