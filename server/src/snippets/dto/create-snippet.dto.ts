export class CreateSnippetDto {
  title!: string;
  description?: string | null;
  language!: string;
  code!: string;
  isFavorite?: boolean;
  tags?: string[];
}
