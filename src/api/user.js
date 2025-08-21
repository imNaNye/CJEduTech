import { http } from '@/lib/http';

export const userApi = {
    me: () => http.get('/api/user/me'),
    setAvatar: (avatar) => http.post('/api/user/avatar', { avatar }),
};