import { webContents } from "electron";
export const appEvent = (event: string, data: any) => {
  webContents.getAllWebContents().forEach((content) => {
    content.send(event, data);
  });
};
