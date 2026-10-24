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
      res.status = (statusCode: number) => {
        res.statusCode = statusCode;
        return res;
      };
      res.json = (data: any) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
      };
      res.send = (body: any) => {
        res.end(body);
      };

      const reqUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
      req.path = reqUrl.pathname;
      req.query = Object.fromEntries(reqUrl.searchParams.entries());

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

      let matchedHandler: { handlers: MiddlewareHandler[]; params: Record<string, string> } | null = null;

      for (const mount of this.mounts) {
        if (req.path.startsWith(mount.prefix)) {
          for (const r of mount.router.routes) {
            const fullPath = `${mount.prefix}${r.path}`.replace(/\/+/g, '/');
            if (r.method === req.method && fullPath === req.path) {
              matchedHandler = { handlers: [...mount.router.middlewares, ...r.handlers], params: {} };
              break;
            }
          }
        }
        if (matchedHandler) break;
      }

      if (!matchedHandler) {
        for (const r of this.routes) {
          if (r.method === req.method && r.path === req.path) {
            matchedHandler = { handlers: r.handlers, params: {} };
            break;
          }
        }
      }

      if (!matchedHandler) {
        res.status(404).send('Not Found');
        return;
      }

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
        res.status(500).json({ success: false, error: err.message });
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
