import { Link } from "react-router";
import { useState } from "react";

const sections = [
  { id: "quickstart", label: "Quick Start" },
  { id: "authentication", label: "Authentication" },
  { id: "chat-completions", label: "Chat Completions" },
  { id: "models", label: "Models" },
  { id: "streaming", label: "Streaming" },
  { id: "smart-routing", label: "Smart Routing" },
  { id: "api-keys", label: "API Keys" },
  { id: "wallet-billing", label: "Wallet & Billing" },
  { id: "usage", label: "Usage" },
  { id: "errors", label: "Error Handling" },
  { id: "rate-limits", label: "Rate Limits" },
];

function CodeBlock({ lang, children }: { lang: string; children: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative group rounded-lg overflow-hidden border border-[#222228] my-4">
      <div className="flex items-center justify-between px-4 py-2 bg-[#0D0D10] border-b border-[#222228] text-xs text-[#8888A0]">
        <span>{lang}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(children.trim()); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          className="text-[#8888A0] hover:text-[#E8E8ED] transition-colors"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="p-4 bg-[#111114] overflow-x-auto text-sm leading-relaxed">
        <code className="text-[#C8C8D0]">{children.trim()}</code>
      </pre>
    </div>
  );
}

function Endpoint({ method, path }: { method: string; path: string }) {
  const color = method === "GET" ? "text-[#3B82F6]" : method === "POST" ? "text-[#00E5A0]" : method === "DELETE" ? "text-red-400" : "text-blue-400";
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#F9FAFB] border border-[#E5E7EB] font-mono text-sm my-2">
      <span className={`font-bold ${color}`}>{method}</span>
      <span className="text-[#374151]">{path}</span>
    </div>
  );
}

export default function DocsPage() {
  return (
    <div className="bg-white text-[#0A1628] min-h-screen" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-5 md:px-8 py-4 flex items-center justify-between bg-[rgba(255,255,255,0.85)] backdrop-blur-xl border-b border-[#E5E7EB]">
        <Link to="/" className="text-2xl font-extrabold tracking-tight">
          mazou<span className="text-[#3B82F6]">.</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-[#6B7280] text-sm font-medium hover:text-[#0A1628] transition-colors">Home</Link>
          <Link to="/docs" className="text-[#0A1628] text-sm font-medium">Docs</Link>
          <Link to="/login" className="bg-[#3B82F6] text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#2563EB] hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(59,130,246,0.15)] transition-all inline-flex items-center gap-2">
            Sign In
          </Link>
        </div>
      </nav>

      <div className="flex max-w-7xl mx-auto pt-20">
        {/* SIDEBAR */}
        <aside className="hidden lg:block w-56 shrink-0 sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto py-8 pr-6 border-r border-[#E5E7EB]">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-4 px-3">On this page</p>
          <nav className="flex flex-col gap-1">
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="text-sm text-[#6B7280] hover:text-[#0A1628] hover:bg-[#F3F4F6] px-3 py-1.5 rounded-md transition-colors">
                {s.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* CONTENT */}
        <main className="flex-1 min-w-0 py-8 px-5 md:px-12 lg:px-16 max-w-4xl">
          <h1 className="text-4xl font-black tracking-tight mb-2">
            API Documentation
          </h1>
          <p className="text-[#6B7280] text-lg mb-12">
            Everything you need to integrate Mazou into your application.
          </p>

          {/* BASE URL */}
          <div className="px-4 py-3 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] mb-12">
            <p className="text-xs text-[#6B7280] mb-1">Base URL</p>
            <code className="text-[#3B82F6] font-mono">https://api.mazou.ai/v1</code>
          </div>

          {/* QUICK START */}
          <section id="quickstart" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl font-bold mb-4">Quick Start</h2>
            <p className="text-[#4B5563] mb-4">
              Mazou is OpenAI-compatible. Install the standard OpenAI SDK, point it at our base URL, and use your Mazou API key.
            </p>

            <h3 className="text-lg font-semibold mb-3">1. Install the SDK</h3>
            <CodeBlock lang="bash">{`
# Python
pip install openai

# JavaScript / TypeScript
npm install openai
`}</CodeBlock>

            <h3 className="text-lg font-semibold mb-3 mt-6">2. Make your first call</h3>
            <CodeBlock lang="python">{`
from openai import OpenAI

client = OpenAI(
    base_url="https://api.mazou.ai/v1",
    api_key="mz_live_your_key_here",
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello from Lagos!"}],
)
print(response.choices[0].message.content)
`}</CodeBlock>
            <CodeBlock lang="javascript">{`
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://api.mazou.ai/v1",
  apiKey: "mz_live_your_key_here",
});

const response = await client.chat.completions.create({
  model: "claude-sonnet-4.6",
  messages: [{ role: "user", content: "Hello from Accra!" }],
});
console.log(response.choices[0].message.content);
`}</CodeBlock>
            <CodeBlock lang="bash">{`
curl https://api.mazou.ai/v1/chat/completions \\
  -H "Authorization: Bearer mz_live_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gemini-2.5-flash",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
`}</CodeBlock>

            <h3 className="text-lg font-semibold mb-3 mt-6">3. Check the response</h3>
            <p className="text-[#4B5563] mb-4">
              The response follows the standard OpenAI format. Your existing code works with zero changes.
            </p>
            <CodeBlock lang="json">{`
{
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
}
`}</CodeBlock>
            <div className="px-4 py-3 rounded-lg bg-[#F3F4F6] border border-[#E5E7EB] text-sm text-[#4B5563]">
              <strong className="text-[#3B82F6]">Tip:</strong> Use a <code className="bg-[#E5E7EB] px-1 rounded text-xs">mz_test_</code> key during development. It skips wallet charges but still logs calls to your dashboard so you can test routing rules and see usage stats.
            </div>
          </section>

          {/* AUTHENTICATION */}
          <section id="authentication" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl font-bold mb-4">Authentication</h2>
            <p className="text-[#4B5563] mb-4">
              All API requests require a valid API key sent in the <code className="text-[#00E5A0] bg-[#F3F4F6] px-1.5 py-0.5 rounded text-sm">Authorization</code> header.
            </p>
            <CodeBlock lang="http">{`
Authorization: Bearer mz_live_your_key_here
`}</CodeBlock>
            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-3 text-sm">
                <span className="text-[#3B82F6] mt-0.5">&#9679;</span>
                <div>
                  <strong className="text-[#0A1628]">Live keys</strong>
                  <span className="text-[#6B7280]"> - prefixed <code className="bg-[#F3F4F6] px-1 rounded text-xs">mz_live_</code>. Charge your wallet and route to real providers.</span>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <span className="text-[#00E5A0] mt-0.5">&#9679;</span>
                <div>
                  <strong className="text-[#0A1628]">Test keys</strong>
                  <span className="text-[#6B7280]"> - prefixed <code className="bg-[#F3F4F6] px-1 rounded text-xs">mz_test_</code>. Skip wallet debit but still log usage. Perfect for development.</span>
                </div>
              </div>
            </div>
          </section>

          {/* CHAT COMPLETIONS */}
          <section id="chat-completions" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl font-bold mb-4">Chat Completions</h2>
            <Endpoint method="POST" path="/v1/chat/completions" />
            <p className="text-[#4B5563] mt-4 mb-4">
              The core endpoint. Fully compatible with the OpenAI Chat Completions API.
            </p>

            <h3 className="text-lg font-semibold mb-3 mt-8">Request Body</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E7EB]">
                    <th className="text-left py-2 pr-4 text-[#6B7280] font-medium">Parameter</th>
                    <th className="text-left py-2 pr-4 text-[#6B7280] font-medium">Type</th>
                    <th className="text-left py-2 pr-4 text-[#6B7280] font-medium">Required</th>
                    <th className="text-left py-2 text-[#6B7280] font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="text-[#4B5563]">
                  <tr className="border-b border-[#F3F4F6]">
                    <td className="py-2.5 pr-4 font-mono text-[#0A1628] text-xs">model</td>
                    <td className="py-2.5 pr-4 font-mono text-xs">string</td>
                    <td className="py-2.5 pr-4">Yes</td>
                    <td className="py-2.5">Model ID (e.g. <code className="text-xs bg-[#F3F4F6] px-1 rounded">gpt-4o</code>, <code className="text-xs bg-[#F3F4F6] px-1 rounded">claude-sonnet-4.6</code>)</td>
                  </tr>
                  <tr className="border-b border-[#F3F4F6]">
                    <td className="py-2.5 pr-4 font-mono text-[#0A1628] text-xs">messages</td>
                    <td className="py-2.5 pr-4 font-mono text-xs">array</td>
                    <td className="py-2.5 pr-4">Yes</td>
                    <td className="py-2.5">Array of message objects with <code className="text-xs bg-[#F3F4F6] px-1 rounded">role</code> and <code className="text-xs bg-[#F3F4F6] px-1 rounded">content</code></td>
                  </tr>
                  <tr className="border-b border-[#F3F4F6]">
                    <td className="py-2.5 pr-4 font-mono text-[#0A1628] text-xs">stream</td>
                    <td className="py-2.5 pr-4 font-mono text-xs">boolean</td>
                    <td className="py-2.5 pr-4">No</td>
                    <td className="py-2.5">Enable server-sent events streaming</td>
                  </tr>
                  <tr className="border-b border-[#F3F4F6]">
                    <td className="py-2.5 pr-4 font-mono text-[#0A1628] text-xs">temperature</td>
                    <td className="py-2.5 pr-4 font-mono text-xs">number</td>
                    <td className="py-2.5 pr-4">No</td>
                    <td className="py-2.5">Sampling temperature (0-2). Default: 1</td>
                  </tr>
                  <tr className="border-b border-[#F3F4F6]">
                    <td className="py-2.5 pr-4 font-mono text-[#0A1628] text-xs">max_tokens</td>
                    <td className="py-2.5 pr-4 font-mono text-xs">integer</td>
                    <td className="py-2.5 pr-4">No</td>
                    <td className="py-2.5">Maximum tokens to generate</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-mono text-[#0A1628] text-xs">top_p</td>
                    <td className="py-2.5 pr-4 font-mono text-xs">number</td>
                    <td className="py-2.5 pr-4">No</td>
                    <td className="py-2.5">Nucleus sampling parameter (0-1)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-semibold mb-3 mt-8">Response</h3>
            <CodeBlock lang="json">{`
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1709123456,
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
}
`}</CodeBlock>
          </section>

          {/* MODELS */}
          <section id="models" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl font-bold mb-4">Models</h2>
            <Endpoint method="GET" path="/v1/models" />
            <p className="text-[#4B5563] mt-4 mb-4">
              List all available models. Returns both global and African-specific models.
            </p>
            <CodeBlock lang="bash">{`
curl https://api.mazou.ai/v1/models \\
  -H "Authorization: Bearer mz_live_your_key_here"
`}</CodeBlock>
            <p className="text-[#4B5563] mt-4">
              Mazou supports 50+ models from OpenAI, Anthropic, Google, Meta, Mistral, DeepSeek, Cohere, and African AI labs. See the full list in the <Link to="/catalog" className="text-[#3B82F6] hover:underline">Model Catalog</Link>.
            </p>
          </section>

          {/* STREAMING */}
          <section id="streaming" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl font-bold mb-4">Streaming</h2>
            <p className="text-[#4B5563] mb-4">
              Set <code className="text-[#00E5A0] bg-[#F3F4F6] px-1.5 py-0.5 rounded text-sm">stream: true</code> to receive responses as server-sent events (SSE).
            </p>
            <CodeBlock lang="python">{`
stream = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Tell me a story"}],
    stream=True,
)

for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")
`}</CodeBlock>
            <CodeBlock lang="javascript">{`
const stream = await client.chat.completions.create({
  model: "claude-sonnet-4.6",
  messages: [{ role: "user", content: "Tell me a story" }],
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || "");
}
`}</CodeBlock>
          </section>

          {/* SMART ROUTING */}
          <section id="smart-routing" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl font-bold mb-4">Smart Routing</h2>
            <p className="text-[#4B5563] mb-4">
              Configure routing rules to automatically direct requests to the optimal model based on cost, latency, or custom logic. Manage rules via the dashboard or API.
            </p>
            <Endpoint method="GET" path="/api/routing/rules" />
            <Endpoint method="POST" path="/api/routing/rules" />
            <Endpoint method="DELETE" path="/api/routing/rules/:id" />
            <CodeBlock lang="json">{`
{
  "name": "Cost Optimizer",
  "match": { "model": "gpt-4o" },
  "action": "fallback",
  "fallback_model": "gpt-4o-mini",
  "condition": "cost > 0.01",
  "enabled": true
}
`}</CodeBlock>
          </section>

          {/* API KEYS */}
          <section id="api-keys" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl font-bold mb-4">API Keys</h2>
            <Endpoint method="GET" path="/v1/keys" />
            <Endpoint method="POST" path="/v1/keys" />
            <Endpoint method="DELETE" path="/v1/keys/:id" />
            <p className="text-[#4B5563] mt-4 mb-4">
              Manage your API keys programmatically. Keys are SHA-256 hashed at rest and cached for 5 minutes.
            </p>
            <CodeBlock lang="bash">{`
# Create a new key
curl -X POST https://api.mazou.ai/v1/keys \\
  -H "Authorization: Bearer mz_live_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Production Backend", "environment": "live"}'
`}</CodeBlock>
          </section>

          {/* WALLET & BILLING */}
          <section id="wallet-billing" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl font-bold mb-4">Wallet & Billing</h2>
            <Endpoint method="GET" path="/v1/wallet" />
            <p className="text-[#4B5563] mt-4 mb-4">
              Check your wallet balance. All amounts are in <strong>kobo</strong> (100 kobo = 1 Naira). Fund your wallet via Paystack from the dashboard.
            </p>
            <CodeBlock lang="json">{`
{
  "balance": 500000,
  "currency": "NGN",
  "formatted": "NGN 5,000.00"
}
`}</CodeBlock>
            <div className="mt-4 px-4 py-3 rounded-lg bg-[#F3F4F6] border border-[#E5E7EB] text-sm text-[#4B5563]">
              <strong className="text-[#00E5A0]">Note:</strong> Live API calls atomically debit your wallet. If your balance is insufficient, the request returns <code className="bg-[#E5E7EB] px-1 rounded text-xs">402 Payment Required</code>. Test keys skip wallet debit.
            </div>
          </section>

          {/* USAGE */}
          <section id="usage" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl font-bold mb-4">Usage</h2>
            <Endpoint method="GET" path="/v1/usage" />
            <p className="text-[#4B5563] mt-4 mb-4">
              Retrieve your API usage statistics with optional date range filters.
            </p>
            <CodeBlock lang="bash">{`
curl "https://api.mazou.ai/v1/usage?start=2026-03-01&end=2026-03-05" \\
  -H "Authorization: Bearer mz_live_your_key_here"
`}</CodeBlock>
          </section>

          {/* ERROR HANDLING */}
          <section id="errors" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl font-bold mb-4">Error Handling</h2>
            <p className="text-[#4B5563] mb-4">
              Mazou returns standard HTTP status codes with a JSON error body.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E7EB]">
                    <th className="text-left py-2 pr-4 text-[#6B7280] font-medium">Status</th>
                    <th className="text-left py-2 text-[#6B7280] font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="text-[#4B5563]">
                  <tr className="border-b border-[#F3F4F6]"><td className="py-2 pr-4 font-mono text-xs">400</td><td className="py-2">Bad request - invalid parameters</td></tr>
                  <tr className="border-b border-[#F3F4F6]"><td className="py-2 pr-4 font-mono text-xs">401</td><td className="py-2">Unauthorized - invalid or missing API key</td></tr>
                  <tr className="border-b border-[#F3F4F6]"><td className="py-2 pr-4 font-mono text-xs">402</td><td className="py-2">Payment required - insufficient wallet balance</td></tr>
                  <tr className="border-b border-[#F3F4F6]"><td className="py-2 pr-4 font-mono text-xs">404</td><td className="py-2">Not found - model or resource does not exist</td></tr>
                  <tr className="border-b border-[#F3F4F6]"><td className="py-2 pr-4 font-mono text-xs">429</td><td className="py-2">Rate limited - too many requests</td></tr>
                  <tr><td className="py-2 pr-4 font-mono text-xs">500</td><td className="py-2">Internal server error</td></tr>
                </tbody>
              </table>
            </div>
            <CodeBlock lang="json">{`
{
  "error": {
    "message": "Insufficient wallet balance",
    "type": "billing_error",
    "code": "insufficient_funds"
  }
}
`}</CodeBlock>
          </section>

          {/* RATE LIMITS */}
          <section id="rate-limits" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl font-bold mb-4">Rate Limits</h2>
            <p className="text-[#4B5563] mb-4">
              Rate limit headers are included in every response:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E7EB]">
                    <th className="text-left py-2 pr-4 text-[#6B7280] font-medium">Header</th>
                    <th className="text-left py-2 text-[#6B7280] font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="text-[#4B5563]">
                  <tr className="border-b border-[#F3F4F6]"><td className="py-2 pr-4 font-mono text-xs">X-RateLimit-Limit</td><td className="py-2">Maximum requests per minute</td></tr>
                  <tr className="border-b border-[#F3F4F6]"><td className="py-2 pr-4 font-mono text-xs">X-RateLimit-Remaining</td><td className="py-2">Remaining requests in current window</td></tr>
                  <tr><td className="py-2 pr-4 font-mono text-xs">X-RateLimit-Reset</td><td className="py-2">Unix timestamp when the limit resets</td></tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 px-4 py-3 rounded-lg bg-[#F3F4F6] border border-[#E5E7EB] text-sm text-[#4B5563]">
              If you hit a rate limit, back off and retry with exponential backoff. The <code className="bg-[#E5E7EB] px-1 rounded text-xs">429</code> response includes a <code className="bg-[#E5E7EB] px-1 rounded text-xs">Retry-After</code> header.
            </div>
          </section>

          {/* FOOTER */}
          <div className="border-t border-[#E5E7EB] pt-8 mt-8 pb-16 flex items-center justify-between text-sm text-[#6B7280]">
            <span>Need help? Contact <a href="mailto:support@mazou.ai" className="text-[#3B82F6] hover:underline">support@mazou.ai</a></span>
            <Link to="/login" className="text-[#3B82F6] hover:underline">Go to Dashboard &rarr;</Link>
          </div>
        </main>
      </div>
    </div>
  );
}
