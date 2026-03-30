import { useState } from "react";
import AdminLayout from "@/layout/AdminLayout";
import { useApiEnvironment, ApiEnvironment } from "@/context/ApiEnvironmentContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useThemeSlider, setAdminThemeDefault } from "@/context/ThemeSliderContext";
import * as SliderPrimitive from "@radix-ui/react-slider";
import {
  Server,
  FlaskConical,
  Train,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  RefreshCw,
  Sun,
  Moon,
  Monitor,
  Palette,
} from "lucide-react";

interface EnvConfig {
  label: string;
  icon: React.ReactNode;
  color: string;
  badgeClass: string;
}

const ENV_META: Record<ApiEnvironment, EnvConfig> = {
  production: {
    label: "Production",
    icon: <Server className="w-4 h-4" />,
    color: "bg-green-500",
    badgeClass: "border-green-500/30 text-green-600 dark:text-green-400",
  },
  staging: {
    label: "Staging",
    icon: <FlaskConical className="w-4 h-4" />,
    color: "bg-amber-500",
    badgeClass: "border-amber-500/30 text-amber-600 dark:text-amber-400",
  },
  railway: {
    label: "Railway (Dev)",
    icon: <Train className="w-4 h-4" />,
    color: "bg-purple-500",
    badgeClass: "border-purple-500/30 text-purple-600 dark:text-purple-400",
  },
};

type ConnectionStatus = "idle" | "testing" | "connected" | "failed";

interface EnvState {
  apiUrl: string;
  apiKeyHint: string;
  privateKeyHint: string;
  status: ConnectionStatus;
  lastTested: string | null;
  errorMessage: string | null;
}

const AdminSettings = () => {
  const { environment, environmentLabel } = useApiEnvironment();
  const { toast } = useToast();
  const { value: themeValue, setValue: setThemeValue, mode: themeMode, setMode: setThemeMode } = useThemeSlider();

  const [adminDefault, setAdminDefault] = useState<"light" | "dark" | "auto">(() => {
    return (localStorage.getItem("healing-buds-theme-admin-default") as any) || "auto";
  });
  const [envStates, setEnvStates] = useState<Record<ApiEnvironment, EnvState>>({
    production: {
      apiUrl: "https://api.drgreennft.com",
      apiKeyHint: "••••••••",
      privateKeyHint: "••••••••",
      status: "idle",
      lastTested: null,
      errorMessage: null,
    },
    staging: {
      apiUrl: "https://stage-api.drgreennft.com",
      apiKeyHint: "••••••••",
      privateKeyHint: "••••••••",
      status: "idle",
      lastTested: null,
      errorMessage: null,
    },
    railway: {
      apiUrl: "https://budstack-backend-main-development.up.railway.app",
      apiKeyHint: "••••••••",
      privateKeyHint: "••••••••",
      status: "idle",
      lastTested: null,
      errorMessage: null,
    },
  });

  const [showKeys, setShowKeys] = useState<Record<ApiEnvironment, boolean>>({
    production: false,
    staging: false,
    railway: false,
  });

  const handleTestConnection = async (env: ApiEnvironment) => {
    setEnvStates((prev) => ({
      ...prev,
      [env]: { ...prev[env], status: "testing" as ConnectionStatus, errorMessage: null },
    }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const response = await supabase.functions.invoke("drgreen-proxy", {
        body: { action: "health-check", environment: env },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) throw response.error;

      const result = response.data;
      const isHealthy = result?.status === "ok" || result?.healthy === true;

      setEnvStates((prev) => ({
        ...prev,
        [env]: {
          ...prev[env],
          status: isHealthy ? "connected" : "failed",
          lastTested: new Date().toISOString(),
          errorMessage: isHealthy ? null : (result?.message || "Health check returned unhealthy"),
        },
      }));

      toast({
        title: isHealthy ? "Connection Successful" : "Connection Failed",
        description: isHealthy
          ? `${ENV_META[env].label} API is reachable and authenticated.`
          : `${ENV_META[env].label}: ${result?.message || "Unhealthy response"}`,
        variant: isHealthy ? "default" : "destructive",
      });
    } catch (error: any) {
      const msg = error?.message || "Connection test failed";
      setEnvStates((prev) => ({
        ...prev,
        [env]: {
          ...prev[env],
          status: "failed",
          lastTested: new Date().toISOString(),
          errorMessage: msg,
        },
      }));

      toast({
        title: "Connection Failed",
        description: msg,
        variant: "destructive",
      });
    }
  };

  const StatusIndicator = ({ status }: { status: ConnectionStatus }) => {
    switch (status) {
      case "testing":
        return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
      case "connected":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <span className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 inline-block" />;
    }
  };

  const environments: ApiEnvironment[] = ["production", "staging", "railway"];

  return (
    <AdminLayout
      title="Settings"
      description="API environment configuration and connection management"
    >
      <div className="space-y-6 max-w-3xl">
        {/* Active Environment Badge */}
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Active Environment:</span>
              <Badge variant="outline" className={ENV_META[environment].badgeClass}>
                <span className={`w-2 h-2 rounded-full mr-2 ${ENV_META[environment].color}`} />
                {environmentLabel}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Switch via the header selector
            </p>
          </CardContent>
        </Card>

        {/* Theme & Appearance */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Palette className="w-4 h-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Theme & Appearance</CardTitle>
                <CardDescription>
                  Control the default site theme for all visitors. Users can override with the ambiance slider.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Default theme preset */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Default Theme for New Visitors</Label>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { key: "light" as const, label: "Light", icon: Sun, desc: "Warm, easy on the eyes" },
                  { key: "dark" as const, label: "Dark", icon: Moon, desc: "Low-light optimised" },
                  { key: "auto" as const, label: "Auto", icon: Monitor, desc: "Follows device setting" },
                ]).map(({ key, label, icon: Icon, desc }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setAdminDefault(key);
                      setAdminThemeDefault(key);
                      toast({ title: "Default theme updated", description: `New visitors will see ${label} mode.` });
                    }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      adminDefault === key
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/30 hover:bg-muted/50"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${adminDefault === key ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-sm font-medium ${adminDefault === key ? "text-foreground" : "text-muted-foreground"}`}>
                      {label}
                    </span>
                    <span className="text-xs text-muted-foreground text-center">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Live preview slider */}
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Live Preview</Label>
                <Badge variant="outline" className="text-xs">
                  {themeMode === "auto" ? "Auto" : `Manual (${themeValue}%)`}
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <Moon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <SliderPrimitive.Root
                  value={[themeValue]}
                  onValueChange={([v]) => setThemeValue(v)}
                  min={0}
                  max={100}
                  step={1}
                  className="relative flex w-full touch-none select-none items-center"
                >
                  <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-muted">
                    <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-indigo-400/60 to-amber-300/60" />
                  </SliderPrimitive.Track>
                  <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background shadow-md ring-0 outline-none cursor-grab active:cursor-grabbing" />
                </SliderPrimitive.Root>
                <Sun className="w-4 h-4 text-amber-500 flex-shrink-0" />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Dark</span>
                <span>Dusk</span>
                <span>Warm Light</span>
              </div>
              {themeMode === "manual" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setThemeMode("auto")}
                  className="text-xs"
                >
                  <Monitor className="w-3 h-3 mr-1" />
                  Reset to Auto
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Environment Cards */}
        {environments.map((env) => {
          const meta = ENV_META[env];
          const state = envStates[env];
          const isActive = environment === env;
          const keysVisible = showKeys[env];

          return (
            <Card
              key={env}
              className={isActive ? "border-primary/40 shadow-sm" : ""}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${meta.color}/10`}>
                      {meta.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{meta.label}</CardTitle>
                      <CardDescription>
                        {env === "production"
                          ? "Live production API — handles real orders"
                          : env === "staging"
                          ? "Official Dr. Green staging environment"
                          : "Development & testing environment"}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusIndicator status={state.status} />
                    {isActive && (
                      <Badge className="bg-primary/10 text-primary border-primary/30 text-xs">
                        ACTIVE
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* API URL */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">API Base URL</Label>
                  <Input
                    value={state.apiUrl}
                    readOnly
                    className="bg-muted/50 font-mono text-sm"
                  />
                </div>

                {/* Credentials Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">API Key</Label>
                    <div className="relative">
                      <Input
                        value={keysVisible ? "(stored in backend secrets)" : state.apiKeyHint}
                        readOnly
                        className="bg-muted/50 font-mono text-sm pr-10"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowKeys((prev) => ({ ...prev, [env]: !prev[env] }))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {keysVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Private Key</Label>
                    <div className="relative">
                      <Input
                        value={keysVisible ? "(stored in backend secrets)" : state.privateKeyHint}
                        readOnly
                        className="bg-muted/50 font-mono text-sm pr-10"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowKeys((prev) => ({ ...prev, [env]: !prev[env] }))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {keysVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Credentials are stored securely in backend secrets and cannot be viewed from the dashboard.
                  To update keys, contact your administrator.
                </p>

                {/* Error message */}
                {state.errorMessage && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive">{state.errorMessage}</p>
                  </div>
                )}

                {/* Test + Last tested */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="text-xs text-muted-foreground">
                    {state.lastTested
                      ? `Last tested: ${new Date(state.lastTested).toLocaleString()}`
                      : "Not tested yet"}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestConnection(env)}
                    disabled={state.status === "testing"}
                  >
                    {state.status === "testing" ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Test Connection
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Info Note */}
        <Card className="border-muted">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> For the final production release, only the Production environment
              will be active. Staging and Railway are available for development and testing purposes. The environment
              selector in the header controls which API all admin operations use.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
