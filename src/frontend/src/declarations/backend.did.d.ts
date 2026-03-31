/* eslint-disable */
// @ts-nocheck

import type { ActorMethod } from '@icp-sdk/core/agent';
import type { IDL } from '@icp-sdk/core/candid';

export interface Network {
  id: bigint;
  name: string;
  rpcUrl: string;
}

export interface MonitoredAddress {
  addrLabel: string;
  address: string;
  id: bigint;
  minBalance: number;
  networkId: bigint;
}

export interface BalanceResult {
  addressId: bigint;
  balance: string;
  hasError: boolean;
  isBelowThreshold: boolean;
}

export interface _SERVICE {
  addAddress: ActorMethod<[string, string, bigint, number], bigint>;
  addNetwork: ActorMethod<[string, string], bigint>;
  fetchAllBalances: ActorMethod<[], Array<BalanceResult>>;
  fetchBalance: ActorMethod<[bigint], BalanceResult>;
  getAddresses: ActorMethod<[], Array<MonitoredAddress>>;
  getNetworks: ActorMethod<[], Array<Network>>;
  removeAddress: ActorMethod<[bigint], boolean>;
  removeNetwork: ActorMethod<[bigint], boolean>;
  updateAddress: ActorMethod<[bigint, string, string, bigint, number], boolean>;
  updateNetwork: ActorMethod<[bigint, string, string], boolean>;
}

export declare const idlService: IDL.ServiceClass;
export declare const idlInitArgs: IDL.Type[];
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
