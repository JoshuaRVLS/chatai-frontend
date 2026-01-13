"use client";

import { Comment, User, UserProfileImage } from "@/app/generated/prisma";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FiSend, FiMessageSquare, FiClock, FiUser, FiCornerDownRight } from "react-icons/fi";
import React, { useContext, useState } from "react";
import { AuthContext } from "@/app/(pages)/providers/AuthProvider";
import Image from "next/image";
import { bytesToBase64 } from "@/app/utils/image";
import { motion, AnimatePresence } from "motion/react";
import { formatDistanceToNow } from "date-fns";
import { toast } from '@/app/lib/toast';
import { useAuthAction } from "@/app/hooks/useAuthAction";

type Author = User & {
  profileImage: UserProfileImage | null;
  image?: string | null;
};

type CommentWithReplies = Comment & {
  author: Author;
  replies?: CommentWithReplies[];
};

const Comments = ({ characterId }: { characterId: string }) => {
  const [commentValue, setCommentValue] = useState<string>("");
  const { user } = useContext(AuthContext);
  const { withAuth, isAuthenticated } = useAuthAction();
  const queryClient = useQueryClient();

  const { isPending, data } = useQuery<CommentWithReplies[]>({
    queryKey: ["comments", characterId],
    queryFn: () =>
      fetch(`/api/comments/${characterId}`).then((res) =>
        res.json().then((data) => data.data)
      ),
  });

  const { mutate: addComment, isPending: isSubmitting } = useMutation({
    mutationFn: async ({ content, parentId }: { content: string, parentId?: string }) => {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId,
          content,
          userId: user?.id,
          parentId
        }),
      });
      if (!res.ok) throw new Error("Failed to post comment");
      return res.json();
    },
    onSuccess: () => {
      setCommentValue("");
      queryClient.invalidateQueries({ queryKey: ["comments", characterId] });
      toast.success("Transmission sent.");
    },
    onError: () => {
      toast.error("Failed to post transmission.");
    }
  });

  const handlePostComment = withAuth(() => {
    if (!commentValue.trim()) return;
    addComment({ content: commentValue });
  });

  return (
    <div className="w-full space-y-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white/90 flex items-center gap-4">
          <span className="w-8 h-1 bg-primary rounded-full" />
          Public Feedback
          <span className="text-sm font-medium normal-case tracking-normal text-white/20 ml-2">
            {isPending ? "Syncing..." : `${data?.length || 0} Threads`}
          </span>
        </h2>
      </div>

      {/* Main Input Section */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-linear-to-r from-primary/20 to-purple-500/20 rounded-4xl blur opacity-0 group-focus-within:opacity-100 transition duration-1000" />
        <div className="relative flex items-center gap-4 p-4 bg-[#0f172a]/40 backdrop-blur-3xl border border-white/5 rounded-4xl">
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
            placeholder={isAuthenticated ? "Share your transmission..." : "Log in to post a transmission..."}
            disabled={isSubmitting}
            onClick={() => !isAuthenticated && handlePostComment()}
          />
          <button
            onClick={handlePostComment}
            disabled={(!commentValue.trim() && isAuthenticated) || isSubmitting}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${((commentValue.trim() && !isSubmitting) || !isAuthenticated)
              ? "bg-primary text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:scale-110"
              : "bg-white/5 text-white/10 cursor-not-allowed"
              }`}
          >
            {isSubmitting ? <div className="w-4 h-4 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" /> : <FiSend size={18} />}
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
            <CommentItem
              key={comment.id}
              comment={comment}
              index={index}
              onReply={(content, parentId) => addComment({ content, parentId })}
              isAuthenticated={isAuthenticated}
              isSubmitting={isSubmitting}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

const CommentItem = ({
  comment,
  index,
  onReply,
  isAuthenticated,
  isSubmitting
}: {
  comment: CommentWithReplies,
  index: number,
  onReply: (content: string, parentId: string) => void,
  isAuthenticated: boolean,
  isSubmitting: boolean
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const { withAuth } = useAuthAction();

  const handleReplySubmit = withAuth(() => {
    if (!replyContent.trim()) return;
    onReply(replyContent, comment.id);
    setReplyContent("");
    setIsReplying(false);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group flex flex-col gap-4"
    >
      {/* Main Comment */}
      <div className="relative flex gap-5 p-6 bg-[#0f172a]/20 border border-white/5 rounded-[2.5rem] hover:border-white/10 transition-all">
        <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-white/5 shrink-0 border border-white/5 font-black uppercase tracking-widest leading-loose">
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

          <button
            onClick={() => setIsReplying(!isReplying)}
            className="text-[10px] font-bold text-white/20 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-1 pt-2"
          >
            Reply
          </button>

          {/* Reply Input */}
          <AnimatePresence>
            {isReplying && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden pt-2"
              >
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleReplySubmit()}
                    placeholder="Write a reply..."
                    className="flex-1 bg-white/5 rounded-xl px-3 py-2 text-xs text-white outline-none border border-white/5 focus:border-white/20 transition-colors"
                  />
                  <button
                    onClick={handleReplySubmit}
                    className="px-3 py-2 bg-white text-black text-xs font-bold uppercase rounded-xl hover:bg-zinc-200 transition-colors"
                  >
                    Send
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="pl-12 space-y-4 relative">
          {/* Thread Line */}
          <div className="absolute left-6 top-0 bottom-6 w-px bg-linear-to-b from-white/10 to-transparent" />

          {comment.replies.map(reply => (
            <div key={reply.id} className="relative flex gap-4 p-4 rounded-3xl bg-white/2 border border-white/5">
              <div className="absolute -left-6 top-6 w-4 h-4 border-l border-b border-white/10 rounded-bl-xl" />

              <div className="relative w-8 h-8 rounded-xl overflow-hidden bg-white/5 shrink-0 border border-white/5 font-black uppercase tracking-widest leading-loose">
                {reply.author.profileImage ? (
                  <Image
                    src={bytesToBase64(reply.author.profileImage)}
                    fill
                    alt={reply.author.username}
                    className="object-cover"
                    sizes="32px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/10 shrink-0"><FiUser size={14} /></div>
                )}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black italic tracking-tight uppercase text-primary/80">
                    {reply.author.username}
                  </h4>
                  <span className="text-[9px] text-white/10">•</span>
                  <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
                    {formatDistanceToNow(new Date(reply.createdAt))} ago
                  </span>
                </div>
                <p className="text-xs text-white/50 leading-relaxed font-medium">
                  {reply.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default Comments;
