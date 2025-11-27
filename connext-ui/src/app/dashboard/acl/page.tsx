"use client";

import SectionHeader from "@/app/components/dashboard/SectionHeader";
import { Button } from "@/components/ui/button";

export default function ACLPage() {
  return (
    <div className="space-y-10">
      <SectionHeader
        title="Access Control (ACL)"
        subtitle="Restrict or allow traffic between devices."
      />

      <div className="bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl p-6 space-y-4">
        <label className="block text-white/70 mb-1">ACL JSON</label>

        <textarea
          className="w-full h-64 bg-white/10 border border-white/20 text-white p-2 rounded font-mono text-sm"
          defaultValue={`{
  "acls": [
    {
      "action": "accept",
      "src": ["*"],
      "dst": ["*:*"]
    }
  ]
}`}
        />

        <Button className="bg-purple-600 hover:bg-purple-700">Save ACL</Button>
      </div>
    </div>
  );
}
