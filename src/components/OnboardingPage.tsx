import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Crosshair,
  Activity,
  Maximize,
  Video,
  Database,
  Scan,
  TerminalSquare,
  Upload,
  Cpu,
  BarChart3,
} from "lucide-react";

interface OnboardingPageProps {
  onGetStarted: () => void;
  onOpenLogin: () => void;
  onOpenSignup: () => void;
}

export function OnboardingPage({
  onGetStarted,
  onOpenLogin,
  onOpenSignup,
}: OnboardingPageProps) {
  const [time, setTime] = useState("");

  // 실시간 타임코드 생성
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTime(
        `${now.toISOString().split("T")[0]} ${now.toTimeString().split(" ")[0]}:${now.getMilliseconds().toString().padStart(3, "0")}`,
      );
    }, 47); // 빠른 업데이트로 프레임 느낌 연출
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#fafbfc] font-sans text-[#1a2b4c] selection:bg-[#8ce600] selection:text-[#1a2b4c] overflow-x-hidden relative">
      {/* Light Scanline Overlay (연구소 모니터 텍스처 효과) */}
      <div className="pointer-events-none fixed inset-0 z-[100] bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,0.03)_50%),linear-gradient(90deg,rgba(0,0,0,0.01),rgba(0,0,0,0.01),rgba(0,0,0,0.01))] bg-[length:100%_4px,3px_100%] opacity-50" />

      {/* Surveillance Navigation (Light Mode) */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 font-mono text-xs uppercase tracking-widest">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-[#6bba00] animate-pulse font-bold">
              ● REC
            </span>
            <span className="text-slate-400 hidden sm:inline-block">
              SYS_STATUS: ONLINE
            </span>
            <span className="text-slate-500 font-bold">{time}</span>
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 flex items-center translate-y-1">
            <img
              src="/RallyTrack.svg"
              alt="RallyTrack"
              className="h-12 w-auto object-contain"
            />
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={onOpenLogin}
              className="text-slate-500 font-bold hover:text-[#1a2b4c] transition-colors"
            >
              [ 로그인 ]
            </button>
            <button
              onClick={onOpenSignup}
              className="bg-[#f2fde0] text-[#6bba00] font-bold border border-[#8ce600] px-4 py-1.5 hover:bg-[#8ce600] hover:text-[#1a2b4c] transition-all"
            >
              시작하기
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section (Main Camera Feed) */}
      <section className="relative pt-24 pb-12 px-6 max-w-[1400px] mx-auto min-h-screen flex flex-col justify-center">
        {/* HUD Elements (Light Mode Color) */}
        <div className="absolute top-24 left-6 w-8 h-8 border-t-2 border-l-2 border-slate-300" />
        <div className="absolute top-24 right-6 w-8 h-8 border-t-2 border-r-2 border-slate-300" />
        <div className="absolute bottom-12 left-6 w-8 h-8 border-b-2 border-l-2 border-slate-300" />
        <div className="absolute bottom-12 right-6 w-8 h-8 border-b-2 border-r-2 border-slate-300" />

        <div className="grid lg:grid-cols-12 gap-10 items-center">
          {/* Text Content */}
          <div className="lg:col-span-5 z-10 relative">
            <div className="font-mono text-[#6bba00] font-bold text-sm mb-4 tracking-widest bg-[#f2fde0] inline-block px-2 py-1 border border-[#8ce600]/30">
              &gt; TARGET_ACQUIRED: BADMINTON_PLAYER
            </div>
            <h1 className="text-6xl md:text-7xl font-black leading-[1.05] tracking-tighter mb-6 text-[#1a2b4c] uppercase">
              랠리 트랙, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6bba00] to-[#8ce600]">
                RALLY TRACK
              </span>
            </h1>
            <p className="text-slate-500 text-lg mb-10 font-mono leading-relaxed max-w-md font-medium">
              코트 내의 선수, 셔틀콕 인식, 스트로크 분류, <br />
              당신의 모든 움직임이 데이터가 됩니다.
            </p>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onGetStarted}
              className="group relative bg-white border-2 border-[#1a2b4c] text-[#1a2b4c] px-8 py-4 font-mono font-bold tracking-widest uppercase overflow-hidden shadow-[4px_4px_0_#1a2b4c] hover:shadow-[2px_2px_0_#1a2b4c] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <div className="absolute inset-0 bg-[#1a2b4c] -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out z-0" />
              <span className="relative z-10 group-hover:text-white flex items-center gap-3">
                <Scan size={20} />
                영상 분석 시작하기
              </span>
            </motion.button>
          </div>

          {/* Main Camera UI (Light Theme) */}
          <div className="lg:col-span-7 relative h-[600px] w-full border border-slate-200 bg-white shadow-xl shadow-slate-200/50 overflow-hidden group">
            {/* Top Bar of Camera Feed */}
            <div className="absolute top-0 left-0 w-full h-8 bg-white/90 backdrop-blur border-b border-slate-200 flex justify-between items-center px-4 font-mono text-[10px] text-slate-500 z-20 font-bold">
              <span>CAM-01 [MAIN_COURT]</span>
              <span>FOV: 120° | 60FPS</span>
            </div>

            {/* Main Image */}
            <img
              src="https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80"
              alt="Main Feed"
              className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity duration-700 filter contrast-[1.1]"
            />
            {/* Very light blue tint for lab feel */}
            <div className="absolute inset-0 bg-blue-50/10 mix-blend-multiply pointer-events-none" />

            {/* AI Bounding Box & Crosshair Animations */}
            <motion.div
              animate={{ x: [0, 20, -10, 0], y: [0, -15, 10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              className="absolute top-[30%] left-[40%] w-32 h-48 border-2 border-[#8ce600] bg-[#8ce600]/10 z-20 shadow-[0_0_15px_rgba(140,230,0,0.5)]"
            >
              <div className="absolute -top-6 left-[-2px] bg-[#8ce600] text-[#1a2b4c] font-mono text-[10px] px-1.5 py-0.5 font-bold tracking-wider">
                ID:P1 [98%]
              </div>
              <Crosshair className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#8ce600]" />
            </motion.div>

            {/* Live Data Overlay (Light) */}
            <div className="absolute bottom-4 left-4 font-mono text-xs text-slate-600 z-20 space-y-1 bg-white/90 p-3 border border-slate-200 shadow-lg backdrop-blur-sm font-bold">
              <div>
                &gt; VELOCITY :{" "}
                <span className="text-[#1a2b4c]">312.4 KM/H</span>
              </div>
              <div>
                &gt; STROKE_TYPE :{" "}
                <span className="text-[#1a2b4c]">CALCULATING...</span>
              </div>
              <div>
                &gt; COURT_POS :{" "}
                <span className="text-[#1a2b4c]">X:42 Y:88</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="workflow"
        className="py-20 px-6 max-w-[1400px] mx-auto border-t border-slate-200 relative"
      >
        <div className="flex items-center gap-4 mb-16">
          <Activity className="text-[#1a2b4c]" />
          <h2 className="text-2xl font-mono font-bold uppercase tracking-widest text-[#1a2b4c]">
            RALLY TRACK 사용 방법
          </h2>
          <div className="h-[1px] flex-1 bg-slate-200 ml-4" />
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-[28px] left-[15%] right-[15%] h-[2px] bg-slate-200 border-dashed border-t-2 border-slate-300 z-0" />

          {/* Step 1 */}
          <div className="relative z-10 flex flex-col items-center text-center group">
            <div className="w-14 h-14 bg-white border-2 border-slate-200 rounded-lg flex items-center justify-center mb-6 group-hover:border-[#6bba00] group-hover:shadow-[0_0_15px_rgba(140,230,0,0.3)] transition-all bg-clip-padding relative overflow-hidden">
              <Upload className="text-[#1a2b4c] group-hover:scale-110 transition-transform relative z-10" />
              <div className="absolute inset-0 bg-[#f2fde0] translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </div>
            <div className="bg-[#f2fde0] text-[#6bba00] font-mono text-[10px] font-bold px-2 py-1 border border-[#8ce600]/30 mb-3 tracking-widest">
              [SEQ.01] DATA_INPUT
            </div>
            <h3 className="text-lg font-black text-[#1a2b4c] mb-2">
              경기 영상 업로드
            </h3>
            <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-[250px]">
              스마트폰이나 카메라로 촬영한 배드민턴 경기 영상을 시스템에 바로
              업로드합니다.
            </p>
          </div>

          {/* Step 2 */}
          <div className="relative z-10 flex flex-col items-center text-center group">
            <div className="w-14 h-14 bg-white border-2 border-slate-200 rounded-lg flex items-center justify-center mb-6 group-hover:border-[#6bba00] group-hover:shadow-[0_0_15px_rgba(140,230,0,0.3)] transition-all bg-clip-padding relative overflow-hidden">
              <Cpu className="text-[#1a2b4c] group-hover:scale-110 transition-transform relative z-10" />
              <div className="absolute inset-0 bg-[#f2fde0] translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </div>
            <div className="bg-[#f2fde0] text-[#6bba00] font-mono text-[10px] font-bold px-2 py-1 border border-[#8ce600]/30 mb-3 tracking-widest">
              [SEQ.02] AI_PROCESSING
            </div>
            <h3 className="text-lg font-black text-[#1a2b4c] mb-2">
              엔진 비전 분석
            </h3>
            <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-[250px]">
              랠리 트랙 코어 엔진이 선수와 셔틀콕의 움직임을 프레임 단위로
              정밀하게 스캔합니다.
            </p>
          </div>

          {/* Step 3 */}
          <div className="relative z-10 flex flex-col items-center text-center group">
            <div className="w-14 h-14 bg-white border-2 border-slate-200 rounded-lg flex items-center justify-center mb-6 group-hover:border-[#6bba00] group-hover:shadow-[0_0_15px_rgba(140,230,0,0.3)] transition-all bg-clip-padding relative overflow-hidden">
              <BarChart3 className="text-[#1a2b4c] group-hover:scale-110 transition-transform relative z-10" />
              <div className="absolute inset-0 bg-[#f2fde0] translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </div>
            <div className="bg-[#f2fde0] text-[#6bba00] font-mono text-[10px] font-bold px-2 py-1 border border-[#8ce600]/30 mb-3 tracking-widest">
              [SEQ.03] RESULT_OUTPUT
            </div>
            <h3 className="text-lg font-black text-[#1a2b4c] mb-2">
              분석 리포트 확인
            </h3>
            <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-[250px]">
              자동 생성된 하이라이트 영상과 히트맵, 산점도 등 심층 데이터
              리포트를 확인하세요.
            </p>
          </div>
        </div>
      </section>

      {/* Multi-Camera Feeds Section */}
      <section
        id="feeds"
        className="py-20 px-6 max-w-[1400px] mx-auto border-t border-slate-200"
      >
        <div className="flex items-center gap-4 mb-10">
          <Database className="text-[#1a2b4c]" />
          <h2 className="text-2xl font-mono font-bold uppercase tracking-widest text-[#1a2b4c]">
            다각도 분석 화면
          </h2>
          <div className="h-[1px] flex-1 bg-slate-200 ml-4" />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Feed 1 */}
          <div className="relative aspect-video border border-slate-200 bg-slate-100 overflow-hidden group shadow-sm">
            <div className="absolute top-2 left-2 z-10 bg-white/90 text-[#1a2b4c] font-mono font-bold text-[10px] px-2 py-0.5 border border-slate-200 shadow-sm">
              CAM-02: HEATMAP
            </div>
            <img
              src="https://images.unsplash.com/photo-1613918431703-e60802773bba?auto=format&fit=crop&q=80"
              alt="Feed 2"
              className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all duration-500"
            />
            {/* Heatmap Simulation Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,0,0,0.5)_0%,transparent_50%)] mix-blend-multiply" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Maximize className="text-white drop-shadow-md w-10 h-10" />
            </div>
          </div>

          {/* Feed 2 (Mascot / 3D Render Placeholder) */}
          <div className="relative aspect-video border border-slate-200 bg-white overflow-hidden flex items-center justify-center group shadow-sm">
            <div className="absolute top-2 left-2 z-10 bg-white/90 text-[#1a2b4c] font-mono font-bold text-[10px] px-2 py-0.5 border border-slate-200 shadow-sm">
              CAM-03: 3D_TRACKING
            </div>

            {/* Light Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />

            <img
              src="/RallyTrack_Mascot.svg"
              alt="Mascot"
              className="h-3/4 w-auto relative z-10 drop-shadow-xl animate-[pulse_4s_ease-in-out_infinite]"
            />
          </div>

          {/* Feed 3 */}
          <div className="relative aspect-video border border-slate-200 bg-slate-100 overflow-hidden group shadow-sm">
            <div className="absolute top-2 left-2 z-10 bg-white/90 text-[#1a2b4c] font-mono font-bold text-[10px] px-2 py-0.5 border border-slate-200 shadow-sm">
              CAM-04: SHUTTLE_POS
            </div>
            <img
              src="https://images.unsplash.com/photo-1622279457486-62dcc4a631d6?auto=format&fit=crop&q=80"
              alt="Feed 3"
              className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all duration-500"
            />
            {/* Scatter Simulation */}
            <div className="absolute z-20 inset-0 pointer-events-none p-6">
              <div className="absolute top-1/4 left-1/3 w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_8px_blue]" />
              <div className="absolute top-1/2 left-2/3 w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_8px_blue]" />
              <div className="absolute bottom-1/3 left-1/2 w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_8px_red]" />
            </div>
            <div className="absolute bottom-2 right-2 text-white bg-[#1a2b4c] px-2 py-0.5 font-mono text-[10px] font-bold shadow-sm">
              P_COUNT: 03
            </div>
          </div>
        </div>
      </section>

      {/* Surveillance Terminal (Features - Light Mode) */}
      <section id="features" className="py-20 px-6 max-w-[1400px] mx-auto">
        <div className="border border-slate-200 bg-white shadow-lg p-8 lg:p-12 relative overflow-hidden">
          {/* Terminal Deco */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#8ce600] to-transparent opacity-80" />
          <TerminalSquare className="text-slate-300 mb-8 w-12 h-12" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                id: "SYS.01",
                title: "자세 및 타구 분석",
                desc: "프레임 단위로 선수의 관절 위치와 자세를 인식하여 스트로크 종류를 분석.",
              },
              {
                id: "SYS.02",
                title: "하이라이트 생성",
                desc: "주요 득점/실점 시퀀스 자동 감지 및 타임라인 클립 추출.",
              },
              {
                id: "SYS.03",
                title: "코트 분석",
                desc: "코트 점유율 히트맵 및 스매시 타격 지점 산점도 매핑.",
              },
              {
                id: "SYS.04",
                title: "AI_코칭",
                desc: "수집된 빅데이터 기반 약점 분석 및 맞춤형 전술 피드백 생성.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group border-l-2 border-slate-100 pl-6 hover:border-[#6bba00] transition-colors"
              >
                <div className="text-[#6bba00] font-mono text-xs font-bold mb-2">
                  [{feature.id}]
                </div>
                <h3 className="text-xl font-black text-[#1a2b4c] mb-3 uppercase tracking-wide">
                  {feature.title}
                </h3>
                <p className="text-slate-500 text-sm font-mono leading-relaxed font-medium group-hover:text-slate-700 transition-colors">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer (Light Mode) */}
      <footer className="border-t border-slate-200 bg-white py-8 mt-20">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center font-mono text-xs font-bold text-slate-400">
          <div className="flex items-center gap-2 mb-4 md:mb-0 text-slate-500">
            <Activity size={14} className="text-[#6bba00]" />
            <span>RALLYTRACK_SYSTEM v2.0.26</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[#1a2b4c] transition-colors">
              ENCRYPTION_POLICY
            </a>
            <a href="#" className="hover:text-[#1a2b4c] transition-colors">
              USER_TERMS
            </a>
            <span>© 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
