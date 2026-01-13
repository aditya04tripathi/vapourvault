import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for download URL response.
 */
export class DownloadResponseDto {
	@ApiProperty({
		description: 'Presigned URL for downloading the file',
		example: 'https://minio.example.com/bucket/file.pdf?X-Amz-Algorithm=...',
	})
	url: string;

	@ApiProperty({
		description: 'URL expiration time in seconds',
		example: 3600,
	})
	expiresIn: number;

	@ApiProperty({
		description: 'File name',
		example: 'document.pdf',
	})
	fileName: string;
}
