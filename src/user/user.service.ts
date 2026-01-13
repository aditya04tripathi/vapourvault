import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserDto } from 'src/user/dto';

@Injectable()
export class UserService {
	constructor(private readonly prisma: PrismaService) {}

	async findById(id: string) {
		return this.prisma.user.findUnique({
			where: { id },
			select: {
				id: true,
				email: true,
				name: true,
			},
		});
	}

	async updateUser(id: string, updateUserDto: UpdateUserDto) {
		return this.prisma.user.update({
			where: { id },
			data: updateUserDto,
			select: {
				id: true,
				email: true,
				name: true,
			},
		});
	}
}
