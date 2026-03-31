import type { Principal } from "@icp-sdk/core/principal";

export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;

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

export interface backendInterface {
  addAddress(addrLabel: string, address: string, networkId: bigint, minBalance: number): Promise<bigint>;
  addNetwork(name: string, rpcUrl: string): Promise<bigint>;
  fetchAllBalances(): Promise<Array<BalanceResult>>;
  fetchBalance(addressId: bigint): Promise<BalanceResult>;
  getAddresses(): Promise<Array<MonitoredAddress>>;
  getNetworks(): Promise<Array<Network>>;
  removeAddress(id: bigint): Promise<boolean>;
  removeNetwork(id: bigint): Promise<boolean>;
  updateAddress(id: bigint, addrLabel: string, address: string, networkId: bigint, minBalance: number): Promise<boolean>;
  updateNetwork(id: bigint, name: string, rpcUrl: string): Promise<boolean>;
}
