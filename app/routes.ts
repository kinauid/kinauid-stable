import { type RouteConfig } from '@react-router/dev/routes';
import { scanFeatureRoutes } from './builder/scanner';

export default scanFeatureRoutes() satisfies RouteConfig;
