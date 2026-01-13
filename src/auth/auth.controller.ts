import { Body, Controller, Get, Post, UseGuards, Patch } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { AuthSignupDto, AuthSigninDto, ChangePasswordDto, ForgotPasswordDto } from 'src/auth/dto';
import { JwtGuard } from 'src/utils/guards';
import { GetUser, GetUserId, Public } from 'src/utils/decorator';
import { User } from '../generated/client';

@Controller('auth')
export class AuthController {
	constructor(private authService: AuthService) {}

	@Public()
	@Post('signin')
	signin(@Body() dto: AuthSigninDto) {
		return this.authService.signin(dto);
	}

	@Public()
	@Post('signup')
	signup(@Body() dto: AuthSignupDto) {
		return this.authService.signup(dto);
	}

	@UseGuards(JwtGuard)
	@Get('me')
	getMe(@GetUser() user: User) {
		return this.authService.getMe(user);
	}

	@UseGuards(JwtGuard)
	@Patch('change-password')
	changePassword(@GetUserId() userId: string, @Body() changePasswordDto: ChangePasswordDto) {
		return this.authService.changePassword(userId, changePasswordDto);
	}

	@Public()
	@Post('forgot-password')
	forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
		return this.authService.forgotPassword(forgotPasswordDto);
	}
}
