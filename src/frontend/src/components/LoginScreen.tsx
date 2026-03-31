import { Button } from "@/components/ui/button";
import { Activity, Loader2, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginScreen() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-card border border-border rounded-xl p-8 max-w-sm w-full shadow-2xl"
        data-ocid="login.card"
      >
        {/* App icon */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/20 ring-1 ring-primary/30 mb-4">
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <h1 className="font-display font-semibold text-xl text-foreground tracking-tight text-center">
            EVM Balance Monitor
          </h1>
          <p className="text-muted-foreground text-sm text-center mt-2 leading-relaxed">
            Sign in with Internet Identity to access your dashboard.
          </p>
        </div>

        {/* Login button */}
        <Button
          className="w-full"
          onClick={login}
          disabled={isLoggingIn}
          data-ocid="login.primary_button"
        >
          {isLoggingIn ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting…
            </>
          ) : (
            <>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Login with Internet Identity
            </>
          )}
        </Button>

        {/* Security note */}
        <p className="text-xs text-muted-foreground/50 text-center mt-3">
          Your data is secured on-chain. Only you can access it.
        </p>
      </motion.div>
    </div>
  );
}
