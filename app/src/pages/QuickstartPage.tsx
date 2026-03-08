import { useState } from "react";
import { Link } from "react-router";
import { useApiKeys, useCreateKey } from "@/lib/api";
import { Check, Copy, ChevronRight, Key, Terminal, BarChart3, Zap } from "lucide-react";

const STEPS = [
  { id: "key", label: "Create an API key", icon: Key },
  { id: "install", label: "Install the SDK", icon: Terminal },
  { id: "call", label: "Make your first call", icon: Zap },
  { id: "done", label: "See it in your dashboard", icon: BarChart3 },
] as const;

type StepId = (typeof STEPS)[number]["id"];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="text-[#8888A0] hover:text-white transition-colors text-xs flex items-center gap-1"
    >
      {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
    </button>
  );
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  return (
    <div className="rounded-lg overflow-hidden border border-[#1E293B] my-3">
      <div className="flex items-center justify-between px-4 py-2 bg-[#0D0D10] border-b border-[#1E293B] text-xs text-[#8888A0]">
        <span>{lang}</span>
        <CopyButton text={code.trim()} />
      </div>
      <pre className="p-4 bg-[#111114] overflow-x-auto text-[13px] leading-[1.8]">
        <code className="text-[#C8C8D0]">{code.trim()}</code>
      </pre>
    </div>
  );
}

export default function QuickstartPage() {
  const [currentStep, setCurrentStep] = useState<StepId>("key");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState<"python" | "javascript" | "curl">("python");
  const { data: keys } = useApiKeys();
  const createKey = useCreateKey();

  const currentIdx = STEPS.findIndex((s) => s.id === currentStep);
  const hasExistingKeys = (keys as unknown[] | undefined)?.length ?? 0 > 0;

  const handleCreateKey = async () => {
    try {
      const result = await createKey.mutateAsync({
        name: "quickstart-key",
        environment: "test",
      });
      setCreatedKey((result as { key?: string }).key || "mz_test_...");
      setCurrentStep("install");
    } catch {
      // If key creation fails, let user proceed with placeholder
      setCreatedKey("mz_test_your_key_here");
      setCurrentStep("install");
    }
  };

  const apiKey = createdKey || "mz_test_your_key_here";

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text mb-2">Get started in 2 minutes</h1>
        <p className="text-sm text-text-sec">
          Create a key, install the SDK, make a call. That's it.
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-1 mb-8">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isActive = step.id === currentStep;
          const isDone = i < currentIdx;
          return (
            <div key={step.id} className="flex items-center gap-1 flex-1">
              <button
                onClick={() => {
                  if (isDone || isActive) setCurrentStep(step.id);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all w-full ${
                  isActive
                    ? "bg-accent/10 text-accent border border-accent/20"
                    : isDone
                      ? "bg-[#00E5A0]/10 text-[#00E5A0] cursor-pointer"
                      : "bg-surface text-text-dim border border-border"
                }`}
              >
                {isDone ? (
                  <Check size={14} className="shrink-0" />
                ) : (
                  <Icon size={14} className="shrink-0" />
                )}
                <span className="hidden sm:inline truncate">{step.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <ChevronRight size={14} className="text-text-dim shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="bg-surface border border-border rounded-xl p-6">
        {/* Step 1: Create Key */}
        {currentStep === "key" && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Create an API key</h2>
            <p className="text-sm text-text-sec mb-6">
              We'll create a <strong>test key</strong> so you can try the API without spending anything.
              Test keys skip wallet debit but still log usage so you can see calls in your dashboard.
            </p>

            {hasExistingKeys && !createdKey ? (
              <div className="bg-bg border border-border rounded-lg p-4 mb-4">
                <p className="text-sm text-text-sec mb-3">
                  You already have API keys. You can use an existing key or create a new one.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setCurrentStep("install")}
                    className="px-4 py-2 rounded-md text-sm font-medium bg-surface border border-border hover:border-accent/30 transition-colors"
                  >
                    Use existing key
                  </button>
                  <button
                    onClick={handleCreateKey}
                    disabled={createKey.isPending}
                    className="px-4 py-2 rounded-md text-sm font-medium bg-accent text-[#0A1628] hover:bg-accent/90 transition-colors disabled:opacity-50"
                  >
                    {createKey.isPending ? "Creating..." : "Create test key"}
                  </button>
                </div>
              </div>
            ) : !createdKey ? (
              <button
                onClick={handleCreateKey}
                disabled={createKey.isPending}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-accent text-[#0A1628] hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Key size={16} />
                {createKey.isPending ? "Creating..." : "Create test key"}
              </button>
            ) : (
              <div className="bg-[#111114] border border-[#1E293B] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#8888A0]">Your test API key</span>
                  <CopyButton text={createdKey} />
                </div>
                <code className="text-[#00E5A0] font-mono text-sm break-all">{createdKey}</code>
                <p className="text-xs text-[#8888A0] mt-3">
                  Save this key - you won't be able to see it again.
                </p>
                <button
                  onClick={() => setCurrentStep("install")}
                  className="mt-4 px-4 py-2 rounded-md text-sm font-semibold bg-accent text-[#0A1628] hover:bg-accent/90 transition-colors flex items-center gap-1.5"
                >
                  Next: Install SDK <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Install */}
        {currentStep === "install" && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Install the SDK</h2>
            <p className="text-sm text-text-sec mb-4">
              Mazou is OpenAI-compatible. Use the standard OpenAI SDK — just point it at our base URL.
            </p>

            <div className="flex gap-2 mb-4">
              {(["python", "javascript", "curl"] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLang(lang)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    selectedLang === lang
                      ? "bg-accent/10 text-accent border border-accent/20"
                      : "bg-bg text-text-sec border border-border hover:border-accent/20"
                  }`}
                >
                  {lang === "python" ? "Python" : lang === "javascript" ? "JavaScript" : "cURL"}
                </button>
              ))}
            </div>

            {selectedLang === "python" && (
              <CodeBlock lang="terminal" code="pip install openai" />
            )}
            {selectedLang === "javascript" && (
              <CodeBlock lang="terminal" code="npm install openai" />
            )}
            {selectedLang === "curl" && (
              <div className="bg-bg border border-border rounded-lg p-4 text-sm text-text-sec">
                No installation needed. cURL is available on most systems.
              </div>
            )}

            <button
              onClick={() => setCurrentStep("call")}
              className="mt-4 px-4 py-2 rounded-md text-sm font-semibold bg-accent text-[#0A1628] hover:bg-accent/90 transition-colors flex items-center gap-1.5"
            >
              Next: Make a call <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* Step 3: Make a call */}
        {currentStep === "call" && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Make your first API call</h2>
            <p className="text-sm text-text-sec mb-4">
              Copy this code and run it. Replace the key if you're using your own.
            </p>

            <div className="flex gap-2 mb-4">
              {(["python", "javascript", "curl"] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLang(lang)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    selectedLang === lang
                      ? "bg-accent/10 text-accent border border-accent/20"
                      : "bg-bg text-text-sec border border-border hover:border-accent/20"
                  }`}
                >
                  {lang === "python" ? "Python" : lang === "javascript" ? "JavaScript" : "cURL"}
                </button>
              ))}
            </div>

            {selectedLang === "python" && (
              <CodeBlock lang="python" code={`from openai import OpenAI

client = OpenAI(
    base_url="https://api.mazou.ai/v1",
    api_key="${apiKey}",
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello from Lagos!"}],
)
print(response.choices[0].message.content)`} />
            )}
            {selectedLang === "javascript" && (
              <CodeBlock lang="javascript" code={`import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://api.mazou.ai/v1",
  apiKey: "${apiKey}",
});

const response = await client.chat.completions.create({
  model: "claude-sonnet-4.6",
  messages: [{ role: "user", content: "Hello from Lagos!" }],
});
console.log(response.choices[0].message.content);`} />
            )}
            {selectedLang === "curl" && (
              <CodeBlock lang="bash" code={`curl https://api.mazou.ai/v1/chat/completions \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gemini-2.5-flash",
    "messages": [{"role": "user", "content": "Hello from Lagos!"}]
  }'`} />
            )}

            <h3 className="text-sm font-semibold mt-6 mb-2 text-text-sec">Response</h3>
            <CodeBlock lang="json" code={`{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "model": "gpt-4o",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 12,
    "completion_tokens": 9,
    "total_tokens": 21
  }
}`} />

            <button
              onClick={() => setCurrentStep("done")}
              className="mt-4 px-4 py-2 rounded-md text-sm font-semibold bg-accent text-[#0A1628] hover:bg-accent/90 transition-colors flex items-center gap-1.5"
            >
              I ran it <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* Step 4: Done */}
        {currentStep === "done" && (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-[#00E5A0]/10 flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-[#00E5A0]" />
            </div>
            <h2 className="text-lg font-semibold mb-2">You're set up</h2>
            <p className="text-sm text-text-sec mb-6 max-w-md mx-auto">
              Your API call will show up in the dashboard within a few seconds.
              From here you can explore smart routing, add more models, or fund your wallet for live calls.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/dashboard"
                className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-accent text-[#0A1628] hover:bg-accent/90 transition-colors inline-flex items-center justify-center gap-2"
              >
                <BarChart3 size={16} /> Go to Dashboard
              </Link>
              <Link
                to="/keys"
                className="px-5 py-2.5 rounded-lg text-sm font-medium bg-surface border border-border hover:border-accent/30 transition-colors inline-flex items-center justify-center gap-2"
              >
                <Key size={16} /> Manage API Keys
              </Link>
              <Link
                to="/docs"
                className="px-5 py-2.5 rounded-lg text-sm font-medium bg-surface border border-border hover:border-accent/30 transition-colors inline-flex items-center justify-center gap-2"
              >
                Full API Docs
              </Link>
            </div>

            <div className="mt-8 border-t border-border pt-6">
              <h3 className="text-sm font-semibold mb-3">What's next?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                <Link to="/billing" className="p-3 bg-bg border border-border rounded-lg hover:border-accent/20 transition-colors">
                  <div className="text-xs font-semibold mb-1">Fund your wallet</div>
                  <div className="text-[11px] text-text-dim">Add Naira credits for live API calls</div>
                </Link>
                <Link to="/routing" className="p-3 bg-bg border border-border rounded-lg hover:border-accent/20 transition-colors">
                  <div className="text-xs font-semibold mb-1">Set up smart routing</div>
                  <div className="text-[11px] text-text-dim">Auto-route to cheaper models and save</div>
                </Link>
                <Link to="/catalog" className="p-3 bg-bg border border-border rounded-lg hover:border-accent/20 transition-colors">
                  <div className="text-xs font-semibold mb-1">Browse models</div>
                  <div className="text-[11px] text-text-dim">117 models including African AI</div>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
