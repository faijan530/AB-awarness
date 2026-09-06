import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EngagementService, CommentItem } from '@/services/api/engagement-service';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/common/Button';
import { ReportModal } from './ReportModal';
import {
  MessageSquare,
  Send,
  Reply,
  Edit2,
  Trash2,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  ShieldAlert,
} from 'lucide-react';

const formatRelativeTime = (dateInput?: string | Date): string => {
  if (!dateInput) return 'Recently';
  const date = new Date(dateInput);
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

interface CommentSectionProps {
  newsId: string;
  initialCommentCount?: number;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ newsId, initialCommentCount = 0 }) => {
  const { user, isAuthenticated } = useAuthStore();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [sortOrder, setSortOrder] = useState<'LATEST' | 'OLDEST'>('LATEST');
  const [newCommentContent, setNewCommentContent] = useState('');
  
  // State for active reply input: commentId
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  // State for active edit: commentId
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // State for showing replies: Set of comment IDs
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  // Report Modal State
  const [reportingComment, setReportingComment] = useState<{ id: string; content: string } | null>(null);

  // Queries
  const { data: commentsData, isLoading } = useQuery({
    queryKey: ['comments', newsId, sortOrder],
    queryFn: () => EngagementService.getArticleComments(newsId, { sort: sortOrder }),
  });

  const comments: CommentItem[] = Array.isArray((commentsData as any)?.comments)
    ? (commentsData as any).comments
    : Array.isArray(commentsData)
    ? (commentsData as CommentItem[])
    : [];

  // Mutations
  const postCommentMutation = useMutation({
    mutationFn: (content: string) => EngagementService.createComment(newsId, content),
    onSuccess: () => {
      setNewCommentContent('');
      toast.success('Comment Posted', 'Your comment is now live in the discussion.');
      queryClient.invalidateQueries({ queryKey: ['comments', newsId] });
      queryClient.invalidateQueries({ queryKey: ['news-detail', newsId] });
    },
    onError: (err: any) => {
      toast.error('Unable to post comment', err.response?.data?.message || 'Failed to submit comment.');
    },
  });

  const postReplyMutation = useMutation({
    mutationFn: ({ parentId, content }: { parentId: string; content: string }) =>
      EngagementService.createReply(parentId, content),
    onSuccess: (_, variables) => {
      setReplyContent('');
      setReplyingToId(null);
      // Auto expand replies for this comment
      setExpandedReplies((prev) => new Set([...prev, variables.parentId]));
      toast.success('Reply Posted', 'Your reply has been added.');
      queryClient.invalidateQueries({ queryKey: ['comments', newsId] });
    },
    onError: (err: any) => {
      toast.error('Unable to post reply', err.response?.data?.message || 'Failed to submit reply.');
    },
  });

  const editCommentMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      EngagementService.updateComment(commentId, content),
    onSuccess: () => {
      setEditingId(null);
      setEditContent('');
      toast.success('Comment Updated', 'Your modifications have been saved.');
      queryClient.invalidateQueries({ queryKey: ['comments', newsId] });
    },
    onError: (err: any) => {
      toast.error('Unable to edit comment', err.response?.data?.message || 'Failed to update comment.');
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => EngagementService.deleteComment(commentId),
    onSuccess: () => {
      toast.success('Comment Deleted', 'The comment has been removed.');
      queryClient.invalidateQueries({ queryKey: ['comments', newsId] });
      queryClient.invalidateQueries({ queryKey: ['news-detail', newsId] });
    },
    onError: (err: any) => {
      toast.error('Unable to delete comment', err.response?.data?.message || 'Failed to delete comment.');
    },
  });

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentContent.trim()) return;
    postCommentMutation.mutate(newCommentContent.trim());
  };

  const handlePostReply = (parentId: string) => {
    if (!replyContent.trim()) return;
    postReplyMutation.mutate({ parentId, content: replyContent.trim() });
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  return (
    <section className="space-y-6 pt-8 border-t border-slate-800/80">
      {/* Header & Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-rose-500" />
          <h3 className="text-lg font-bold text-white tracking-tight">
            Public Discussion ({comments.length || initialCommentCount})
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">Sort by:</span>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-slate-700"
          >
            <option value="LATEST">Newest First</option>
            <option value="OLDEST">Oldest First</option>
          </select>
        </div>
      </div>

      {/* New Comment Box */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-sm">
        {isAuthenticated ? (
          <form onSubmit={handlePostComment} className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold text-xs uppercase">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <span className="text-xs font-semibold text-slate-300">{user?.fullName}</span>
            </div>

            <textarea
              rows={3}
              placeholder="Join the conversation... Share your thoughtful perspective (be civil and respectful)."
              value={newCommentContent}
              onChange={(e) => setNewCommentContent(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-rose-500/80 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 outline-none resize-none leading-relaxed transition-all"
              maxLength={2000}
            />

            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500">
                {newCommentContent.length}/2000 characters
              </span>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                isLoading={postCommentMutation.isPending}
                disabled={!newCommentContent.trim()}
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                Post Comment
              </Button>
            </div>
          </form>
        ) : (
          <div className="text-center py-4 space-y-2">
            <p className="text-sm text-slate-300">
              Want to join the conversation and share your perspective?
            </p>
            <Button variant="outline" size="sm" onClick={() => (window.location.href = '/login')}>
              Sign In to Comment
            </Button>
          </div>
        )}
      </div>

      {/* Comments Feed */}
      <div className="space-y-4 pt-2">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-500 font-mono">Loading discussions...</div>
        ) : comments.length === 0 ? (
          <div className="py-10 text-center bg-slate-950/40 border border-dashed border-slate-800/80 rounded-2xl space-y-2">
            <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-300 font-semibold">No comments yet</p>
            <p className="text-xs text-slate-500">Be the first to share your thoughts on this story.</p>
          </div>
        ) : (
          comments.map((comment: CommentItem) => {
            const isAuthor = user?.id === comment.userId;
            const isEditing = editingId === comment.id;
            const isReplying = replyingToId === comment.id;
            const hasReplies = Boolean(comment.replies && comment.replies.length > 0);
            const areRepliesExpanded = expandedReplies.has(comment.id);

            return (
              <div
                key={comment.id}
                className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-3 transition-all hover:border-slate-700/80"
              >
                {/* Author row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center font-bold text-xs uppercase">
                      {comment.user?.fullName?.charAt(0) || 'A'}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{comment.user?.fullName}</h4>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(comment.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Actions Dropdown / Menu */}
                  <div className="flex items-center gap-1 text-slate-400">
                    {isAuthor && !isEditing && (
                      <>
                        <button
                          onClick={() => {
                            setEditingId(comment.id);
                            setEditContent(comment.content);
                          }}
                          className="p-1.5 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                          title="Edit Comment"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this comment?')) {
                              deleteCommentMutation.mutate(comment.id);
                            }
                          }}
                          className="p-1.5 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                          title="Delete Comment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    {!isAuthor && (
                      <button
                        onClick={() => setReportingComment({ id: comment.id, content: comment.content })}
                        className="p-1.5 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Report Comment"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Content or Edit Box */}
                {isEditing ? (
                  <div className="space-y-2 pt-1">
                    <textarea
                      rows={2}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl p-2.5 text-xs text-white outline-none resize-none"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(null)}
                        disabled={editCommentMutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={editCommentMutation.isPending}
                        onClick={() => editCommentMutation.mutate({ commentId: comment.id, content: editContent })}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line font-sans">
                    {comment.content}
                  </p>
                )}

                {/* Bottom Controls: Reply trigger & Show replies toggle */}
                <div className="flex items-center gap-4 pt-1 text-xs">
                  <button
                    onClick={() => {
                      setReplyingToId(isReplying ? null : comment.id);
                      setReplyContent('');
                    }}
                    className="flex items-center gap-1 text-slate-400 hover:text-rose-400 transition-colors font-semibold"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    <span>Reply</span>
                  </button>

                  {hasReplies && (
                    <button
                      onClick={() => toggleReplies(comment.id)}
                      className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors font-mono text-[11px]"
                    >
                      {areRepliesExpanded ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5 text-rose-400" />
                          <span>Hide {comment.replies?.length} Replies</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5 text-rose-400" />
                          <span>View {comment.replies?.length} Replies</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Inline Reply Input Box */}
                {isReplying && (
                  <div className="pt-2 pl-4 border-l-2 border-slate-800 space-y-2">
                    <textarea
                      rows={2}
                      placeholder={`Replying to @${comment.user?.fullName}...`}
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl p-2.5 text-xs text-white outline-none resize-none"
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setReplyingToId(null)}>
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={postReplyMutation.isPending}
                        disabled={!replyContent.trim()}
                        onClick={() => handlePostReply(comment.id)}
                      >
                        Reply
                      </Button>
                    </div>
                  </div>
                )}

                {/* Nested Replies List */}
                {hasReplies && areRepliesExpanded && (
                  <div className="pt-2 pl-4 sm:pl-6 border-l-2 border-slate-800/80 space-y-3">
                    {comment.replies!.map((reply: CommentItem) => (
                      <div key={reply.id} className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[10px] uppercase">
                              {reply.user?.fullName?.charAt(0) || 'A'}
                            </div>
                            <h5 className="text-[11px] font-bold text-slate-300">{reply.user?.fullName}</h5>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {formatRelativeTime(reply.createdAt)}
                            </span>
                          </div>

                          {user?.id === reply.userId && (
                            <button
                              onClick={() => {
                                if (window.confirm('Delete this reply?')) {
                                  deleteCommentMutation.mutate(reply.id);
                                }
                              }}
                              className="text-slate-500 hover:text-rose-400 p-1"
                              title="Delete reply"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        <p className="text-xs text-slate-300 pl-7">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Report Modal */}
      {reportingComment && (
        <ReportModal
          isOpen={true}
          onClose={() => setReportingComment(null)}
          targetType="COMMENT"
          targetId={reportingComment.id}
          targetTitle={reportingComment.content.slice(0, 60)}
        />
      )}
    </section>
  );
};
