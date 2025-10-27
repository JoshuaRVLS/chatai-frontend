import {Image} from '@/@types/type';
import sharp from 'sharp';

import {CharacterImage} from '../generated/prisma';

export const generateProfileImage =
    async(alphabet: string): Promise<Buffer> => {
  const width = 200;
  const height = 200;

  // Generate a consistent hue based on the alphabet
  const hue = Math.floor(alphabet.charCodeAt(0) * 360 / 26) % 360;

  // Create SVG for the circle background and text
  const svg = `
    <svg width="${width}" height="${height}">
      <defs>
        <style>
          .text { 
            font: bold 80px sans-serif; 
            fill: #FFFFFF; 
            text-anchor: middle; 
            dominant-baseline: central;
          }
        </style>
      </defs>
      <rect width="100%" height="100%" fill="hsl(${hue}, 70%, 60%)"/>
      <text x="50%" y="50%" class="text">${alphabet.toUpperCase()}</text>
    </svg>
  `;

  // Convert SVG to PNG buffer
  const buffer = await sharp(Buffer.from(svg)).png().toBuffer();

  return buffer;
};

export const bytesToBase64 = (photo: any): string => {
  return `data:${photo.mimetype};base64,${
      Buffer.from(Object.values(photo.data)).toString('base64')}`;
};