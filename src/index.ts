#!/usr/bin/env node

import path from "path";
import { execSync } from "child_process";

import yargs from "yargs";
import git from "nodegit";
import fs from "fs-extra";
import commandExists from "command-exists";

type Args = {
  dist: string;
  directory: string;
  repo: string;
  tempDir: string;
};

async function installDeps(path: string) {
  const currentCwd = process.cwd();
  process.chdir(path);
  const command = (await commandExists("yarn")) ? "yarn" : "npm";
  execSync(`${command} install`, { stdio: "inherit" });
  process.chdir(currentCwd);
}

async function main() {
  const { $0, _, ...parsedArgs } = yargs
    .scriptName("create-alliage-app")
    .command(
      "$0 <dist> <directory>",
      "Create an Alliage app from a given distribution",
      (builder: yargs.Argv) => {
        builder
          .positional("dist", {
            type: "string",
            describe: "The distribution to install",
          })
          .positional("directory", {
            type: "string",
            describe: "The project's directory",
          })
          .option("repo", {
            type: "string",
            default: "https://github.com/TheHumbleJester/alliage-dists.git",
          })
          .option("tempDir", {
            type: "string",
            default: "/tmp/create-alliage-app",
          });
      }
    )
    .help().argv as yargs.Argv<Args>["argv"];

  console.log(`⚙️  Installing "${parsedArgs.dist}" distribution...`);

  // Remove temp directory where distributions are stored
  await fs.remove(parsedArgs.tempDir);

  // Clone dists repository
  const repo = await git.Clone.clone(parsedArgs.repo, parsedArgs.tempDir);

  // Check if dist exists
  const distPath = path.resolve(repo.workdir(), parsedArgs.dist);
  if (!(await fs.pathExists(distPath))) {
    throw new Error(`${parsedArgs.dist} does not exist.`);
  }

  // Copy dist in project's directory
  await fs.copy(distPath, parsedArgs.directory);

  // Install dependencies
  await installDeps(parsedArgs.directory);

  console.log(
    `✅ Your project has been successfully created in ${path.resolve(
      parsedArgs.directory
    )}`
  );
}

try {
  main();
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
