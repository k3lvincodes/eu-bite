import http from 'node:http';
import { URL } from 'node:url';

export type MiddlewareHandler = (req: any, res: any, next?: any) => void | Promise<void>;

export interface RouteHandler {
  method: string;
  path: string;
  handlers: MiddlewareHandler[];
}

export class MiniRouter {
  routes: RouteHandler[] = [];
  middlewares: MiddlewareHandler[] = [];

  use(...middlewares: any[]) {
    this.middlewares.push(...middlewares);
    return this;
  }

  get(path: string, ...handlers: MiddlewareHandler[]) {
    this.routes.push({ method: 'GET', path, handlers });
    return this;
  }

  post(path: string, ...handlers: MiddlewareHandler[]) {
    this.routes.push({ method: 'POST', path, handlers });
    return this;
  }

  patch(path: string, ...handlers: MiddlewareHandler[]) {
    this.routes.push({ method: 'PATCH', path, handlers });
    return this;
  }

  put(path: string, ...handlers: MiddlewareHandler[]) {
    this.routes.push({ method: 'PUT', path, handlers });
    return this;
  }

  delete(path: string, ...handlers: MiddlewareHandler[]) {
    this.routes.push({ method: 'DELETE', path, handlers });
    return this;
  }
}

export class MiniApp extends MiniRouter {
  mounts: Array<{ prefix: string; router: MiniRouter }> = [];

  use(prefixOrMiddleware: any, ...maybeRouter: any[]) {
    if (typeof prefixOrMiddleware === 'string' && maybeRouter.length > 0) {
      this.mounts.push({ prefix: prefixOrMiddleware, router: maybeRouter[0] });
    } else if (typeof prefixOrMiddleware === 'function') {
      this.middlewares.push(prefixOrMiddleware);
    }
    return this;
  }

  listen(port: number | string, callback?: () => void) {
    const server = http.createServer(async (req: any, res: any) => {
      // Enhance res
      res.status = (statusCode: number) => {
        res.statusCode = statusCode;
        return res;
      };
      res.json = (data: any) => {
        res.setHeader('Content-Type', 'application/json');
        if (req.method === 'HEAD') {
          res.end();
        } else {
          res.end(JSON.stringify(data));
        }
      };
      res.send = (body: any) => {
        if (req.method === 'HEAD') {
          res.end();
        } else {
          res.end(body);
        }
      };

      // Enhance req
      const reqUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
      req.path = reqUrl.pathname;
      req.query = Object.fromEntries(reqUrl.searchParams.entries());

      // Parse body if present
      let bodyData = '';
      for await (const chunk of req) {
        bodyData += chunk;
      }
      if (bodyData) {
        try {
          req.body = JSON.parse(bodyData);
        } catch {
          req.body = bodyData;
        }
      } else {
        req.body = {};
      }

      // Route matching
      let matchedHandler: { handlers: MiddlewareHandler[]; params: Record<string, string> } | null = null;

      const testRoute = (route: RouteHandler, prefix: string = '') => {
        const methodMatches =
          route.method === req.method ||
          route.method === 'ALL' ||
          (route.method === 'GET' && req.method === 'HEAD');
        if (!methodMatches) return null;
        const fullPath = `${prefix}${route.path}`.replace(/\/+/g, '/');
        const routeParts = fullPath.split('/').filter(Boolean);
        const reqParts = req.path.split('/').filter(Boolean);

        if (routeParts.length !== reqParts.length) return null;

        const params: Record<string, string> = {};
        for (let i = 0; i < routeParts.length; i++) {
          if (routeParts[i].startsWith(':')) {
            params[routeParts[i].slice(1)] = decodeURIComponent(reqParts[i]);
          } else if (routeParts[i] !== reqParts[i]) {
            return null;
          }
        }
        return params;
      };

      // Check root routes
      for (const r of this.routes) {
        const p = testRoute(r, '');
        if (p) {
          matchedHandler = { handlers: r.handlers, params: p };
          break;
        }
      }

      // Check mounted sub-routers
      if (!matchedHandler) {
        for (const mount of this.mounts) {
          if (req.path.startsWith(mount.prefix)) {
            for (const r of mount.router.routes) {
              const p = testRoute(r, mount.prefix);
              if (p) {
                matchedHandler = { handlers: [...mount.router.middlewares, ...r.handlers], params: p };
                break;
              }
            }
          }
          if (matchedHandler) break;
        }
      }

      if (!matchedHandler) {
        res.status(404).json({ success: false, error: `Endpoint not found: ${req.method} ${req.path}` });
        return;
      }

      req.params = matchedHandler.params;

      // Execute middleware chain
      try {
        let idx = 0;
        const runNext = async () => {
          if (idx < matchedHandler!.handlers.length) {
            const h = matchedHandler!.handlers[idx++];
            await h(req, res, runNext);
          }
        };
        await runNext();
      } catch (err: any) {
        console.error('[SERVER ERROR]', err);
        res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
      }
    });

    const parsedPort = typeof port === 'string' ? parseInt(port, 10) : port;
    return server.listen(parsedPort, callback);
  }
}

export function createExpressApp() {
  return new MiniApp();
}

export function createRouter() {
  return new MiniRouter();
}
