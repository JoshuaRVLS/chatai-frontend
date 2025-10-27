import Chat from "@/app/(pages)/components/Chat/Chat";
import { Metadata } from "next";
import React from "react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  // Fetch your data (this will be deduped with the same call in the Page component)
  const { data } = await fetch(
    `${process.env.NEXTAUTH_URL}/api/chats/${(await params).id}`
  ).then((res) => res.json());

  return {
    title: `${data.character.name} | Character Chat`,
    description: data.bio,
    // other metadata...
  };
}


const page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  return <Chat chatId={id} />;
};

export default page;
