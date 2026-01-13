import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for completing a presigned upload.
 */
export class CompleteUploadDto {
	@ApiProperty({
		description: 'File ID returned from presign-upload',
		example: 'clx1234567890',
	})
	@IsString()
	@IsNotEmpty()
	fileId: string;

	@ApiProperty({
		description: 'Upload key used in MinIO',
		example: 'uploads/user123/file-abc123.pdf',
	})
	@IsString()
	@IsNotEmpty()
	uploadKey: string;
}
