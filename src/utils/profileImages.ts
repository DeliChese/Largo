export type ProfileImageKind = 'avatar' | 'cover';
export type ProfileImages = Partial<Record<ProfileImageKind, Blob>>;

export const PROFILE_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/avif';
const imageTypes = new Set(PROFILE_IMAGE_ACCEPT.split(','));

export async function prepareProfileImage(file: File, kind: ProfileImageKind): Promise<Blob> {
  if (!imageTypes.has(file.type)) throw new Error('Hãy chọn ảnh JPG, PNG, WebP hoặc AVIF.');
  if (file.size > 20 * 1024 * 1024) throw new Error('Hãy chọn ảnh có dung lượng tối đa 20 MB.');

  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error('Largo chưa đọc được ảnh này. Hãy chọn một tệp ảnh khác.');
  });
  try {
    const edge = Math.min(bitmap.width, bitmap.height);
    const avatar = kind === 'avatar';
    const width = avatar ? edge : bitmap.width;
    const height = avatar ? edge : bitmap.height;
    const scale = Math.min(1, (avatar ? 512 : 1600) / width, (avatar ? 512 : 1000) / height);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Trình duyệt chưa thể chuẩn bị ảnh hồ sơ.');
    context.drawImage(bitmap, (bitmap.width - width) / 2, (bitmap.height - height) / 2, width, height,
      0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Largo chưa thể lưu ảnh này. Hãy thử một tệp khác.'));
      }, 'image/webp', 0.86);
    });
  } finally {
    bitmap.close();
  }
}

export function readImageForBackup(image: Blob | undefined): Promise<string | undefined> {
  if (!image) return Promise.resolve(undefined);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(image);
  });
}
