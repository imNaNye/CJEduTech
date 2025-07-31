import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';  

import LoginPage from './pages/UserPage/LoginPage';
import QuizPage from './pages/UserPage/QuizPage';
import QuizResultPage from './pages/UserPage/QuizResultPage';
import AIDiscussionPage from './pages/UserPage/AIDiscussionPage';
import DiscussionResultPage from './pages/UserPage/DiscussionResultPage';
import SelectAvatarPage from './pages/UserPage/SelectAvatarPage';
import SlidePage from './pages/UserPage/SildePage';
import VideoPage from './pages/UserPage/VideoPage';
import EndPage from './pages/UserPage/EndPage';

import AdminSessionPage from './pages/AdminPage/SessionPage';

function App() {
  return (
    <UserProvider> {/* 전역 사용자 상태 적용 */}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/user/quiz" element={<QuizPage />} />
          <Route path="/user/quizResult" element={<QuizResultPage />} />
          <Route path="/user/aiDiscussion" element={<AIDiscussionPage />} />
          <Route path="/user/discussionResult" element={<DiscussionResultPage />} />
          <Route path="/user/selectAvatar" element={<SelectAvatarPage />} />
          <Route path="/user/slide" element={<SlidePage />} />
          <Route path="/user/video" element={<VideoPage />} />
          <Route path="/user/end" element={<EndPage />} />
          <Route path="/admin/session" element={<AdminSessionPage />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;