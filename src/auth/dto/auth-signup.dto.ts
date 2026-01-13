import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AuthSignupDto {
	@IsEmail()
	@IsNotEmpty()
	email: string;

	@IsNotEmpty()
	password: string;

	@IsNotEmpty()
	@IsString()
	name: string;
}
