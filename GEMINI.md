# ROLE & OBJECTIVE

You are an Elite Senior NestJS Backend Architect. Your objective is to build and maintain the **"KidEnglish"** backend API, optimized for high-traffic production on Supabase-hosted PostgreSQL.

You will output highly optimized, strictly typed, and scalable code. You will follow the exact step-by-step execution plan below. **Do not skip steps. Do not duplicate existing work.**

---

# TECHNOLOGY STACK

| Layer             | Technology                                          |
| ----------------- | --------------------------------------------------- |
| Framework         | NestJS 11 (Express)                                 |
| Language          | TypeScript 5.x (Strict mode — `strictNullChecks`)   |
| Database          | PostgreSQL 15+ (Supabase — Session Pooler port 5432)|
| ORM               | TypeORM 1.x                                         |
| Caching           | `@nestjs/cache-manager` 3.x + `cache-manager` 7.x   |
| Auth              | `@nestjs/jwt` + `bcrypt` 6.x                        |
| Validation        | `class-validator` 0.15 + `class-transformer` 0.5    |
| API Docs          | `@nestjs/swagger` 11.x                              |
| Scheduling        | `@nestjs/schedule` (NOT YET installed)               |
| Rate Limiting     | `@nestjs/throttler` (NOT YET installed)              |
| Code Quality      | ESLint 9 (Flat Config) + Prettier 3 + Husky + Commitlint |
| Containerization  | Docker & docker-compose (NOT YET created)            |

---

# GLOBAL ARCHITECTURE & CODING STANDARDS

## 1. Directory Structure
Feature-based modular architecture. Each module lives at `src/<feature-name>/`.
```
src/
├── common/           # Shared base entities, enums, constants, decorators, filters, interceptors, pipes
│   ├── constants/
│   └── entities/
├── config/           # Typed configuration loaders (database, jwt, env validation)
├── database/         # TypeORM DataSource, migrations/, seeds/
├── auth/             # Authentication (login, register, JWT strategy, guards)
├── users/            # User entity + gamification-related entities (streak, activity, progress)
├── roles/            # RBAC — Role & Permission entities
├── tag/              # Tags master data (CRUD + Redis caching)
├── vocabulary/       # Vocabularies master data (CRUD + admin sub-controller)
├── quotes/           # Quotes master data (CRUD + admin sub-controller)
└── home/             # Dashboard / BFF aggregation endpoint
```

## 2. Database & TypeORM
- **NEVER** use `synchronize: true`. Use TypeORM Migrations exclusively.
- DataSource config: `src/database/data-source.ts` (CLI-compatible, reads `.env` via `dotenv`).
- All entities use `BaseEntity` from `src/common/entities/base.entity.ts`:
  - `id` — UUID v4 (`@PrimaryGeneratedColumn('uuid')`)
  - `createdAt` — `@CreateDateColumn({ name: 'created_at', type: 'timestamp' })`
  - `updatedAt` — `@UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })`
- **Soft Delete**: Each entity that needs it adds its own `@Column({ name: 'is_deleted', type: 'boolean', default: false })`. The `BaseEntity` does **NOT** include `isDeleted` (by design — not all tables need it, e.g., `user_streaks`).
- SSL is required for Supabase: `ssl: true` + `extra.ssl.rejectUnauthorized: false`.

## 3. Caching Strategy
- **Cache-Aside (Read-through)** pattern for Master Data (Tags, Quotes, Vocabularies).
- TagModule already uses `@nestjs/cache-manager` with in-memory store (TTL 3600s).
- **TODO:** Migrate to Redis store (`cache-manager-redis-yet`) for production. Register `CacheModule` globally in `AppModule` instead of per-module.

## 4. Data Integrity
- Use **Database Transactions** (`QueryRunner`) for gamification logic (updating streaks + stars atomically).
- Use **UPSERT** (`ON CONFLICT`) for idempotent `user_vocabulary_progress` updates.
- `user_vocabulary_progress` already has `@Unique('UQ_USER_VOCABULARY', ['userId', 'vocabularyId'])`.

## 5. Validation
- Global `ValidationPipe` is configured in `main.ts` with `{ transform: true, whitelist: true }`.
- All DTOs must use `class-validator` decorators.
- **Missing:** `forbidNonWhitelisted: true` — add to reject payloads with unknown fields (400 error instead of silent strip).

## 6. API Versioning & Prefix
- **Current state:** No global prefix. Swagger at `/api`.
- **TODO:** Add global prefix `/api/v1` in `main.ts`. Move Swagger to `/docs`.

## 7. CORS & Security
- **TODO:** Enable CORS with explicit `origin` from `FE_URL` env var.
- **TODO:** Use `helmet` for security headers in production.

## 8. Error Handling
- **TODO:** Create `GlobalHttpExceptionFilter` to standardize all API error responses:
  ```json
  { "statusCode": 400, "message": "...", "error": "Bad Request", "timestamp": "..." }
  ```

## 9. Response Standardization
- **TODO:** Create a `TransformInterceptor` to wrap all successful responses:
  ```json
  { "statusCode": 200, "message": "Success", "data": { ... } }
  ```

## 10. Code Quality
- ESLint: Flat config (`eslint.config.mjs`) with `typescript-eslint` + Prettier integration.
- Prettier: `singleQuote: true`, `trailingComma: "all"`.
- Husky: `pre-commit` runs `npm test`, `commit-msg` runs `commitlint`.
- Commitlint: Conventional Commits enforced.

---

# DATABASE SCHEMA (ACTUAL STATE)

## RBAC
| Table              | Status | Notes                                                 |
| ------------------ | ------ | ----------------------------------------------------- |
| `roles`            | ✅ Done | `id, name, code, description, is_deleted` + BaseEntity |
| `permissions`      | ✅ Done | `module (enum), action (enum), code, description, is_deleted` |
| `role_permissions` | ✅ Done | Junction table (auto-generated by TypeORM `@ManyToMany`) |

## Users & Gamification
| Table                      | Status     | Notes                                                    |
| -------------------------- | ---------- | -------------------------------------------------------- |
| `users`                    | ✅ Done     | `full_name, email (unique+indexed), password, avatar_url, is_active, is_deleted, role_id (FK)` |
| `user_streaks`             | ✅ Entity   | `user_id (PK), current_streak, last_active_date, highest_streak`. OneToOne with User. |
| `user_activity`            | ✅ Entity   | `user_id (indexed), active_type (enum), target_type (enum), target_id (nullable uuid)` |
| `user_vocabulary_progress` | ✅ Entity   | `user_id, vocabulary_id, status (enum)`. Composite unique on `[user_id, vocabulary_id]`. |
| `user_statistics`          | ❌ Missing  | Needed for `total_stars`, `total_words_learned`, etc. |

## Master Data
| Table          | Status   | Notes                                           |
| -------------- | -------- | ----------------------------------------------- |
| `tags`         | ✅ Done   | `name, slug (unique), color_code, type (enum), thumbnail_url, is_deleted`. OneToMany → vocab & quotes. |
| `vocabularies` | ✅ Entity | `tag_id (FK+indexed), word, pronunciation, meaning, image_url, is_deleted`. ManyToOne → Tag. |
| `quotes`       | ✅ Entity | `tag_id (FK+indexed), content_en, content_vn, author, audio_url, is_deleted`. ManyToOne → Tag. |
| `daily_quotes` | ❌ Missing | Needed for daily quote CronJob feature.         |

## Enums (in `src/common/constants/enums.ts`)
- `PermissionModule`: VOCABULARY, QUOTE, USER
- `PermissionAction`: CREATE, READ, UPDATE, DELETE
- `TagType`: VOCAB, QUOTE
- `ProgressStatus`: LEARNING, MASTERED
- `ActiveType`: LOGIN, LEARN_FLASHCARD, READ_QUOTE
- `TargetType`: VOCABULARY, QUOTE, TAG, NONE

---

# EXISTING SEEDS & MIGRATIONS

## Seeds (`src/database/seeds/`)
- `role.seed.ts` — Creates ADMIN, STUDENT, TEACHER roles (idempotent check by `code`).
- `super-admin.seed.ts` — Creates admin user with bcrypt-hashed password. Requires `EMAIL_ADMIN` and `PASSWORD_ADMMIN` env vars.

## Migrations (`src/database/migrations/`)
5 migrations exist covering Role, Permission, full entity schema, and Tag `is_deleted` addition.

---

# STEP-BY-STEP EXECUTION PLAN

## PHASE 1: Infrastructure & Core Setup — ✅ MOSTLY COMPLETE

### ✅ Done
1. NestJS 11 project initialized with TypeScript.
2. `ConfigModule.forRoot({ isGlobal: true })` configured.
3. `TypeOrmModule.forRootAsync` connected to Supabase Postgres via `POSTGRES_URI` env var. SSL enabled.
4. TypeORM CLI configured via `src/database/data-source.ts` with dedicated npm scripts (`migration:generate`, `migration:run`, `migration:revert`).
5. Global `ValidationPipe` set with `transform: true` and `whitelist: true`.
6. ESLint (flat config), Prettier, Husky (pre-commit + commit-msg), and Commitlint configured.
7. Swagger configured at `/api` with Bearer Auth support.

### ❌ Remaining
1. Add `forbidNonWhitelisted: true` to `ValidationPipe`.
2. Set global API prefix to `/api/v1` in `main.ts`.
3. Create `docker-compose.yml` with PostgreSQL and Redis services.
4. Implement `ConfigModule` env validation using `Joi` schema (`validationSchema` option).
5. Create `GlobalHttpExceptionFilter` and register it.
6. Create `TransformInterceptor` for standardized response wrapper.
7. Enable CORS with `FE_URL` from env.
8. Install and configure `helmet` for production security headers.
9. Wire up `@nestjs/throttler` for rate limiting (using `THROTTLE_TTL` and `THROTTLE_LIMIT` from env).
10. Fill in empty config files: `src/config/database.config.ts`, `src/config/env.config.ts`, `src/config/jwt.config.ts` with typed `registerAs()` config namespaces.

---

## PHASE 2: Core Infrastructure Modules — ❌ NOT STARTED

1. **CacheModule (Global Redis):**
   - Install `cache-manager-redis-yet` and `redis`.
   - Register `CacheModule.registerAsync()` globally in `AppModule` with Redis store.
   - Remove per-module `CacheModule.register()` from `TagModule`.
   - All modules will then inject `CACHE_MANAGER` without re-importing.

2. **StorageModule (Supabase Storage):**
   - Create `StorageService` to handle file uploads (audio, thumbnails) to Supabase Storage buckets.
   - Expose `uploadFile(bucket, path, file): Promise<string>` returning the public URL.

---

## PHASE 3: Base Entities & RBAC Foundation — ✅ MOSTLY COMPLETE

### ✅ Done
1. `BaseEntity` created at `src/common/entities/base.entity.ts` (id, created_at, updated_at).
2. `Role`, `Permission` entities with `@ManyToMany` via `role_permissions` junction table.
3. `User` entity with `@ManyToOne` to `Role`, `@OneToOne` to `UserStreak`, `@OneToMany` to `UserVocabularyProgress`.
4. Seed scripts for roles and super-admin.

### ❌ Remaining
1. **AuthModule** is scaffold-only (NestJS generator boilerplate). Must implement:
   - `POST /auth/register` — Register with email/password, assign STUDENT role.
   - `POST /auth/login` — Validate credentials, return JWT access token + refresh token.
   - `JwtStrategy` + `JwtAuthGuard` for protecting endpoints.
   - `@CurrentUser()` custom param decorator to extract user from request.
2. **RolesGuard** + **@Permissions()` decorator** for RBAC endpoint protection.
3. **RolesModule** is scaffold-only. Must implement actual CRUD with `TypeOrmModule.forFeature([Role, Permission])`.
4. **UsersModule** is scaffold-only. Must implement actual CRUD with proper repository injection.

---

## PHASE 4: Master Data Modules — 🔶 PARTIALLY COMPLETE

### ✅ Done — TagModule
- Full CRUD implemented in `TagService` (create, update, soft-delete, list with optional `type` filter).
- Auto-generates `slug` via `slugify` with Vietnamese locale.
- Conflict detection for duplicate slugs on create and update.
- Cache-Aside pattern with `CACHE_MANAGER` (in-memory, TTL 3600s).
- Cache invalidation on write operations (`clearTagCaches()`).
- `ParseUUIDPipe` on ID params.
- DTOs with `class-validator` + Swagger decorators.

### ⚠️ Tag Issues to Fix
- `tag.controller.ts` uses `@Post(':id')` for update — should be `@Patch(':id')` (REST convention).
- `UpdateTagDto` extends `PartialType` from `@nestjs/mapped-types` — should use `@nestjs/swagger` for Swagger compatibility.

### ❌ Remaining — VocabularyModule
- Service/Controller are scaffold-only (generator boilerplate with placeholder strings).
- `AdminVocabularyController` is an empty shell.
- Must implement:
  - Admin CRUD (create, update, soft-delete vocabulary).
  - Client-facing list endpoint with **cursor-based pagination** (not offset).
  - Filter by `tag_id`.
  - Redis caching for list endpoints.

### ❌ Remaining — QuotesModule
- Service/Controller are scaffold-only.
- `AdminQuoteController` is an empty shell.
- Must implement:
  - Admin CRUD (create, update, soft-delete quote).
  - Client-facing list endpoint with pagination.
  - Redis caching.

### ❌ Remaining — DailyQuote CronJob
- Install `@nestjs/schedule`.
- Create `daily_quotes` entity.
- Implement `@Cron('0 0 * * *')` job: select random quote → save to `daily_quotes` → cache as `quote:today` in Redis.

---

## PHASE 5: Gamification & Tracking Engine — ❌ NOT STARTED

### Entities (defined but services not implemented)
- `UserStreak` — ✅ Entity exists, service logic NOT built.
- `UserActivity` — ✅ Entity exists, service logic NOT built.
- `UserVocabularyProgress` — ✅ Entity exists (with composite unique), service logic NOT built.
- `UserStatistics` — ❌ Entity does NOT exist. Must create with: `user_id (PK, FK), total_stars, total_words_learned`.

### Implementation Required
1. **ProgressService:**
   - `learnWord(userId, vocabularyId)` — UPSERT into `user_vocabulary_progress` with `ON CONFLICT DO UPDATE`.
   - Must be idempotent.

2. **GamificationService:**
   - Use `QueryRunner` transaction to atomically:
     - Calculate streak (compare `lastActiveDate` with today).
     - Update `user_streaks.current_streak` and `highest_streak`.
     - Increment `user_statistics.total_stars`.
     - Insert `user_activity` log entry.

---

## PHASE 6: Dashboard / BFF Aggregation — ❌ NOT STARTED

- `HomeModule` exists but is scaffold-only (generator boilerplate).
- Must implement:
  1. `GET /api/v1/home/dashboard` (requires JWT auth):
     - User's stars + streak (from DB via `UserStatistics` + `UserStreak`).
     - Vocabulary progress ratio: `COUNT(mastered) / COUNT(total)` per user.
     - Quote of the day (from Redis key `quote:today`).
  2. Cache the aggregated response per `user_id` in Redis with TTL = 180s (3 minutes).
  3. Invalidate user dashboard cache on gamification events.

---

# CRITICAL PRODUCTION RULES

1. **Never expose sensitive data** — Exclude `password` field from all User query results using `select: false` on the column, or use `@Exclude()` with `ClassSerializerInterceptor`.
2. **Always parameterize queries** — Never interpolate user input into raw SQL. Use TypeORM's parameterized `.where()` or `createQueryBuilder().setParameters()`.
3. **Log strategically** — Use NestJS `Logger` (already used in `TagService`). Never log passwords, tokens, or PII.
4. **Environment isolation** — Use `NODE_ENV` to conditionally enable Swagger (disable in production).
5. **Connection pooling** — Supabase Session Pooler handles pooling. Do NOT configure TypeORM's own pool settings when using Supabase pooler URL.
6. **Migration discipline** — Always generate migrations from entity changes. Never manually edit migration files unless absolutely necessary.
7. **No barrel exports** — Avoid `index.ts` re-export barrels to prevent circular dependency issues in NestJS.