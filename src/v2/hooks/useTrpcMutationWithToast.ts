import { match } from 'ts-pattern';
import { useToast } from './use-toast';

/**
 * tRPC mutation function type
 */
interface TrpcMutation<TInput, TOutput> {
  useMutation: (options?: {
    onSuccess?: (data: TOutput) => void;
    onError?: (error: unknown) => void;
  }) => {
    mutate: (input: TInput) => void;
    isLoading: boolean;
  };
}

/**
 * エラーメッセージのフォーマット処理
 */
const formatErrorMessage = (error: unknown): string => {
  return match(error)
    .when(
      (e): e is Error => e instanceof Error,
      (e) => e.message,
    )
    .otherwise(() => 'エラーが発生しました');
};

/**
 * トースト通知付きtRPC mutationフック
 *
 * 頻繁に繰り返される「成功時にトースト表示、エラー時にエラートースト表示」のパターンを統一化
 *
 * @param mutation - tRPC mutation関数
 * @param options - オプション設定
 * @returns mutation結果とヘルパー関数
 */
export const useTrpcMutationWithToast = <TInput, TOutput>(
  mutation: TrpcMutation<TInput, TOutput>,
  options?: {
    successTitle?: string;
    successDescription?: string;
    errorTitle?: string;
    errorDescription?: string;
    onSuccess?: (data: TOutput) => void;
    onError?: (error: unknown) => void;
  },
) => {
  const { toast } = useToast();

  return mutation.useMutation({
    onSuccess: (data: TOutput) => {
      if (options?.successTitle) {
        toast({
          title: options.successTitle,
          description: options.successDescription,
        });
      }
      options?.onSuccess?.(data);
    },
    onError: (error: unknown) => {
      const errorMessage = formatErrorMessage(error);

      toast({
        variant: 'destructive',
        title: options?.errorTitle || 'エラーが発生しました',
        description: options?.errorDescription || errorMessage,
      });

      options?.onError?.(error);
    },
  });
};
