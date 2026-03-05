// Mock data from the prototype - will be replaced with real Supabase queries

// ─── Catalog Model Type ─────────────────────────────────────────────
export interface CatalogModel {
  id: string;
  name: string;
  provider: string;
  providerIcon: string;
  providerColor: string;
  category: string;
  tags: string[];
  description: string;
  contextWindow: string;
  inputCost: number;   // per 1M tokens in USD
  outputCost: number;  // per 1M tokens in USD
  isAfrican: boolean;
  africanMeta?: {
    country: string;
    langs: string[];
    domain?: string;
  };
  released: string;
}

// ─── Full Model Catalog ─────────────────────────────────────────────
// Pricing in USD per 1M tokens. Sources: OpenRouter, official docs, Feb 2026

export const CATALOG_MODELS: CatalogModel[] = [
  // ── OpenAI ──
  { id: "gpt-5.3-codex", name: "GPT-5.3 Codex", provider: "OpenAI", providerIcon: "OA", providerColor: "openai", category: "Code", tags: ["agentic", "code", "reasoning"], description: "Most capable agentic coding model combining Codex and GPT-5 training stacks. ~25% faster than predecessors, sets new highs on key coding benchmarks.", contextWindow: "256K", inputCost: 2.00, outputCost: 8.00, isAfrican: false, released: "Feb 2026" },
  { id: "gpt-5.2", name: "GPT-5.2", provider: "OpenAI", providerIcon: "OA", providerColor: "openai", category: "General", tags: ["frontier", "reasoning", "multimodal", "vision"], description: "Most advanced frontier model. State-of-the-art reasoning, long-context understanding, coding, and vision. First to cross 90% on ARC-AGI-1.", contextWindow: "256K", inputCost: 2.00, outputCost: 8.00, isAfrican: false, released: "Jan 2026" },
  { id: "gpt-5", name: "GPT-5", provider: "OpenAI", providerIcon: "OA", providerColor: "openai", category: "General", tags: ["multimodal", "vision", "reasoning"], description: "Default ChatGPT model replacing GPT-4o. Excellent all-round performance for general tasks, coding, and analysis.", contextWindow: "128K", inputCost: 1.50, outputCost: 6.00, isAfrican: false, released: "Sep 2025" },
  { id: "o3-pro", name: "o3-pro", provider: "OpenAI", providerIcon: "OA", providerColor: "openai", category: "Reasoning", tags: ["thinking", "reasoning", "high-compute"], description: "Reasoning model designed to think longer and provide most reliable responses using extended compute for complex STEM and analysis.", contextWindow: "200K", inputCost: 20.00, outputCost: 80.00, isAfrican: false, released: "Dec 2025" },
  { id: "o3-mini", name: "o3-mini", provider: "OpenAI", providerIcon: "OA", providerColor: "openai", category: "Reasoning", tags: ["thinking", "fast", "reasoning"], description: "Small reasoning model optimized for science, math, and coding at a fraction of o3-pro cost.", contextWindow: "200K", inputCost: 1.10, outputCost: 4.40, isAfrican: false, released: "Oct 2025" },
  { id: "gpt-4.1", name: "GPT-4.1", provider: "OpenAI", providerIcon: "OA", providerColor: "openai", category: "Code", tags: ["code", "instruction-following"], description: "Specialized model excelling at coding, precise instruction following, and web development.", contextWindow: "1M", inputCost: 2.00, outputCost: 8.00, isAfrican: false, released: "Apr 2025" },
  { id: "gpt-4.1-mini", name: "GPT-4.1 Mini", provider: "OpenAI", providerIcon: "OA", providerColor: "openai", category: "General", tags: ["fast", "affordable"], description: "Fast, capable, efficient small model ideal for high-volume tasks.", contextWindow: "1M", inputCost: 0.40, outputCost: 1.60, isAfrican: false, released: "Apr 2025" },

  // ── Anthropic ──
  { id: "claude-opus-4.6", name: "Claude Opus 4.6", provider: "Anthropic", providerIcon: "AN", providerColor: "anthropic", category: "General", tags: ["frontier", "reasoning", "agentic", "code"], description: "Most capable Claude. Exceptional coding and reasoning — 16 Opus agents wrote a C compiler in Rust from scratch. Supports agent teams.", contextWindow: "200K", inputCost: 15.00, outputCost: 75.00, isAfrican: false, released: "Feb 2026" },
  { id: "claude-sonnet-4.6", name: "Claude Sonnet 4.6", provider: "Anthropic", providerIcon: "AN", providerColor: "anthropic", category: "General", tags: ["frontier", "fast", "multimodal"], description: "Outperforms Opus 4.6 on some real-world office tasks. Faster and cheaper — default for free and Pro users.", contextWindow: "200K", inputCost: 3.00, outputCost: 15.00, isAfrican: false, released: "Feb 2026" },
  { id: "claude-haiku-4.5", name: "Claude Haiku 4.5", provider: "Anthropic", providerIcon: "AN", providerColor: "anthropic", category: "General", tags: ["fast", "affordable", "lightweight"], description: "Fastest and cheapest Claude model. Ideal for high-volume, latency-sensitive workloads.", contextWindow: "200K", inputCost: 0.80, outputCost: 4.00, isAfrican: false, released: "Oct 2025" },

  // ── Google ──
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google", providerIcon: "GO", providerColor: "google", category: "Reasoning", tags: ["thinking", "multimodal", "reasoning", "code"], description: "Maximum quality thinking model. Tackles complex tasks demanding deep reasoning and coding. Configurable thinking budget.", contextWindow: "1M", inputCost: 1.25, outputCost: 10.00, isAfrican: false, released: "Jan 2026" },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google", providerIcon: "GO", providerColor: "google", category: "General", tags: ["thinking", "fast", "multimodal", "affordable"], description: "Fastest and most budget-friendly multimodal Gemini. Thinking model with reasoning capabilities and native audio support.", contextWindow: "1M", inputCost: 0.15, outputCost: 0.60, isAfrican: false, released: "Jan 2026" },
  { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash-Lite", provider: "Google", providerIcon: "GO", providerColor: "google", category: "General", tags: ["fast", "affordable", "lightweight"], description: "Lowest latency and cost in the 2.5 family. Cost-effective upgrade from legacy Flash models.", contextWindow: "1M", inputCost: 0.075, outputCost: 0.30, isAfrican: false, released: "Feb 2026" },

  // ── Meta ──
  { id: "llama-4-scout", name: "Llama 4 Scout", provider: "Meta", providerIcon: "MT", providerColor: "meta", category: "General", tags: ["open-weight", "multimodal", "moe"], description: "17B active params, 16 experts. Fits on single H100 GPU with industry-leading 10M context window. Open-weight.", contextWindow: "10M", inputCost: 0.18, outputCost: 0.35, isAfrican: false, released: "Mar 2025" },
  { id: "llama-4-maverick", name: "Llama 4 Maverick", provider: "Meta", providerIcon: "MT", providerColor: "meta", category: "General", tags: ["open-weight", "multimodal", "moe", "reasoning"], description: "17B active params, 128 experts. Beats GPT-4o and Gemini 2.0 Flash. Comparable to DeepSeek V3 on reasoning. Open-weight.", contextWindow: "1M", inputCost: 0.25, outputCost: 0.65, isAfrican: false, released: "Mar 2025" },

  // ── DeepSeek ──
  { id: "deepseek-v3.2", name: "DeepSeek V3.2", provider: "DeepSeek", providerIcon: "DS", providerColor: "deepseek", category: "General", tags: ["fast", "affordable", "reasoning"], description: "Latest general-purpose model. Default on deepseek-chat and deepseek-reasoner endpoints. Optimized for speed and daily tasks.", contextWindow: "128K", inputCost: 0.27, outputCost: 1.10, isAfrican: false, released: "Jan 2026" },
  { id: "deepseek-v3.1", name: "DeepSeek V3.1", provider: "DeepSeek", providerIcon: "DS", providerColor: "deepseek", category: "General", tags: ["reasoning", "thinking", "open-weight"], description: "Hybrid thinking/non-thinking modes. Surpasses V3 and R1 by 40%+ on certain benchmarks. MIT License.", contextWindow: "128K", inputCost: 0.27, outputCost: 1.10, isAfrican: false, released: "Aug 2025" },
  { id: "deepseek-r2", name: "DeepSeek R2", provider: "DeepSeek", providerIcon: "DS", providerColor: "deepseek", category: "Reasoning", tags: ["thinking", "reasoning", "code"], description: "Specialized reasoning model for deep logic, complex coding, and multilingual reasoning. Successor to R1.", contextWindow: "128K", inputCost: 0.55, outputCost: 2.19, isAfrican: false, released: "Nov 2025" },
  { id: "deepseek-r1", name: "DeepSeek R1", provider: "DeepSeek", providerIcon: "DS", providerColor: "deepseek", category: "Reasoning", tags: ["thinking", "reasoning", "open-weight"], description: "Achieves o1-level reasoning. Explains its full reasoning chain step by step. Open-weight.", contextWindow: "64K", inputCost: 0.55, outputCost: 2.19, isAfrican: false, released: "Jan 2025" },

  // ── Mistral ──
  { id: "mistral-large-2", name: "Mistral Large 2", provider: "Mistral", providerIcon: "MI", providerColor: "mistral", category: "General", tags: ["frontier", "reasoning", "multilingual"], description: "Flagship model excelling at reasoning, code generation, JSON, and multilingual chat. On par with GPT-4o.", contextWindow: "128K", inputCost: 2.00, outputCost: 6.00, isAfrican: false, released: "Jul 2025" },
  { id: "mistral-medium-3.1", name: "Mistral Medium 3.1", provider: "Mistral", providerIcon: "MI", providerColor: "mistral", category: "General", tags: ["enterprise", "balanced"], description: "High-performance enterprise-grade model. Updated version balancing speed and quality.", contextWindow: "128K", inputCost: 1.00, outputCost: 3.00, isAfrican: false, released: "Dec 2025" },
  { id: "codestral-2", name: "Codestral 2", provider: "Mistral", providerIcon: "MI", providerColor: "mistral", category: "Code", tags: ["code", "fill-in-middle"], description: "Code generation specialist with high-precision fill-in-the-middle completion. Shared instruction and completion endpoint.", contextWindow: "256K", inputCost: 0.30, outputCost: 0.90, isAfrican: false, released: "Nov 2025" },

  // ── MiniMax ──
  { id: "minimax-m2.5", name: "MiniMax M2.5", provider: "MiniMax", providerIcon: "MM", providerColor: "teal", category: "General", tags: ["frontier", "multimodal", "affordable"], description: "Most powerful MiniMax model. Matches Anthropic and OpenAI on coding and search. Drops frontier cost by up to 95%. Generates Word, Excel, PowerPoint.", contextWindow: "1M", inputCost: 0.50, outputCost: 2.00, isAfrican: false, released: "Feb 2026" },
  { id: "minimax-m2.5-lightning", name: "MiniMax M2.5 Lightning", provider: "MiniMax", providerIcon: "MM", providerColor: "teal", category: "General", tags: ["fast", "affordable"], description: "Near state-of-the-art at 1/20th cost of Claude Opus 4.6. Optimized for speed and efficiency.", contextWindow: "1M", inputCost: 0.10, outputCost: 0.40, isAfrican: false, released: "Feb 2026" },

  // ── Kimi / Moonshot ──
  { id: "kimi-k2.5", name: "Kimi K2.5", provider: "Moonshot", providerIcon: "KM", providerColor: "purple", category: "General", tags: ["open-weight", "multimodal", "moe", "agentic"], description: "1T total params, 32B active per request (MoE). Native multimodal with Agent Swarm coordinating 100 agents. SOTA among non-thinking models.", contextWindow: "128K", inputCost: 0.60, outputCost: 2.50, isAfrican: false, released: "Jan 2026" },

  // ── xAI ──
  { id: "grok-4", name: "Grok 4", provider: "xAI", providerIcon: "XA", providerColor: "blue", category: "Reasoning", tags: ["thinking", "reasoning", "multimodal"], description: "Advanced reasoning, coding, and visual processing. Trained with massive compute. Strong on STEM benchmarks.", contextWindow: "256K", inputCost: 3.00, outputCost: 15.00, isAfrican: false, released: "Feb 2026" },
  { id: "grok-4-fast", name: "Grok 4 Fast", provider: "xAI", providerIcon: "XA", providerColor: "blue", category: "General", tags: ["fast", "affordable", "reasoning"], description: "Faster, cheaper Grok variant with reasoning and non-reasoning modes available.", contextWindow: "256K", inputCost: 0.20, outputCost: 0.50, isAfrican: false, released: "Feb 2026" },

  // ── Cohere ──
  { id: "command-a", name: "Command A", provider: "Cohere", providerIcon: "CO", providerColor: "purple", category: "General", tags: ["enterprise", "rag", "multilingual", "agentic"], description: "111B params, 256K context. 150% higher throughput than Command R+. Excels at tool use, RAG, agents, and 23 languages.", contextWindow: "256K", inputCost: 2.50, outputCost: 10.00, isAfrican: false, released: "Mar 2025" },

  // ══════════════════════════════════════════════════════════════════
  // ── AFRICAN MODELS ── Language ─────────────────────────────────
  // ══════════════════════════════════════════════════════════════════
  { id: "inkubalm", name: "InkubaLM", provider: "Lelapa AI", providerIcon: "AF", providerColor: "naira", category: "NLP", tags: ["multilingual", "african-languages", "open-weight"], description: "Africa's first homegrown multilingual LLM. 0.4B params, matches larger models on AfriMMLU and AfriXnli benchmarks. Named after the dung beetle.", contextWindow: "4K", inputCost: 0.05, outputCost: 0.10, isAfrican: true, africanMeta: { country: "South Africa", langs: ["Swahili", "Yoruba", "isiXhosa", "Hausa", "isiZulu"], domain: "Language" }, released: "2024" },
  { id: "yarngpt", name: "YarnGPT", provider: "Independent", providerIcon: "AF", providerColor: "naira", category: "Speech", tags: ["tts", "speech", "nigerian"], description: "Nigerian TTS model generating culturally authentic speech. Built on SmolLM2-360M with 11 distinct voices. 19K+ users, 1.2B tokens/mo.", contextWindow: "4K", inputCost: 0.03, outputCost: 0.08, isAfrican: true, africanMeta: { country: "Nigeria", langs: ["English-NG", "Yoruba", "Igbo", "Hausa"], domain: "Language" }, released: "2024" },
  { id: "afrolm", name: "AfroLM", provider: "Community", providerIcon: "AF", providerColor: "naira", category: "NLP", tags: ["multilingual", "ner", "sentiment"], description: "1B-param RoBERTa model trained on ALPACA Corpus covering 25 African languages. Outperforms AfriBERTa and mBERT on NER and classification.", contextWindow: "2K", inputCost: 0.04, outputCost: 0.08, isAfrican: true, africanMeta: { country: "Pan-African", langs: ["25 African langs"], domain: "Language" }, released: "2024" },
  { id: "vulavula", name: "Vulavula", provider: "Lelapa AI", providerIcon: "AF", providerColor: "naira", category: "NLP", tags: ["transcription", "translation", "ner", "platform"], description: "NLP-as-a-service platform. Entity recognition, intent detection, transcription and translation built for Global South conditions.", contextWindow: "8K", inputCost: 0.06, outputCost: 0.12, isAfrican: true, africanMeta: { country: "South Africa", langs: ["isiZulu", "Sesotho", "Afrikaans", "English-ZA"], domain: "Language" }, released: "2024" },
  { id: "khaya-ai", name: "Khaya AI", provider: "GhanaNLP", providerIcon: "AF", providerColor: "naira", category: "Translation", tags: ["translation", "asr", "west-african"], description: "Translation and speech recognition for West African languages. Outperforms Google Translate on Yoruba by 9.8 BLEU points.", contextWindow: "4K", inputCost: 0.04, outputCost: 0.08, isAfrican: true, africanMeta: { country: "Ghana", langs: ["Twi", "Ewe", "Ga", "Yoruba", "Dagbani"], domain: "Language" }, released: "2024" },
  { id: "lesan-ai", name: "Lesan AI", provider: "Lesan", providerIcon: "AF", providerColor: "naira", category: "Translation", tags: ["translation", "ethiopic", "ocr"], description: "Machine translation for Ethiopian/Eritrean languages with custom Ethiopic OCR. 10M+ translations served. Partners: UNICEF, Dalberg.", contextWindow: "4K", inputCost: 0.04, outputCost: 0.08, isAfrican: true, africanMeta: { country: "Ethiopia", langs: ["Tigrinya", "Amharic", "Afaan Oromoo", "Somali"], domain: "Language" }, released: "2024" },
  { id: "sunflower", name: "Sunflower", provider: "Sunbird AI", providerIcon: "AF", providerColor: "naira", category: "NLP", tags: ["multilingual", "open-weight", "translation"], description: "Open-source LLM for 31 Ugandan languages. State-of-the-art translation in 24 languages, outperforming ChatGPT and Gemini.", contextWindow: "4K", inputCost: 0.04, outputCost: 0.08, isAfrican: true, africanMeta: { country: "Uganda", langs: ["31 Ugandan langs", "Luganda", "Runyankole"], domain: "Language" }, released: "2024" },
  { id: "afriberta", name: "AfriBERTa", provider: "Masakhane", providerIcon: "AF", providerColor: "naira", category: "NLP", tags: ["embeddings", "ner", "classification", "open-weight"], description: "Pretrained model for 11 African languages. Small, base, and large variants for text classification and NER. Community-built.", contextWindow: "2K", inputCost: 0.02, outputCost: 0.04, isAfrican: true, africanMeta: { country: "Pan-African", langs: ["Amharic", "Hausa", "Igbo", "Swahili", "Yoruba"], domain: "Language" }, released: "2024" },
  { id: "afroxlmr", name: "AfroXLMR", provider: "Masakhane", providerIcon: "AF", providerColor: "naira", category: "NLP", tags: ["cross-lingual", "transfer-learning", "multilingual"], description: "Cross-lingual model extending XLM-RoBERTa for African languages. Strong cross-lingual transfer capabilities.", contextWindow: "2K", inputCost: 0.03, outputCost: 0.06, isAfrican: true, africanMeta: { country: "Pan-African", langs: ["17+ African langs"], domain: "Language" }, released: "2024" },
  { id: "ethiollm", name: "EthioLLM", provider: "Community", providerIcon: "AF", providerColor: "naira", category: "NLP", tags: ["ethiopian", "multilingual"], description: "Language models and machine translation specifically for Ethiopian languages including Amharic, Tigrinya, and Oromo.", contextWindow: "4K", inputCost: 0.04, outputCost: 0.08, isAfrican: true, africanMeta: { country: "Ethiopia", langs: ["Amharic", "Tigrinya", "Oromo"], domain: "Language" }, released: "2024" },
  { id: "swahbert", name: "SwahBERT", provider: "Masakhane", providerIcon: "AF", providerColor: "naira", category: "NLP", tags: ["swahili", "embeddings"], description: "BERT-based transformer model trained specifically on Swahili data for East African NLP tasks.", contextWindow: "2K", inputCost: 0.02, outputCost: 0.04, isAfrican: true, africanMeta: { country: "Pan-African", langs: ["Swahili"], domain: "Language" }, released: "2024" },

  // ── AFRICAN MODELS ── Healthcare ──────────────────────────────
  { id: "ulizallama", name: "UlizaLlama", provider: "Jacaranda Health", providerIcon: "AF", providerColor: "naira", category: "Healthcare", tags: ["healthcare", "maternal", "swahili", "open-weight"], description: "7B LLM fine-tuned from Llama 2 with 321M Swahili tokens. Built for maternal health in East Africa. Powers SMS-based prenatal advice.", contextWindow: "4K", inputCost: 0.05, outputCost: 0.10, isAfrican: true, africanMeta: { country: "Kenya", langs: ["Swahili", "English"], domain: "Healthcare" }, released: "2024" },
  { id: "ubenwa", name: "Ubenwa", provider: "Ubenwa Health", providerIcon: "AF", providerColor: "naira", category: "Healthcare", tags: ["healthcare", "diagnostics", "infant-health"], description: "ML model analysing infant cries to flag early signs of birth asphyxia. Non-invasive AI diagnostics for neonatal care.", contextWindow: "N/A", inputCost: 0.10, outputCost: 0.20, isAfrican: true, africanMeta: { country: "Nigeria", langs: ["Universal (audio)"], domain: "Healthcare" }, released: "2024" },
  { id: "mpharma-ai", name: "mPharma AI", provider: "mPharma", providerIcon: "AF", providerColor: "naira", category: "Healthcare", tags: ["healthcare", "pharmacy", "supply-chain"], description: "AI-powered pharmacy platform: prescription management, medicine delivery, inventory management, drug pricing intelligence across Africa.", contextWindow: "N/A", inputCost: 0.08, outputCost: 0.15, isAfrican: true, africanMeta: { country: "Ghana", langs: ["English", "French"], domain: "Healthcare" }, released: "2025" },
  { id: "yenehealth", name: "YeneHealth", provider: "YeneHealth", providerIcon: "AF", providerColor: "naira", category: "Healthcare", tags: ["healthcare", "medications", "digital-health"], description: "AI-driven digital health app streamlining access to affordable medications and healthcare services in Ethiopia.", contextWindow: "N/A", inputCost: 0.06, outputCost: 0.12, isAfrican: true, africanMeta: { country: "Ethiopia", langs: ["Amharic", "English"], domain: "Healthcare" }, released: "2025" },

  // ── AFRICAN MODELS ── Agriculture ─────────────────────────────
  { id: "apollo-agri", name: "Apollo Agriculture", provider: "Apollo", providerIcon: "AF", providerColor: "naira", category: "Agriculture", tags: ["agriculture", "satellite", "credit-scoring"], description: "Agronomic ML + satellite/remote sensing for customized credit, farm inputs, insurance and advice to 350K+ smallholder farmers.", contextWindow: "N/A", inputCost: 0.08, outputCost: 0.15, isAfrican: true, africanMeta: { country: "Kenya", langs: ["English", "Swahili"], domain: "Agriculture" }, released: "2025" },
  { id: "shamba-records", name: "Shamba Records", provider: "Shamba", providerIcon: "AF", providerColor: "naira", category: "Agriculture", tags: ["agriculture", "climate", "credit"], description: "AI platform providing smart credit, market access, and climate-resilient data-driven agriculture for 50K+ farmers.", contextWindow: "N/A", inputCost: 0.06, outputCost: 0.12, isAfrican: true, africanMeta: { country: "Kenya", langs: ["English", "Swahili"], domain: "Agriculture" }, released: "2025" },
  { id: "agripredict", name: "AgriPredict", provider: "AgriPredict", providerIcon: "AF", providerColor: "naira", category: "Agriculture", tags: ["agriculture", "crop-disease", "weather"], description: "Smartphone/USSD app using AI for crop disease diagnosis, weather forecasts, and digital marketplace connecting farmers with buyers.", contextWindow: "N/A", inputCost: 0.05, outputCost: 0.10, isAfrican: true, africanMeta: { country: "Zambia", langs: ["English"], domain: "Agriculture" }, released: "2024" },

  // ── AFRICAN MODELS ── Fintech ─────────────────────────────────
  { id: "black-swan", name: "Black Swan", provider: "Black Swan", providerIcon: "AF", providerColor: "naira", category: "Fintech", tags: ["fintech", "credit-scoring", "unbanked"], description: "AI-driven alternative credit scoring for Africa's unbanked population, addressing a $700B financing gap in the informal economy.", contextWindow: "N/A", inputCost: 0.10, outputCost: 0.20, isAfrican: true, africanMeta: { country: "Mauritius", langs: ["English", "French"], domain: "Fintech" }, released: "2025" },
  { id: "periculum", name: "Periculum", provider: "Periculum", providerIcon: "AF", providerColor: "naira", category: "Fintech", tags: ["fintech", "fraud", "identity", "credit"], description: "AI credit risk assessment, fraud prevention, and identity verification for fintechs across East and West Africa.", contextWindow: "N/A", inputCost: 0.08, outputCost: 0.15, isAfrican: true, africanMeta: { country: "Nigeria", langs: ["English"], domain: "Fintech" }, released: "2025" },

  // ── AFRICAN MODELS ── Logistics / Supply Chain ────────────────
  { id: "leta-ai", name: "Leta.ai", provider: "Leta", providerIcon: "AF", providerColor: "naira", category: "Logistics", tags: ["logistics", "fleet", "automation"], description: "AI-driven logistics replacing manual dispatching with automated processes. Clients include KFC, Diageo. $5M seed raised.", contextWindow: "N/A", inputCost: 0.08, outputCost: 0.15, isAfrican: true, africanMeta: { country: "Pan-African", langs: ["English"], domain: "Supply Chain" }, released: "2025" },
  { id: "kobo360", name: "Kobo360", provider: "Kobo360", providerIcon: "AF", providerColor: "naira", category: "Logistics", tags: ["logistics", "trucking", "route-optimization"], description: "AI-powered trucking logistics for demand forecasting, route optimization, and delivery management. 'Uber for trucks' in Africa.", contextWindow: "N/A", inputCost: 0.08, outputCost: 0.15, isAfrican: true, africanMeta: { country: "Nigeria", langs: ["English"], domain: "Supply Chain" }, released: "2024" },
  { id: "jetstream", name: "Jetstream", provider: "Jetstream", providerIcon: "AF", providerColor: "naira", category: "Logistics", tags: ["trade", "compliance", "customs"], description: "AI platform for cross-border trade: regulatory analysis, compliance risk flagging, and automated customs documentation.", contextWindow: "N/A", inputCost: 0.08, outputCost: 0.15, isAfrican: true, africanMeta: { country: "Ghana", langs: ["English"], domain: "Supply Chain" }, released: "2025" },

  // ── AFRICAN MODELS ── Skincare / Beauty ───────────────────────
  { id: "oyster", name: "Oyster", provider: "Oyster", providerIcon: "AF", providerColor: "naira", category: "Skincare", tags: ["skincare", "computer-vision", "personalization"], description: "AI skincare analysis trained on African/darker-skin datasets. Identifies acne, hyperpigmentation, pores, dark circles. 50K users, $151K revenue.", contextWindow: "N/A", inputCost: 0.12, outputCost: 0.25, isAfrican: true, africanMeta: { country: "Nigeria", langs: ["English"], domain: "Skincare" }, released: "2025" },

  // ── AFRICAN MODELS ── AI Infrastructure ───────────────────────
  { id: "cerebrium", name: "Cerebrium", provider: "Cerebrium", providerIcon: "AF", providerColor: "naira", category: "Infrastructure", tags: ["gpu", "serverless", "deployment"], description: "Serverless GPU infra for deploying/scaling AI workloads. Sub-5s cold starts, 40% cost savings vs cloud. Supports H100, A100.", contextWindow: "N/A", inputCost: 0.00, outputCost: 0.00, isAfrican: true, africanMeta: { country: "South Africa", langs: ["English"], domain: "Infrastructure" }, released: "2025" },
];

// ─── Categories for filtering ───────────────────────────────────────
export const MODEL_CATEGORIES = [
  "All", "General", "Reasoning", "Code", "NLP", "Speech", "Translation",
  "Healthcare", "Agriculture", "Fintech", "Logistics", "Skincare", "Infrastructure",
];

export const MODEL_TAGS = [
  "frontier", "thinking", "reasoning", "multimodal", "agentic", "code",
  "fast", "affordable", "open-weight", "multilingual", "african-languages",
  "healthcare", "agriculture", "fintech", "logistics", "skincare",
];

// ─── Currency conversion rates (from USD) ───────────────────────────
export const CURRENCIES = {
  NGN: { symbol: "\u20A6", rate: 1580, label: "NGN" },
  USDT: { symbol: "$", rate: 1, label: "USDT" },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

// ─── Active model usage data (dashboard) ────────────────────────────
export const MODEL_DATA = [
  { name: "GPT-5", provider: "OpenAI", icon: "OA", color: "openai", spend: 2227200, pct: 78, calls: "933K", latency: "1.0s" },
  { name: "Claude Sonnet 4.6", provider: "Anthropic", icon: "AN", color: "anthropic", spend: 320000, pct: 32, calls: "286K", latency: "0.8s" },
  { name: "GPT-4.1 Mini", provider: "OpenAI", icon: "OA", color: "openai", spend: 124000, pct: 14, calls: "156K", latency: "0.4s" },
  { name: "YarnGPT", provider: "African", icon: "AF", color: "naira", spend: 86400, pct: 12, calls: "64K", latency: "0.8s" },
  { name: "Gemini 2.5 Pro", provider: "Google", icon: "GO", color: "google", spend: 42000, pct: 6, calls: "38K", latency: "0.9s" },
  { name: "Claude Haiku 4.5", provider: "Anthropic", icon: "AN", color: "anthropic", spend: 18600, pct: 4, calls: "48K", latency: "0.2s" },
  { name: "InkubaLM", provider: "African", icon: "AF", color: "naira", spend: 18600, pct: 3, calls: "22K", latency: "0.6s" },
  { name: "Llama 4 Maverick", provider: "Meta", icon: "MT", color: "meta", spend: 12400, pct: 2, calls: "18K", latency: "0.4s" },
  { name: "DeepSeek V3.2", provider: "DeepSeek", icon: "DS", color: "deepseek", spend: 9800, pct: 2, calls: "14K", latency: "0.7s" },
  { name: "Mistral Large 2", provider: "Mistral", icon: "MI", color: "mistral", spend: 7200, pct: 1, calls: "8K", latency: "0.6s" },
];

export const FEATURE_DATA = [
  { name: "Customer Support Bot", tag: "agent", model: "gpt-5", african: false, calls: "842K", cost: 1940000, pct: 90, tip: "\u2192 Sonnet 4.6 \u00B7 Save \u20A6890K", actionable: true },
  { name: "Transaction Summariser", tag: "feature", model: "claude-sonnet-4.6", african: false, calls: "286K", cost: 620000, pct: 55, tip: "\u2192 Haiku 4.5 \u00B7 Save \u20A6248K", actionable: true },
  { name: "Yoruba Chat Translation", tag: "feature", model: "YarnGPT", african: true, calls: "64K", cost: 86400, pct: 18, tip: "\u2713 Optimal", actionable: false },
  { name: "Fraud Detection Agent", tag: "agent", model: "gpt-5", african: false, calls: "91K", cost: 287200, pct: 22, tip: "\u2713 Optimal", actionable: false },
  { name: "Receipt OCR", tag: "feature", model: "gemini-2.5-pro", african: false, calls: "38K", cost: 42000, pct: 8, tip: "\u2713 Optimal", actionable: false },
  { name: "Hausa Email Classifier", tag: "feature", model: "AfroLM", african: true, calls: "22K", cost: 18600, pct: 5, tip: "\u2713 Optimal", actionable: false },
  { name: "Document Extraction", tag: "feature", model: "gpt-4.1-mini", african: false, calls: "156K", cost: 124000, pct: 12, tip: "\u2192 Gemini Flash \u00B7 Save \u20A638K", actionable: true },
  { name: "Compliance Reviewer", tag: "agent", model: "claude-opus-4.6", african: false, calls: "3.2K", cost: 41000, pct: 4, tip: "\u2713 Optimal", actionable: false },
];

export const AGENT_DATA = [
  { name: "Customer Support Bot", status: "live" as const, models: "gpt-5, haiku-4.5", calls: "842K", cost: "\u20A61.94M", trend: "+15%", up: true, tasks: 12400, errors: 23, uptime: "99.8%" },
  { name: "Fraud Detection Agent", status: "live" as const, models: "gpt-5", calls: "91K", cost: "\u20A6287K", trend: "-3%", up: false, tasks: 2800, errors: 2, uptime: "99.99%" },
  { name: "Onboarding Assistant", status: "live" as const, models: "sonnet-4.6, YarnGPT", calls: "24K", cost: "\u20A668K", trend: "-8%", up: false, tasks: 860, errors: 5, uptime: "99.7%" },
  { name: "Compliance Reviewer", status: "idle" as const, models: "claude-opus-4.6", calls: "3.2K", cost: "\u20A641K", trend: "-22%", up: false, tasks: 120, errors: 0, uptime: "100%" },
];

export const ROUTE_LOG = [
  { time: "2m ago", agent: "Support Bot", action: "routed to", to: "haiku-4.5", from: "gpt-5", reason: "Simple FAQ detected.", saved: "\u20A60.80", tag: "routed" },
  { time: "4m ago", agent: "Fraud Agent", action: "kept on", to: "gpt-5", from: null, reason: "Complex reasoning required.", saved: null, tag: "optimal" },
  { time: "6m ago", agent: "Yoruba Chat", action: "routed to", to: "YarnGPT", from: "sonnet-4.6", reason: "Local language detected. Better quality + lower cost.", saved: "\u20A61.20", tag: "routed" },
  { time: "11m ago", agent: "Receipt OCR", action: "fallback to", to: "gpt-4.1-mini", from: "gemini-2.5-pro", reason: "Gemini timed out. Completed in 1.2s.", saved: null, tag: "fallback" },
  { time: "14m ago", agent: "Summariser", action: "batch routed to", to: "haiku-4.5", from: "sonnet-4.6", reason: "48 requests batched.", saved: "\u20A612.40", tag: "routed" },
  { time: "18m ago", agent: "Hausa Classifier", action: "routed to", to: "AfroLM", from: "gpt-5", reason: "Hausa input detected. Local model 40% more accurate.", saved: "\u20A62.10", tag: "routed" },
  { time: "23m ago", agent: "Support Bot", action: "cache hit", to: null, from: null, reason: "Identical query found in cache. No API call made.", saved: "\u20A62.30", tag: "cached" },
  { time: "31m ago", agent: "Doc Extraction", action: "routed to", to: "gpt-4.1-mini", from: "gpt-5", reason: "Simple document structure. Mini sufficient.", saved: "\u20A60.60", tag: "routed" },
];

export const OPTIMISATIONS = [
  { icon: "\uD83D\uDCB0", type: "save", title: "Downgrade Support Bot to Claude Sonnet 4.6", desc: "842K calls/mo using GPT-5 for tier-1 support. Sonnet 4.6 handles 96% of these with identical quality scores.", amount: "\u20A6890K/mo", impact: "high" as const },
  { icon: "\uD83D\uDD04", type: "swap", title: "Route Summariser to Haiku 4.5 for short inputs", desc: "72% of summarisation inputs are under 500 tokens. Haiku 4.5 matches Sonnet quality at this length.", amount: "\u20A6248K/mo", impact: "high" as const },
  { icon: "\uD83D\uDCE6", type: "cache", title: "Enable response caching for Support Bot", desc: "34% of support queries are repeated questions. Caching would eliminate redundant API calls.", amount: "\u20A6186K/mo", impact: "medium" as const },
  { icon: "\u26A1", type: "batch", title: "Batch Transaction Summariser calls", desc: "Currently sending individual requests. Batching 50 at a time reduces per-call overhead by 18%.", amount: "\u20A662K/mo", impact: "medium" as const },
  { icon: "\uD83C\uDF0D", type: "swap", title: "Route Hausa tasks to AfroLM", desc: "14K Hausa-language calls going to GPT-5. AfroLM scores 40% higher on Hausa benchmarks at 60% the cost.", amount: "\u20A638K/mo", impact: "medium" as const },
];

export const ROUTING_RULES = [
  { name: "Language Detection", desc: "If input is Yoruba/Hausa/Igbo/Pidgin \u2192 route to YarnGPT or AfroLM", status: "active", triggers: "1,240/day" },
  { name: "Simple Query Downgrade", desc: "If Support Bot query < 100 tokens and matches FAQ pattern \u2192 route to Haiku 4.5", status: "active", triggers: "680/day" },
  { name: "Cost Cap", desc: "If feature monthly spend exceeds \u20A6500K \u2192 flag for review and suggest alternatives", status: "active", triggers: "2 alerts" },
  { name: "Latency Fallback", desc: "If primary model response > 5s \u2192 fallback to next cheapest capable model", status: "active", triggers: "34/day" },
  { name: "Batch Detection", desc: "If > 10 identical-structure requests within 60s \u2192 batch process", status: "active", triggers: "89/day" },
  { name: "Quality Gate", desc: "If routing saves > \u20A61 but quality score drops > 5% \u2192 keep original model", status: "active", triggers: "12/day" },
];

export const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { id: "dashboard", icon: "LayoutDashboard", name: "Dashboard", href: "/dashboard" },
      { id: "usage", icon: "TrendingUp", name: "Usage & Spend", href: "/usage" },
      { id: "routing", icon: "GitBranch", name: "Smart Routing", href: "/routing", badge: "Live" },
    ],
  },
  {
    label: "AI Assets",
    items: [
      { id: "agents", icon: "Bot", name: "Agents", href: "/agents", badge: "4" },
      { id: "models", icon: "Boxes", name: "Active Models", href: "/models", badge: "10" },
      { id: "catalog", icon: "Globe", name: "Model Catalog", href: "/catalog", badge: `${CATALOG_MODELS.length}` },
    ],
  },
  {
    label: "Optimise",
    items: [
      { id: "recommendations", icon: "Lightbulb", name: "Recommendations", href: "/recommendations", badge: "5" },
      { id: "keys", icon: "Key", name: "API Keys", href: "/keys" },
    ],
  },
  {
    label: "Billing",
    items: [
      { id: "billing", icon: "Wallet", name: "Wallets & Billing", href: "/billing" },
    ],
  },
  {
    label: "Explore",
    items: [
      { id: "docs", icon: "BookOpen", name: "Documentation", href: "/docs" },
    ],
  },
];
