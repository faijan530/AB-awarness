import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EngagementService, ReactionType, ReactionSummary } from '@/services/api/engagement-service';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/utils/cn';

interface ReactionsBarProps {
  newsId: string;
  className?: string;
}

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'LIKE', emoji: '👍', label: 'Like' },
  { type: 'LOVE', emoji: '❤️', label: 'Love' },
  { type: 'INSIGHTFUL', emoji: '💡', label: 'Insightful' },
  { type: 'SAD', emoji: '😢', label: 'Sad' },
  { type: 'ANGRY', emoji: '😡', label: 'Angry' },
];

export const ReactionsBar: React.FC<ReactionsBarProps> = ({ newsId, className }) => {
  const { isAuthenticated } = useAuthStore();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: reactionsData } = useQuery({
    queryKey: ['news-reactions', newsId],
    queryFn: () => EngagementService.getNewsReactions(newsId),
    staleTime: 1000 * 60 * 5,
  });

  // Instant Optimistic Reaction Mutation
  const reactionMutation = useMutation({
    mutationFn: (type: ReactionType) => EngagementService.toggleReaction(newsId, type),
    onMutate: async (newType: ReactionType) => {
      await queryClient.cancelQueries({ queryKey: ['news-reactions', newsId] });
      const previous = queryClient.getQueryData<ReactionSummary>(['news-reactions', newsId]);

      if (previous) {
        const currentType = previous.userReaction;
        const newCounts = { ...previous.counts };

        if (currentType === newType) {
          // Toggling off
          newCounts[newType] = Math.max(0, (newCounts[newType] || 1) - 1);
          queryClient.setQueryData(['news-reactions', newsId], {
            ...previous,
            userReaction: null,
            totalReactions: Math.max(0, previous.totalReactions - 1),
            counts: newCounts,
          });
        } else {
          // Switch or new reaction
          if (currentType) {
            newCounts[currentType] = Math.max(0, (newCounts[currentType] || 1) - 1);
          }
          newCounts[newType] = (newCounts[newType] || 0) + 1;
          queryClient.setQueryData(['news-reactions', newsId], {
            ...previous,
            userReaction: newType,
            totalReactions: currentType ? previous.totalReactions : previous.totalReactions + 1,
            counts: newCounts,
          });
        }
      }
      return { previous };
    },
    onError: (_err, _newType, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['news-reactions', newsId], context.previous);
      }
      toast.error('Unable to record reaction. Please try again.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['news-reactions', newsId] });
    },
  });

  const handleReact = (type: ReactionType) => {
    if (!isAuthenticated) {
      toast.info('Sign In Required', 'Please sign in to react to news stories and participate in community discussions.');
      return;
    }
    reactionMutation.mutate(type);
  };

  const userReaction = reactionsData?.userReaction;
  const counts = reactionsData?.counts || {
    LIKE: 0,
    LOVE: 0,
    INSIGHTFUL: 0,
    SAD: 0,
    ANGRY: 0,
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5 sm:gap-2', className)}>
      {REACTIONS.map(({ type, emoji, label }) => {
        const count = counts[type] || 0;
        const isActive = userReaction === type;

        return (
          <button
            key={type}
            type="button"
            onClick={() => handleReact(type)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-100 cursor-pointer select-none active:scale-90 transform-gpu',
              isActive
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-sm shadow-rose-950/50 scale-105'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
            )}
            title={`${label} (${count})`}
          >
            <span className="text-sm leading-none">{emoji}</span>
            <span>{label}</span>
            {count > 0 && (
              <span className={cn('ml-0.5 text-[11px] font-mono font-bold', isActive ? 'text-rose-300' : 'text-slate-400')}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
