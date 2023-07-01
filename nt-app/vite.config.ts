import { rmSync } from "fs";
import { join } from "path";
import { defineConfig, loadEnv, Plugin, UserConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import electron from "vite-plugin-electron";
import pkg from "./package.json";
import { fileURLToPath, URL } from "node:url";


rmSync("dist", { recursive: true, force: true }); // v14.14.0

// https://vitejs.dev/config/
export default defineConfig(({ command, mode, ssrBuild }) => {
  // TODO: Remove this hack once https://github.com/electron-vite/vite-plugin-electron/issues/37 gets fixed
  const env = loadEnv(mode, process.cwd());
  process.env = { ...process.env, ...env };

  return {
    plugins: [
      vue(),
      electron({
        main: {
          entry: "electron/main/index.ts",
          vite: withDebug({
            build: {
              outDir: "dist/electron/main",
            },
            define: {
              "process.env.VITE_APP_HOSTNAME_PUBLIC": JSON.stringify(
                  env.VITE_APP_HOSTNAME_PUBLIC
              ),
              "process.env.VITE_APP_WS_PORT_PUBLIC": JSON.stringify(
                  env.VITE_APP_WS_PORT_PUBLIC
              ),
            },
          }),
        },
        preload: {
          input: {
            index: join(__dirname, "electron/preload/index.ts"),
          },
          vite: {
            build: {
              sourcemap: "inline",
              outDir: "dist/electron/preload",
            },
          },
        },
        renderer: {},
      }),
    ],
    server: {
      host: pkg.env.VITE_DEV_SERVER_HOST,
      port: pkg.env.VITE_DEV_SERVER_PORT,
    },
    build: {
      target: "esnext",
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL("./src", import.meta.url))
      },
    },
    base: "/"
  };
});

function withDebug(config: UserConfig): UserConfig {
  if (process.env.VSCODE_DEBUG) {
    if (!config.build) config.build = {};
    config.build.sourcemap = true;
    config.plugins = (config.plugins || []).concat({
      name: "electron-vite-debug",
      configResolved(config) {
        const index = config.plugins.findIndex(
          (p) => p.name === "electron-main-watcher"
        );
        // At present, Vite can only modify plugins in configResolved hook.
        (config.plugins as Plugin[]).splice(index, 1);
      },
    });
  }
  return config;
}