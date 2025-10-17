// src/contexts/UserContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [nickname, setNickname] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const storedNickname = localStorage.getItem('nickname');
    const storedAvatarUrl = localStorage.getItem('avatarUrl');
    if (storedNickname) setNickname(storedNickname);
    if (storedAvatarUrl) setAvatarUrl(storedAvatarUrl);
    if (isAdmin) setNickname('admin');
  }, []);

  return (
    <UserContext.Provider value={{ nickname, setNickname, avatarUrl, setAvatarUrl, isAdmin, setIsAdmin }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}