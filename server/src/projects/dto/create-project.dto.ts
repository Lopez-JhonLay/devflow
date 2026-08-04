export class CreateProjectDto {
  name!: string;
  description?: string | null;
  repositoryUrl?: string | null;
  liveUrl?: string | null;
  status?: string;
  tags?: string[];
  coverImage?: string | null;
}
