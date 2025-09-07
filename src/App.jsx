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

import AdminSessionPage from './pages/AdminPage/SessionPage.jsx';

function RoundStepLayout() {
  return (
    <RoundStepProvider>
      <Outlet />
    </RoundStepProvider>
  );
}

function App() {
  return (
    <UserProvider> {/* 전역 사용자 상태 적용 */}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/user/onboarding" element={<OnBoardingPage/>} />
          <Route path="/user/selectAvatar" element={<SelectAvatarPage />} />
          <Route element={<RoundStepLayout />}>
            <Route path="/user/slide" element={<SlideRoute />} />
            <Route path="/user/roundIndicator" element={<RoundIndicatorPage />} />
            <Route path="/user/quiz" element={<QuizPage />} />
            <Route path="/user/quizResult" element={<QuizResultPage />} />
            <Route path="/user/video" element={<VideoPage />} />
            <Route path="/user/aiDiscussion" element={<AIDiscussionPage />} />
            <Route path="/user/discussionResult" element={<DiscussionResultPage />} />
          </Route>
          <Route path="/user/finalResult" element={<FinalResultPage />} />
          <Route path="/user/loadResult" element={<LoadResultPage />} />

          <Route path="/user/end" element={<EndPage />} />
          <Route path="/admin/session" element={<AdminSessionPage />} />
          <Route path="/test" element={<TestApi />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;