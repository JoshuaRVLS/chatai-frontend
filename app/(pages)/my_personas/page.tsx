import React from "react";
import { QueryClient, HydrationBoundary } from "@tanstack/react-query";
import { getServerSession } from "next-auth";
import MyCharacters from "../components/MyCharacters/MyCharacters";
import Persona from "../components/Persona/Persona";

const page = async () => {
  const queryClient = new QueryClient();
  const session = await getServerSession();

  await queryClient.prefetchQuery({
    queryKey: ["personas"],
    queryFn: () =>
      fetch(`/api/persona/${session?.user.id}`).then((res) =>
        res.json().then((data) => data.data)
      ),
  });

  return <Persona />;
};

export default page;
