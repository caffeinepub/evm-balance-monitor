import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { Switch } from "@/components/ui/switch";
import {
  Activity,
  Loader2,
  LogOut,
  Network,
  Radio,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { BalanceResult } from "./backend";
import AddressesPanel from "./components/AddressesPanel";
import LoginScreen from "./components/LoginScreen";
import NetworksPanel from "./components/NetworksPanel";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";

type Panel = "addresses" | "networks";

export default function App() {
  const { identity, clear, isInitializing } = useInternetIdentity();
  const { actor, isFetching: isActorFetching } = useActor();

  const [activePanel, setActivePanel] = useState<Panel>("addresses");
  const [balanceMap, setBalanceMap] = useState<Map<string, BalanceResult>>(
    new Map(),
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [warningCount, setWarningCount] = useState(0);

  const isRefreshingRef = useRef(false);

  const handleRefresh = useCallback(async () => {
    if (!actor || isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    setIsRefreshing(true);
    try {
      const results = await actor.fetchAllBalances();
      const map = new Map<string, BalanceResult>();
      let warnings = 0;
      for (const r of results) {
        map.set(r.addressId.toString(), r);
        if (r.isBelowThreshold && !r.hasError) warnings++;
      }
      setBalanceMap(map);
      setWarningCount(warnings);
      setLastRefreshed(new Date());
    } catch (err) {
      toast.error("Failed to fetch balances");
      console.error(err);
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    }
  }, [actor]);

  // Initial fetch once actor is ready
  const prevActorRef = useRef<typeof actor>(null);
  useEffect(() => {
    if (actor && actor !== prevActorRef.current) {
      prevActorRef.current = actor;
      handleRefresh();
    }
  }, [actor, handleRefresh]);

  // Auto-refresh interval
  const handleRefreshRef = useRef(handleRefresh);
  useEffect(() => {
    handleRefreshRef.current = handleRefresh;
  });
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      handleRefreshRef.current();
    }, 30_000);
    return () => clearInterval(id);
  }, [autoRefresh]);

  // ── Auth gate ──────────────────────────────────────────────────────────
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  if (!isAuthenticated) {
    return (
      <>
        <LoginScreen />
        <Toaster richColors position="top-right" />
      </>
    );
  }
  // ── End auth gate ─────────────────────────────────────────────────────

  const navItems: { id: Panel; label: string; icon: React.ReactNode }[] = [
    {
      id: "addresses",
      label: "Addresses",
      icon: <Wallet className="w-4 h-4" />,
    },
    {
      id: "networks",
      label: "Networks",
      icon: <Network className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Top Header ────────────────────────────────────────────────── */}
      <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6 shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary/20 ring-1 ring-primary/30">
            <Activity className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="font-display font-semibold text-base text-foreground tracking-tight">
            EVM Balance Monitor
          </span>
          {warningCount > 0 && (
            <Badge
              className="bg-destructive/20 text-destructive border-destructive/30 text-xs h-5"
              variant="outline"
            >
              {warningCount} alert{warningCount !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          {/* Auto-refresh toggle */}
          <div className="hidden sm:flex items-center gap-2">
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
              data-ocid="app.switch"
            />
            <Label
              htmlFor="auto-refresh"
              className="text-xs text-muted-foreground cursor-pointer select-none"
            >
              {autoRefresh ? (
                <span className="flex items-center gap-1">
                  <Radio className="w-3 h-3 text-success animate-pulse-dot" />
                  Auto
                </span>
              ) : (
                "Auto"
              )}
            </Label>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isActorFetching}
            className="h-8"
            data-ocid="app.primary_button"
          >
            {isRefreshing ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            )}
            Refresh
          </Button>

          {/* Logout button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={clear}
            className="h-8 text-muted-foreground hover:text-foreground"
            title="Logout"
            data-ocid="app.secondary_button"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline ml-1.5">Logout</span>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Desktop Sidebar ──────────────────────────────────────────── */}
        <aside className="hidden md:flex w-52 border-r border-border bg-sidebar flex-col py-4 shrink-0">
          <div className="px-3 mb-2">
            <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-widest px-3 mb-1">
              Navigation
            </p>
          </div>
          <nav className="px-3 space-y-0.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActivePanel(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  activePanel === item.id
                    ? "bg-primary/15 text-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
                data-ocid={`nav.${item.id}.link`}
              >
                {item.icon}
                {item.label}
                {item.id === "addresses" && warningCount > 0 && (
                  <span className="ml-auto text-xs bg-destructive/20 text-destructive rounded-full px-1.5 py-0.5">
                    {warningCount}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Sidebar footer status */}
          <div className="mt-auto px-4 pb-2">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  autoRefresh
                    ? "bg-success animate-pulse-dot"
                    : "bg-muted-foreground/30"
                }`}
              />
              <span className="text-xs text-muted-foreground/50">
                {autoRefresh ? "Auto-refreshing" : "Manual mode"}
              </span>
            </div>
          </div>
        </aside>

        {/* ── Mobile Tab Bar ───────────────────────────────────────────── */}
        <div className="md:hidden border-b border-border bg-card flex shrink-0 absolute top-14 left-0 right-0 z-30">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActivePanel(item.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                activePanel === item.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              data-ocid={`nav.${item.id}.tab`}
            >
              {item.icon}
              {item.label}
              {item.id === "addresses" && warningCount > 0 && (
                <span className="text-xs bg-destructive/20 text-destructive rounded-full px-1.5 py-0">
                  {warningCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Main Content ─────────────────────────────────────────────── */}
        <main className="flex-1 overflow-auto p-4 md:p-6 pt-14 md:pt-6">
          <AnimatePresence mode="wait">
            {activePanel === "addresses" ? (
              <motion.div
                key="addresses"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                <AddressesPanel
                  balanceMap={balanceMap}
                  lastRefreshed={lastRefreshed}
                />
              </motion.div>
            ) : (
              <motion.div
                key="networks"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                <NetworksPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-3 px-6 flex items-center justify-between">
        <p className="text-xs text-muted-foreground/50">
          &copy; {new Date().getFullYear()} EVM Balance Monitor
        </p>
        <p className="text-xs text-muted-foreground/40">
          Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              window.location.hostname,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary/60 hover:text-primary transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>

      <Toaster richColors position="top-right" />
    </div>
  );
}
