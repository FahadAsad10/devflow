import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import multer from "multer";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ message: error.code === "LIMIT_FILE_SIZE" ? "File is too large. Maximum size is 10 MB." : "File upload failed." });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      message: "Validation failed.",
      issues: error.issues,
    });
  }

  console.error(error);
  const message = error instanceof Error ? error.message : "An unexpected server error occurred.";
  return res.status(500).json({
    message: process.env.NODE_ENV === "development" ? message : "An unexpected server error occurred.",
  });
}
