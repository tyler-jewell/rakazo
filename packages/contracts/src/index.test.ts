import { describe, expect, it } from "vitest";
import * as contracts from "./index.js";
import {
  appContract,
  CreateBotInput,
  DeploymentSettingsSchema,
  MeSchema,
  ProductEventType,
} from "./index.js";

describe("contracts", () => {
  it("parses bot create input", () => {
    const parsed = CreateBotInput.parse({ name: "Chief" });
    expect(parsed.title).toBe("");
    expect(parsed.notifyOnFinish).toBe(true);
  });

  it("exposes the product rpc surface", () => {
    expect(appContract.models.beginOAuth).toBeTruthy();
    expect(appContract.models.completeOAuth).toBeTruthy();
    expect(appContract.bots.create).toBeTruthy();
    expect(appContract.bots.archive).toBeTruthy();
    expect(appContract.bots.restore).toBeTruthy();
    expect(appContract.bots.remove).toBeTruthy();
    expect(appContract.threads.subscribe).toBeTruthy();
    expect("notifications" in appContract).toBe(false);
    expect(ProductEventType.options).toContain("thread.message.created");
    expect(ProductEventType.options).toContain("thread.subagent");
    expect(ProductEventType.options).toContain("bot.spawned");
  });

  it("does not export a native window-shell contract or host-computer choice", () => {
    expect(["Rakazo", "Desktop"].join("") in contracts).toBe(false);
    expect(Object.keys(MeSchema.shape)).not.toContain("computerHost");
    expect(Object.keys(MeSchema.shape)).not.toContain("canChooseHostComputer");
    expect(Object.keys(DeploymentSettingsSchema.shape)).not.toContain("computerHost");
    expect(Object.keys(DeploymentSettingsSchema.shape)).not.toContain("canChooseHostComputer");
  });
});
