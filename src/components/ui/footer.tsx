export function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white mt-auto">
      <div className="max-w-[1440px] mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-3">

        {/* 좌측: 브랜드 */}
        <div className="flex items-center gap-3">
          <img src="/RallyTrack.svg" alt="RallyTrack" className="h-6 w-auto opacity-60" />
          <span className="text-xs text-slate-400 hidden sm:block">
            배드민턴 경기 AI 분석 서비스
          </span>
        </div>

        {/* 우측: 링크 */}
        <div className="flex items-center gap-5 text-xs text-slate-400">
          <a href="#" className="hover:text-slate-600 transition-colors">이용약관</a>
          <a href="#" className="hover:text-slate-600 transition-colors">개인정보처리방침</a>
          <a href="#" className="hover:text-slate-600 transition-colors">문의하기</a>
          <span className="text-slate-300 hidden sm:block">©&nbsp;2026 RallyTrack</span>
        </div>

      </div>
    </footer>
  );
}
