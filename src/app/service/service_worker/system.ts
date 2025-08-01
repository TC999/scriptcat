import { type SystemConfig } from "@App/pkg/config/config";
import { type Group } from "@Packages/message/server";
import type { MessageSend } from "@Packages/message/types";
import { createObjectURL, VscodeConnectClient } from "../offscreen/client";
import { cacheInstance } from "@App/app/cache";
import { CACHE_KEY_FAVICON } from "@App/app/cache_key";

// 一些系统服务
export class SystemService {
  constructor(
    private systemConfig: SystemConfig,
    private group: Group,
    private sender: MessageSend
  ) {}

  async init() {
    const vscodeConnect = new VscodeConnectClient(this.sender);
    // 如果开启了自动连接vscode，则自动连接
    // 使用tx来确保service_worker恢复时不会再执行
    cacheInstance.tx("vscodeReconnect", async (init) => {
      if (!init) {
        if (await this.systemConfig.getVscodeReconnect()) {
          // 调用连接
          vscodeConnect.connect({
            url: await this.systemConfig.getVscodeUrl(),
            reconnect: true,
          });
        }
      }
      return true;
    });
    this.group.on("connectVSCode", (params) => {
      return vscodeConnect.connect(params);
    });
    this.group.on("loadFavicon", async (url) => {
      // 加载favicon图标
      // 对url做一个缓存
      const cacheKey = `${CACHE_KEY_FAVICON}${url}`;
      return cacheInstance.getOrSet(cacheKey, async () => {
        return fetch(url)
          .then((response) => response.blob())
          .then((blob) => createObjectURL(this.sender, blob, true))
          .catch(() => {
            return "";
          });
      });
    });
  }
}
