// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/UserPage/LoginPage';
import QuizPage from './pages/UserPage/QuizPage';
import AIDiscussionPage from './pages/UserPage/AIDiscussionPage';
import DiscussionResultPage from './pages/UserPage/DiscussionResultPage';
import SelectAvatarPage from './pages/UserPage/SelectAvatarPage';
import SlidePage from './pages/UserPage/SildePage';
import VideoPage from './pages/UserPage/VideoPage';
import AdminSessionPage from './pages/AdminPage/SessionPage';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/user/quiz" element={<QuizPage />} />
        <Route path="/user/aiDiscussion" element={<AIDiscussionPage />} />
        <Route path="/user/discussionResult" element={<DiscussionResultPage />} />
        <Route path="/user/selectAvatar" element={<SelectAvatarPage />} />
        <Route path="/user/slide" element={<SlidePage />} />
        <Route path="/user/video" element={<VideoPage />} />
        <Route path="/admin/session" element={<AdminSessionPage/>} />
        {/* 추가 페이지 경로들 */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;