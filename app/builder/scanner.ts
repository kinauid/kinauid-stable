import fs from 'node:fs';
import path from 'node:path';
import { route, index, type RouteConfigEntry } from '@react-router/dev/routes';
import { dotNotationToRoutePath } from './breadcrumbs';

export * from './breadcrumbs';

/**
 * Scans app/features/ directory for single-file feature routes (*.ts)
 * Directly maps each feature to its .ts file for native React Router v7 compilation and dead-code elimination.
 */
export function scanFeatureRoutes(appDir: string = 'app'): RouteConfigEntry[] {
  const featuresDir = path.resolve(process.cwd(), appDir, 'features');
  if (!fs.existsSync(featuresDir)) {
    return [];
  }

  const files = fs.readdirSync(featuresDir);
  const featureFiles = files.filter((f) => f.endsWith('.ts') && f !== 'root.ts');

  const routes: RouteConfigEntry[] = [];

  for (const file of featureFiles) {
    const featureKey = file.replace(/\.ts$/, '');
    const { isIndex, routePath } = dotNotationToRoutePath(featureKey);
    const routeFile = `features/${file}`;

    if (isIndex) {
      routes.push(index(routeFile));
    } else {
      routes.push(route(routePath, routeFile));
    }
  }

  return routes;
}
