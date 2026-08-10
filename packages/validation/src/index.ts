import { z } from "zod";

/**
 * Shared validation primitives.
 * Domain schemas will be added as feature modules are implemented.
 */

export const cafeIdSchema = z.string().uuid();
export const userIdSchema = z.string().uuid();
export const emailSchema = z.string().email().max(255);
