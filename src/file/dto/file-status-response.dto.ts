import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for file status response.
 */
export class FileStatusResponseDto {
	@ApiProperty({
		description: 'File ID',
		example: 'clx1234567890',
	})
	id: string;

	@ApiProperty({
		description: 'Original file name',
		example: 'document.pdf',
	})
	originalName: string;

	@ApiProperty({
		description: 'MIME type',
		example: 'application/pdf',
	})
	mimeType: string;

	@ApiProperty({
		description: 'File size in bytes',
		example: 1048576,
	})
	size: number;

	@ApiProperty({
		description: 'File status',
		enum: ['PENDING', 'UPLOADING', 'UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED'],
		example: 'PROCESSING',
	})
	status: string;

	@ApiProperty({
		description: 'Job status if processing',
		enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
		example: 'PROCESSING',
		required: false,
	})
	jobStatus?: string;

	@ApiProperty({
		description: 'Error message if failed',
		required: false,
	})
	errorMessage?: string;

	@ApiProperty({
		description: 'Created timestamp',
		example: '2025-01-10T12:00:00Z',
	})
	createdAt: Date;

	@ApiProperty({
		description: 'Updated timestamp',
		example: '2025-01-10T12:05:00Z',
	})
	updatedAt: Date;
}
