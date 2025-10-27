import {Image} from '@/@types/type';
import {createCanvas} from 'node-canvas';

import {CharacterImage} from '../generated/prisma';

export const generateProfileImage =
    async(alphabet: string): Promise<Buffer> => {
  const canvas = createCanvas(200, 200);
  const ctx = canvas.getContext('2d');

  // Background color - using HSL for consistent brightness
  const hue = Math.floor(Math.random() * 360);
  ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Text styling
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 80px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Draw text
  ctx.fillText(alphabet.toUpperCase(), 100, 100);

  // Return as Buffer
  return canvas.toBuffer('image/png');
};

export const bytesToBase64 = (photo: any): string => {
  return `data:${photo.mimetype};base64,${
      Buffer.from(Object.values(photo.data)).toString('base64')}`;
};
