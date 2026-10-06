import { app } from "../server";

export default function handler(req: any, res: any) {
  try {
    return app(req, res);
  } catch (err: any) {
    console.error("Vercel Serverless Function fatal error:", err);
    if (!res.headersSent) {
      return res.status(500).json({
        error: "Internal Server Error",
        message: err?.message || "Serverless function execution failed"
      });
    }
  }
}

export { app };