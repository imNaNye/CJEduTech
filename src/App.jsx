import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';  

import LoginPage from './pages/UserPage/LoginPage.jsx';
import QuizPage from './pages/UserPage/QuizPage.jsx';
import QuizResultPage from './pages/UserPage/QuizResultPage.jsx';
import AIDiscussionPage from './pages/UserPage/AIDiscussionPage.jsx';
import DiscussionResultPage from './pages/UserPage/DiscussionResultPage.jsx';
import SelectAvatarPage from './pages/UserPage/SelectAvatarPage.jsx';
import SlidePage from './pages/UserPage/SildePage.jsx';
import VideoPage from './pages/UserPage/VideoPage.jsx';
import EndPage from './pages/UserPage/EndPage.jsx';

import AdminSessionPage from './pages/AdminPage/SessionPage.jsx';

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