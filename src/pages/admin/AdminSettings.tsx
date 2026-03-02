import { useState, useEffect } from "react";
import { Settings, Wallet, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { adminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface SettingsData {
  cod_enabled: string;
}

export default function AdminSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [codEnabled, setCodEnabled] = useState(true);

  useEffect(() => {
    adminApi.getSettings().then((res) => {
      if (res.data) {
        const data = res.data as SettingsData;
        setCodEnabled(data.cod_enabled !== "false");
      }
    }).catch(() => {
      // defaults stay
    }).finally(() => setLoading(false));
  }, []);

  const handleCodToggle = async (enabled: boolean) => {
    setCodEnabled(enabled);
    setSaving(true);
    try {
      await adminApi.updateSettings({ cod_enabled: String(enabled) });
      toast({
        title: enabled ? "COD Enabled" : "COD Disabled",
        description: enabled
          ? "Customers can now pay via Cash on Delivery."
          : "Cash on Delivery is now blocked. Only online payments accepted.",
      });
    } catch {
      setCodEnabled(!enabled); // revert
      toast({ title: "Error", description: "Failed to update setting.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-primary" />
        <h1 className="font-oswald text-2xl font-bold uppercase">
          Site <span className="text-primary">Settings</span>
        </h1>
      </div>

      {/* Payment Settings */}
      <div className="bg-card rounded-lg border border-border p-6 space-y-6">
        <h2 className="font-oswald text-lg font-bold uppercase flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" /> Payment Settings
        </h2>

        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
          <div className="space-y-1">
            <Label htmlFor="cod-toggle" className="text-sm font-semibold cursor-pointer">
              Cash on Delivery (COD)
            </Label>
            <p className="text-xs text-muted-foreground max-w-md">
              When disabled, customers will only see online payment (Razorpay) at checkout.
              The COD option will be hidden and any COD order attempts will be blocked.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <Switch
              id="cod-toggle"
              checked={codEnabled}
              onCheckedChange={handleCodToggle}
              disabled={saving}
            />
            <span className={`text-xs font-semibold ${codEnabled ? "text-green-500" : "text-red-400"}`}>
              {codEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
