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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Check,
  Edit2,
  Globe,
  Link,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { Network } from "../backend";
import {
  useAddNetwork,
  useNetworks,
  useRemoveNetwork,
  useUpdateNetwork,
} from "../hooks/useQueries";

interface NetworkForm {
  name: string;
  rpcUrl: string;
}

const emptyForm: NetworkForm = { name: "", rpcUrl: "" };

function validateForm(form: NetworkForm): Partial<NetworkForm> {
  const errors: Partial<NetworkForm> = {};
  if (!form.name.trim()) errors.name = "Network name is required";
  if (!form.rpcUrl.trim()) errors.rpcUrl = "RPC URL is required";
  else if (!form.rpcUrl.startsWith("http"))
    errors.rpcUrl = "Must start with http:// or https://";
  return errors;
}

export default function NetworksPanel() {
  const { data: networks = [], isLoading } = useNetworks();
  const addNetwork = useAddNetwork();
  const updateNetwork = useUpdateNetwork();
  const removeNetwork = useRemoveNetwork();

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<NetworkForm>(emptyForm);
  const [addErrors, setAddErrors] = useState<Partial<NetworkForm>>({});

  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [editForm, setEditForm] = useState<NetworkForm>(emptyForm);
  const [editErrors, setEditErrors] = useState<Partial<NetworkForm>>({});

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm(addForm);
    if (Object.keys(errors).length > 0) {
      setAddErrors(errors);
      return;
    }
    await addNetwork.mutateAsync({
      name: addForm.name.trim(),
      rpcUrl: addForm.rpcUrl.trim(),
    });
    setAddForm(emptyForm);
    setAddErrors({});
    setShowAdd(false);
  };

  const startEdit = (network: Network) => {
    setEditingId(network.id);
    setEditForm({ name: network.name, rpcUrl: network.rpcUrl });
    setEditErrors({});
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    const errors = validateForm(editForm);
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }
    await updateNetwork.mutateAsync({
      id: editingId,
      name: editForm.name.trim(),
      rpcUrl: editForm.rpcUrl.trim(),
    });
    setEditingId(null);
  };

  const handleDelete = async (id: bigint) => {
    await removeNetwork.mutateAsync(id);
  };

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-display font-semibold text-foreground">
            RPC Networks
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage EVM network endpoints
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setShowAdd(!showAdd);
            setAddForm(emptyForm);
            setAddErrors({});
          }}
          data-ocid="networks.primary_button"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Network
        </Button>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            key="add-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="overflow-hidden mb-4"
          >
            <Card className="border-primary/40 bg-card shadow-glow">
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-sm font-medium text-foreground">
                  New Network
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <form
                  onSubmit={handleAddSubmit}
                  noValidate
                  className="space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="add-name"
                        className="text-xs text-muted-foreground"
                      >
                        Network Name
                      </Label>
                      <Input
                        id="add-name"
                        placeholder="e.g. Ethereum Mainnet"
                        value={addForm.name}
                        onChange={(e) =>
                          setAddForm((p) => ({ ...p, name: e.target.value }))
                        }
                        data-ocid="networks.input"
                        className="bg-input/60 h-9"
                      />
                      {addErrors.name && (
                        <p
                          className="text-xs text-destructive"
                          data-ocid="networks.error_state"
                        >
                          {addErrors.name}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="add-rpc"
                        className="text-xs text-muted-foreground"
                      >
                        RPC URL
                      </Label>
                      <Input
                        id="add-rpc"
                        placeholder="https://mainnet.infura.io/v3/..."
                        value={addForm.rpcUrl}
                        onChange={(e) =>
                          setAddForm((p) => ({ ...p, rpcUrl: e.target.value }))
                        }
                        data-ocid="networks.input"
                        className="bg-input/60 h-9 font-mono text-xs"
                      />
                      {addErrors.rpcUrl && (
                        <p
                          className="text-xs text-destructive"
                          data-ocid="networks.error_state"
                        >
                          {addErrors.rpcUrl}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={addNetwork.isPending}
                      data-ocid="networks.submit_button"
                    >
                      {addNetwork.isPending && (
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
                      data-ocid="networks.cancel_button"
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

      {/* Network List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3" data-ocid="networks.loading_state">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : networks.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-14 text-center"
              data-ocid="networks.empty_state"
            >
              <div className="w-12 h-12 rounded-full bg-muted/40 flex items-center justify-center mb-3">
                <Globe className="w-5 h-5 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                No networks configured
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Add your first EVM RPC endpoint to get started
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {networks.map((network, idx) => (
                <li
                  key={network.id.toString()}
                  className="p-4"
                  data-ocid={`networks.item.${idx + 1}`}
                >
                  {editingId === network.id ? (
                    <form
                      onSubmit={handleEditSubmit}
                      noValidate
                      className="space-y-3"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            Network Name
                          </Label>
                          <Input
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm((p) => ({
                                ...p,
                                name: e.target.value,
                              }))
                            }
                            className="h-8 text-sm bg-input/60"
                            data-ocid="networks.input"
                          />
                          {editErrors.name && (
                            <p
                              className="text-xs text-destructive"
                              data-ocid="networks.error_state"
                            >
                              {editErrors.name}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            RPC URL
                          </Label>
                          <Input
                            value={editForm.rpcUrl}
                            onChange={(e) =>
                              setEditForm((p) => ({
                                ...p,
                                rpcUrl: e.target.value,
                              }))
                            }
                            className="h-8 text-xs font-mono bg-input/60"
                            data-ocid="networks.input"
                          />
                          {editErrors.rpcUrl && (
                            <p
                              className="text-xs text-destructive"
                              data-ocid="networks.error_state"
                            >
                              {editErrors.rpcUrl}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          size="sm"
                          disabled={updateNetwork.isPending}
                          data-ocid="networks.save_button"
                        >
                          {updateNetwork.isPending ? (
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
                          data-ocid="networks.cancel_button"
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-foreground">
                            {network.name}
                          </span>
                          <Badge
                            variant="secondary"
                            className="text-xs px-1.5 py-0 h-4 font-mono"
                          >
                            #{network.id.toString()}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Link className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                          <p className="text-xs text-muted-foreground font-mono truncate">
                            {network.rpcUrl}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => startEdit(network)}
                          data-ocid={`networks.edit_button.${idx + 1}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              data-ocid={`networks.delete_button.${idx + 1}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent data-ocid="networks.dialog">
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Remove Network
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Remove &ldquo;{network.name}&rdquo;? Addresses
                                assigned to this network will lose their
                                association.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel data-ocid="networks.cancel_button">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                onClick={() => handleDelete(network.id)}
                                data-ocid="networks.confirm_button"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
