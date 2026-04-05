// src/components/Footer.tsx

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-6 mt-auto">
      <div className="max-w-[1600px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 font-mono text-xs font-bold text-slate-400">
        {/* 좌측: 서비스명 + 설명 */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="text-[#6bba00]">◆</span>
            <span>RALLYTRACK AI</span>
          </div>
          <span className="hidden sm:inline text-slate-200">|</span>
          <span className="text-slate-400 text-center sm:text-left">
            배드민턴 경기 분석 서비스 — Powered by SuperPoint SLAM
          </span>
        </div>

        {/* 우측: 링크 + 저작권 */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400">
          <a href="#" className="hover:text-[#1a2b4c] transition-colors uppercase tracking-widest">
            이용약관
          </a>
          <span className="text-slate-200">·</span>
          <a href="#" className="hover:text-[#1a2b4c] transition-colors uppercase tracking-widest">
            개인정보처리방침
          </a>
          <span className="text-slate-200">·</span>
          <a href="#" className="hover:text-[#1a2b4c] transition-colors uppercase tracking-widest">
            문의하기
          </a>
          <span className="text-slate-200">·</span>
          <span className="text-slate-400">© 2026 RallyTrack. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}