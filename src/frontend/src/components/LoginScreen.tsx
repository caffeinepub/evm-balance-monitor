import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Activity, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const ACCESS_PASSWORD = "dyfqpl";

export default function LoginScreen() {
  const { login, isLoggingIn } = useInternetIdentity();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);

  const handleVerify = () => {
    if (password === ACCESS_PASSWORD) {
      setVerified(true);
      setError("");
    } else {
      setError("密码错误，请重试");
      setPassword("");
    }
  };

  const handleLogin = () => {
    if (!verified) return;
    login();
  };

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
            请先输入访问密码，验证通过后方可登录。
          </p>
        </div>

        {/* Password input */}
        {!verified && (
          <div className="mb-4">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="输入访问密码"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                className="pr-10 text-foreground bg-input/60"
                data-ocid="login.password_input"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {error && (
              <p className="text-destructive text-xs mt-1.5 pl-1">{error}</p>
            )}
            <Button
              className="w-full mt-3"
              variant="outline"
              onClick={handleVerify}
              disabled={password.length === 0}
              data-ocid="login.verify_button"
            >
              验证密码
            </Button>
          </div>
        )}

        {/* Verified indicator */}
        {verified && (
          <div className="flex items-center gap-2 text-sm text-green-400 mb-4 px-1">
            <ShieldCheck className="w-4 h-4" />
            <span>密码验证通过</span>
          </div>
        )}

        {/* Login button */}
        <Button
          className="w-full"
          onClick={handleLogin}
          disabled={!verified || isLoggingIn}
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
