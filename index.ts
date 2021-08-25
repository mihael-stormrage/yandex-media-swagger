import Ajv from 'ajv';
import { Request, Router } from 'express';
import { RequestHandler } from '@laurence79/express-async-request-handler';

export type ValidationOptions = {
  logger?: (
    req: Request
  ) => (message: string, data: Record<string, unknown>) => void;
};

export type CreateQueueRequestBody = NewUserQueue;

export type CreateQueue201ResponseBody = UserQueue;

export type GetQueueByIdRequestPath = { queueId: number };

export type GetQueueById200ResponseBody = UserQueue;

export type GetUsersFavMatchRequestQuery = { offset?: number; limit?: number };

export type GetUsersFavMatch200ResponseBody = Array<User>;

export type User = {
  userId?: number;
  email: string;
  firstName: string;
  lastName: string;
  gender?: Genders;
  age?: number;
  social?: string;
  favArtists?: Array<string>;
};

export type NewUserQueue = User & {
  queueId?: number;
  description?: string;
  social?: string;
  isGang: boolean;
  eventId: number;
};

export type UserQueue = NewUserQueue & unknown;

export type Genders = 'male' | 'female';

export type CreateQueuedefaultResponseBody = Buffer;

export type GetQueueByIddefaultResponseBody = Buffer;

export type GetUsersFavMatchdefaultResponseBody = Buffer;

export type CreateQueueRequestHandler = RequestHandler<
  unknown,
  CreateQueue201ResponseBody,
  CreateQueueRequestBody,
  unknown,
  Record<string, any>,
  201 | number
>;

export type GetQueueByIdRequestHandler = RequestHandler<
  GetQueueByIdRequestPath,
  GetQueueById200ResponseBody,
  unknown,
  unknown,
  Record<string, any>,
  200 | number
>;

export type GetUsersFavMatchRequestHandler = RequestHandler<
  unknown,
  GetUsersFavMatch200ResponseBody,
  unknown,
  GetUsersFavMatchRequestQuery,
  Record<string, any>,
  200 | number
>;

export type RequestHandlers = {
  createQueue: CreateQueueRequestHandler;

  getQueueById: GetQueueByIdRequestHandler;

  getUsersFavMatch: GetUsersFavMatchRequestHandler;
};

const ajv = new Ajv({ strict: false, coerceTypes: true });
ajv.addSchema({
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    CreateQueueRequestBody: { $ref: '#/definitions/NewUserQueue' },
    CreateQueue201ResponseBody: { $ref: '#/definitions/UserQueue' },
    GetQueueByIdRequestPath: {
      type: 'object',
      properties: { queueId: { type: 'integer' } },
      required: ['queueId']
    },
    GetQueueById200ResponseBody: { $ref: '#/definitions/UserQueue' },
    GetUsersFavMatchRequestQuery: {
      type: 'object',
      properties: {
        offset: { type: 'integer', minimum: 0, default: 0 },
        limit: { type: 'integer', minimum: 1, default: 300 }
      },
      required: []
    },
    GetUsersFavMatch200ResponseBody: {
      type: 'array',
      items: { $ref: '#/definitions/User' }
    },
    User: {
      type: 'object',
      properties: {
        userId: { type: 'integer' },
        email: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        gender: { $ref: '#/definitions/Genders' },
        age: { type: 'integer' },
        social: { type: 'string' },
        favArtists: { type: 'array', items: { type: 'string' } }
      },
      required: ['email', 'firstName', 'lastName']
    },
    NewUserQueue: {
      allOf: [
        { $ref: '#/definitions/User' },
        {
          type: 'object',
          properties: {
            queueId: { type: 'integer' },
            description: { type: 'string' },
            social: { type: 'string' },
            isGang: { type: 'boolean' },
            eventId: { type: 'integer' }
          },
          required: ['userId', 'gender', 'age', 'isGang', 'eventId']
        }
      ]
    },
    UserQueue: {
      allOf: [
        { $ref: '#/definitions/NewUserQueue' },
        { type: 'object', required: ['queueId'] }
      ]
    },
    Genders: { type: 'string', enum: ['male', 'female'] }
  }
});

const createQueueValidator = (
  options?: ValidationOptions
): CreateQueueRequestHandler => {
  const body = ajv.getSchema('#/definitions/CreateQueueRequestBody')!;

  return (req, res, next) => {
    if ([body(req.body)].every(r => r)) {
      return next();
    }

    const fields = ([[body, 'body']] as const)
      .flatMap(([validator, path]) =>
        validator.errors?.map(e => ({
          path: `${path}${e.dataPath}`,
          message: e.message ?? 'Unknown'
        }))
      )
      .compact();

    options?.logger?.(req as Request)('Request validation failed', { fields });

    res.status(400).send({
      type: 'REQUEST_VALIDATION_FAILED',
      fields
    });
  };
};

const getQueueByIdValidator = (
  options?: ValidationOptions
): GetQueueByIdRequestHandler => {
  const params = ajv.getSchema('#/definitions/GetQueueByIdRequestPath')!;

  return (req, res, next) => {
    if ([params(req.params)].every(r => r)) {
      return next();
    }

    const fields = ([[params, 'params']] as const)
      .flatMap(([validator, path]) =>
        validator.errors?.map(e => ({
          path: `${path}${e.dataPath}`,
          message: e.message ?? 'Unknown'
        }))
      )
      .compact();

    options?.logger?.(req as Request)('Request validation failed', { fields });

    res.status(400).send({
      type: 'REQUEST_VALIDATION_FAILED',
      fields
    });
  };
};

const getUsersFavMatchValidator = (
  options?: ValidationOptions
): GetUsersFavMatchRequestHandler => {
  const query = ajv.getSchema('#/definitions/GetUsersFavMatchRequestQuery')!;

  return (req, res, next) => {
    if ([query(req.query)].every(r => r)) {
      return next();
    }

    const fields = ([[query, 'query']] as const)
      .flatMap(([validator, path]) =>
        validator.errors?.map(e => ({
          path: `${path}${e.dataPath}`,
          message: e.message ?? 'Unknown'
        }))
      )
      .compact();

    options?.logger?.(req as Request)('Request validation failed', { fields });

    res.status(400).send({
      type: 'REQUEST_VALIDATION_FAILED',
      fields
    });
  };
};

export const serviceRouter = (
  { createQueue, getQueueById, getUsersFavMatch }: RequestHandlers,
  options?: ValidationOptions
): Router => {
  return Router()
    .post('/queue', createQueueValidator(options), createQueue)
    .get('/queue/:queueId', getQueueByIdValidator(options), getQueueById)
    .get('/match_users', getUsersFavMatchValidator(options), getUsersFavMatch);
};
