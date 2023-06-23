// Imports
import got from "got";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { EventEmitter } from "events";

// Constants
const AutoUpdateServers = [
  "https://raw.githubusercontent.com/soler91/noita-together/",
];

function forcedirSync(dir: fs.PathLike) {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (_) {
    // Ignore
  }
}

function hash(data: crypto.BinaryLike) {
  return crypto
    .createHash("sha256")
    .update(data)
    .digest()
    .toString("hex")
    .toUpperCase();
}

export interface DownloadOperation {
  data?: any,
  type: string
  hash: string
  relpath: string
  abspath: string
}

export interface DownloadCheck{
  serverIndex: number,
  operations: DownloadOperation[]
}

export type UpdateBranch = "mod" | "nemesis";

class Updater extends EventEmitter {
  gamePath: string;
  branch: UpdateBranch;
  constructor(branch: UpdateBranch = "mod", gamePath: string) {
    super();
    this.setMaxListeners(0);

    this.branch = branch;
    this.gamePath = gamePath;
  }

  buildPath(relpath: string) {
    const p = path.join(this.gamePath, relpath);
    return p;
  }
  buildURL(serverIndex: number, relpath: string) {
    return `${AutoUpdateServers[serverIndex]}${this.branch}/${relpath}`;
  }
  async downloadRaw(serverIndex: number, relpath: string) {
    const url = this.buildURL(serverIndex, relpath);
    return await got(url).buffer();
  }
  async downloadJSON(serverIndex: number, relpath: string): Promise<any> {
    const url = this.buildURL(serverIndex, relpath);
    return got(url).json();
  }

  async check(serverIndex = 0): Promise<DownloadCheck|null> {
    this.emit("check_start", serverIndex);

    try {
      const manifest = await this.downloadJSON(serverIndex, "manifest.json");

      const operations: DownloadOperation[] = [];
      Object.keys(manifest.files).forEach((relpath) => {
        const filedata = manifest.files[relpath];
        const filepath = this.buildPath(relpath);

        let expectedHash = null;
        let needsUpdate = false;
        if (typeof filedata === "object") {
          expectedHash = filedata.hash.toUpperCase();

          if (filedata.overwrite === "only")
            needsUpdate =
              fs.existsSync(filepath) &&
              hash(fs.readFileSync(filepath)) !== expectedHash;
          else
            needsUpdate =
              !fs.existsSync(filepath) ||
              (filedata.overwrite &&
                hash(fs.readFileSync(filepath)) !== expectedHash);
        } else {
          expectedHash = filedata.toUpperCase();
          needsUpdate =
            !fs.existsSync(filepath) ||
            hash(fs.readFileSync(filepath)) !== expectedHash;
        }

        if (needsUpdate)
          operations.push({
            type: "update",
            hash: expectedHash,
            relpath,
            abspath: filepath,
          });
      });

      this.emit("check_success", serverIndex, operations);
      return {
        serverIndex,
        operations,
      };
    } catch (e) {
      this.emit("check_fail", serverIndex, e);

      if (serverIndex + 1 < AutoUpdateServers.length) {
        return await this.check(serverIndex + 1);
      } else {
        this.emit("check_fail_all");
        return null;
      }
    }
  }

  async resolveGamePath() {
    if (!this.gamePath) {
      return false;
    }

    if (fs.existsSync(path.join(this.gamePath, "/noita.exe"))) {
      let folder = "noita-together";
      if (this.branch == "nemesis") {
        folder = "noita-nemesis";
      }
      // TODO: WTF is up with this code?
      this.gamePath = path.join(this.gamePath, "/mods/" + folder + "/");
      return true;
    } else {
      return false;
    }
  }

  async run(checkResult = null) {
    this.emit("run_start");

    this.emit("gamepath_find");
    const foundGamepath = await this.resolveGamePath();
    if (!foundGamepath) {
      this.emit("gamepath_error");
      return;
    }

    let checkResultTyped: DownloadCheck|null = checkResult
    if (!checkResultTyped) checkResultTyped = await this.check();

    let success;
    if (checkResultTyped) {
      success = true;

      if (checkResultTyped.operations.length > 0) {
        this.emit("prepare_start");

        // Prepare and validate operations
        for (const operation of checkResultTyped.operations) {
          if (operation.type === "update") {
            this.emit(
              "download_start",
              checkResultTyped.serverIndex,
              operation.relpath
            );
            operation.data = await this.downloadRaw(
                checkResultTyped.serverIndex,
              operation.relpath
            );
            if (operation.hash === hash(operation.data)) {
              this.emit(
                "download_finish",
                  checkResultTyped.serverIndex,
                operation.relpath
              );
            } else {
              this.emit(
                "download_error",
                operation.relpath,
                operation.hash,
                hash(operation.data)
              );
              success = false;
              break;
            }
          }
        }

        this.emit("prepare_finish");

        if (success) {
          this.emit("execute_start");

          // All operations have been prepared and validated, so execute them now
          for (const operation of checkResultTyped.operations) {
            switch (operation.type) {
              case "update": {
                this.emit("install_start", operation.relpath);
                try {
                  forcedirSync(path.dirname(operation.abspath));
                  fs.writeFileSync(operation.abspath, operation.data);
                  this.emit("install_finish", operation.relpath);
                } catch (e) {
                  success = false;
                  this.emit("install_error", operation.relpath, e);
                }
                break;
              }
            }
          }

          this.emit("execute_finish");
        }
      }
    } else {
      success = false;
    }

    this.emit("run_finish", success);
    return (
        checkResultTyped &&
        checkResultTyped.operations &&
        checkResultTyped.operations.length !== 0
    );
  }
}

export default Updater;
