import React from "react";

// app/character/[id]/page.tsx
import { Metadata } from "next";
import CharacterView from "@/app/(pages)/components/CharacterView/CharacterView";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  // Fetch your data (this will be deduped with the same call in the Page component)
  const { data } = await fetch(
    `${process.env.NEXTAUTH_URL}/api/character-name/${(await params).id}`
  ).then((res) => res.json());

  const char = data;

  return {
    title: char.name,
    description: char.bio.slice(0, 160),
    openGraph: {
      title: `${char.name} | Character Profile`,
      description: char.bio,
      url: `https://jchatai.space/character/${(await params).id}`,
      images: [
        {
          url: `https://jchatai.space/api/image/${(await params).id}`,
          width: 800,
          height: 800,
          alt: char.name,
        },
      ],
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: char.name,
      description: char.bio,
      images: [`https://jchatai.space/api/image/${(await params).id}`],
    },
    alternates: {
      canonical: `https://jchatai.space/character/${(await params).id}`,
    }
  };
}

const page = async ({ params }: PageProps) => {
  const { id } = await params;
  return <CharacterView id={id} />;
};

export default page;
