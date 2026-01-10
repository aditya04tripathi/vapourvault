---
applyTo: '**'
---

## Project Overview

SkillLens AI is an intelligent productivity and learning platform that transforms any content into personalized, actionable knowledge experiences. The platform serves both academic learners and working professionals through a dual-persona architecture, offering AI-powered content transformation, collaboration features, and comprehensive analytics.

### Vision Statement

To democratize intelligent learning by transforming any content into personalized, actionable knowledge experiences that adapt to both academic achievement and professional growth.

### Key Value Propositions

- **Universal Content Ingestion**: Support for PDFs, videos, audio, presentations, and handwritten notes
- **Dual-Persona Architecture**: Seamlessly switches between academic and professional learning contexts
- **Privacy-First Approach**: User-controlled privacy settings with enterprise-grade security
- **Scalable Collaboration**: Individual study to enterprise-wide training programs
- **Transparent Pricing**: Clear, predictable costs with visible usage quotas

## Technical Architecture

### Technology Stack

#### Frontend

- **Framework**: React 18+ with TypeScript
- **Styling**: Tailwind CSS with ShadCN design system
- **State Management**: Redux Toolkit with TanStack Query

#### Backend

- **Architecture**: Microservices with Node.js/Express
- **Database**: PostgreSQL (primary), MongoDB (content), Redis (cache), Elasticsearch (search)
- **AI/ML**: OpenAI GPT integration, custom NLP models, TensorFlow/PyTorch
- **Infrastructure**: AWS/Azure cloud-native with Kubernetes orchestration
- **Authentication**: JWT with OAuth2, SAML for enterprise SSO

#### Key Services

- **User Management Service**: Authentication, profiles, subscriptions
- **Content Processing Service**: File upload, OCR, transcription, extraction
- **AI Generation Service**: Summaries, questions, flashcards, concept maps
- **Analytics Service**: Progress tracking, performance analysis, reporting
- **Collaboration Service**: Study groups, sharing, leaderboards
- **Notification Service**: Email, push notifications, communications

### Security Requirements

- **Encryption**: AES-256 at rest, TLS 1.3 in transit
- **Authentication**: Multi-factor authentication support
- **Privacy**: GDPR, CCPA, FERPA compliant with user data controls
- **Enterprise**: SOC 2 Type II, SSO integration, audit logging

## Development Guidelines

### Code Standards

#### General Principles

- **Clean Code**: Write self-documenting code with meaningful variable and function names
- **SOLID Principles**: Follow single responsibility, open/closed, Liskov substitution, interface segregation, and dependency inversion
- **DRY (Don't Repeat Yourself)**: Extract common functionality into reusable modules
- **Error Handling**: Implement comprehensive error handling with user-friendly messages
- **Testing**: Maintain 90%+ code coverage with unit, integration, and e2e tests

#### NestJS Service Standards

```typescript
// Use dependency injection and proper typing
@Injectable()
export class UserService {
	constructor(
		private prisma: PrismaService,
		private jwtService: JwtService,
	) {}

	async findOne(id: string): Promise<User> {
		return this.prisma.user.findUnique({ where: { id } });
	}
}

// Use DTOs for input validation
export class CreateUserDto {
	@IsEmail()
	@IsNotEmpty()
	email: string;

	@IsString()
	@IsNotEmpty()
	@MinLength(8)
	password: string;
}

// Use proper error handling
@Controller('users')
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Get(':id')
	async findOne(@Param('id') id: string): Promise<User> {
		const user = await this.userService.findOne(id);
		if (!user) {
			throw new NotFoundException('User not found');
		}
		return user;
	}
}
```

### File Structure

```
src/
├── app.controller.ts     # Main application controller
├── app.module.ts         # Root application module
├── app.service.ts        # Main application service
├── main.ts              # Application entry point
├── auth/                # Authentication module
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   ├── auth.service.ts
│   └── dto/             # Data transfer objects
├── user/                # User management module
│   ├── user.controller.ts
│   ├── user.module.ts
│   ├── user.service.ts
│   └── dto/
├── common/              # Shared/common modules
│   ├── common.module.ts
│   └── common.service.ts
├── prisma/              # Database module
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── types/               # TypeScript type definitions
├── utils/               # Utility functions and helpers
└── config/              # Configuration files
```

### API Design Standards

#### RESTful Conventions

```typescript
// Use consistent URL patterns
GET / api / v1 / users / { userId } / content;
POST / api / v1 / content;
PUT / api / v1 / content / { contentId };
DELETE / api / v1 / content / { contentId };

// Consistent response format
interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: {
		code: string;
		message: string;
		details?: any;
	};
	pagination?: {
		page: number;
		limit: number;
		total: number;
		hasNext: boolean;
	};
}
```

#### Error Handling

```typescript
// Standard error codes
enum ErrorCodes {
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	UNAUTHORIZED = 'UNAUTHORIZED',
	CONTENT_PROCESSING_FAILED = 'CONTENT_PROCESSING_FAILED',
	AI_GENERATION_FAILED = 'AI_GENERATION_FAILED',
	QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
}

// Error response format
const errorResponse = (code: ErrorCodes, message: string, details?: any) => ({
	success: false,
	error: { code, message, details },
});
```

## Feature Implementation Guidelines

### Content Processing Pipeline

#### File Upload Handling

```typescript
// Support multiple file types with validation
const supportedFormats = {
	documents: ['.pdf', '.docx', '.pptx', '.txt'],
	media: ['.mp4', '.mp3', '.wav', '.mov'],
	images: ['.jpg', '.jpeg', '.png', '.gif'],
};

// Implement progress tracking
interface UploadProgress {
	fileId: string;
	progress: number; // 0-100
	status: 'uploading' | 'processing' | 'completed' | 'failed';
	estimatedTimeRemaining?: number;
}
```

#### AI Content Generation

```typescript
// Quality scoring for generated content
interface GeneratedContent {
	content: string;
	qualityScore: number; // 0-1
	confidence: number; // 0-1
	needsReview: boolean;
	metadata: {
		model: string;
		processingTime: number;
		tokens: number;
	};
}

// Implement fallback mechanisms
const generateWithFallback = async (
	input: string,
	type: 'summary' | 'questions' | 'flashcards',
) => {
	try {
		return await primaryAIService.generate(input, type);
	} catch (error) {
		logger.warn('Primary AI service failed, using fallback', { error });
		return await fallbackAIService.generate(input, type);
	}
};
```

### Dual-Persona Implementation

#### Context Switching

```typescript
interface PersonaContext {
  type: 'academic' | 'professional';
  settings: {
    terminology: 'academic' | 'business';
    complexity: 'beginner' | 'intermediate' | 'advanced';
    focus: 'comprehension' | 'application' | 'certification';
  };
  customizations: {
    branding?: BrandingConfig;
    templates?: ContentTemplate[];
    integrations?: IntegrationConfig[];
  };
}

// Adapt UI based on persona
const PersonaProvider: React.FC<{ persona: PersonaContext; children: ReactNode }> = ({
  persona,
  children
}) => {
  const adaptedTheme = usePersonaTheme(persona);
  return (
    <PersonaContext.Provider value={persona}>
      <ThemeProvider theme={adaptedTheme}>
        {children}
      </ThemeProvider>
    </PersonaContext.Provider>
  );
};
```

#### Content Adaptation

```typescript
// Adapt content based on persona and learning style
const adaptContentForPersona = (
	content: RawContent,
	persona: PersonaContext,
	learningStyle: LearningStyle,
): AdaptedContent => {
	return {
		...content,
		terminology: translateTerminology(content.text, persona.settings.terminology),
		complexity: adjustComplexity(content.text, persona.settings.complexity),
		format: formatForLearningStyle(content, learningStyle),
		examples: generateExamples(content, persona.type),
	};
};
```

### Analytics and Progress Tracking

#### Learning Analytics

```typescript
interface LearningSession {
	id: string;
	userId: string;
	contentId: string;
	startTime: Date;
	endTime?: Date;
	activities: LearningActivity[];
	performance: {
		questionsAnswered: number;
		correctAnswers: number;
		timeSpent: number;
		concepts: ConceptMastery[];
	};
}

// Track learning patterns
const trackLearningPattern = (session: LearningSession) => {
	// Analyze optimal study times, difficulty progression, etc.
	analyticsService.track('learning_session', {
		userId: session.userId,
		duration: session.endTime ? session.endTime.getTime() - session.startTime.getTime() : 0,
		accuracy: session.performance.correctAnswers / session.performance.questionsAnswered,
		concepts: session.performance.concepts.map((c) => ({
			name: c.name,
			masteryLevel: c.level,
		})),
	});
};
```

### Privacy and Compliance

#### Data Protection

```typescript
// Implement data minimization
interface UserDataCollection {
	necessary: RequiredUserData; // Only data needed for core functionality
	optional: OptionalUserData; // Data that improves experience
	analytics: AnalyticsData; // Anonymized usage data
}

// Privacy controls
interface PrivacySettings {
	dataUsageForAI: boolean; // Allow data for AI training
	analyticsOptIn: boolean; // Share usage analytics
	marketingOptIn: boolean; // Receive marketing communications
	dataRetention: number; // Days to retain data after account deletion
}

// GDPR compliance helpers
const handleDataDeletion = async (userId: string) => {
	await Promise.all([
		userService.deleteUser(userId),
		contentService.deleteUserContent(userId),
		analyticsService.anonymizeUserData(userId),
		cacheService.purgeUserData(userId),
	]);
};
```

## Performance Guidelines

### Frontend Performance Standards

- **Web Vitals**: LCP < 2.5s, FID < 100ms, CLS < 0.1
- **Bundle Size**: < 500KB initial load, < 200KB for subsequent loads
- **Runtime Performance**: 60fps animations, < 100MB memory usage
- **Network**: Minimize HTTP requests, implement lazy loading

### Backend Performance Standards

- **API Response**: 95% of requests < 500ms
- **Database Queries**: < 100ms average query time
- **Content Processing**: PDF < 30s, Video < 2min/hour
- **Scalability**: Handle 1000+ concurrent users, auto-scaling enabled

### Frontend Caching Strategy

```typescript
// Frontend-specific caching
const frontendCacheStrategies = {
	userPreferences: { ttl: 3600, storage: 'localStorage' }, // 1 hour
	uiState: { ttl: 1800, storage: 'sessionStorage' }, // 30 minutes
	staticAssets: { ttl: 2592000, storage: 'browser' }, // 30 days
};

// Frontend cache management
const frontendCache = {
	set: (key: string, value: any, ttl: number) => {
		const item = { value, expiry: Date.now() + ttl * 1000 };
		localStorage.setItem(key, JSON.stringify(item));
	},
	get: (key: string) => {
		const item = localStorage.getItem(key);
		if (!item) return null;
		const parsed = JSON.parse(item);
		if (Date.now() > parsed.expiry) {
			localStorage.removeItem(key);
			return null;
		}
		return parsed.value;
	},
};
```

### Backend Caching Strategy

```typescript
// Backend-specific caching
const backendCacheStrategies = {
	userProfiles: { ttl: 3600, storage: 'redis' }, // 1 hour
	contentMetadata: { ttl: 86400, storage: 'redis' }, // 24 hours
	generatedContent: { ttl: 604800, storage: 's3' }, // 7 days
	apiResponses: { ttl: 300, storage: 'redis' }, // 5 minutes
};

// Backend cache invalidation
const invalidateBackendCache = (userId: string) => {
	cache.del(`user:${userId}:*`);
	cache.del(`content:user:${userId}:*`);
};
```

## Testing Requirements

### Test Coverage Standards

- **Unit Tests**: 90%+ coverage for business logic
- **Integration Tests**: All API endpoints and database operations
- **E2E Tests**: Critical user journeys and workflows
- **Performance Tests**: Load testing for expected traffic

### Test Structure

```typescript
// Unit test example
describe('FlashcardGenerator', () => {
	it('should generate flashcards from content', async () => {
		const content = mockProcessedContent;
		const flashcards = await generateFlashcards(content);

		expect(flashcards).toHaveLength(5);
		expect(flashcards[0]).toHaveProperty('question');
		expect(flashcards[0]).toHaveProperty('answer');
		expect(flashcards[0].qualityScore).toBeGreaterThan(0.7);
	});
});

// Integration test example
describe('Content API', () => {
	it('should process uploaded PDF and generate study materials', async () => {
		const file = fs.readFileSync('./test-fixtures/sample.pdf');
		const response = await request(app)
			.post('/api/v1/content')
			.attach('file', file, 'sample.pdf')
			.expect(200);

		expect(response.body.success).toBe(true);
		expect(response.body.data).toHaveProperty('contentId');
	});
});
```

## Deployment and DevOps

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test
      - run: npm run test:e2e

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: docker build -t skilllens:${{ github.sha }} .
      - run: kubectl apply -f k8s/
```

### Environment Configuration

#### Frontend Environment Configuration

```typescript
// Frontend-specific environment settings
interface FrontendEnvironmentConfig {
	nodeEnv: 'development' | 'staging' | 'production';
	api: {
		baseUrl: string;
		timeout: number;
	};
	storage: {
		localStorage: boolean;
		sessionStorage: boolean;
	};
	features: {
		analytics: boolean;
		errorReporting: boolean;
	};
	ui: {
		theme: 'light' | 'dark' | 'auto';
		animations: boolean;
	};
}
```

#### Backend Environment Configuration

```typescript
// Backend-specific environment settings
interface BackendEnvironmentConfig {
	nodeEnv: 'development' | 'staging' | 'production';
	database: DatabaseConfig;
	ai: {
		openaiKey: string;
		models: AIModelConfig;
		rateLimits: RateLimitConfig;
	};
	storage: {
		s3Bucket: string;
		cdnUrl: string;
		uploadPath: string;
	};
	monitoring: {
		sentryDsn: string;
		logLevel: 'debug' | 'info' | 'warn' | 'error';
	};
	security: {
		jwtSecret: string;
		bcryptRounds: number;
	};
}
```

## AI Integration Guidelines

### Content Generation Quality

- Implement quality scoring for all AI-generated content
- Provide fallback mechanisms when AI fails or produces low-quality output
- Allow human review and editing of generated materials
- Track user satisfaction and content effectiveness

### Model Management

```typescript
// Model versioning and A/B testing
interface AIModel {
	name: string;
	version: string;
	type: 'summary' | 'questions' | 'flashcards';
	performance: {
		accuracy: number;
		speed: number;
		userSatisfaction: number;
	};
	isActive: boolean;
}

// A/B testing for AI models
const selectModelForUser = (userId: string, contentType: string): AIModel => {
	const experiment = getActiveExperiment(contentType);
	if (experiment && isUserInExperiment(userId, experiment)) {
		return experiment.model;
	}
	return getDefaultModel(contentType);
};
```

## Collaboration Features

### Real-time Collaboration

```typescript
// WebSocket event handling
interface CollaborationEvent {
	type: 'user_joined' | 'content_shared' | 'progress_updated' | 'message_sent';
	userId: string;
	groupId: string;
	data: any;
	timestamp: Date;
}

// Study group management
const createStudyGroup = async (creator: User, settings: StudyGroupSettings) => {
	const group = await studyGroupService.create({
		creatorId: creator.id,
		name: settings.name,
		privacy: settings.privacy,
		maxMembers: settings.maxMembers,
		allowedContent: settings.allowedContent,
	});

	// Set up real-time collaboration
	await collaborationService.initializeGroup(group.id);

	return group;
};
```

## Monitoring and Observability

### Logging Standards

```typescript
// Structured logging
const logger = {
	info: (message: string, meta?: object) => {
		console.log(
			JSON.stringify({
				level: 'info',
				message,
				timestamp: new Date().toISOString(),
				...meta,
			}),
		);
	},
	error: (message: string, error: Error, meta?: object) => {
		console.error(
			JSON.stringify({
				level: 'error',
				message,
				error: {
					name: error.name,
					message: error.message,
					stack: error.stack,
				},
				timestamp: new Date().toISOString(),
				...meta,
			}),
		);
	},
};
```

### Health Checks

```typescript
// Service health monitoring
const healthCheck = async (): Promise<HealthStatus> => {
	const checks = await Promise.allSettled([
		checkDatabase(),
		checkRedis(),
		checkS3(),
		checkAIService(),
	]);

	return {
		status: checks.every((check) => check.status === 'fulfilled') ? 'healthy' : 'unhealthy',
		checks: checks.map((check, index) => ({
			service: ['database', 'redis', 's3', 'ai'][index],
			status: check.status === 'fulfilled' ? 'up' : 'down',
			response_time: check.status === 'fulfilled' ? check.value.responseTime : null,
		})),
		timestamp: new Date().toISOString(),
	};
};
```

## Documentation Standards

### Code Documentation

- Use JSDoc for all public APIs and complex functions
- Maintain README files for each service and major component
- Document all environment variables and configuration options
- Keep architecture decision records (ADRs) for major technical decisions

### API Documentation

- Use OpenAPI/Swagger specifications for all REST APIs
- Provide examples for all request/response formats
- Document error codes and handling strategies
- Maintain SDK documentation for third-party integrations

## Contributing Guidelines

### Pull Request Process

1. Create feature branch from `develop`
2. Implement changes with tests
3. Update documentation as needed
4. Create PR with descriptive title and detailed description
5. Ensure all CI checks pass
6. Request review from team members
7. Merge after approval and testing

### Code Review Checklist

- [ ] Code follows project standards and conventions
- [ ] Tests cover new functionality with good coverage
- [ ] Documentation is updated and accurate
- [ ] Performance impact is considered and acceptable
- [ ] Security implications are reviewed
- [ ] Accessibility requirements are met
- [ ] Error handling is comprehensive

## Release Management

### Version Strategy

- Use semantic versioning (MAJOR.MINOR.PATCH)
- Tag releases with detailed changelog
- Maintain backward compatibility for APIs
- Coordinate releases across microservices

### Feature Flags

```typescript
// Feature flag management
interface FeatureFlag {
	name: string;
	enabled: boolean;
	rolloutPercentage: number;
	conditions?: {
		userSegment?: string;
		persona?: 'academic' | 'professional';
		subscription?: 'free' | 'premium' | 'enterprise';
	};
}

const isFeatureEnabled = (flagName: string, user: User): boolean => {
	const flag = getFeatureFlag(flagName);
	if (!flag.enabled) return false;

	// Check conditions
	if (flag.conditions) {
		// Implementation
	}

	// Check rollout percentage
	return getUserHash(user.id) < flag.rolloutPercentage;
};
```

---

## Project Values

1. **User-Centric Design**: Always prioritize user experience and learning outcomes
2. **Privacy First**: Respect user data and provide transparent controls
3. **Quality Over Speed**: Ensure high-quality, tested code before shipping
4. **Accessibility**: Design for all users, including those with disabilities
5. **Performance**: Optimize for speed and efficiency at every level
6. **Security**: Implement security best practices from the ground up
7. **Collaboration**: Foster teamwork and knowledge sharing
8. **Continuous Learning**: Stay updated with best practices and new technologies

Remember: We're building a platform that helps people learn better. Our code should reflect the same attention to detail and quality that we want our users to experience in their learning journey.
