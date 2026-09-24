import { app } from '../server/app.js';

export default function handler(req: any, res: any) {
  // If Vercel has already parsed the JSON payload, mark _body to avoid body-parser hang
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') {
      try {
        req.body = JSON.parse(req.body);
      } catch {
        // ignore
      }
    }
    req._body = true;
  }
  return app(req, res);
}
