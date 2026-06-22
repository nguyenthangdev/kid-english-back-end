import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// Đọc file .env
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.POSTGRES_URI, // Dùng thẳng chuỗi kết nối Session Pooler 6543
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false, // Luôn để false ở production/migration

  // 2 cấu hình BẮT BUỘC để CLI chọc được qua tường lửa của Supabase
  ssl: true,
  extra: {
    ssl: {
      rejectUnauthorized: false,
    },
  },
});
