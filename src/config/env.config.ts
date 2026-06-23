import * as Joi from 'joi';

/**
 * Joi validation schema for environment variables.
 * Import this into ConfigModule.forRoot({ validationSchema }) in AppModule.
 */
export const envValidationSchema = Joi.object({
  // Server
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),

  // Database
  POSTGRES_URI: Joi.string().required(),
  // Auth
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_RESET_SECRET: Joi.string().min(16).required(),

  // CORS
  FE_URL: Joi.string().uri().allow('').default(''),

  // Rate limiting
  THROTTLE_TTL: Joi.number().default(600000),
  THROTTLE_LIMIT: Joi.number().default(100),

  // Redis
  REDIS_URL: Joi.string()
    .uri({ scheme: ['redis', 'rediss'] })
    .default('redis://localhost:6379'),

  // Admin seed
  EMAIL_ADMIN: Joi.string().email().required(),
  PASSWORD_ADMIN: Joi.string().min(8).required(),
});
