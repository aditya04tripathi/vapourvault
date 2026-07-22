import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as argon from 'argon2';

describe('FileController (e2e)', () => {
	let app: INestApplication;
	let prisma: PrismaService;
	let authToken: string;
	let userId: string;

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();

		prisma = moduleFixture.get<PrismaService>(PrismaService);

		const hashedPassword = await argon.hash('password123');
		const user = await prisma.user.create({
			data: {
				email: 'test@example.com',
				name: 'Test User',
				hashedPassword,
			},
		});
		userId = user.id;

		const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({
			email: 'test@example.com',
			password: 'password123',
		});

		authToken = loginResponse.body.access_token;
	});

	afterAll(async () => {
		await prisma.file.deleteMany({ where: { userId } });
		await prisma.user.delete({ where: { id: userId } });
		await app.close();
	});

	describe('POST /files/presign-upload', () => {
		it('should generate presigned upload URL', () => {
			return request(app.getHttpServer())
				.post('/files/presign-upload')
				.set('Authorization', `Bearer ${authToken}`)
				.send({
					fileName: 'test.pdf',
					mimeType: 'application/pdf',
					size: 1024,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).toHaveProperty('fileId');
					expect(res.body).toHaveProperty('uploadUrl');
					expect(res.body).toHaveProperty('uploadKey');
					expect(res.body).toHaveProperty('expiresIn', 3600);
				});
		});

		it('should reject invalid file size', () => {
			return request(app.getHttpServer())
				.post('/files/presign-upload')
				.set('Authorization', `Bearer ${authToken}`)
				.send({
					fileName: 'test.pdf',
					mimeType: 'application/pdf',
					size: 600000000,
				})
				.expect(400);
		});

		it('should require authentication', () => {
			return request(app.getHttpServer())
				.post('/files/presign-upload')
				.send({
					fileName: 'test.pdf',
					mimeType: 'application/pdf',
					size: 1024,
				})
				.expect(401);
		});
	});

	describe('POST /files/complete-upload', () => {
		let fileId: string;
		let uploadKey: string;

		beforeEach(async () => {
			const presignResponse = await request(app.getHttpServer())
				.post('/files/presign-upload')
				.set('Authorization', `Bearer ${authToken}`)
				.send({
					fileName: 'test.pdf',
					mimeType: 'application/pdf',
					size: 1024,
				});

			fileId = presignResponse.body.fileId;
			uploadKey = presignResponse.body.uploadKey;
		});

		it('should complete upload and enqueue job', () => {
			return request(app.getHttpServer())
				.post('/files/complete-upload')
				.set('Authorization', `Bearer ${authToken}`)
				.send({
					fileId,
					uploadKey,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).toHaveProperty('message');
					expect(res.body).toHaveProperty('fileId', fileId);
					expect(res.body).toHaveProperty('jobId');
				});
		});

		it('should reject invalid file ID', () => {
			return request(app.getHttpServer())
				.post('/files/complete-upload')
				.set('Authorization', `Bearer ${authToken}`)
				.send({
					fileId: 'invalid-id',
					uploadKey: 'uploads/test/file.pdf',
				})
				.expect(404);
		});
	});

	describe('GET /files/:fileId/status', () => {
		let fileId: string;

		beforeEach(async () => {
			const presignResponse = await request(app.getHttpServer())
				.post('/files/presign-upload')
				.set('Authorization', `Bearer ${authToken}`)
				.send({
					fileName: 'test.pdf',
					mimeType: 'application/pdf',
					size: 1024,
				});

			fileId = presignResponse.body.fileId;
		});

		it('should return file status', () => {
			return request(app.getHttpServer())
				.get(`/files/${fileId}/status`)
				.set('Authorization', `Bearer ${authToken}`)
				.expect(200)
				.expect((res) => {
					expect(res.body).toHaveProperty('id', fileId);
					expect(res.body).toHaveProperty('status');
					expect(res.body).toHaveProperty('originalName');
				});
		});

		it('should reject access to other user files', async () => {
			const otherUser = await prisma.user.create({
				data: {
					email: 'other@example.com',
					name: 'Other User',
					hashedPassword: await argon.hash('password123'),
				},
			});

			const otherFile = await prisma.file.create({
				data: {
					userId: otherUser.id,
					originalName: 'other.pdf',
					mimeType: 'application/pdf',
					size: 1024,
					status: 'PENDING',
					uploadBucket: 'uploads',
					uploadKey: 'uploads/other/file.pdf',
				},
			});

			await request(app.getHttpServer())
				.get(`/files/${otherFile.id}/status`)
				.set('Authorization', `Bearer ${authToken}`)
				.expect(403);

			await prisma.file.delete({ where: { id: otherFile.id } });
			await prisma.user.delete({ where: { id: otherUser.id } });
		});
	});

	describe('DELETE /files/:fileId', () => {
		let fileId: string;

		beforeEach(async () => {
			const presignResponse = await request(app.getHttpServer())
				.post('/files/presign-upload')
				.set('Authorization', `Bearer ${authToken}`)
				.send({
					fileName: 'test.pdf',
					mimeType: 'application/pdf',
					size: 1024,
				});

			fileId = presignResponse.body.fileId;
		});

		it('should delete file', () => {
			return request(app.getHttpServer())
				.delete(`/files/${fileId}`)
				.set('Authorization', `Bearer ${authToken}`)
				.expect(200)
				.expect((res) => {
					expect(res.body).toHaveProperty('message');
				});
		});
	});
});
