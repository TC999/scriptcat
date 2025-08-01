import { Message } from "@arco-design/web-react";
import ChromeStorage from "./chrome_storage";
import { defaultConfig } from "../../../packages/eslint/linter-config";
import type { FileSystemType } from "@Packages/filesystem/factory";
import type { MessageQueue } from "@Packages/message/message_queue";
import { changeLanguage, matchLanguage } from "@App/locales/locales";
import { ExtVersion } from "@App/app/const";

export const SystamConfigChange = "systemConfigChange";

export type CloudSyncConfig = {
  enable: boolean;
  syncDelete: boolean;
  syncStatus: boolean;
  filesystem: FileSystemType;
  params: { [key: string]: any };
};

export type CATFileStorage = {
  filesystem: FileSystemType;
  params: { [key: string]: any };
  status: "unset" | "success" | "error";
};

export class SystemConfig {
  public cache = new Map<string, any>();

  public storage = new ChromeStorage("system", true);

  constructor(private mq: MessageQueue) {
    this.mq.subscribe(SystamConfigChange, (msg) => {
      const { key, value } = msg;
      this.cache.set(key, value);
    });
  }

  addListener(key: string, callback: (value: any) => void) {
    this.mq.subscribe(SystamConfigChange, (data: { key: string; value: string }) => {
      if (data.key !== key) {
        return;
      }
      const { value } = data;
      callback(value);
    });
  }

  async getAll(): Promise<{ [key: string]: any }> {
    const ret: { [key: string]: any } = {};
    const list = await this.storage.keys();
    Object.keys(list).forEach((key) => {
      this.cache.set(key, list[key]);
      ret[key] = list[key];
    });
    return ret;
  }

  get<T>(key: string, defaultValue: T): Promise<T> {
    if (this.cache.has(key)) {
      return Promise.resolve(this.cache.get(key));
    }
    return this.storage.get(key).then((val) => {
      if (val === undefined) {
        return defaultValue;
      }
      this.cache.set(key, val);
      return val;
    });
  }

  public set(key: string, val: any) {
    if (val === undefined) {
      this.cache.delete(key);
      this.storage.remove(key);
    } else {
      this.cache.set(key, val);
      this.storage.set(key, val);
    }
    // 发送消息通知更新
    this.mq.publish(SystamConfigChange, {
      key,
      value: val,
    });
  }

  public getChangetime() {
    return this.get("changetime", 0);
  }

  public setChangetime(n: number) {
    this.set("changetime", n);
  }

  // 检查更新周期,单位为秒
  public getCheckScriptUpdateCycle() {
    return this.get("check_script_update_cycle", 86400);
  }

  public setCheckScriptUpdateCycle(n: number) {
    this.set("check_script_update_cycle", n);
  }

  public getSilenceUpdateScript() {
    return this.get("silence_update_script", false);
  }

  public setSilenceUpdateScript(val: boolean) {
    this.set("silence_update_script", val);
  }

  public getEnableAutoSync() {
    return this.get("enable_auto_sync", true);
  }

  public setEnableAutoSync(enable: boolean) {
    this.set("enable_auto_sync", enable);
  }

  // 更新已经禁用的脚本
  public getUpdateDisableScript() {
    return this.get("update_disable_script", true);
  }

  public setUpdateDisableScript(enable: boolean) {
    this.set("update_disable_script", enable);
  }

  public getVscodeUrl() {
    return this.get("vscode_url", "ws://localhost:8642");
  }

  public setVscodeUrl(val: string) {
    this.set("vscode_url", val);
  }

  public getVscodeReconnect() {
    return this.get("vscode_reconnect", false);
  }

  public setVscodeReconnect(val: boolean) {
    this.set("vscode_reconnect", val);
  }

  public getBackup(): Promise<{
    filesystem: FileSystemType;
    params: { [key: string]: any };
  }> {
    return this.get("backup", {
      filesystem: "webdav",
      params: {},
    });
  }

  public setBackup(data: { filesystem: FileSystemType; params: { [key: string]: any } }) {
    this.set("backup", data);
  }

  getCloudSync(): Promise<CloudSyncConfig> {
    return this.get("cloud_sync", {
      enable: false,
      syncDelete: true,
      syncStatus: true,
      filesystem: "webdav",
      params: {},
    });
  }

  setCloudSync(data: CloudSyncConfig) {
    this.set("cloud_sync", data);
  }

  getCatFileStorage(): Promise<CATFileStorage> {
    return this.get("cat_file_storage", {
      status: "unset",
      filesystem: "webdav",
      params: {},
    });
  }

  setCatFileStorage(data: CATFileStorage | undefined) {
    this.set("cat_file_storage", data);
  }

  getEnableEslint() {
    return this.get("enable_eslint", true);
  }

  setEnableEslint(val: boolean) {
    this.set("enable_eslint", val);
  }

  getEslintConfig() {
    return this.get("eslint_config", defaultConfig);
  }

  setEslintConfig(v: string) {
    if (v === "") {
      this.set("eslint_config", undefined);
      Message.success("ESLint规则已重置");
      return;
    }
    try {
      JSON.parse(v);
      this.set("eslint_config", v);
      Message.success("ESLint规则已保存");
    } catch (err: any) {
      Message.error(err.toString());
    }
  }

  // 日志清理周期
  getLogCleanCycle() {
    return this.get("log_clean_cycle", 7);
  }

  setLogCleanCycle(val: number) {
    this.set("log_clean_cycle", val);
  }

  // 设置脚本列表列宽度
  getScriptListColumnWidth() {
    return this.get<{ [key: string]: number }>("script_list_column_width", {});
  }

  setScriptListColumnWidth(val: { [key: string]: number }) {
    this.set("script_list_column_width", val);
  }

  // 展开菜单数
  getMenuExpandNum() {
    return this.get("menu_expand_num", 5);
  }

  setMenuExpandNum(val: number) {
    this.set("menu_expand_num", val);
  }

  async getLanguage() {
    if (globalThis.localStorage) {
      const cachedLanguage = localStorage.getItem("language");
      if (cachedLanguage) {
        return cachedLanguage;
      }
    }
    const lng = await this.get("language", (await matchLanguage()) || chrome.i18n.getUILanguage());
    // 设置进入缓存
    if (globalThis.localStorage) {
      localStorage.setItem("language", lng);
    }
    return lng;
  }

  setLanguage(value: string) {
    this.set("language", value);
    changeLanguage(value);
    if (globalThis.localStorage) {
      localStorage.setItem("language", value);
    }
  }

  setCheckUpdate(data: { notice: string; version: string; isRead: boolean }) {
    this.set("check_update", {
      notice: data.notice,
      version: data.version,
      isRead: data.isRead,
    });
  }

  getCheckUpdate(): Promise<Parameters<typeof this.setCheckUpdate>[0]> {
    return this.get("check_update", {
      notice: "",
      isRead: false,
      version: ExtVersion,
    });
  }

  setEnableScript(enable: boolean) {
    if (chrome.extension.inIncognitoContext) {
      return this.set("enable_script_incognito", enable);
    }
    this.set("enable_script", enable);
  }

  async getEnableScript(): Promise<boolean> {
    const enableScript = await this.get("enable_script", true);
    if (chrome.extension.inIncognitoContext) {
      // 如果是隐身窗口，主窗口设置为false，直接返回false
      if (enableScript === false) {
        return false;
      }
      return this.get("enable_script_incognito", true);
    }
    return enableScript;
  }

  setBlacklist(blacklist: string) {
    this.set("blacklist", blacklist);
  }

  getBlacklist(): Promise<string> {
    return this.get("blacklist", "");
  }

  // 设置徽标数字类型，不显示，运行次数，脚本个数
  setBadgeNumberType(type: "none" | "run_count" | "script_count") {
    this.set("badge_number_type", type);
  }

  getBadgeNumberType(): Promise<"none" | "run_count" | "script_count"> {
    return this.get("badge_number_type", "run_count");
  }

  setBadgeBackgroundColor(color: string) {
    this.set("badge_background_color", color);
  }

  getBadgeBackgroundColor(): Promise<string> {
    return this.get("badge_background_color", "#4e5969");
  }

  setBadgeTextColor(color: string) {
    this.set("badge_text_color", color);
  }

  getBadgeTextColor(): Promise<string> {
    return this.get("badge_text_color", "#ffffff");
  }

  // 设置显示脚本注册的菜单，不在浏览器中显示，全部显示
  setScriptMenuDisplayType(type: "no_browser" | "all") {
    this.set("script_menu_display_type", type);
  }

  getScriptMenuDisplayType(): Promise<"no_browser" | "all"> {
    return this.get("script_menu_display_type", "all");
  }
}
