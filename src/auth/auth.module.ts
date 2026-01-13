import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from 'src/auth/auth.service';
import { JwtStrategy } from 'src/utils/strategy/jwt.strategy';
import { AuthController } from 'src/auth/auth.controller';

@Module({
	imports: [PassportModule.register({ defaultStrategy: 'jwt' }), JwtModule.register({})],
	controllers: [AuthController],
	providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
