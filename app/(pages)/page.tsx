import React, { useContext } from "react";
import Characters from "./components/Home/Characters/Characters";
import History from "./components/Home/History/History";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { CharactersData, ChatHistroy } from "@/@types/type";
import { getServerSession, Session } from "next-auth";
import { authOptions } from "../utils/auth";

const HomePage = async () => {
  const queryClient = new QueryClient();
  const session = await getServerSession(authOptions);

  await queryClient.prefetchQuery<CharactersData>({
    queryKey: ["characters"],
    queryFn: () =>
      fetch("/api/characters").then((res) =>
        res.json().then((data) => data.data)
      ),
  });

  await queryClient.prefetchQuery<ChatHistroy>({
    queryKey: ["chatsHistory"],
    queryFn: () =>
      fetch(`/api/history/${session?.user.id}`).then((res) =>
        res.json().then((data) => data.data)
      ),
  });

  return (
    <div className="mt-32 flex flex-col w-full h-full scrollbar-hide">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <History />
        <Characters />
      </HydrationBoundary>
    </div>
  );
};

export default HomePage;
