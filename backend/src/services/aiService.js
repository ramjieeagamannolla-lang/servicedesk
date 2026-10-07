const { TICKET_CATEGORIES, TICKET_PRIORITY } = require('../config/constants');

// ---------------------------------------------------------------------------
// Rule-based fallback classifier. This NEVER fails and NEVER makes a network
// call, so the app stays fully demoable even with AI_PROVIDER=none or an
// expired/missing API key. Order matters: first matching rule wins.
// ---------------------------------------------------------------------------
const FALLBACK_RULES = [
  {
    test: /\bvpn\b/i,
    category: 'VPN',
    subcategory: 'VPN Connectivity',
    priority: 'CRITICAL',
    summary: 'Employee is unable to connect to the corporate VPN.',
    suggestedSolution: [
      'Verify VPN credentials are correct and not expired',
      'Restart the VPN client application',
      'Check local network/internet connectivity',
      'Restart the device and reattempt the connection',
      'Escalate to network team if issue persists',
    ],
  },
  {
    test: /\bwi-?fi\b|\bwireless\b|\binternet\b|\bnetwork\b.*(down|outage|slow)/i,
    category: 'Network',
    subcategory: 'Wi-Fi / Connectivity',
    priority: 'HIGH',
    summary: 'Employee is experiencing network or Wi-Fi connectivity issues.',
    suggestedSolution: [
      'Confirm whether other users on the same floor are affected',
      'Restart the Wi-Fi adapter or router',
      'Forget and reconnect to the corporate network',
      'Check for a known network outage',
    ],
  },
  {
    test: /\bslow\b|\blag\b|\bfreez|\bhang|\bperformance\b/i,
    category: 'Hardware',
    subcategory: 'Performance',
    priority: 'MEDIUM',
    summary: 'Employee is reporting degraded device performance.',
    suggestedSolution: [
      'Restart the device',
      'Close unused applications and browser tabs',
      'Check available disk space',
      'Run a malware/performance scan',
    ],
  },
  {
    test: /\bprinter\b|\bprint(ing)?\b/i,
    category: 'Printer',
    subcategory: 'Printer',
    priority: 'LOW',
    summary: 'Employee is having trouble printing.',
    suggestedSolution: [
      'Confirm the printer is powered on and connected',
      'Check paper and toner levels',
      'Restart the print spooler service',
      'Reinstall printer drivers if needed',
    ],
  },
  {
    test: /\bpassword\b|\blocked\s?out\b|\bcan'?t\s+log\s?in\b|\breset\b/i,
    category: 'Access',
    subcategory: 'Password Reset',
    priority: 'HIGH',
    summary: 'Employee needs a password reset or is locked out of an account.',
    suggestedSolution: [
      'Verify the employee\'s identity',
      'Trigger a self-service or admin password reset',
      'Confirm account is not locked due to repeated attempts',
      'Advise on password policy if reset fails',
    ],
  },
  {
    test: /\bemail\b|\boutlook\b|\bmailbox\b/i,
    category: 'Email',
    subcategory: 'Email / Mailbox',
    priority: 'MEDIUM',
    summary: 'Employee is having an issue with email or mailbox access.',
    suggestedSolution: [
      'Confirm mail server status',
      'Verify account credentials and mailbox quota',
      'Restart the email client',
      'Recreate the mail profile if the issue persists',
    ],
  },
  {
    test: /\binstall\b|\bsoftware\b|\bapplication\b|\bapp\b|\blicense\b/i,
    category: 'Software',
    subcategory: 'Software Installation',
    priority: 'LOW',
    summary: 'Employee needs help installing or licensing software.',
    suggestedSolution: [
      'Confirm the software is approved and licensed',
      'Deploy via the standard software catalog',
      'Verify system requirements are met',
    ],
  },
  {
    test: /\bphish|\bmalware|\bvirus|\bsuspicious\b|\bsecurity\b|\bbreach\b|\bhack/i,
    category: 'Security',
    subcategory: 'Security Incident',
    priority: 'CRITICAL',
    summary: 'Employee is reporting a potential security incident.',
    suggestedSolution: [
      'Isolate the affected device from the network if possible',
      'Do not click any further links or attachments',
      'Escalate immediately to the security team',
      'Preserve evidence (screenshots, emails) for investigation',
    ],
  },
];

function fallbackClassify({ title = '', description = '' }) {
  const text = `${title} ${description}`;
  const rule = FALLBACK_RULES.find((r) => r.test.test(text));

  if (rule) {
    return {
      category: rule.category === 'VPN' ? 'VPN' : rule.category,
      subcategory: rule.subcategory,
      priority: rule.priority,
      confidence: 0.6,
      summary: rule.summary,
      suggestedSolution: rule.suggestedSolution,
      source: 'fallback',
    };
  }

  return {
    category: 'Other',
    subcategory: 'General',
    priority: 'MEDIUM',
    confidence: 0.4,
    summary: title || 'Employee submitted a support request.',
    suggestedSolution: [
      'Review ticket details with the employee',
      'Route to the appropriate specialist team',
    ],
    source: 'fallback',
  };
}

function safeParseJson(text) {
  if (!text) return null;
  const cleaned = text.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to salvage the first {...} block
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function buildPrompt(title, description) {
  return `You are an IT helpdesk ticket triage assistant. Classify the following ticket.

Title: ${title}
Description: ${description}

Respond with ONLY a JSON object (no prose, no markdown fences) with exactly these fields:
{
  "category": one of ${JSON.stringify(TICKET_CATEGORIES)},
  "subcategory": a short specific subcategory string,
  "priority": one of ${JSON.stringify(TICKET_PRIORITY)},
  "confidence": a number between 0 and 1,
  "summary": a one-sentence summary of the issue,
  "suggestedSolution": an array of 3-5 short actionable troubleshooting steps
}`;
}

async function callGroq(title, description) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: buildPrompt(title, description) }],
        temperature: 0.2,
        max_tokens: 500,
      }),
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`Groq API responded ${res.status}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    return safeParseJson(text);
  } finally {
    clearTimeout(timeout);
  }
}

async function callGemini(title, description) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(title, description) }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 500 },
      }),
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`Gemini API responded ${res.status}`);
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return safeParseJson(text);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Classifies a ticket using the configured AI provider, with a guaranteed
 * rule-based fallback. This function NEVER throws — callers can always trust
 * the result shape.
 */
async function classifyTicket({ title, description }) {
  const provider = (process.env.AI_PROVIDER || 'none').toLowerCase();

  if (provider === 'none') {
    return fallbackClassify({ title, description });
  }

  try {
    let parsed = null;
    if (provider === 'groq') parsed = await callGroq(title, description);
    else if (provider === 'gemini') parsed = await callGemini(title, description);

    if (
      !parsed ||
      !TICKET_CATEGORIES.includes(parsed.category) ||
      !TICKET_PRIORITY.includes(parsed.priority)
    ) {
      throw new Error('AI response failed validation, falling back');
    }

    return {
      category: parsed.category,
      subcategory: parsed.subcategory || '',
      priority: parsed.priority,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.7,
      summary: parsed.summary || title,
      suggestedSolution: Array.isArray(parsed.suggestedSolution) ? parsed.suggestedSolution : [],
      source: 'ai',
    };
  } catch (err) {
    console.warn(`[aiService] ${provider} classification failed, using fallback:`, err.message);
    return fallbackClassify({ title, description });
  }
}

module.exports = { classifyTicket, fallbackClassify };
