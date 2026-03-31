import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { MonitoredAddress, Network } from "../backend";
import { useActor } from "./useActor";

// ── Networks ────────────────────────────────────────────────────────────────

export function useNetworks() {
  const { actor, isFetching } = useActor();
  return useQuery<Network[]>({
    queryKey: ["networks"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getNetworks();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddNetwork() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, rpcUrl }: { name: string; rpcUrl: string }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.addNetwork(name, rpcUrl);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["networks"] });
      toast.success("Network added");
    },
    onError: (err: Error) => {
      toast.error(`Failed to add network: ${err.message}`);
    },
  });
}

export function useUpdateNetwork() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      rpcUrl,
    }: {
      id: bigint;
      name: string;
      rpcUrl: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updateNetwork(id, name, rpcUrl);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["networks"] });
      toast.success("Network updated");
    },
    onError: (err: Error) => {
      toast.error(`Failed to update network: ${err.message}`);
    },
  });
}

export function useRemoveNetwork() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.removeNetwork(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["networks"] });
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Network removed");
    },
    onError: (err: Error) => {
      toast.error(`Failed to remove network: ${err.message}`);
    },
  });
}

// ── Addresses ───────────────────────────────────────────────────────────────

export function useAddresses() {
  const { actor, isFetching } = useActor();
  return useQuery<MonitoredAddress[]>({
    queryKey: ["addresses"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAddresses();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddAddress() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      addrLabel: string;
      address: string;
      networkId: bigint;
      minBalance: number;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.addAddress(
        params.addrLabel,
        params.address,
        params.networkId,
        params.minBalance,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Address added");
    },
    onError: (err: Error) => {
      toast.error(`Failed to add address: ${err.message}`);
    },
  });
}

export function useUpdateAddress() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: bigint;
      addrLabel: string;
      address: string;
      networkId: bigint;
      minBalance: number;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updateAddress(
        params.id,
        params.addrLabel,
        params.address,
        params.networkId,
        params.minBalance,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Address updated");
    },
    onError: (err: Error) => {
      toast.error(`Failed to update address: ${err.message}`);
    },
  });
}

export function useRemoveAddress() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.removeAddress(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Address removed");
    },
    onError: (err: Error) => {
      toast.error(`Failed to remove address: ${err.message}`);
    },
  });
}
