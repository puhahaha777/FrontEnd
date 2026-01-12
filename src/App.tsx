import { useState } from 'react';
import { LoginPage } from './components/LoginPage';
import { OnboardingPage } from './components/OnboardingPage';
import { DashboardPage } from './components/DashboardPage';
import { VideoPlayerPage } from './components/VideoPlayerPage';
import { AnalysisReportPage } from './components/AnalysisReportPage';
import { AccountPage } from './components/AccountPage';

type Page = 'onboarding' | 'login' | 'dashboard' | 'video' | 'report' | 'account';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('onboarding');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setSelectedVideoId(null);
    setCurrentPage('onboarding');
  };

  const handleViewVideo = (videoId: string) => {
    setSelectedVideoId(videoId);
    setCurrentPage('video');
  };

  const handleViewReport = (videoId: string) => {
    setSelectedVideoId(videoId);
    setCurrentPage('report');
  };

  const handleBackToDashboard = () => {
    setCurrentPage('dashboard');
  };

  const handleNavigate = (page: 'dashboard' | 'video' | 'report' | 'account') => {
    setCurrentPage(page);
  };

  const handleJumpToVideo = (time: number) => {
    // In real implementation, this would jump to specific time in video
    setCurrentPage('video');
  };

  return (
    <div className="size-full">
      {currentPage === 'onboarding' && (
        <OnboardingPage onGetStarted={() => setCurrentPage('login')} />
      )}

      {currentPage === 'login' && <LoginPage onLogin={handleLogin} />}

      {currentPage === 'dashboard' && (
        <DashboardPage
          onLogout={handleLogout}
          onViewVideo={handleViewVideo}
          onViewReport={handleViewReport}
          onNavigate={handleNavigate}
          hasSelectedVideo={!!selectedVideoId}
        />
      )}

      {currentPage === 'video' && selectedVideoId && (
        <VideoPlayerPage
          videoId={selectedVideoId}
          onBack={handleBackToDashboard}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )}

      {currentPage === 'report' && selectedVideoId && (
        <AnalysisReportPage
          videoId={selectedVideoId}
          onBack={handleBackToDashboard}
          onJumpToVideo={handleJumpToVideo}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )}

      {currentPage === 'account' && (
        <AccountPage
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          hasSelectedVideo={!!selectedVideoId}
        />
      )}
    </div>
  );
}