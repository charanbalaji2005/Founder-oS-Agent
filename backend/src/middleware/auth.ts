import { Request, Response, NextFunction } from "express";

export function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const key = req.headers["x-groq-api-key"] as string;
  if (!key || key.length < 10) {
    return res.status(401).json({ error: "Missing or invalid Groq API key in x-groq-api-key header" });
  }
  next();
}
