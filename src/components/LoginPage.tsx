import { useState } from 'react';
import { Activity } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login
    onLogin();
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 p-12 flex-col justify-between">
        <div className="flex items-center gap-3 text-white">
          <Activity className="size-10" />
          <span className="text-2xl">BadmintonAI</span>
        </div>
        <div className="text-white">
          <h1 className="text-5xl mb-6">
            배드민턴 실력을
            <br />
            AI로 분석하세요
          </h1>
          <p className="text-xl opacity-90">
            객체 인식 기반 모션 분석으로 당신의 경기를 한 단계 업그레이드
          </p>
        </div>
        <div className="text-white/70 text-sm">
          © 2026 BadmintonAI. All rights reserved.
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex items-center justify-center gap-3 text-blue-600">
            <Activity className="size-8" />
            <span className="text-xl">BadmintonAI</span>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-3xl mb-2">
              {isSignUp ? '회원가입' : '로그인'}
            </h2>
            <p className="text-gray-600 mb-8">
              {isSignUp
                ? '새로운 계정을 만들어 시작하세요'
                : '계정에 로그인하세요'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="block text-sm mb-2 text-gray-700">
                    이름
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="홍길동"
                    required={isSignUp}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm mb-2 text-gray-700">
                  이메일
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="example@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-gray-700">
                  비밀번호
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                  required
                />
              </div>

              {!isSignUp && (
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-gray-600">로그인 상태 유지</span>
                  </label>
                  <button
                    type="button"
                    className="text-blue-600 hover:underline"
                  >
                    비밀번호 찾기
                  </button>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isSignUp ? '가입하기' : '로그인'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-gray-600"
              >
                {isSignUp ? (
                  <>
                    이미 계정이 있으신가요?{' '}
                    <span className="text-blue-600 hover:underline">
                      로그인
                    </span>
                  </>
                ) : (
                  <>
                    계정이 없으신가요?{' '}
                    <span className="text-blue-600 hover:underline">
                      회원가입
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
