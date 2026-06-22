// File: src/database/seeds/role.seed.ts
import { AppDataSource } from '../data-source';
import { Role } from '../../roles/entities/role.entity';

async function runSeed() {
  // 1. Khởi tạo kết nối với Supabase
  await AppDataSource.initialize();
  console.log('🚀 Đã kết nối Database thành công!');

  const roleRepository = AppDataSource.getRepository(Role);

  // 2. Chuẩn bị dữ liệu mẫu
  const roles = [
    {
      name: 'Administrator',
      code: 'ADMIN',
      description: 'Quản trị viên toàn quyền',
    },
    {
      name: 'Student',
      code: 'STUDENT',
      description: 'Học sinh hệ thống KidEnglish',
    },
    {
      name: 'Teacher',
      code: 'TEACHER',
      description: 'Giáo viên phụ trách bài giảng',
    },
  ];

  // 3. Tiến hành Insert an toàn
  for (const roleData of roles) {
    // Kiểm tra xem mã code đã tồn tại chưa
    const exists = await roleRepository.findOneBy({ code: roleData.code });

    if (!exists) {
      const newRole = roleRepository.create(roleData);
      await roleRepository.save(newRole);
      console.log(`✅ Đã thêm mới role: ${roleData.code}`);
    } else {
      console.log(`⚠️ Role ${roleData.code} đã tồn tại, bỏ qua.`);
    }
  }

  console.log('🎉 Quá trình Seeding hoàn tất!');
  process.exit(0);
}

runSeed().catch((error) => {
  console.error('❌ Lỗi khi chạy seed:', error);
  process.exit(1);
});
