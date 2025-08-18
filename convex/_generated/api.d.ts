/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as entries from "../entries.js";
import type * as entriesNode from "../entriesNode.js";
import type * as leads from "../leads.js";
import type * as payments from "../payments.js";
import type * as raffleActions from "../raffleActions.js";
import type * as raffleMutations from "../raffleMutations.js";
import type * as raffleWinner from "../raffleWinner.js";
import type * as stripeActions from "../stripeActions.js";
import type * as utils from "../utils.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  entries: typeof entries;
  entriesNode: typeof entriesNode;
  leads: typeof leads;
  payments: typeof payments;
  raffleActions: typeof raffleActions;
  raffleMutations: typeof raffleMutations;
  raffleWinner: typeof raffleWinner;
  stripeActions: typeof stripeActions;
  utils: typeof utils;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
