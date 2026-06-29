import { AppDataSource } from '../data-source';
import { Role } from '../../roles/entities/role.entity';
import { Permission } from '../../permissions/entities/permission.entity';
import {
  PermissionModule,
  PermissionAction,
} from '../../common/constants/enums';

async function runSeed() {
  await AppDataSource.initialize();
  console.log('🚀 Đã kết nối Database để Seed Permissions!');

  const roleRepository = AppDataSource.getRepository(Role);
  const permissionRepository = AppDataSource.getRepository(Permission);

  // 1. Tìm Role ADMIN
  const adminRole = await roleRepository.findOne({
    where: { code: 'ADMIN' },
    relations: { permissions: true },
  });

  if (!adminRole) {
    console.error(
      '❌ Lỗi: Chưa tìm thấy quyền ADMIN. Hãy chạy seed:role trước!',
    );
    process.exit(1);
  }

  // 2. Cập nhật Postgres ENUM type trước khi thêm data (tránh lỗi 22P02)
  try {
    await AppDataSource.query(
      `ALTER TYPE permissions_module_enum ADD VALUE IF NOT EXISTS 'TAG'`,
    );
    await AppDataSource.query(
      `ALTER TYPE permissions_module_enum ADD VALUE IF NOT EXISTS 'ROLE'`,
    );
    await AppDataSource.query(
      `ALTER TYPE permissions_module_enum ADD VALUE IF NOT EXISTS 'PERMISSION'`,
    );
    await AppDataSource.query(
      `ALTER TYPE permissions_module_enum ADD VALUE IF NOT EXISTS 'DASHBOARD'`,
    );
  } catch (err) {
    // Nếu chạy trên DB không dùng Postgres hoặc không hỗ trợ lệnh này, thì bỏ qua
    console.log(
      '⚠️ Bỏ qua cập nhật cấu trúc ENUM (chỉ cần thiết cho Postgres)',
    );
  }

  // 3. Tạo tất cả các Permissions từ Enum nếu chưa có
  const modules = Object.values(PermissionModule);
  const actions = Object.values(PermissionAction);

  const allPermissions: Permission[] = [];

  for (const module of modules) {
    for (const action of actions) {
      const code = `${module}:${action}`;
      let permission = await permissionRepository.findOneBy({ code });

      if (!permission) {
        permission = permissionRepository.create({
          module,
          action,
          code,
          description: `Quyền ${action} cho phân hệ ${module}`,
        });
        await permissionRepository.save(permission);
        console.log(`✅ Đã tạo permission: ${code}`);
      }
      allPermissions.push(permission);
    }
  }

  // 4. Gán TOÀN BỘ quyền cho ADMIN
  adminRole.permissions = allPermissions;
  await roleRepository.save(adminRole);

  console.log(
    `🎉 Đã cấp full ${allPermissions.length} quyền cho role ADMIN thành công!`,
  );
  process.exit(0);
}

runSeed().catch((error) => {
  console.error('❌ Lỗi khi chạy seed Permissions:', error);
  process.exit(1);
});
