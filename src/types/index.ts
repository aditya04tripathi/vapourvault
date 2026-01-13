/**
 * User interface definition.
 */
export interface User {
	id: string;
	email: string;
	username?: string;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * JWT Payload definition for authentication.
 */
export interface JwtPayload {
	sub: string;
	email: string;
	iat: number;
}

/**
 * Interface for auth tokens (Access & Refresh).
 */
export interface AuthTokens {
	accessToken: string;
	refreshToken?: string;
}
