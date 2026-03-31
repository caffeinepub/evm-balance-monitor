/* eslint-disable */

// @ts-nocheck

import { IDL } from '@icp-sdk/core/candid';

const HttpHeader = IDL.Record({ name: IDL.Text, value: IDL.Text });

const HttpRequestResult = IDL.Record({
  body: IDL.Vec(IDL.Nat8),
  headers: IDL.Vec(HttpHeader),
  status: IDL.Nat,
});

const TransformationInput = IDL.Record({
  context: IDL.Vec(IDL.Nat8),
  response: HttpRequestResult,
});

const TransformationOutput = IDL.Record({
  body: IDL.Vec(IDL.Nat8),
  headers: IDL.Vec(HttpHeader),
  status: IDL.Nat,
});

const Network = IDL.Record({
  id: IDL.Nat,
  name: IDL.Text,
  rpcUrl: IDL.Text,
});

const MonitoredAddress = IDL.Record({
  addrLabel: IDL.Text,
  address: IDL.Text,
  id: IDL.Nat,
  minBalance: IDL.Float64,
  networkId: IDL.Nat,
});

const BalanceResult = IDL.Record({
  addressId: IDL.Nat,
  balance: IDL.Text,
  hasError: IDL.Bool,
  isBelowThreshold: IDL.Bool,
});

const serviceDefinition = {
  addAddress: IDL.Func([IDL.Text, IDL.Text, IDL.Nat, IDL.Float64], [IDL.Nat], []),
  addNetwork: IDL.Func([IDL.Text, IDL.Text], [IDL.Nat], []),
  fetchAllBalances: IDL.Func([], [IDL.Vec(BalanceResult)], []),
  fetchBalance: IDL.Func([IDL.Nat], [BalanceResult], []),
  getAddresses: IDL.Func([], [IDL.Vec(MonitoredAddress)], ['query']),
  getNetworks: IDL.Func([], [IDL.Vec(Network)], ['query']),
  removeAddress: IDL.Func([IDL.Nat], [IDL.Bool], []),
  removeNetwork: IDL.Func([IDL.Nat], [IDL.Bool], []),
  transform: IDL.Func([TransformationInput], [TransformationOutput], ['query']),
  updateAddress: IDL.Func([IDL.Nat, IDL.Text, IDL.Text, IDL.Nat, IDL.Float64], [IDL.Bool], []),
  updateNetwork: IDL.Func([IDL.Nat, IDL.Text, IDL.Text], [IDL.Bool], []),
};

export const idlService = IDL.Service(serviceDefinition);
export const idlInitArgs = [];
export const idlFactory = ({ IDL }) => { return IDL.Service(serviceDefinition); };
export const init = ({ IDL }) => { return []; };
