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

export type SnippetsQuery = {
  search?: string;
  language?: string;
};
