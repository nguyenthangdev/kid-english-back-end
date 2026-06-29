import { AppDataSource } from '../data-source';
import { Permission } from '../../permissions/entities/permission.entity';
import {
  PermissionModule,
  PermissionAction,
} from '../../common/constants/enums';

async function runCleanup() {
  await AppDataSource.initialize();
  console.log('🚀 Đã kết nối Database để Cleanup Permissions!');

  const permissionRepository = AppDataSource.getRepository(Permission);

  const modules = Object.values(PermissionModule);
  const actions = Object.values(PermissionAction);

  // Danh sách các code hợp lệ
  const validCodes: string[] = [];
  for (const module of modules) {
    for (const action of actions) {
      validCodes.push(`${module}:${action}`);
    }
  }

  // Tìm các permission không nằm trong danh sách hợp lệ
  const allPerms = await permissionRepository.find();
  const invalidPerms = allPerms.filter((p) => !validCodes.includes(p.code));

  if (invalidPerms.length > 0) {
    console.log(`🗑️ Đang xóa ${invalidPerms.length} quyền cũ không hợp lệ...`);
    // Vì bảng RolePermission có khóa ngoại, TypeORM có thể báo lỗi nếu cascade = false,
    // Nhưng isDeleted là soft-delete, nên ta xóa mềm hoặc xóa cứng.
    // Ở đây ta xóa cứng luôn cho sạch bảng matrix.
    await permissionRepository.remove(invalidPerms);
    console.log('✅ Đã dọn dẹp sạch sẽ!');
  } else {
    console.log('✨ Không có quyền rác nào cần dọn!');
  }

  process.exit(0);
}

runCleanup().catch((error) => {
  console.error('❌ Lỗi khi dọn dẹp Permissions:', error);
  process.exit(1);
});
