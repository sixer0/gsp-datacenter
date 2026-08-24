import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

interface AgentChatRequest {
  agentId: string;
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

// Map agentId → Hermes profile name. Brahma = default profile.
const PROFILE_MAP: Record<string, string> = {
  brahma: 'default',
  'gsp-master-controller': 'gsp-master-controller',
  'gsp-pm-controller': 'gsp-pm-controller',
  'gsp-document-controller': 'gsp-document-controller',
  'gsp-vendor-crawler-orchestrator': 'gsp-vendor-crawler-orchestrator',
  'gsp-explore': 'gsp-explore',
  'gsp-data-collector': 'gsp-data-collector',
  'gsp-data-analyst': 'gsp-data-analyst',
  'gsp-image-analyst': 'gsp-image-analyst',
  'gsp-document-analyst': 'gsp-document-analyst',
  'gsp-pm-analyst': 'gsp-pm-analyst',
  'gsp-social-media-analyst': 'gsp-social-media-analyst',
  'gsp-social-media-crawler': 'gsp-social-media-crawler',
  'gsp-coder-execution': 'gsp-coder-execution',
  'gsp-database-specialist': 'gsp-database-specialist',
  'gsp-docker-specialist': 'gsp-docker-specialist',
  'gsp-git-specialist': 'gsp-git-specialist',
  'gsp-design-system-specialist': 'gsp-design-system-specialist',
  'gsp-image-specialist': 'gsp-image-specialist',
  'gsp-image-prompt-specialist': 'gsp-image-prompt-specialist',
  'gsp-vendor-crawler-specialist': 'gsp-vendor-crawler-specialist',
  'gsp-document-writer': 'gsp-document-writer',
  'gsp-document-converter': 'gsp-document-converter',
  'gsp-document-translator': 'gsp-document-translator',
  'gsp-pm-writer': 'gsp-pm-writer',
  'gsp-verifier': 'gsp-verifier',
  'gsp-senior-code-reviewer': 'gsp-senior-code-reviewer',
  'gsp-security-review': 'gsp-security-review',
  'gsp-test-expert': 'gsp-test-expert',
  'gsp-document-reviewer': 'gsp-document-reviewer',
  'gsp-pm-verifier': 'gsp-pm-verifier',
  'gsp-request-translator': 'gsp-request-translator',
  'gsp-task-architect': 'gsp-task-architect',
  'gsp-document-reader': 'gsp-document-reader',
  'gsp-pm-planner': 'gsp-pm-planner',
};

// Fallback persona prompts (used if the Hermes CLI is unavailable)
const FALLBACK_PROMPTS: Record<string, string> = {
  brahma: 'You are Brahma 🧠, AI Orchestrator owned by PT. Gemilang Satria Perkasa (GSP). You plan, dispatch, coordinate and verify work across GSP specialist agents. Be concise, structured, and in Indonesian unless asked otherwise.',
  'gsp-task-architect': 'You are the GSP Task Architect 📐. You turn translated requests into structured task blueprints with complete agent mapping. Design only, no implementation.',
  'gsp-request-translator': 'You are the GSP Request Translator 🔄. You parse user intent into structured task documentation. No workflows, no delegation.',
  'gsp-social-media-analyst': 'You are the GSP Social Media Analyst 📈. You produce deep, citable social media insights (sentiment, themes, trends, competitors) from public corpora using GSP free-path tools. Always cite sources, state caveats, and never fabricate metrics.',
  'gsp-social-media-crawler': 'You are the GSP Social Media Crawler 🕷️. You collect multi-platform social data (Reddit, YouTube, TikTok, Instagram, Threads, Bluesky, web) into a normalized corpus with provenance, using free-path resources only. Never bypass login walls or paid APIs.',
};

function extractReply(stdout: string): string {
  // Strip ANSI escape sequences
  const noAnsi = stdout.replace(/\x1b\[[0-9;]*m/g, '');
  // Cut off CLI footer (session resume block)
  let body = noAnsi;
  const footerMarkers = ['Resume this session', 'Session:', 'Messages:', 'Title:', 'Duration:'];
  for (const m of footerMarkers) {
    const idx = body.indexOf(m);
    if (idx > 0) body = body.slice(0, idx);
  }
  const lines = body.split('\n');
  // Prefer boxed reply: lines starting with │ (content of the answer box)
  const boxed = lines
    .filter(l => l.trimStart().startsWith('│'))
    .map(l => l.replace(/^[│┃\s]+/, '').replace(/[│┃\s]+$/, '').trim())
    .filter(Boolean);
  if (boxed.length >= 2) {
    // Drop the header line (e.g. "⚕ Hermes" or "GSP Task Architect")
    const reply = boxed.slice(1).join('\n').trim();
    if (reply.length > 0) return reply.slice(0, 3000);
  }
  // Fallback: last meaningful lines
  const meaningful = lines.map(l => l.trim()).filter(l => l && !l.startsWith('╭') && !l.startsWith('╰') && !l.startsWith('┌') && !l.startsWith('└'));
  return meaningful.slice(-6).join('\n').slice(0, 3000) || 'No reply received.';
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: AgentChatRequest = await request.json();
    const { agentId, message } = body;

    if (!agentId || !message) {
      return NextResponse.json({ error: 'Missing agentId or message' }, { status: 400 });
    }

    const profile = PROFILE_MAP[agentId];
    if (!profile) {
      return NextResponse.json({ error: `Unknown agent: ${agentId}` }, { status: 400 });
    }

    const hermesBin = process.env.HERMES_BIN || 'hermes';

    try {
      const args = profile === 'default'
        ? ['chat', '-q', message]
        : ['-p', profile, 'chat', '-q', message];

      const { stdout } = await execFileAsync(hermesBin, args, {
        timeout: 120_000,
        maxBuffer: 4 * 1024 * 1024,
        env: { ...process.env },
      });

      return NextResponse.json({ reply: extractReply(stdout), agentId, via: profile });
    } catch (err: any) {
      console.error('Hermes CLI chat error:', err?.message);
      // Fallback: use a static persona reply so the UI still works
      const fallback = FALLBACK_PROMPTS[agentId];
      if (fallback) {
        return NextResponse.json({
          reply: `(profil ${profile} tidak bisa dihubungi saat ini — ${err?.message || 'CLI error'}). Saya ${agentId}. ${fallback.split('. ').slice(1, 3).join('. ')}`,
          agentId,
          via: 'fallback',
        });
      }
      return NextResponse.json(
        { error: `Failed to reach Hermes profile ${profile}: ${err?.message || 'CLI error'}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Agent chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
