import { z } from "zod";

export const bridgeCommandSchema = z.object({
  name: z.string(),
  jsName: z.string(),
  swiftMethod: z.string(),
  description: z.string().optional(),
});

export const screenSchema = z.object({
  id: z.string(),
  path: z.string(),
  title: z.string(),
  description: z.string().optional(),
});

export const assetEntrySchema = z.object({
  id: z.string(),
  /** Repo-relative or generator-resolved path */
  source: z.string(),
  role: z.enum(["font", "icon", "image", "webBundle"]),
});

export const minervaIrSchema = z.object({
  version: z.literal("1"),
  app: z.object({
    bundleId: z.string(),
    displayName: z.string(),
    executableModule: z.string(),
    swiftProductName: z.string(),
  }),
  bridge: z.object({
    jsGlobal: z.string(),
    messageHandler: z.string(),
    commands: z.array(bridgeCommandSchema),
  }),
  tokens: z.record(z.string(), z.string()).default({}),
  screens: z.array(screenSchema),
  assets: z.object({
    entries: z.array(assetEntrySchema),
  }),
});

export type MinervaIr = z.infer<typeof minervaIrSchema>;
export type BridgeCommand = z.infer<typeof bridgeCommandSchema>;

export function parseMinervaIr(data: unknown): MinervaIr {
  return minervaIrSchema.parse(data);
}

export function safeParseMinervaIr(data: unknown) {
  return minervaIrSchema.safeParse(data);
}
