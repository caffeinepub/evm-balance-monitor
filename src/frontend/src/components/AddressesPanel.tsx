import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Edit2,
  Loader2,
  Plus,
  Trash2,
  Wallet,
  WifiOff,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { BalanceResult } from "../backend";
import {
  useAddAddress,
  useAddresses,
  useNetworks,
  useRemoveAddress,
  useUpdateAddress,
} from "../hooks/useQueries";

// ── Utility ──────────────────────────────────────────────────────────────────

export function hexWeiToEth(hex: string): string {
  if (!hex || hex === "Error" || !hex.startsWith("0x")) return "Error";
  try {
    const wei = BigInt(hex);
    const whole = wei / BigInt("1000000000000000000");
    const rem = wei % BigInt("1000000000000000000");
    return (Number(whole) + Number(rem) / 1e18).toFixed(6);
  } catch {
    return "Error";
  }
}

function isValidEvmAddress(addr: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(addr);
}

// ── Types ────────────────────────────────────────────────────────────────────

interface AddrForm {
  addrLabel: string;
  address: string;
  networkId: string;
  minBalance: string;
}

type AddrFormErrors = Partial<AddrForm>;

const emptyForm: AddrForm = {
  addrLabel: "",
  address: "",
  networkId: "",
  minBalance: "0.01",
};

function validateForm(form: AddrForm, hasNetworks: boolean): AddrFormErrors {
  const err: AddrFormErrors = {};
  if (!form.addrLabel.trim()) err.addrLabel = "Label is required";
  if (!form.address.trim()) err.address = "Address is required";
  else if (!isValidEvmAddress(form.address.trim()))
    err.address = "Must be 0x + 40 hex chars";
  if (!form.networkId && hasNetworks) err.networkId = "Select a network";
  const mb = Number.parseFloat(form.minBalance);
  if (Number.isNaN(mb) || mb < 0)
    err.minBalance = "Enter a non-negative number";
  return err;
}

// ── Props ────────────────────────────────────────────────────────────────────

interface AddressesPanelProps {
  balanceMap: Map<string, BalanceResult>;
  lastRefreshed: Date | null;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function AddressesPanel({
  balanceMap,
  lastRefreshed,
}: AddressesPanelProps) {
  const { data: addresses = [], isLoading: loadingAddresses } = useAddresses();
  const { data: networks = [], isLoading: loadingNetworks } = useNetworks();
  const addAddress = useAddAddress();
  const updateAddress = useUpdateAddress();
  const removeAddress = useRemoveAddress();

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<AddrForm>(emptyForm);
  const [addErrors, setAddErrors] = useState<AddrFormErrors>({});

  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [editForm, setEditForm] = useState<AddrForm>(emptyForm);
  const [editErrors, setEditErrors] = useState<AddrFormErrors>({});

  const networkName = (id: bigint) =>
    networks.find((n) => n.id === id)?.name ?? `#${id.toString()}`;

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm(addForm, networks.length > 0);
    if (Object.keys(errors).length > 0) {
      setAddErrors(errors);
      return;
    }
    await addAddress.mutateAsync({
      addrLabel: addForm.addrLabel.trim(),
      address: addForm.address.trim(),
      networkId: BigInt(addForm.networkId),
      minBalance: Number.parseFloat(addForm.minBalance),
    });
    setAddForm(emptyForm);
    setAddErrors({});
    setShowAdd(false);
  };

  const startEdit = (a: (typeof addresses)[number]) => {
    setEditingId(a.id);
    setEditForm({
      addrLabel: a.addrLabel,
      address: a.address,
      networkId: a.networkId.toString(),
      minBalance: a.minBalance.toString(),
    });
    setEditErrors({});
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    const errors = validateForm(editForm, networks.length > 0);
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }
    await updateAddress.mutateAsync({
      id: editingId,
      addrLabel: editForm.addrLabel.trim(),
      address: editForm.address.trim(),
      networkId: BigInt(editForm.networkId),
      minBalance: Number.parseFloat(editForm.minBalance),
    });
    setEditingId(null);
  };

  const handleDelete = async (id: bigint) => {
    await removeAddress.mutateAsync(id);
  };

  const isLoading = loadingAddresses || loadingNetworks;

  return (
    <TooltipProvider>
      <div className="max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-display font-semibold text-foreground">
              Monitored Addresses
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {lastRefreshed
                ? `Last updated: ${lastRefreshed.toLocaleTimeString()}`
                : "Click Refresh to fetch balances"}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setShowAdd(!showAdd);
              setAddForm(emptyForm);
              setAddErrors({});
            }}
            disabled={networks.length === 0}
            title={networks.length === 0 ? "Add a network first" : undefined}
            data-ocid="addresses.primary_button"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Address
          </Button>
        </div>

        {/* Network prerequisite hint */}
        {!loadingNetworks && networks.length === 0 && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-warning/10 border border-warning/30 flex items-center gap-2.5">
            <WifiOff className="w-4 h-4 text-warning shrink-0" />
            <p className="text-sm text-warning">
              Add at least one network in the <strong>Networks</strong> tab
              before monitoring addresses.
            </p>
          </div>
        )}

        {/* Add Form */}
        <AnimatePresence>
          {showAdd && (
            <motion.div
              key="add-addr"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="overflow-hidden mb-4"
            >
              <Card className="border-primary/40 bg-card shadow-glow">
                <CardContent className="px-4 py-4">
                  <p className="text-sm font-medium text-foreground mb-3">
                    New Address
                  </p>
                  <form
                    onSubmit={handleAddSubmit}
                    noValidate
                    className="space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="add-label"
                          className="text-xs text-muted-foreground"
                        >
                          Label
                        </Label>
                        <Input
                          id="add-label"
                          placeholder="e.g. Hot Wallet"
                          value={addForm.addrLabel}
                          onChange={(e) =>
                            setAddForm((p) => ({
                              ...p,
                              addrLabel: e.target.value,
                            }))
                          }
                          className="h-9 bg-input/60"
                          data-ocid="addresses.input"
                        />
                        {addErrors.addrLabel && (
                          <p
                            className="text-xs text-destructive"
                            data-ocid="addresses.error_state"
                          >
                            {addErrors.addrLabel}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label
                          htmlFor="add-addr"
                          className="text-xs text-muted-foreground"
                        >
                          EVM Address
                        </Label>
                        <Input
                          id="add-addr"
                          placeholder="0x..."
                          value={addForm.address}
                          onChange={(e) =>
                            setAddForm((p) => ({
                              ...p,
                              address: e.target.value,
                            }))
                          }
                          className="h-9 bg-input/60 font-mono text-xs"
                          data-ocid="addresses.input"
                        />
                        {addErrors.address && (
                          <p
                            className="text-xs text-destructive"
                            data-ocid="addresses.error_state"
                          >
                            {addErrors.address}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Network
                        </Label>
                        <Select
                          value={addForm.networkId}
                          onValueChange={(v) =>
                            setAddForm((p) => ({ ...p, networkId: v }))
                          }
                        >
                          <SelectTrigger
                            className="h-9 bg-input/60"
                            data-ocid="addresses.select"
                          >
                            <SelectValue placeholder="Select network" />
                          </SelectTrigger>
                          <SelectContent>
                            {networks.map((n) => (
                              <SelectItem
                                key={n.id.toString()}
                                value={n.id.toString()}
                              >
                                {n.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {addErrors.networkId && (
                          <p
                            className="text-xs text-destructive"
                            data-ocid="addresses.error_state"
                          >
                            {addErrors.networkId}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label
                          htmlFor="add-threshold"
                          className="text-xs text-muted-foreground"
                        >
                          Min Balance (ETH)
                        </Label>
                        <Input
                          id="add-threshold"
                          type="number"
                          step="0.001"
                          min="0"
                          placeholder="0.01"
                          value={addForm.minBalance}
                          onChange={(e) =>
                            setAddForm((p) => ({
                              ...p,
                              minBalance: e.target.value,
                            }))
                          }
                          className="h-9 bg-input/60"
                          data-ocid="addresses.input"
                        />
                        {addErrors.minBalance && (
                          <p
                            className="text-xs text-destructive"
                            data-ocid="addresses.error_state"
                          >
                            {addErrors.minBalance}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={addAddress.isPending}
                        data-ocid="addresses.submit_button"
                      >
                        {addAddress.isPending && (
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        )}
                        Add
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowAdd(false);
                          setAddErrors({});
                        }}
                        data-ocid="addresses.cancel_button"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div
                className="p-4 space-y-3"
                data-ocid="addresses.loading_state"
              >
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : addresses.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-14 text-center"
                data-ocid="addresses.empty_state"
              >
                <div className="w-12 h-12 rounded-full bg-muted/40 flex items-center justify-center mb-3">
                  <Wallet className="w-5 h-5 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  No addresses monitored
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {networks.length === 0
                    ? "Add a network first, then add addresses"
                    : 'Click "Add Address" to start monitoring'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table data-ocid="addresses.table">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border">
                      <TableHead className="text-xs font-medium text-muted-foreground w-32">
                        Label
                      </TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground">
                        Network
                      </TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground hidden md:table-cell">
                        Address
                      </TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground text-right">
                        Balance
                      </TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground text-right">
                        Threshold
                      </TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground text-center w-16">
                        Status
                      </TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground text-right w-20">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {addresses.map((addr, idx) => {
                      const result = balanceMap.get(addr.id.toString());
                      const isEditing = editingId === addr.id;

                      if (isEditing) {
                        return (
                          <TableRow
                            key={addr.id.toString()}
                            className="bg-accent/30 hover:bg-accent/30"
                            data-ocid={`addresses.item.${idx + 1}`}
                          >
                            <TableCell colSpan={7} className="py-3 px-4">
                              <form onSubmit={handleEditSubmit} noValidate>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                                  <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">
                                      Label
                                    </Label>
                                    <Input
                                      value={editForm.addrLabel}
                                      onChange={(e) =>
                                        setEditForm((p) => ({
                                          ...p,
                                          addrLabel: e.target.value,
                                        }))
                                      }
                                      className="h-8 text-sm bg-input/60"
                                      data-ocid="addresses.input"
                                    />
                                    {editErrors.addrLabel && (
                                      <p
                                        className="text-xs text-destructive"
                                        data-ocid="addresses.error_state"
                                      >
                                        {editErrors.addrLabel}
                                      </p>
                                    )}
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">
                                      Address
                                    </Label>
                                    <Input
                                      value={editForm.address}
                                      onChange={(e) =>
                                        setEditForm((p) => ({
                                          ...p,
                                          address: e.target.value,
                                        }))
                                      }
                                      className="h-8 text-xs font-mono bg-input/60"
                                      data-ocid="addresses.input"
                                    />
                                    {editErrors.address && (
                                      <p
                                        className="text-xs text-destructive"
                                        data-ocid="addresses.error_state"
                                      >
                                        {editErrors.address}
                                      </p>
                                    )}
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">
                                      Network
                                    </Label>
                                    <Select
                                      value={editForm.networkId}
                                      onValueChange={(v) =>
                                        setEditForm((p) => ({
                                          ...p,
                                          networkId: v,
                                        }))
                                      }
                                    >
                                      <SelectTrigger
                                        className="h-8 text-sm bg-input/60"
                                        data-ocid="addresses.select"
                                      >
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {networks.map((n) => (
                                          <SelectItem
                                            key={n.id.toString()}
                                            value={n.id.toString()}
                                          >
                                            {n.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    {editErrors.networkId && (
                                      <p
                                        className="text-xs text-destructive"
                                        data-ocid="addresses.error_state"
                                      >
                                        {editErrors.networkId}
                                      </p>
                                    )}
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">
                                      Min Balance
                                    </Label>
                                    <Input
                                      type="number"
                                      step="0.001"
                                      min="0"
                                      value={editForm.minBalance}
                                      onChange={(e) =>
                                        setEditForm((p) => ({
                                          ...p,
                                          minBalance: e.target.value,
                                        }))
                                      }
                                      className="h-8 text-sm bg-input/60"
                                      data-ocid="addresses.input"
                                    />
                                    {editErrors.minBalance && (
                                      <p
                                        className="text-xs text-destructive"
                                        data-ocid="addresses.error_state"
                                      >
                                        {editErrors.minBalance}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    type="submit"
                                    size="sm"
                                    disabled={updateAddress.isPending}
                                    data-ocid="addresses.save_button"
                                  >
                                    {updateAddress.isPending ? (
                                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                                    ) : (
                                      <Check className="w-3.5 h-3.5 mr-1" />
                                    )}
                                    Save
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingId(null)}
                                    data-ocid="addresses.cancel_button"
                                  >
                                    <X className="w-3.5 h-3.5 mr-1" />
                                    Cancel
                                  </Button>
                                </div>
                              </form>
                            </TableCell>
                          </TableRow>
                        );
                      }

                      const ethBalance =
                        result && !result.hasError
                          ? hexWeiToEth(result.balance)
                          : null;

                      return (
                        <TableRow
                          key={addr.id.toString()}
                          className="group"
                          data-ocid={`addresses.item.${idx + 1}`}
                        >
                          {/* Label */}
                          <TableCell className="py-3 font-medium text-sm">
                            {addr.addrLabel}
                          </TableCell>

                          {/* Network */}
                          <TableCell className="py-3">
                            <Badge
                              variant="secondary"
                              className="text-xs font-normal"
                            >
                              {networkName(addr.networkId)}
                            </Badge>
                          </TableCell>

                          {/* Address (desktop) */}
                          <TableCell className="py-3 hidden md:table-cell">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="font-mono text-xs text-muted-foreground cursor-default">
                                  {addr.address.slice(0, 6)}&hellip;
                                  {addr.address.slice(-4)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                data-ocid="addresses.tooltip"
                              >
                                <p className="font-mono text-xs">
                                  {addr.address}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>

                          {/* Balance */}
                          <TableCell className="py-3 text-right">
                            {result === undefined ? (
                              <span className="text-xs text-muted-foreground/50">
                                —
                              </span>
                            ) : result.hasError ? (
                              <Badge
                                variant="destructive"
                                className="text-xs"
                                data-ocid="addresses.error_state"
                              >
                                Error
                              </Badge>
                            ) : (
                              <span
                                className={`font-mono text-sm font-medium ${
                                  result.isBelowThreshold
                                    ? "text-destructive"
                                    : "text-success"
                                }`}
                              >
                                {ethBalance}
                              </span>
                            )}
                          </TableCell>

                          {/* Threshold */}
                          <TableCell className="py-3 text-right">
                            <span className="font-mono text-xs text-muted-foreground">
                              {addr.minBalance.toFixed(4)}
                            </span>
                          </TableCell>

                          {/* Status */}
                          <TableCell className="py-3 text-center">
                            {result === undefined || result.hasError ? (
                              <span className="text-muted-foreground/30 text-xs">
                                —
                              </span>
                            ) : result.isBelowThreshold ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center justify-center">
                                    <AlertTriangle
                                      className="w-4 h-4 text-destructive"
                                      aria-label="Balance below threshold"
                                    />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent data-ocid="addresses.tooltip">
                                  Balance below threshold!
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <CheckCircle2
                                className="w-4 h-4 text-success mx-auto"
                                aria-label="Balance healthy"
                              />
                            )}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => startEdit(addr)}
                                data-ocid={`addresses.edit_button.${idx + 1}`}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                    data-ocid={`addresses.delete_button.${idx + 1}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent data-ocid="addresses.dialog">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Remove Address
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Stop monitoring &ldquo;
                                      {addr.addrLabel}&rdquo;?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel data-ocid="addresses.cancel_button">
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                      onClick={() => handleDelete(addr.id)}
                                      data-ocid="addresses.confirm_button"
                                    >
                                      Remove
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {addresses.length > 0 && balanceMap.size === 0 && (
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Hit{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-muted/60 font-mono text-xs">
              Refresh
            </kbd>{" "}
            to fetch current balances
          </p>
        )}
      </div>
    </TooltipProvider>
  );
}
