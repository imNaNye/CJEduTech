// src/contexts/UserContext.jsx
import { createContext, useContext, useState } from 'react';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [nickname, setNickname] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  return (
    <UserContext.Provider value={{ nickname, setNickname, avatarUrl, setAvatarUrl }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}