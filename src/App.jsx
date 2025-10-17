import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';  
import { RoundStepProvider } from './contexts/RoundStepContext.jsx';

import LoginPage from './pages/UserPage/LoginPage.jsx';
import QuizPage from './pages/UserPage/QuizPage.jsx';
import QuizResultPage from './pages/UserPage/QuizResultPage.jsx';
import AIDiscussionPage from './pages/UserPage/AIDiscussionPage.jsx';
import DiscussionResultPage from './pages/UserPage/DiscussionResultPage.jsx';
import SelectAvatarPage from './pages/UserPage/SelectAvatarPage.jsx';
import VideoPage from './pages/UserPage/VideoPage.jsx';
import EndPage from './pages/UserPage/EndPage.jsx';
import RoundIndicatorPage from './pages/UserPage/RoundIndicatorPage.jsx';
import TestApi from "./pages/TestApi.jsx";
import OnBoardingPage from './pages/UserPage/OnBoardingPage.jsx';
import SlideRoute from './routes/SlideRoute.jsx';
import FinalResultPage from './pages/UserPage/FinalResultPage.jsx';
import LoadResultPage from './pages/UserPage/LoadResultPage.jsx';
import DonorsOnboardingPage from './pages/UserPage/DonorsOnboardingPage.jsx';

import AdminSessionPage from './pages/AdminPage/SessionPage.jsx';
import GamePage from './pages/UserPage/GamePage.jsx';
import AfterSlidePage from './pages/UserPage/AfterSlidePage.jsx';


import AdminRoundIndicatorPage from './pages/AdminPage/AdminRoundIndicatorPage.jsx';
import AdminAIDiscussionPage from './pages/AdminPage/AdminAIDiscussionPage.jsx';
import AdminDiscussionResultPage from './pages/AdminPage/AdminDiscussionResultPage.jsx';
import AdminQuizPage from './pages/AdminPage/AdminQuizPage.jsx';
import AdminGamePage from './pages/AdminPage/AdminGamePage.jsx';

function RoundStepLayout() {
  return (
    <RoundStepProvider>
      <Outlet />
    </RoundStepProvider>
  );
}

function App() {
  return (
    <RoundStepProvider>
    <UserProvider> {/* 전역 사용자 상태 적용 */}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />

          <Route path="/user/quizResult" element={<QuizResultPage />} />{/* 미사용 */}

          <Route path="/user/selectAvatar" element={<SelectAvatarPage />} />{/* 수강자 */}
          <Route path="/user/quiz" element={<QuizPage />} />{/* 수강자 */}
          <Route path="/user/game" element={<GamePage/>}/>{/* 수강자 */}
          <Route path="/user/aiDiscussion" element={<AIDiscussionPage />} />{/* 수강자 */}
          <Route path="/user/discussionResult" element={<DiscussionResultPage />} />{/* 수강자 */}
          <Route path="/user/finalResult" element={<FinalResultPage />} />{/* 수강자 */}
          <Route path="/user/loadResult" element={<LoadResultPage />} />{/* 수강자 */}
          <Route path="/user/roundIndicator" element={<RoundIndicatorPage />} />{/* 수강자 (신규?) */}


          <Route path="/admin/session" element={<AdminSessionPage />} />{/* 강의자용 로그인 */}
          <Route path="/admin/onboarding" element={<OnBoardingPage/>} /> {/* 강의자 */}
          <Route path="/admin/donorsOnboarding" element={<DonorsOnboardingPage/>} />{/* 강의자 */}
          <Route path="/admin/slide" element={<SlideRoute />} />{/* 강의자 */}
          <Route path="/admin/afterSlide" element={<AfterSlidePage/>}/>{/* 강의자 */}
          <Route path="/admin/quiz" element={<AdminQuizPage />} />{/* 강의자용 가이드(신규) */}
          <Route path="/admin/game" element={<AdminGamePage/>}/>{/* 강의자용 가이드(신규) */}
          <Route path="/admin/roundIndicator" element={<AdminRoundIndicatorPage />} />{/* 강의자용 가이드 (신규?) */}
          <Route path="/admin/video" element={<VideoPage />} />{/* 강의자 */}
          <Route path="/admin/aiDiscussion" element={<AdminAIDiscussionPage />} />{/* 강의자용 신규 */}
          <Route path="/admin/discussionResult" element={<AdminDiscussionResultPage />} />{/* 강의자용 신규 */}

          <Route path="/admin/end" element={<EndPage />} />{/* 전체 */}
          <Route path="/user/end" element={<EndPage />} />{/* 전체 */}

          <Route path="/test" element={<TestApi />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
    </RoundStepProvider>
  );
}

export default App;