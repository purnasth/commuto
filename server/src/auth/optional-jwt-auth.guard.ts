import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Populates `req.user` when a valid Bearer token is present, but still allows
 * the request through when the token is missing or invalid.
 *
 * Used on endpoints that stay publicly readable while returning a richer
 * projection to the authenticated participants of a ride.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(err: unknown, user: TUser): TUser | undefined {
    // Never throw: an absent or rejected token simply means an anonymous viewer.
    return user || undefined;
  }
}
