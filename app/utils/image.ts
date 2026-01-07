/** @deprecated Use direct API URLs like /api/image/${id} instead of sending bytes over JSON */
export const bytesToBase64 = (photo: any): string => {
  if (!photo || !photo.data) return '';
  return `data:${photo.mimetype};base64,${Buffer.from(Object.values(photo.data)).toString('base64')}`;
};