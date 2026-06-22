import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import prisma from '../../prisma/prisma';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const secret = config.get<string>('JWT_SECRET');
    if (!secret) {
      throw new InternalServerErrorException(
        'JWT_SECRET environment variable is not set. Cannot start the application.',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    // Re-check the user on every request so deactivating, deleting, or
    // un-approving an account revokes access immediately rather than waiting
    // for the JWT to expire. Role is sourced from the DB, not the token.
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        active: true,
        approved: true,
      },
    });

    if (!user || !user.active) {
      throw new UnauthorizedException(
        'Account is inactive or no longer exists',
      );
    }
    if (user.role === 'COACH' && !user.approved) {
      throw new UnauthorizedException('Coach account is not approved');
    }

    return { userId: user.id, email: user.email, role: user.role };
  }
}
