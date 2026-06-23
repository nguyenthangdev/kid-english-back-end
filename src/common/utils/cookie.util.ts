import { CookieOptions } from 'express';
import ms from 'ms';

export const getAuthCookieOptions = (time: '1h' | '14d'): CookieOptions => {
  const maxAge = ms(time);

  return {
    maxAge,
    httpOnly: true, // Bảo vệ khỏi XSS
    secure: process.env.NODE_ENV === 'production', // Chỉ gửi qua HTTPS khi deploy
    sameSite: 'lax', // Hoặc 'none' nếu gọi cross-origin khác domain
    path: '/',
  };
};

export const parseCookies = (cookieString?: string): Record<string, string> => {
  if (!cookieString) return {};
  return cookieString.split(';').reduce((res, item) => {
    const data = item.trim().split('=');
    return { ...res, [data[0]]: data[1] };
  }, {});
};
