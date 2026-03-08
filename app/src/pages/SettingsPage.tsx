import { useState } from "react";
import { useNavigate } from "react-router";
import { Panel } from "@/components/ui/panel";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { Settings, AlertTriangle, Loader2, X } from "lucide-react";

export default function SettingsPage() {
  const { toast } = useToast();
  const navigate = useNavigate();

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
        navigate("/login");
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
      <Panel title="Organization Settings" icon={<Settings size={15} />}>
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
              <option value="low">Low - Optimize for cost</option>
              <option value="balanced">Balanced - Cost vs quality</option>
              <option value="quality">Quality - Best models always</option>
            </select>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-accent text-white border-none px-4 py-2 rounded-md text-sm font-semibold cursor-pointer hover:bg-accent-muted transition-all disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </Panel>

      <Panel title="Danger Zone" icon={<AlertTriangle size={15} />} className="mt-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-red">Delete Organization</div>
            <div className="text-xs text-text-dim">This will permanently delete all data, API keys, and billing history.</div>
          </div>
          <button
            onClick={() => setShowDelete(true)}
            className="bg-red-50 text-red border border-red-200 px-4 py-2 rounded-md text-xs font-semibold cursor-pointer hover:bg-red-100 transition-colors"
          >
            Delete
          </button>
        </div>
      </Panel>

      <Modal open={showDelete} onClose={handleCloseDelete} title="Delete Organization" icon={<AlertTriangle size={16} />}>
        {deleteStep === "confirm" && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red">
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
                className="flex-1 bg-red text-white py-2.5 rounded-lg text-sm font-semibold cursor-pointer hover:bg-red-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ backgroundColor: deleteConfirm === orgName ? "#EF4444" : undefined }}
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
            <Loader2 size={32} className="animate-spin text-red mx-auto mb-3" />
            <div className="text-sm font-semibold mb-1 text-red">Deleting Organization...</div>
            <div className="text-xs text-text-dim">Removing all data, API keys, and billing records...</div>
          </div>
        )}
        {deleteStep === "done" && (
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto"><X size={28} className="text-red" /></div>
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
