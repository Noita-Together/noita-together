import { makeSafeRenderer } from "../shared/ipc-helpers";
import type { MainIpc, RendererIpc } from "../electron/ipc";
import { ipcRenderer } from "electron-better-ipc";

export const ipc = makeSafeRenderer<MainIpc, RendererIpc>(ipcRenderer);