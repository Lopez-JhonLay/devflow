import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @AllowAnonymous()
  @Get('test-db')
  async testDbConnection() {
    try {
      const userCount = await this.prisma.user.count();
      return { success: true, message: 'Database connected!', userCount };
    } catch (error: unknown) {
      return { success: false, message: 'Failed to connect.', error: error };
    }
  }
}
