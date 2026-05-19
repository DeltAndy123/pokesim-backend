import { zValidator } from '@hono/zod-validator';
import type { ZodType } from 'zod';

export const validate = <T extends ZodType>(
  target: Parameters<typeof zValidator>[0],
  schema: T,
) =>
  zValidator(target, schema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          errors: result.error.issues.map((i) => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        },
        400,
      );
    }
  });
