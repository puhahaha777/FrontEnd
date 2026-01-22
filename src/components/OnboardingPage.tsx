import { Activity, Video, TrendingUp, Award } from 'lucide-react';

interface OnboardingPageProps {
  onGetStarted: () => void;
}

export function OnboardingPage({ onGetStarted }: OnboardingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
       <header className="h-16 flex items-center px-6 bg-white border-b border-gray-200 sticky top-0 z-50">
  <div className="container mx-auto px-6">
    <div className="flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-2 text-blue-600 font-bold italic tracking-tight">
        <span className="logo_img flex items-center translate-y-6">
          <img
            src="/RallyTrack.svg"
            alt="RallyTrack"
            className="h-24 w-auto"
          />
        </span>
        </div>
        </div>
        </div>
        <button
          onClick={onGetStarted}
            className="px-7 py-4 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap"
        >
          로그인
        </button>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-6xl mb-6 text-gray-900">
          AI 기반 배드민턴
          <br />
          경기 분석 플랫폼
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          영상을 업로드하면 AI가 자동으로 움직임을 분석하고
          <br />
          실력 향상을 위한 인사이트를 제공합니다
        </p>
        <button
          onClick={onGetStarted}
          className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg"
        >
          시작하기
        </button>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
              <Video className="size-7 text-blue-600" />
            </div>
            <h3 className="text-2xl mb-4">영상 업로드</h3>
            <p className="text-gray-600">
              경기 영상을 업로드하면 AI가 자동으로 선수와 셔틀콕을 인식하고
              추적합니다
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
              <TrendingUp className="size-7 text-indigo-600" />
            </div>
            <h3 className="text-2xl mb-4">상세 분석</h3>
            <p className="text-gray-600">
              히트맵, 이동 거리, 스트로크 분석 등 다양한 지표로 경기를
              분석합니다
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
              <Award className="size-7 text-purple-600" />
            </div>
            <h3 className="text-2xl mb-4">AI 코칭</h3>
            <p className="text-gray-600">
              AI 코치가 당신의 플레이를 분석하고 개선점을 제안합니다
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-16 text-white">
          <h2 className="text-4xl mb-6">지금 바로 시작하세요</h2>
          <p className="text-xl mb-8 opacity-90">
            무료로 첫 영상을 분석해보세요
          </p>
          <button
            onClick={onGetStarted}
            className="px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors text-lg"
          >
            무료로 시작하기
          </button>
        </div>
      </section>
    </div>
  );
}
