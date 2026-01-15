import {
  Character,
  CharacterImage,
  CharacterTag,
  Chat,
  Message,
  User,
} from "@/app/generated/prisma";

export type CharactersData = (Character & {
  author: User;
  photo: { id: string; charId: string; mimetype: string; name: string; data?: Uint8Array };
  tags: CharacterTag[];
})[];

export type ChatHistroy = (Chat & {
  character: Character & { photo: CharacterImage; author: User };
  messages: Message[];
})[];

export type Image = {
  data: Uint8Array;
  mimetype: string;
};
