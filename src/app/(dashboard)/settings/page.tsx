"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/panel";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

export default function SettingsPage() {
  const { toast } = useToast();
  const router = useRouter();

  const [orgName, setOrgName] = useState("My Organization");
  const [billingEmail, setBillingEmail] = useState("billing@myorg.com");
  const [defaultBudget, setDefaultBudget] = useState("balanced");
  const [saving, setSaving] = useState(false);

  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteStep, setDeleteStep] = useState<"confirm" | "deleting" | "done">("confirm");

  function handleSave() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast("Settings saved successfully");
    }, 800);
  }

  function handleDelete() {
    if (deleteConfirm !== orgName) return;
    setDeleteStep("deleting");
    setTimeout(() => {
      setDeleteStep("done");
      toast("Organization deleted", "error");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    }, 2000);
  }

  function handleCloseDelete() {
    setShowDelete(false);
    setDeleteConfirm("");
    setDeleteStep("confirm");
  }

  return (
    <div>
      <Panel title="Organization Settings" icon="\u2699\uFE0F">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-text-dim font-medium mb-1.5">Organization Name</label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full max-w-md bg-bg border border-border rounded-lg px-3 py-2.5 text-sm text-text outline-none focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-text-dim font-medium mb-1.5">Billing Email</label>
            <input
              type="email"
              value={billingEmail}
              onChange={(e) => setBillingEmail(e.target.value)}
              className="w-full max-w-md bg-bg border border-border rounded-lg px-3 py-2.5 text-sm text-text outline-none focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-text-dim font-medium mb-1.5">Default Budget</label>
            <select
              value={defaultBudget}
              onChange={(e) => setDefaultBudget(e.target.value)}
              className="bg-bg border border-border rounded-lg px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
            >
              <option value="low">Low — Optimize for cost</option>
              <option value="balanced">Balanced — Cost vs quality</option>
              <option value="quality">Quality — Best models always</option>
            </select>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-accent text-black border-none px-4 py-2 rounded-md text-sm font-semibold cursor-pointer hover:brightness-110 transition-all disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </Panel>

      <Panel title="Danger Zone" icon="\u26A0\uFE0F" className="mt-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-red">Delete Organization</div>
            <div className="text-xs text-text-dim">This will permanently delete all data, API keys, and billing history.</div>
          </div>
          <button
            onClick={() => setShowDelete(true)}
            className="bg-[rgba(255,77,77,0.08)] text-red border border-[rgba(255,77,77,0.2)] px-4 py-2 rounded-md text-xs font-semibold cursor-pointer hover:bg-[rgba(255,77,77,0.15)] transition-colors"
          >
            Delete
          </button>
        </div>
      </Panel>

      <Modal open={showDelete} onClose={handleCloseDelete} title="Delete Organization" icon="\u26A0\uFE0F">
        {deleteStep === "confirm" && (
          <div className="space-y-4">
            <div className="bg-[rgba(255,77,77,0.06)] border border-[rgba(255,77,77,0.15)] rounded-lg p-3 text-xs text-red">
              This action is permanent and cannot be undone. All data, API keys, wallets, usage history, and billing records will be permanently deleted.
            </div>
            <div>
              <label className="block text-xs text-text-dim font-medium mb-1.5">
                Type <strong className="text-text">{orgName}</strong> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder={orgName}
                className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm text-text outline-none focus:border-red transition-colors font-mono"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleteConfirm !== orgName}
                className="flex-1 bg-red text-white py-2.5 rounded-lg text-sm font-semibold cursor-pointer hover:brightness-110 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ backgroundColor: deleteConfirm === orgName ? "#FF4D4D" : undefined }}
              >
                Delete Organization
              </button>
              <button
                onClick={handleCloseDelete}
                className="flex-1 bg-surface border border-border text-text-sec py-2.5 rounded-lg text-sm cursor-pointer hover:bg-surface-2 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {deleteStep === "deleting" && (
          <div className="py-8 text-center">
            <div className="text-3xl mb-3 animate-spin inline-block">\u23F3</div>
            <div className="text-sm font-semibold mb-1 text-red">Deleting Organization...</div>
            <div className="text-xs text-text-dim">Removing all data, API keys, and billing records...</div>
          </div>
        )}
        {deleteStep === "done" && (
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[rgba(255,77,77,0.1)] flex items-center justify-center text-2xl mx-auto">\u2717</div>
            <div>
              <div className="text-sm font-semibold text-red">Organization Deleted</div>
              <div className="text-xs text-text-dim mt-1">Redirecting to login...</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
