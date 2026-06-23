import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  resetSecret: process.env.JWT_RESET_SECRET,
  expiresIn: '7d',
  refreshExpiresIn: '30d',
}));
