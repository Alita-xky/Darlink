/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activity from "../activity.js";
import type * as ai from "../ai.js";
import type * as aiPreview from "../aiPreview.js";
import type * as auth from "../auth.js";
import type * as chats from "../chats.js";
import type * as lib_darwin from "../lib/darwin.js";
import type * as lib_distill from "../lib/distill.js";
import type * as lib_migrate_v2 from "../lib/migrate_v2.js";
import type * as matchEngine from "../matchEngine.js";
import type * as matchEngineInternal from "../matchEngineInternal.js";
import type * as matches from "../matches.js";
import type * as nuwa from "../nuwa.js";
import type * as profile from "../profile.js";
import type * as seed from "../seed.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activity: typeof activity;
  ai: typeof ai;
  aiPreview: typeof aiPreview;
  auth: typeof auth;
  chats: typeof chats;
  "lib/darwin": typeof lib_darwin;
  "lib/distill": typeof lib_distill;
  "lib/migrate_v2": typeof lib_migrate_v2;
  matchEngine: typeof matchEngine;
  matchEngineInternal: typeof matchEngineInternal;
  matches: typeof matches;
  nuwa: typeof nuwa;
  profile: typeof profile;
  seed: typeof seed;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
