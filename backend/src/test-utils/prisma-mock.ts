import type prismaClient from '../prisma/prisma';

/**
 * `jest.Mocked<typeof prisma>` no longer recognises Prisma's overloaded delegate
 * methods (findUnique/upsert/…) as jest mocks, so `.mockResolvedValue` and
 * `.mock` are dropped from their types. This deep-mock proxy maps every function
 * to a `jest.Mock` while preserving the nested model shape, restoring the mock
 * helpers in specs without weakening runtime behaviour.
 */
export type DeepMockProxy<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any
    ? jest.Mock
    : T[K] extends object
      ? DeepMockProxy<T[K]>
      : T[K];
};

export type MockedPrisma = DeepMockProxy<typeof prismaClient>;

/** Cast a jest-mocked prisma module to a fully mock-typed client. */
export const asMockedPrisma = (p: typeof prismaClient): MockedPrisma =>
  p as unknown as MockedPrisma;
