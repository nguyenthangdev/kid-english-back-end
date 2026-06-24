export const convertToSlug = (text: string): string => {
  if (!text) return '';
  return text
    .trim()
    .normalize('NFD') // Tách dấu ra khỏi chữ (VD: ả -> a + ̉)
    .replace(/[\u0300-\u036f]/g, '') // Xóa các ký tự dấu
    .toLowerCase() // Đưa về chữ thường
    .replace(/\s+/g, '-'); // Thay khoảng trắng bằng gạch nối
};

// Hàm này giữ nguyên khoảng trắng (chỉ bỏ dấu) để tìm kiếm sát nghĩa hơn
export const removeAccents = (text: string): string => {
  if (!text) return '';
  return text
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};
