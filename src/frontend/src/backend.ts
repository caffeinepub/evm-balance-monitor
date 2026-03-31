/* eslint-disable */
// @ts-nocheck

import { Actor, HttpAgent, type HttpAgentOptions, type ActorConfig, type Agent, type ActorSubclass } from "@icp-sdk/core/agent";
import type { Principal } from "@icp-sdk/core/principal";
import { idlFactory, type _SERVICE } from "./declarations/backend.did";

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

export class ExternalBlob {
    directURL: string;
    onProgress: ((progress: number) => void) | undefined;
    constructor(directURL: string) { this.directURL = directURL; }
    static fromURL(url: string) { return new ExternalBlob(url); }
    async getBytes(): Promise<Uint8Array> {
        const response = await fetch(this.directURL);
        const buffer = await response.arrayBuffer();
        return new Uint8Array(buffer);
    }
}

export class Backend implements backendInterface {
    constructor(
        private actor: ActorSubclass<_SERVICE>,
        private _uploadFile: (file: ExternalBlob) => Promise<Uint8Array>,
        private _downloadFile: (file: Uint8Array) => Promise<ExternalBlob>,
        private processError?: (error: unknown) => never
    ) {}

    async addAddress(addrLabel: string, address: string, networkId: bigint, minBalance: number): Promise<bigint> {
        return this.actor.addAddress(addrLabel, address, networkId, minBalance);
    }
    async addNetwork(name: string, rpcUrl: string): Promise<bigint> {
        return this.actor.addNetwork(name, rpcUrl);
    }
    async fetchAllBalances(): Promise<Array<BalanceResult>> {
        return this.actor.fetchAllBalances();
    }
    async fetchBalance(addressId: bigint): Promise<BalanceResult> {
        return this.actor.fetchBalance(addressId);
    }
    async getAddresses(): Promise<Array<MonitoredAddress>> {
        return this.actor.getAddresses();
    }
    async getNetworks(): Promise<Array<Network>> {
        return this.actor.getNetworks();
    }
    async removeAddress(id: bigint): Promise<boolean> {
        return this.actor.removeAddress(id);
    }
    async removeNetwork(id: bigint): Promise<boolean> {
        return this.actor.removeNetwork(id);
    }
    async updateAddress(id: bigint, addrLabel: string, address: string, networkId: bigint, minBalance: number): Promise<boolean> {
        return this.actor.updateAddress(id, addrLabel, address, networkId, minBalance);
    }
    async updateNetwork(id: bigint, name: string, rpcUrl: string): Promise<boolean> {
        return this.actor.updateNetwork(id, name, rpcUrl);
    }
}

export interface CreateActorOptions {
    agent?: Agent;
    agentOptions?: HttpAgentOptions;
    actorOptions?: ActorConfig;
    processError?: (error: unknown) => never;
}

export function createActor(
    canisterId: string,
    _uploadFile: (file: ExternalBlob) => Promise<Uint8Array>,
    _downloadFile: (file: Uint8Array) => Promise<ExternalBlob>,
    options: CreateActorOptions = {}
): Backend {
    const agent = options.agent || HttpAgent.createSync({ ...options.agentOptions });
    if (options.agent && options.agentOptions) {
        console.warn("Detected both agent and agentOptions passed to createActor. Ignoring agentOptions and proceeding with the provided agent.");
    }
    const actor = Actor.createActor<_SERVICE>(idlFactory, {
        agent,
        canisterId,
        ...options.actorOptions,
    });
    return new Backend(actor, _uploadFile, _downloadFile, options.processError);
}
