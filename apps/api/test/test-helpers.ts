import { rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

export const createTempDatabasePath = (): string =>
  join(tmpdir(), `programmers-badge-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`);

export const removeTempDatabase = (databasePath: string): void => {
  rmSync(databasePath, { force: true });
  rmSync(`${databasePath}-shm`, { force: true });
  rmSync(`${databasePath}-wal`, { force: true });
};
