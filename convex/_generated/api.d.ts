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
import type * as adminAuth from "../adminAuth.js";
import type * as entries from "../entries.js";
import type * as entriesNode from "../entriesNode.js";
import type * as initDatabase from "../initDatabase.js";
import type * as leads from "../leads.js";
import type * as notifications from "../notifications.js";
import type * as payments from "../payments.js";
import type * as raffleMutations from "../raffleMutations.js";
import type * as raffleSync from "../raffleSync.js";
import type * as raffleTesting from "../raffleTesting.js";
import type * as raffleTickets from "../raffleTickets.js";
import type * as robustSync from "../robustSync.js";
import type * as stripeActions from "../stripeActions.js";
import type * as utils from "../utils.js";
import type * as winnerSelection from "../winnerSelection.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  adminAuth: typeof adminAuth;
  entries: typeof entries;
  entriesNode: typeof entriesNode;
  initDatabase: typeof initDatabase;
  leads: typeof leads;
  notifications: typeof notifications;
  payments: typeof payments;
  raffleMutations: typeof raffleMutations;
  raffleSync: typeof raffleSync;
  raffleTesting: typeof raffleTesting;
  raffleTickets: typeof raffleTickets;
  robustSync: typeof robustSync;
  stripeActions: typeof stripeActions;
  utils: typeof utils;
  winnerSelection: typeof winnerSelection;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
