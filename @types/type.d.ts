import {
  Character,
  CharacterImage,
  Chat,
  Message,
  User,
} from "@/app/generated/prisma";

export type CharactersData = (Character & {
  author: User;
  photo: { data: Uint8Array; mimetype: string; name: string };
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
