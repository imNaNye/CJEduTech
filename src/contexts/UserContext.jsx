// src/contexts/UserContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [nickname, setNickname] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    const storedNickname = localStorage.getItem('nickname');
    const storedAvatarUrl = localStorage.getItem('avatarUrl');
    if (storedNickname) setNickname(storedNickname);
    if (storedAvatarUrl) setAvatarUrl(storedAvatarUrl);
  }, []);

  return (
    <UserContext.Provider value={{ nickname, setNickname, avatarUrl, setAvatarUrl }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}