import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { auth } from '@/auth/auth';

interface AuthenticatedRequest extends Request {
  user?: Record<string, unknown>;
  session?: Record<string, unknown>;
}

@Injectable()
export class SessionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    try {
      const headers = request.headers as Record<string, string>;

      const session = await auth.api.getSession({
        headers: headers,
      });

      if (!session) {
        throw new UnauthorizedException(
          'You must be logged in to access this resource.',
        );
      }

      request.user = session.user;
      request.session = session.session;

      return true;
    } catch {
      throw new UnauthorizedException('Authentication failed.');
    }
  }
}
