const fs = require('fs');
const path = require('path');

function validateSwagger() {
	try {
		const swaggerPath = path.join(__dirname, 'swagger.json');
		const swaggerContent = fs.readFileSync(swaggerPath, 'utf8');
		const swagger = JSON.parse(swaggerContent);

		if (!swagger.openapi) {
			throw new Error('Missing OpenAPI version');
		}

		if (!swagger.info || !swagger.info.title || !swagger.info.version) {
			throw new Error('Missing required info fields');
		}

		console.log('✅ Swagger file is valid');
		return true;
	} catch (error) {
		console.error('❌ Swagger validation failed:', error.message);
		process.exit(1);
	}
}

validateSwagger();
