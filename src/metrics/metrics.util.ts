const INTERNAL_ROUTE = /^\/(api\/)?(metrics|health)/;

function shouldSkipRoute(path: string): boolean {
	return INTERNAL_ROUTE.test(path);
}
