import {
	Controller,
	Post,
	Get,
	Delete,
	Body,
	Param,
	UseGuards,
	HttpCode,
	HttpStatus,
	UseInterceptors,
	UploadedFile,
	BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from './file.service';
import { Throttle } from '@nestjs/throttler';
import {
	PresignUploadDto,
	CompleteUploadDto,
	FileStatusResponseDto,
	DownloadResponseDto,
} from './dto';
import { IdempotencyInterceptor } from 'src/common/interceptors/idempotency.interceptor';

@ApiTags('files')
@Controller('files')
/**
 * Controller handling file upload, retrieval, and status operations.
 */
export class FileController {
	constructor(private readonly fileService: FileService) {}

	@Post('presign-upload')
	@Throttle({ default: { limit: 10, ttl: 60000 } })
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Generate presigned URL for file upload' })
	@ApiResponse({
		status: 200,
		description: 'Presigned URL generated successfully',
	})
	@ApiResponse({ status: 400, description: 'Invalid request data' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	/**
	 * Initates a presigned upload session.
	 * @param dto - Upload parameters.
	 * @returns Presigned URL.
	 */
	async presignUpload(@Body() dto: PresignUploadDto) {
		return this.fileService.presignUpload(dto);
	}

	@Post('upload')
	@UseInterceptors(FileInterceptor('file'), IdempotencyInterceptor)
	@Throttle({ default: { limit: 10, ttl: 60000 } })
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Upload file directly using multipart/form-data' })
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				file: {
					type: 'string',
					format: 'binary',
				},
			},
		},
	})
	@ApiResponse({
		status: 200,
		description: 'File uploaded successfully and job enqueued',
	})
	@ApiResponse({ status: 400, description: 'Invalid request data' })
	/**
	 * Uploads a file directly via form-data.
	 * @param file - The uploaded file.
	 * @returns Upload confirmation.
	 */
	async uploadFile(@UploadedFile() file: Express.Multer.File) {
		if (!file) {
			throw new BadRequestException('File is required');
		}
		return this.fileService.uploadFile(file);
	}

	@Post('complete-upload')
	@UseInterceptors(IdempotencyInterceptor)
	@Throttle({ default: { limit: 10, ttl: 60000 } })
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Mark upload as complete and enqueue processing job' })
	@ApiResponse({
		status: 200,
		description: 'Upload completed and job enqueued',
	})
	@ApiResponse({ status: 400, description: 'Invalid request data' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden' })
	@ApiResponse({ status: 404, description: 'File not found' })
	/**
	 * Finalizes a presigned upload.
	 * @param dto - Completion details.
	 * @returns Completion confirmation.
	 */
	async completeUpload(@Body() dto: CompleteUploadDto) {
		return this.fileService.completeUpload(dto);
	}

	@Get(':fileId/status')
	@ApiOperation({ summary: 'Get file and job status' })
	@ApiResponse({
		status: 200,
		description: 'File status retrieved successfully',
		type: FileStatusResponseDto,
	})
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden' })
	@ApiResponse({ status: 404, description: 'File not found' })
	/**
	 * Gets current status of a file.
	 * @param fileId - File ID.
	 * @returns Status object.
	 */
	async getFileStatus(@Param('fileId') fileId: string) {
		return this.fileService.getFileStatus(fileId);
	}

	@Get(':fileId/download')
	@ApiOperation({ summary: 'Get presigned download URL' })
	@ApiResponse({
		status: 200,
		description: 'Download URL generated successfully',
		type: DownloadResponseDto,
	})
	@ApiResponse({ status: 400, description: 'File processing not completed' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden' })
	@ApiResponse({ status: 404, description: 'File not found' })
	/**
	 * Gets a temporary download URL.
	 * @param fileId - File ID.
	 * @returns Download URL.
	 */
	async getDownloadUrl(@Param('fileId') fileId: string) {
		return this.fileService.getDownloadUrl(fileId);
	}

	@Get('storage/list')
	@ApiOperation({ summary: 'List all files currently in storage bucket' })
	@ApiResponse({
		status: 200,
		description: 'List of files in storage',
	})
	/**
	 * DEBUG: Lists all files in storage.
	 * @returns List of objects.
	 */
	async listStorageFiles() {
		return this.fileService.listFilesFromStorage();
	}

	@Delete(':fileId')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Delete file and associated data' })
	@ApiResponse({
		status: 200,
		description: 'File deleted successfully',
	})
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden' })
	@ApiResponse({ status: 404, description: 'File not found' })
	/**
	 * Deletes a file.
	 * @param fileId - File ID.
	 * @returns Success message.
	 */
	async deleteFile(@Param('fileId') fileId: string) {
		return this.fileService.deleteFile(fileId);
	}
}
