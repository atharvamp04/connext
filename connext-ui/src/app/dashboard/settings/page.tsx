"use client";

import SectionHeader from "@/app/components/dashboard/SectionHeader";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="space-y-10">
      <SectionHeader
        title="Server Settings"
        subtitle="Configure your Headscale control server."
      />

      {/* Form */}
      <div className="bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl p-6 space-y-6">
        <div>
          <label className="block text-white/70 mb-1">Server URL</label>
          <input
            className="w-full bg-white/10 border border-white/20 text-white p-2 rounded"
            placeholder="http://192.168.1.10:8080"
          />
        </div>

        <div>
          <label className="block text-white/70 mb-1">DERP Region</label>
          <input
            className="w-full bg-white/10 border border-white/20 text-white p-2 rounded"
            placeholder="https://controlplane.tailscale.com/derpmap/default"
          />
        </div>

        <Button className="bg-purple-600 hover:bg-purple-700">Save Settings</Button>
      </div>
    </div>
  );
}
