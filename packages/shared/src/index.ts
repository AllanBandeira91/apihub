import { z } from 'zod';

export enum WorkspaceRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

export enum ParameterLocation {
  QUERY = 'query',
  PATH = 'path',
  HEADER = 'header',
}

export const RegisterInputSchema = z.object({
  name: z.string().min(2, 'Name must have at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must have at least 8 characters').max(100),
});
export type RegisterInput = z.infer<typeof RegisterInputSchema>;

export const LoginInputSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

export const CreateWorkspaceSchema = z.object({
  name: z.string().min(2).max(60),
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().max(255).optional(),
});
export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceSchema>;

export const CreateProjectSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  description: z.string().max(300).optional(),
});
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

export const CreateApiDefinitionSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
  baseUrl: z.string().url('Base URL must be a valid URL'),
  version: z.string().default('v1.0.0'),
  isPublic: z.boolean().default(false),
});
export type CreateApiDefinitionInput = z.infer<typeof CreateApiDefinitionSchema>;

export const CreateEndpointSchema = z.object({
  method: z.nativeEnum(HttpMethod),
  path: z.string().startsWith('/', 'Path must start with /'),
  summary: z.string().max(120),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string()).default([]),
  parameters: z.array(z.object({
    name: z.string(),
    in: z.nativeEnum(ParameterLocation),
    required: z.boolean().default(false),
    description: z.string().optional(),
    example: z.string().optional(),
  })).default([]),
  requestBody: z.string().optional(),
  responseExamples: z.array(z.object({
    statusCode: z.number().int().min(100).max(599),
    description: z.string().optional(),
    body: z.string().optional(),
  })).default([]),
});
export type CreateEndpointInput = z.infer<typeof CreateEndpointSchema>;

export const ExecuteTestRequestSchema = z.object({
  endpointId: z.string().optional(),
  method: z.nativeEnum(HttpMethod),
  url: z.string().url(),
  headers: z.record(z.string()).default({}),
  queryParams: z.record(z.string()).default({}),
  body: z.string().optional(),
});
export type ExecuteTestRequestInput = z.infer<typeof ExecuteTestRequestSchema>;

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
