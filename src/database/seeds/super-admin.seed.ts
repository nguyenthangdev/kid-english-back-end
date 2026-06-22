// File: src/database/seeds/super-admin.seed.ts
import { AppDataSource } from '../data-source';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../roles/entities/role.entity';
import * as bcrypt from 'bcrypt';

async function runSeed() {
  await AppDataSource.initialize();
  console.log('🚀 Đã kết nối Database để tạo Super Admin!');

  const userRepository = AppDataSource.getRepository(User);
  const roleRepository = AppDataSource.getRepository(Role);

  // 1. Tìm chính xác Role ADMIN đã được tạo từ trước
  const adminRole = await roleRepository.findOneBy({ code: 'ADMIN' });

  if (!adminRole) {
    console.error(
      '❌ Lỗi: Chưa tìm thấy quyền ADMIN. Hãy chạy seed:role trước!',
    );
    process.exit(1);
  }

  const adminEmail = process.env.EMAIL_ADMIN;

  // 2. Kiểm tra xem tài khoản này đã tồn tại chưa
  const existingAdmin = await userRepository.findOneBy({ email: adminEmail });

  if (!existingAdmin) {
    // 3. Mã hóa mật khẩu (Chuẩn bảo mật)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(
      process.env.PASSWORD_ADMMIN!,
      salt,
    );

    // 4. Tạo user mới và gán role_id
    const superAdmin = userRepository.create({
      fullName: 'System Administrator',
      email: adminEmail,
      password: hashedPassword,
      roleId: adminRole.id, // Liên kết Khóa ngoại
      isActive: true,
    });

    await userRepository.save(superAdmin);
    console.log('✅ Đã khởi tạo thành công tài khoản Super Admin!');
  } else {
    console.log('⚠️ Tài khoản Super Admin đã tồn tại, bỏ qua.');
  }

  process.exit(0);
}

runSeed().catch((error) => {
  console.error('❌ Lỗi khi chạy seed User:', error);
  process.exit(1);
});
