"use client";

import { Comment, User, UserProfileImage } from "@/app/generated/prisma";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FiSend, FiMessageSquare, FiClock, FiUser } from "react-icons/fi";
import React, { useContext, useState } from "react";
import { AuthContext } from "@/app/(pages)/providers/AuthProvider";
import Image from "next/image";
import { bytesToBase64 } from "@/app/utils/image";
import { motion, AnimatePresence } from "motion/react";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { useConfirm } from "@/app/(pages)/providers/ConfirmationProvider";

type Author = User & {
  profileImage: UserProfileImage | null;
  image?: string | null;
};

const Comments = ({ characterId }: { characterId: string }) => {
  const [commentValue, setCommentValue] = useState<string>("");
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();

  const { isPending, data } = useQuery<(Comment & { author: Author })[]>({
    queryKey: ["comments", characterId],
    queryFn: () =>
      fetch(`/api/comments/${characterId}`).then((res) =>
        res.json().then((data) => data.data)
      ),
  });

  const { mutate: addComment, isPending: isSubmitting } = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId,
          content,
          userId: user?.id,
        }),
      });
      if (!res.ok) throw new Error("Failed to post comment");
      return res.json();
    },
    onMutate: async (newContent) => {
      await queryClient.cancelQueries({ queryKey: ["comments", characterId] });
      const previousComments = queryClient.getQueryData(["comments", characterId]);

      if (user) {
        const optimisticComment = {
          id: `temp-${Date.now()}`,
          content: newContent,
          authorId: user.id,
          characterId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          author: {
            ...user,
            profileImage: null, // No bytes for optimistic
          },
        };

        queryClient.setQueryData(["comments", characterId], (old: any) => [
          optimisticComment,
          ...(old || []),
        ]);
      }

      return { previousComments };
    },
    onError: (err, newComment, context) => {
      queryClient.setQueryData(["comments", characterId], context?.previousComments);
      toast.error("Failed to post comment");
    },
    onSuccess: () => {
      setCommentValue("");
      queryClient.invalidateQueries({ queryKey: ["comments", characterId] });
    },
  });

  const handlePostComment = () => {
    if (!commentValue.trim()) return;
    if (!user) {
      toast.error("You must be logged in to comment");
      return;
    }
    addComment(commentValue);
  };

  return (
    <div className="w-full space-y-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white/90 flex items-center gap-4">
          <span className="w-8 h-1 bg-primary rounded-full" />
          Public Feedback
          <span className="text-sm font-medium normal-case tracking-normal text-white/20 ml-2">
            {isPending ? "Syncing..." : `${data?.length || 0} Comments`}
          </span>
        </h2>
      </div>

      {/* Input Section */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-[2rem] blur opacity-0 group-focus-within:opacity-100 transition duration-1000" />
        <div className="relative flex items-center gap-4 p-4 bg-[#0f172a]/40 backdrop-blur-3xl border border-white/5 rounded-[2rem]">
          <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/20 shrink-0 overflow-hidden">
            {user?.image ? (
              <Image
                src={user.image}
                width={40}
                height={40}
                alt="User"
                className="w-full h-full object-cover"
              />
            ) : <FiUser size={20} />}
          </div>
          <input
            className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/10 text-sm font-medium"
            value={commentValue}
            onChange={(e) => setCommentValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handlePostComment()}
            placeholder={user ? "Share your transmission..." : "Log in to post a transmission..."}
            disabled={!user || isSubmitting}
          />
          <button
            onClick={handlePostComment}
            disabled={!commentValue.trim() || isSubmitting || !user}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${commentValue.trim() && !isSubmitting && user
              ? "bg-primary text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:scale-110"
              : "bg-white/5 text-white/10 cursor-not-allowed"
              }`}
          >
            <FiSend size={18} />
          </button>
        </div>
      </div>

      {/* List Section */}
      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {!data?.length && !isPending && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 text-center"
            >
              <div className="w-16 h-16 mx-auto bg-white/5 border border-white/5 rounded-3xl flex items-center justify-center mb-4 text-white/10">
                <FiMessageSquare size={32} />
              </div>
              <p className="text-white/20 text-xs font-black uppercase tracking-widest">No transmissions recorded.</p>
            </motion.div>
          )}

          {data?.map((comment, index) => (
            <motion.div
              key={comment.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
              className="group relative flex gap-5 p-6 bg-[#0f172a]/20 border border-white/5 rounded-[2.5rem] hover:border-white/10 transition-all"
            >
              <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-white/5 flex-shrink-0 border border-white/5 font-black uppercase tracking-widest leading-loose">
                {comment.author.profileImage ? (
                  <Image
                    src={bytesToBase64(comment.author.profileImage)}
                    fill
                    alt={comment.author.username}
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="48px"
                  />
                ) : (
                  (comment.author as any).image ? (
                    <Image
                      src={(comment.author as any).image}
                      fill
                      alt={comment.author.username}
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="48px"
                    />
                  ) : <div className="w-full h-full flex items-center justify-center text-white/10 shrink-0"><FiUser size={20} /></div>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black italic tracking-tight uppercase text-primary/80 group-hover:text-primary transition-colors">
                    {comment.author.username}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/10 uppercase tracking-widest">
                    <FiClock size={10} />
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </div>
                </div>
                <p className="text-[13px] text-white/50 leading-relaxed font-medium group-hover:text-white/70 transition-colors">
                  {comment.content}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Comments;
