'use client';

/* SWARM brand guard for Agent HQ (client-side text interception).
 * Replaces legacy brand words with "Swarm" in alert/confirm/prompt,
 * Notification, and any text node entering the DOM (chat replies, toasts,
 * error banners, dispatch results). Internal contracts protected: route
 * /brahma, /api/brahma/*, Prisma models HermesTask/HermesMemory, HERMES_*
 * envs, CLI binary 'hermes', path ~/.hermes. Code/pre blocks untouched. */

import { useEffect } from 'react';

function splitProtected(s: string): string[] {
  const re =
    /(HERMES_[A-Z0-9_]+|hermesTaskId|hermesTask\b|HermesTask\b|HermesMemory\b|\/api\/brahma[/A-Za-z0-9._-]*|\/brahma\b|X-Hermes-CSRF-Token|hermes-bridge|hermesTask\b|\.hermes\b|~\/\.hermes|\bhermes(?:\.exe)?\b(?=\s*(?:[-"']|$)))/g;
  const out: string[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  re.lastIndex = 0;
  while ((m = re.exec(s))) {
    out.push(s.slice(last, m.index), m[0]);
    last = m.index + m[0].length;
  }
  out.push(s.slice(last));
  return out;
}

export function clean(input: string): string {
  if (typeof input !== 'string') return input;
  if (
    !input.includes('Hermes') &&
    !input.includes('Brahma') &&
    !input.includes('HERMES') &&
    !input.includes('BRAHMA')
  ) {
    return input;
  }
  const parts = splitProtected(input);
  const out: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (i % 2) {
      out.push(parts[i]);
      continue;
    }
    out.push(
      parts[i]
        .replace(
          /(^|[^A-Za-z0-9_.\/\\@#$%&'~+-])(Hermes|Brahma)(?![A-Za-z0-9_.\/\\-])/g,
          (_m, pre) => pre + 'Swarm',
        )
        .replace(
          /(^|[^A-Za-z0-9_.\/\\@#$%&'~+-])(HERMES|BRAHMA)(?![A-Za-z0-9_])/g,
          (_m, pre) => pre + 'SWARM',
        ),
    );
  }
  return out.join('');
}

function scrubNode(node: Node) {
  if (node.nodeType === Node.TEXT_NODE) {
    const v = clean(node.nodeValue ?? '');
    if (v !== node.nodeValue) node.nodeValue = v;
  }
}

export function BrandGuard() {
  useEffect(() => {
    const wstate = window as unknown as { __SWARM_BRAND_GUARD__?: boolean };
    if (wstate.__SWARM_BRAND_GUARD__) return;
    wstate.__SWARM_BRAND_GUARD__ = true;

    const w = window as unknown as {
      alert: (m: string) => void;
      confirm: (m: string) => boolean;
      prompt: (m: string, d?: string) => string | null;
    };
    const _alert = w.alert.bind(window);
    w.alert = (msg: string) => _alert(clean(msg));
    const _confirm = w.confirm.bind(window);
    w.confirm = (msg: string) => _confirm(clean(msg));
    const _prompt = w.prompt.bind(window);
    w.prompt = (msg: string, d?: string) => _prompt(clean(msg), d ? clean(d) : d);

    if ('Notification' in window) {
      const Orig = window.Notification;
      const Guarded = function (title: string, opts?: NotificationOptions) {
        const o = { ...(opts ?? {}) };
        if (o.body) o.body = clean(o.body);
        return new Orig(clean(title), o);
      };
      Guarded.permission = Orig.permission;
      Guarded.requestPermission = Orig.requestPermission.bind(Orig);
      Object.setPrototypeOf(Guarded, Orig);
      window.Notification = Guarded as unknown as typeof Notification;
    }

    const observer = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === 'characterData' && m.target.nodeType === Node.TEXT_NODE) {
          scrubNode(m.target);
        }
        if (m.addedNodes) {
          for (const n of Array.from(m.addedNodes)) {
            if (n.nodeType === Node.TEXT_NODE) {
              scrubNode(n);
            } else if (n.nodeType === Node.ELEMENT_NODE) {
              const el = n as Element;
              for (const a of ['title', 'placeholder', 'aria-label', 'data-label']) {
                if (el.hasAttribute && el.hasAttribute(a)) {
                  const v = clean(el.getAttribute(a) ?? '');
                  if (v !== el.getAttribute(a)) el.setAttribute(a, v);
                }
              }
              if (!/(SCRIPT|STYLE|CODE|PRE)/.test(el.nodeName)) {
                const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
                let tn: Node | null;
                while ((tn = walker.nextNode())) {
                  if (tn.parentNode && /(SCRIPT|STYLE|CODE|PRE)/.test(tn.parentNode.nodeName)) continue;
                  scrubNode(tn);
                }
              }
            }
          }
        }
      }
    });
    observer.observe(document.documentElement, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    // initial sweep
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let tn: Node | null;
    while ((tn = walker.nextNode())) {
      if (tn.parentNode && /(SCRIPT|STYLE|CODE|PRE)/.test(tn.parentNode.nodeName)) continue;
      scrubNode(tn);
    }
  }, []);

  return null;
}
