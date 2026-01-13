import { Controller, Get, Patch, Body } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { UpdateUserDto } from 'src/user/dto';

@Controller('user')
export class UserController {
	constructor(private readonly userService: UserService) {}
}
