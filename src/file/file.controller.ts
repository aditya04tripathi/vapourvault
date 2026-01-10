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

@ApiTags('files')
@Controller('files')
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
	async presignUpload(@Body() dto: PresignUploadDto) {
		return this.fileService.presignUpload(dto);
	}

	@Post('upload')
	@UseInterceptors(FileInterceptor('file'))
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
	async uploadFile(@UploadedFile() file: Express.Multer.File) {
		if (!file) {
			throw new BadRequestException('File is required');
		}
		return this.fileService.uploadFile(file);
	}

	@Post('complete-upload')
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
	async getDownloadUrl(@Param('fileId') fileId: string) {
		return this.fileService.getDownloadUrl(fileId);
	}

	@Get('storage/list')
	@ApiOperation({ summary: 'List all files currently in storage bucket' })
	@ApiResponse({
		status: 200,
		description: 'List of files in storage',
	})
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
	async deleteFile(@Param('fileId') fileId: string) {
		return this.fileService.deleteFile(fileId);
	}
}
