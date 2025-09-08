import { serveStatic } from '@hono/node-server/serve-static';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import swaggerUiDist from 'swagger-ui-dist';

const swaggerUiPath = swaggerUiDist.absolutePath();

let swaggerHtml = readFileSync(resolve(swaggerUiPath, 'index.html'), 'utf-8');
swaggerHtml = swaggerHtml.replace(
    'https://petstore.swagger.io/v2/swagger.json',
    '/doc'
);

export function setupSwagger(app) {
    // Serve the swagger UI files from a separate path.
    // This serves a file like 'swagger-ui-bundle.js' when the browser requests '/swagger-ui-bundle.js'.
    app.use('/swagger-assets/*', serveStatic({ root: swaggerUiPath, path: '/swagger-assets' }));
    
    // Now serve the modified index.html
    app.get('/swagger', (c) => c.html(swaggerHtml));
    
    // You also need to adjust the swaggerHtml to point to the new assets path.
    // For example, if the original HTML has <script src="swagger-ui-bundle.js">,
    // you would need to change it to <script src="/swagger-assets/swagger-ui-bundle.js">.
    // A simpler approach is to use the `serve-static` middleware correctly.
}