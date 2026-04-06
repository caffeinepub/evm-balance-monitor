import { Button } from "@/components/ui/button";
import { Activity, Loader2 } from "lucide-react";
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
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/20 ring-1 ring-primary/30 mb-4">
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <h1 className="font-display font-semibold text-xl text-foreground tracking-tight text-center">
            EVM Balance Monitor
          </h1>
          <p className="text-muted-foreground text-sm text-center mt-2 leading-relaxed">
            使用 Internet Identity 登录以访问您的 EVM 余额监控面板。
          </p>
        </div>

        <Button
          className="w-full"
          onClick={login}
          disabled={isLoggingIn}
          data-ocid="login.login_button"
        >
          {isLoggingIn ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              登录中...
            </>
          ) : (
            "使用 Internet Identity 登录"
          )}
        </Button>
      </motion.div>
    </div>
  );
}
