import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { type User } from '@prisma/client';
import { CurrentUser } from '@/auth/decorators/current-user-decorator';
import { SessionGuard } from '@/auth/guards/guard';
import { CreateSnippetDto } from './dto/create-snippet.dto';
import { UpdateSnippetDto } from './dto/update-snippet.dto';
import { SnippetsService } from './snippets.service';

@Controller('snippets')
@UseGuards(SessionGuard)
export class SnippetsController {
  constructor(private readonly snippetsService: SnippetsService) {}

  @Post()
  createSnippet(@CurrentUser() user: User, @Body() body: CreateSnippetDto) {
    return this.snippetsService.createSnippet(user.id, body);
  }

  @Get()
  listSnippets(
    @CurrentUser() user: User,
    @Query('search') search?: string,
    @Query('language') language?: string,
  ) {
    return this.snippetsService.listSnippets(user.id, {
      search,
      language,
    });
  }

  @Get(':id')
  getSnippet(@CurrentUser() user: User, @Param('id') snippetId: string) {
    return this.snippetsService.getSnippet(user.id, snippetId);
  }

  @Put(':id')
  updateSnippet(
    @CurrentUser() user: User,
    @Param('id') snippetId: string,
    @Body() body: UpdateSnippetDto,
  ) {
    return this.snippetsService.updateSnippet(user.id, snippetId, body);
  }

  @Delete(':id')
  deleteSnippet(@CurrentUser() user: User, @Param('id') snippetId: string) {
    return this.snippetsService.deleteSnippet(user.id, snippetId);
  }
}
