import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/query-client';

export type Snippet = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  language: string;
  code: string;
  isFavorite: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type SnippetPayload = {
  title?: string;
  description?: string | null;
  language?: string;
  code?: string;
  isFavorite?: boolean;
  tags?: string[];
};

type SnippetsQuery = {
  search?: string;
  language?: string;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export const snippetKeys = {
  all: ['snippets'] as const,
  list: (query: SnippetsQuery) => ['snippets', query] as const,
  detail: (id: string) => ['snippets', id] as const,
};

export function useSnippets(query: SnippetsQuery = {}) {
  return useQuery({
    queryKey: snippetKeys.list(query),
    queryFn: async () => {
      const searchParams = new URLSearchParams();

      if (query.search) searchParams.set('search', query.search);
      if (query.language) searchParams.set('language', query.language);

      const suffix = searchParams.toString() ? `?${searchParams.toString()}` : '';
      const response = (await apiFetch(`/snippets${suffix}`)) as ApiResponse<Snippet[]>;
      return response.data;
    },
    staleTime: 1000 * 60,
  });
}

export function useCreateSnippet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SnippetPayload) => {
      const response = (await apiFetch('/snippets', {
        method: 'POST',
        body: JSON.stringify(payload),
      })) as ApiResponse<Snippet>;
      return response.data;
    },
    onSuccess: (snippet) => {
      queryClient.invalidateQueries({ queryKey: snippetKeys.all });
      queryClient.setQueryData(snippetKeys.detail(snippet.id), snippet);
    },
  });
}

export function useUpdateSnippet(snippetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SnippetPayload) => {
      const response = (await apiFetch(`/snippets/${snippetId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })) as ApiResponse<Snippet>;
      return response.data;
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: snippetKeys.all });

      const previousLists = queryClient.getQueriesData<Snippet[]>({
        queryKey: snippetKeys.all,
      });
      const previousDetail = queryClient.getQueryData<Snippet>(snippetKeys.detail(snippetId));

      const optimisticPatch = toOptimisticPatch(payload);

      queryClient.setQueriesData<Snippet[] | Snippet>({ queryKey: snippetKeys.all }, (snippets) => {
        if (!Array.isArray(snippets)) return snippets;

        return snippets.map((snippet) =>
          snippet.id === snippetId ? { ...snippet, ...optimisticPatch } : snippet,
        );
      });

      queryClient.setQueryData<Snippet | undefined>(snippetKeys.detail(snippetId), (snippet) =>
        snippet ? { ...snippet, ...optimisticPatch } : snippet,
      );

      return { previousLists, previousDetail };
    },
    onError: (_error, _payload, context) => {
      context?.previousLists.forEach(([queryKey, snippets]) => {
        queryClient.setQueryData(queryKey, snippets);
      });

      if (context?.previousDetail) {
        queryClient.setQueryData(snippetKeys.detail(snippetId), context.previousDetail);
      }
    },
    onSuccess: (snippet) => {
      queryClient.setQueriesData<Snippet[] | Snippet>({ queryKey: snippetKeys.all }, (snippets) => {
        if (!Array.isArray(snippets)) return snippets;

        return snippets.map((currentSnippet) =>
          currentSnippet.id === snippet.id ? snippet : currentSnippet,
        );
      });
      queryClient.setQueryData(snippetKeys.detail(snippet.id), snippet);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: snippetKeys.all });
    },
  });
}

function toOptimisticPatch(payload: SnippetPayload): Partial<Snippet> {
  const patch: Partial<Snippet> = {
    updatedAt: new Date().toISOString(),
  };

  if (payload.title !== undefined) patch.title = payload.title;
  if (payload.description !== undefined) patch.description = payload.description;
  if (payload.language !== undefined) patch.language = payload.language;
  if (payload.code !== undefined) patch.code = payload.code;
  if (payload.isFavorite !== undefined) patch.isFavorite = payload.isFavorite;
  if (payload.tags !== undefined) patch.tags = payload.tags;

  return patch;
}

export function useDeleteSnippet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (snippetId: string) => {
      await apiFetch(`/snippets/${snippetId}`, {
        method: 'DELETE',
      });
      return snippetId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: snippetKeys.all });
    },
  });
}
