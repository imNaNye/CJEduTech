import { http } from '@/lib/http' ;
export const authApi = {
    login: ({nickname, password}) => http.post('/api/auth/login', { nickname, password }),
    me: () => http.get('/api/auth/me'),
    logout: () => http.post('/api/auth/logout', {}),
};