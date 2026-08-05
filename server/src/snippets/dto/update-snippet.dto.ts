export class UpdateSnippetDto {
  title?: string;
  description?: string | null;
  language?: string;
  code?: string;
  isFavorite?: boolean;
  tags?: string[];
}
