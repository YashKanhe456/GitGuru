import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import type { CloneRepositoryInput, CloneRepositoryResult } from "../domain/repository";
import { env } from "@/core/env";
import { toCloneTarget } from "./github";

function runGitCommand(args: string[], cwd?: string, timeoutMs = env.GIT_CLONE_TIMEOUT_MS) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn("git", args, {
      cwd,
      stdio: "ignore",
      windowsHide: true,
    });

    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error("Git clone timed out."));
    }, timeoutMs);

    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    child.on("exit", (code) => {
      clearTimeout(timeout);

      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Git exited with code ${code ?? "unknown"}.`));
    });
  });
}

export async function cloneGitHubRepository(input: CloneRepositoryInput): Promise<CloneRepositoryResult> {
  const { repository, cloneUrl, directoryName } = toCloneTarget(input.repoUrl);
  const root = input.destinationRoot ?? env.CLONE_WORKDIR ?? (await mkdtemp(join(tmpdir(), "vulcan-")));
  const targetPath = join(root, directoryName);

  await mkdir(root, { recursive: true });
  await rm(targetPath, { recursive: true, force: true });
  await runGitCommand(["clone", "--depth", "1", cloneUrl, targetPath], undefined, input.timeoutMs);

  return {
    repository,
    clonePath: targetPath,
    clonedAt: new Date().toISOString(),
  };
}
