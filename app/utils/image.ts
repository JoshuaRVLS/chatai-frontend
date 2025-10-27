// Remove sharp import and server-side code
// Keep only client-compatible utilities

export const bytesToBase64 = (photo: any): string => {
  return `data:${photo.mimetype};base64,${
      Buffer.from(Object.values(photo.data)).toString('base64')}`;
};

// Client-side image generation
export const generateProfileImage = (alphabet: string) => {
  // This runs in the browser
  if (typeof window === 'undefined') return '';

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  canvas.width = 200;
  canvas.height = 200;

  const hue = Math.floor(alphabet.charCodeAt(0) * 360 / 26) % 360;
  ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 80px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(alphabet.toUpperCase(), 100, 100);

  // If you have a base64 string (from canvas.toDataURL())
  const base64String =
      canvas.toDataURL('image/png')
          .split(',')[1];  // Remove "data:image/png;base64," prefix
  const binaryString = atob(base64String);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};