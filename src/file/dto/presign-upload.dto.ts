import { IsString, IsNotEmpty, IsInt, Min, Max, IsMimeType } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PresignUploadDto {
	@ApiProperty({
		description: 'Original file name',
		example: 'document.pdf',
	})
	@IsString()
	@IsNotEmpty()
	fileName: string;

	@ApiProperty({
		description: 'MIME type of the file',
		example: 'application/pdf',
	})
	@IsMimeType()
	@IsNotEmpty()
	mimeType: string;

	@ApiProperty({
		description: 'File size in bytes (max 500MB)',
		example: 1048576,
		minimum: 1,
		maximum: 524288000,
	})
	@IsInt()
	@Min(1)
	@Max(524288000)
	size: number;
}
