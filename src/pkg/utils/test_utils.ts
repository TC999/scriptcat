// eslint-disable-next-line import/no-extraneous-dependencies
import "fake-indexeddb/auto";
import LoggerCore from "@App/app/logger/core";
import DBWriter from "@App/app/logger/db_writer";
import migrate from "@App/app/migrate";
import { LoggerDAO } from "@App/app/repo/logger";

export default function initTestEnv() {
  // @ts-ignore
  if (global.initTest) {
    return;
  }
  // @ts-ignore
  global.initTest = true;
  migrate();

  const logger = new LoggerCore({
    level: "debug",
    writer: new DBWriter(new LoggerDAO()),
    labels: { env: "tests" },
    debug: true,
  });
  logger.logger().debug("test start");
}