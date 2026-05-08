/* Briefings — list + iframe preview for Claude Design handovers stored
 * locally as templates and instances. Backend at briefings/backend.js.
 *
 * Two-pane: list of briefings on the left, the selected briefing's HTML
 * rendered in an iframe on the right. Each briefing has a "Duplicate"
 * action (clones into data/items/) and an "Open in tab" link to the
 * standalone view URL — the same URL a future Cloudflare tunnel would
 * expose publicly.
 */

const { useState, useEffect, useCallback, useMemo, useRef } = React;

export const meta = { icon: 'clipboard-list', name: 'Briefings' };

const KIND_LABEL = { template: 'template', instance: 'instance' };
const KIND_TONE = {
  template: 'var(--color-gb-blue-br)',
  instance: 'var(--color-gb-green-br)',
};

function viewUrl(b) { return `/api/briefings/view/${b.scope}/${b.id}/`; }
function pdfUrl(b)  { return `/api/briefings/pdf/${b.scope}/${b.id}`; }
function sameItem(a, b) { return a && b && a.scope === b.scope && a.id === b.id; }

function Card({ briefing, selected, onSelect, onDuplicate, onDelete, onAddChild, busy, isChild, childCount }) {
  const tone = KIND_TONE[briefing.kind] || 'var(--color-gb-fg4)';
  return (
    <div
      onClick={() => onSelect(briefing)}
      style={{
        padding: '10px 12px',
        marginBottom: 8,
        marginLeft: isChild ? 14 : 0,
        background: selected ? 'var(--color-gb-bg1)' : 'transparent',
        borderLeft: isChild
          ? `2px solid ${selected ? tone : 'var(--color-gb-bg2)'}`
          : `2px solid ${selected ? tone : 'transparent'}`,
        borderTop: '1px solid var(--color-gb-bg1)',
        borderRight: '1px solid var(--color-gb-bg1)',
        borderBottom: '1px solid var(--color-gb-bg1)',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontSize: 13, color: 'var(--color-gb-fg0)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
          {briefing.name}
          {briefing.openFeedback > 0 && (
            <span style={{
              padding: '0 5px',
              borderRadius: 8,
              background: 'var(--color-gb-yellow-br)',
              color: 'var(--color-gb-bg0)',
              fontSize: 9,
              fontWeight: 700,
            }} title={`${briefing.openFeedback} open note${briefing.openFeedback === 1 ? '' : 's'}`}>
              {briefing.openFeedback}
            </span>
          )}
        </div>
        <span style={{
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: 1,
          color: tone,
          flex: '0 0 auto',
        }}>
          {KIND_LABEL[briefing.kind]}
        </span>
      </div>
      {briefing.description && (
        <div style={{
          fontSize: 11,
          color: 'var(--color-gb-fg3)',
          marginTop: 4,
          lineHeight: 1.45,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {briefing.description}
        </div>
      )}
      {briefing.source && (
        <div style={{ fontSize: 10, color: 'var(--color-gb-fg4)', marginTop: 4 }}>
          {briefing.source}
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicate(briefing); }}
          disabled={busy}
          style={btnStyle}
        >
          duplicate
        </button>
        {briefing.scope === 'item' && !isChild && (
          <button
            onClick={(e) => { e.stopPropagation(); onAddChild(briefing); }}
            disabled={busy}
            style={btnStyle}
            title={childCount ? `${childCount} child${childCount === 1 ? '' : 'ren'}` : 'Add a child briefing nested under this one'}
          >
            + child{childCount ? ` (${childCount})` : ''}
          </button>
        )}
        {briefing.scope === 'item' && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(briefing); }}
            disabled={busy}
            style={{ ...btnStyle, color: 'var(--color-gb-red-br)' }}
          >
            delete
          </button>
        )}
        <a
          href={viewUrl(briefing)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{ ...btnStyle, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
        >
          open ↗
        </a>
        <a
          href={pdfUrl(briefing)}
          onClick={(e) => e.stopPropagation()}
          style={{ ...btnStyle, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
          title="Download PDF (rendered via headless Chrome)"
        >
          pdf ↓
        </a>
        {isChild && <CopyDeepDiveButton briefing={briefing} />}
      </div>
    </div>
  );
}

// Copies a paste-ready <a data-deepdive="..."> snippet into the clipboard.
// The view route + publish injector resolve the href at request time, so
// the snippet works in both atelier preview and the production Vercel
// deploy without the user touching URLs.
function CopyDeepDiveButton({ briefing }) {
  const [copied, setCopied] = useState(false);
  const snippet = `<a data-deepdive="${briefing.id}" class="deep-dive">Deep dive: ${briefing.name} →</a>`;
  return (
    <button
      onClick={async (e) => {
        e.stopPropagation();
        try { await navigator.clipboard.writeText(snippet); setCopied(true); setTimeout(() => setCopied(false), 1400); }
        catch {}
      }}
      style={btnStyle}
      title="Copy a deep-dive anchor to paste into the parent's HTML/JSX"
    >
      {copied ? 'copied!' : 'copy deep-dive'}
    </button>
  );
}

const btnStyle = {
  background: 'var(--color-gb-bg0-soft)',
  color: 'var(--color-gb-fg2)',
  border: '1px solid var(--color-gb-bg2)',
  padding: '3px 8px',
  fontSize: 11,
  fontFamily: 'inherit',
  cursor: 'pointer',
  borderRadius: 2,
};

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async (e) => {
        e.stopPropagation();
        try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1200); }
        catch {}
      }}
      style={{ ...btnStyle, padding: '1px 6px', fontSize: 10 }}
    >
      {copied ? 'copied' : 'copy'}
    </button>
  );
}

function PathLine({ briefing }) {
  const rel = briefing.scope === 'seed'
    ? `briefings/seed/${briefing.id}`
    : `briefings/data/items/${briefing.id}`;
  return (
    <div style={{
      fontSize: 10,
      color: 'var(--color-gb-fg4)',
      fontFamily: 'var(--font-mono, ui-monospace, monospace)',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    }}>
      <span style={{ textTransform: 'uppercase', letterSpacing: 1, color: 'var(--color-gb-fg4)' }}>path</span>
      <code style={{ color: 'var(--color-gb-fg2)' }}>{rel}</code>
      <CopyButton value={rel} />
    </div>
  );
}

function ExpireMenu({ briefing, onApplied }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function set(days) {
    setBusy(true); setError(null);
    try {
      const expiresAt = days == null
        ? null
        : new Date(Date.now() + days * 86400000).toISOString();
      const r = await fetch('/api/briefings/expire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromScope: briefing.scope, fromId: briefing.id, expiresAt }),
      });
      const j = await r.json();
      if (!r.ok || j.error) throw new Error(j.error || 'http ' + r.status);
      setOpen(false);
      onApplied?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const live = briefing.expiresAt && Date.parse(briefing.expiresAt) > Date.now();
  return (
    <span style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        style={{ ...btnStyle, color: live ? 'var(--color-gb-yellow-br)' : btnStyle.color }}
        title={live ? `Expires ${new Date(briefing.expiresAt).toISOString().slice(0, 16).replace('T', ' ')} UTC` : 'Set an expiry date'}
      >
        {busy ? '…' : (live ? `expires ${new Date(briefing.expiresAt).toISOString().slice(5, 10)}` : 'expire')}
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '110%', right: 0, zIndex: 5,
          background: 'var(--color-gb-bg0-soft)', border: '1px solid var(--color-gb-bg2)', borderRadius: 3,
          padding: 6, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 130,
          boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
        }}>
          {[
            { label: '1 day',   days: 1 },
            { label: '7 days',  days: 7 },
            { label: '30 days', days: 30 },
            { label: '90 days', days: 90 },
            { label: 'never',   days: null },
          ].map((opt) => (
            <button
              key={opt.label}
              onClick={() => set(opt.days)}
              disabled={busy}
              style={{ ...btnStyle, textAlign: 'left' }}
            >
              {opt.label}
            </button>
          ))}
          {error && <div style={{ color: 'var(--color-gb-red-br)', fontSize: 10 }}>{error}</div>}
        </div>
      )}
    </span>
  );
}

function LockButton({ briefing, onApplied }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [shownPassword, setShownPassword] = useState(null);

  async function lock() {
    setBusy(true); setError(null);
    try {
      const r = await fetch('/api/briefings/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromScope: briefing.scope, fromId: briefing.id }),
      });
      const j = await r.json();
      if (!r.ok || j.error) throw new Error(j.error || 'http ' + r.status);
      setShownPassword(j.password);
      onApplied?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function unlock() {
    if (!window.confirm('Remove the password? Anyone with the URL will be able to view it.')) return;
    setBusy(true); setError(null);
    try {
      const r = await fetch('/api/briefings/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromScope: briefing.scope, fromId: briefing.id }),
      });
      const j = await r.json();
      if (!r.ok || j.error) throw new Error(j.error || 'http ' + r.status);
      setShownPassword(null);
      onApplied?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (briefing.lock) {
    return (
      <button
        onClick={unlock}
        disabled={busy}
        style={{ ...btnStyle, color: 'var(--color-gb-purple-br)' }}
        title="Click to remove the password"
      >
        {busy ? '…' : 'unlock'}
      </button>
    );
  }
  return (
    <>
      <button
        onClick={lock}
        disabled={busy}
        style={btnStyle}
        title="Add a password — readers will need it to view"
      >
        {busy ? '…' : 'lock'}
      </button>
      {shownPassword && (
        <div style={{
          position: 'absolute',
          right: 14, top: 96, zIndex: 6,
          background: 'var(--color-gb-bg0-soft)',
          border: '1px solid var(--color-gb-bg2)',
          borderRadius: 3,
          padding: 10,
          boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
          fontSize: 11,
          color: 'var(--color-gb-fg1)',
          minWidth: 240,
        }}>
          <div style={{ marginBottom: 6, color: 'var(--color-gb-fg3)' }}>Password set. Copy it now — atelier won't show it again.</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <code style={{ flex: 1, color: 'var(--color-gb-aqua-br)' }}>{shownPassword}</code>
            <CopyButton value={shownPassword} />
            <button onClick={() => setShownPassword(null)} style={{ ...btnStyle, padding: '1px 6px', fontSize: 10 }}>×</button>
          </div>
        </div>
      )}
      {error && <span style={{ color: 'var(--color-gb-red-br)', fontSize: 10, marginLeft: 6 }}>{error}</span>}
    </>
  );
}

function UnpublishButton({ briefing, onApplied }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  async function go() {
    if (!window.confirm(`Take "${briefing.name}" down? Anyone with the URL will get a 404.`)) return;
    setBusy(true); setError(null);
    try {
      const r = await fetch('/api/briefings/unpublish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromScope: briefing.scope, fromId: briefing.id }),
      });
      const j = await r.json();
      if (!r.ok || j.error) throw new Error(j.error || 'http ' + r.status);
      onApplied?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <button
      onClick={go}
      disabled={busy}
      style={{ ...btnStyle, color: 'var(--color-gb-red-br)' }}
      title="Remove from Vercel — URL will 404"
    >
      {busy ? 'taking down…' : 'unpublish'}
    </button>
  );
}

function PublishButton({ briefing, onPublished }) {
  const [state, setState] = useState('idle'); // idle | loading | error
  const [error, setError] = useState(null);

  async function publish(e) {
    e.preventDefault();
    if (state === 'loading') return;
    const verb = briefing.publishUrl ? 'Re-publish' : 'Publish';
    if (!window.confirm(`${verb} "${briefing.name}" to Vercel? It'll appear at the public URL.`)) return;
    setState('loading');
    setError(null);
    try {
      const r = await fetch('/api/briefings/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromScope: briefing.scope, fromId: briefing.id }),
      });
      const j = await r.json();
      if (!r.ok || j.error) throw new Error(j.error || 'publish failed');
      setState('idle');
      onPublished?.(j.url);
    } catch (err) {
      setError(err.message);
      setState('error');
      setTimeout(() => { setState('idle'); setError(null); }, 8000);
    }
  }

  const label = state === 'loading' ? 'publishing…' :
                state === 'error'   ? 'publish failed' :
                briefing.publishUrl ? 're-publish' :
                                      'publish';
  return (
    <button
      onClick={publish}
      disabled={state === 'loading'}
      title={error || (briefing.publishUrl ? `Currently live at ${briefing.publishUrl}` : 'Deploy this briefing publicly via Vercel')}
      style={{
        ...btnStyle,
        color: state === 'error' ? 'var(--color-gb-red-br)' :
               briefing.publishUrl ? 'var(--color-gb-aqua-br)' : btnStyle.color,
      }}
    >
      {label}
    </button>
  );
}

function PdfButton({ briefing }) {
  const [state, setState] = useState('idle'); // idle | loading | error
  const [error, setError] = useState(null);

  async function download(e) {
    e.preventDefault();
    if (state === 'loading') return;
    setState('loading');
    setError(null);
    try {
      const r = await fetch(pdfUrl(briefing));
      if (!r.ok) {
        let msg = 'http ' + r.status;
        try { const j = await r.json(); if (j.error) msg = j.error; } catch {}
        throw new Error(msg);
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (briefing.name || 'briefing') + '.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setState('idle');
    } catch (err) {
      setError(err.message);
      setState('error');
      setTimeout(() => { setState('idle'); setError(null); }, 6000);
    }
  }

  const label = state === 'loading' ? 'rendering…' :
                state === 'error'   ? 'pdf failed' :
                                      'pdf ↓';
  return (
    <a
      href={pdfUrl(briefing)}
      onClick={download}
      title={error || 'Headless-Chrome rendered PDF'}
      style={{
        ...btnStyle,
        textDecoration: 'none',
        color: state === 'error' ? 'var(--color-gb-red-br)' : btnStyle.color,
      }}
    >
      {label}
    </a>
  );
}

function relTime(iso) {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '';
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  if (s < 86400 * 14) return Math.floor(s / 86400) + 'd ago';
  return new Date(iso).toISOString().slice(0, 10);
}

function ApplyModal({ briefing, openCount, onClose, onResolveAll }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/briefings/feedback/${briefing.scope}/${briefing.id}/prompt`)
      .then(async (r) => {
        const j = await r.json();
        if (cancelled) return;
        if (!r.ok || j.error) setError(j.error || 'http ' + r.status);
        else setData(j);
      })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [briefing.scope, briefing.id]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
        zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 560, maxWidth: '90vw', maxHeight: '85vh',
          background: 'var(--color-gb-bg0)',
          border: '1px solid var(--color-gb-bg3)',
          borderRadius: 4, padding: 18,
          color: 'var(--color-gb-fg1)',
          display: 'flex', flexDirection: 'column', gap: 12,
          fontSize: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontSize: 14, color: 'var(--color-gb-fg0)' }}>
            Apply {openCount} note{openCount === 1 ? '' : 's'} via Claude
          </div>
          <button onClick={onClose} style={{ ...btnStyle, padding: '2px 8px' }}>close</button>
        </div>

        {error && <div style={{ color: 'var(--color-gb-red-br)' }}>{error}</div>}
        {!data && !error && <div style={{ color: 'var(--color-gb-fg4)' }}>preparing prompt…</div>}

        {data && (
          <>
            <div style={{ color: 'var(--color-gb-fg3)', lineHeight: 1.5 }}>
              <div><b>1.</b> Open a terminal at the workspace root.</div>
              <div><b>2.</b> Run this command:</div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <code style={{
                flex: 1,
                background: 'var(--color-gb-bg0-hard)',
                border: '1px solid var(--color-gb-bg2)',
                padding: '6px 8px',
                borderRadius: 2,
                fontSize: 11,
                color: 'var(--color-gb-fg1)',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
              }}>{data.cmd}</code>
              <CopyButton value={data.cmd} />
            </div>
            <div style={{ color: 'var(--color-gb-fg3)' }}><b>3.</b> Paste this prompt and let Claude work:</div>
            <textarea
              readOnly
              value={data.prompt}
              style={{
                width: '100%',
                minHeight: 180,
                resize: 'vertical',
                background: 'var(--color-gb-bg0-hard)',
                border: '1px solid var(--color-gb-bg2)',
                color: 'var(--color-gb-fg1)',
                fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                fontSize: 11,
                padding: 8,
                boxSizing: 'border-box',
                borderRadius: 2,
              }}
              onClick={(e) => e.target.select()}
            />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <CopyButton value={data.prompt} />
              <span style={{ color: 'var(--color-gb-fg4)' }}>copy prompt</span>
              <div style={{ flex: 1 }} />
              <button
                onClick={async () => { await onResolveAll(); onClose(); }}
                style={{ ...btnStyle, color: 'var(--color-gb-aqua-br)' }}
                title="Mark every open note resolved (use after Claude has applied them)"
              >
                mark all resolved
              </button>
            </div>
            <div style={{ color: 'var(--color-gb-fg4)', lineHeight: 1.5, fontSize: 11 }}>
              When Claude finishes editing, refresh the preview (the iframe reload picks up file changes automatically) and mark notes resolved.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FeedbackItem({ item, onResolve, onReopen, onDelete, onShowAnchor }) {
  const open = item.status !== 'resolved';
  return (
    <div style={{
      padding: '8px 10px',
      marginBottom: 6,
      background: open ? 'var(--color-gb-bg0-soft)' : 'transparent',
      border: '1px solid var(--color-gb-bg1)',
      borderLeft: `2px solid ${open ? 'var(--color-gb-yellow-br)' : 'var(--color-gb-bg3)'}`,
      opacity: open ? 1 : 0.7,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <div style={{ color: 'var(--color-gb-fg0)', fontSize: 12 }}>
          {item.from || 'anonymous'}
        </div>
        <div style={{ color: 'var(--color-gb-fg4)', fontSize: 10 }}>
          {relTime(item.at)}
        </div>
      </div>
      {item.anchor && (
        <button
          onClick={() => onShowAnchor?.(item.anchor)}
          title="Show this passage in the preview"
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            background: 'transparent',
            border: 0,
            padding: 0,
            marginTop: 4,
            cursor: onShowAnchor ? 'pointer' : 'default',
            font: 'inherit',
          }}
        >
          <div style={{
            fontSize: 10,
            fontStyle: 'italic',
            color: 'var(--color-gb-yellow-br)',
            borderLeft: '2px solid var(--color-gb-yellow-fd)',
            paddingLeft: 6,
          }}>
            “{item.anchor}”{onShowAnchor && <span style={{ marginLeft: 4, opacity: 0.7 }}>↗</span>}
          </div>
        </button>
      )}
      <div style={{
        marginTop: 4,
        fontSize: 12,
        color: 'var(--color-gb-fg1)',
        whiteSpace: 'pre-wrap',
        lineHeight: 1.45,
      }}>
        {item.message}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        {open ? (
          <button onClick={() => onResolve(item.id)} style={{ ...btnStyle, color: 'var(--color-gb-aqua-br)' }}>resolve</button>
        ) : (
          <button onClick={() => onReopen(item.id)} style={btnStyle}>reopen</button>
        )}
        <button onClick={() => onDelete(item.id)} style={{ ...btnStyle, color: 'var(--color-gb-red-br)' }}>×</button>
      </div>
    </div>
  );
}

function AddNoteForm({ briefing, onAdded, onCancel }) {
  const [from, setFrom] = useState('');
  const [anchor, setAnchor] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function submit() {
    const m = message.trim();
    if (!m) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`/api/briefings/feedback/${briefing.scope}/${briefing.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: from.trim() || 'pasted',
          anchor: anchor.trim() || null,
          message: m,
        }),
      });
      const j = await r.json();
      if (!r.ok || j.error) throw new Error(j.error || 'http ' + r.status);
      onAdded();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{
      padding: '10px 12px',
      marginBottom: 10,
      background: 'var(--color-gb-bg0-soft)',
      border: '1px solid var(--color-gb-bg2)',
      borderLeft: '2px solid var(--color-gb-blue-br)',
    }}>
      <div style={{ fontSize: 11, color: 'var(--color-gb-fg3)', marginBottom: 6 }}>
        Add a note manually (paste from email, Slack, etc.)
      </div>
      <input
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        placeholder="From (e.g. Riley)"
        style={inputStyle}
      />
      <input
        value={anchor}
        onChange={(e) => setAnchor(e.target.value)}
        placeholder='Pinned to (optional, e.g. "Day 2 itinerary")'
        style={inputStyle}
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Their note…"
        style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
      />
      {error && <div style={{ color: 'var(--color-gb-red-br)', fontSize: 11, marginBottom: 4 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={submit} disabled={busy || !message.trim()} style={{ ...btnStyle, color: 'var(--color-gb-aqua-br)' }}>
          {busy ? 'saving…' : 'add'}
        </button>
        <button onClick={onCancel} style={btnStyle}>cancel</button>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'var(--color-gb-bg0-hard)',
  border: '1px solid var(--color-gb-bg2)',
  color: 'var(--color-gb-fg1)',
  padding: '4px 8px',
  fontSize: 11,
  fontFamily: 'inherit',
  marginBottom: 6,
  borderRadius: 2,
};

function FeedbackPanel({ briefing, onCountChange, onShowAnchor }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [showResolved, setShowResolved] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [pullStatus, setPullStatus] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch(`/api/briefings/feedback/${briefing.scope}/${briefing.id}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'http ' + r.status);
      setItems(j.feedback || []);
      setError(null);
      onCountChange?.((j.feedback || []).filter((f) => f.status !== 'resolved').length);
    } catch (e) {
      setError(e.message);
    }
  }, [briefing.scope, briefing.id, onCountChange]);

  useEffect(() => { refresh(); }, [refresh]);

  // Auto-pull cloud notes when the panel opens for a published briefing.
  // Same flow as the manual button below; status surfaces only if it
  // actually pulls anything new (otherwise stays out of the way).
  const pull = useCallback(async () => {
    if (pulling) return;
    if (!briefing.publishUrl) {
      setPullStatus({ kind: 'info', text: 'publish first to enable cloud pull' });
      return;
    }
    setPulling(true);
    try {
      const r = await fetch('/api/briefings/pull-cloud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromScope: briefing.scope, fromId: briefing.id }),
      });
      const j = await r.json();
      if (!r.ok || j.error) {
        setPullStatus({ kind: 'error', text: j.error || ('http ' + r.status) });
      } else {
        setPullStatus({
          kind: j.added ? 'good' : 'idle',
          text: j.added ? `+${j.added} new` : 'up to date',
        });
        if (j.added > 0) await refresh();
      }
    } catch (e) {
      setPullStatus({ kind: 'error', text: e.message });
    } finally {
      setPulling(false);
      setTimeout(() => setPullStatus(null), 4000);
    }
  }, [briefing.scope, briefing.id, briefing.publishUrl, pulling, refresh]);

  useEffect(() => {
    if (briefing.publishUrl) pull();
    // re-pull when the briefing under the panel changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [briefing.scope, briefing.id]);

  useEffect(() => {
    const sub = window.__atelier?.subscribe?.('briefings', (frame) => {
      if ((frame.type === 'feedback-added' || frame.type === 'feedback-changed') &&
          frame.scope === briefing.scope && frame.id === briefing.id) {
        refresh();
      }
    });
    return sub;
  }, [briefing.scope, briefing.id, refresh]);

  async function setStatus(id, status) {
    await fetch(`/api/briefings/feedback/${briefing.scope}/${briefing.id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    await refresh();
  }
  async function resolveAll() {
    await fetch(`/api/briefings/feedback/${briefing.scope}/${briefing.id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'resolved' }),
    });
    await refresh();
  }
  async function remove(id) {
    if (!window.confirm('Delete this note?')) return;
    await fetch(`/api/briefings/feedback/${briefing.scope}/${briefing.id}/${id}`, { method: 'DELETE' });
    await refresh();
  }

  const open = (items || []).filter((f) => f.status !== 'resolved');
  const resolved = (items || []).filter((f) => f.status === 'resolved');

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{
        padding: '8px 14px',
        borderBottom: '1px solid var(--color-gb-bg2)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flex: '0 0 auto',
      }}>
        <div style={{ fontSize: 11, color: 'var(--color-gb-fg3)' }}>
          {open.length} open · {resolved.length} resolved
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={refresh} style={btnStyle}>refresh</button>
        <button
          onClick={pull}
          disabled={pulling || !briefing.publishUrl}
          style={{ ...btnStyle, color: briefing.publishUrl ? 'var(--color-gb-aqua-br)' : 'var(--color-gb-fg4)', opacity: briefing.publishUrl ? 1 : 0.5 }}
          title={briefing.publishUrl ? 'Pull notes left on the published URL' : 'Publish first to enable cloud pull'}
        >
          {pulling ? 'pulling…' : 'pull cloud'}
        </button>
        {pullStatus && (
          <span style={{
            fontSize: 10,
            color: pullStatus.kind === 'error' ? 'var(--color-gb-red-br)'
                 : pullStatus.kind === 'good'  ? 'var(--color-gb-aqua-br)'
                 :                                'var(--color-gb-fg4)',
          }}>
            {pullStatus.text}
          </span>
        )}
        <button onClick={() => setAddOpen(true)} style={btnStyle} title="Type or paste a note manually">+ note</button>
        <button
          onClick={() => setApplyOpen(true)}
          disabled={open.length === 0}
          style={{
            ...btnStyle,
            color: open.length ? 'var(--color-gb-aqua-br)' : 'var(--color-gb-fg4)',
            opacity: open.length ? 1 : 0.5,
          }}
          title={open.length ? 'Generate a Claude prompt for these notes' : 'No open notes'}
        >
          apply via claude
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>
        {error && (
          <div style={{ color: 'var(--color-gb-red-br)', fontSize: 11, marginBottom: 10 }}>{error}</div>
        )}
        {!items && !error && <div style={{ color: 'var(--color-gb-fg4)', fontSize: 11 }}>loading…</div>}
        {addOpen && (
          <AddNoteForm
            briefing={briefing}
            onAdded={() => { setAddOpen(false); refresh(); }}
            onCancel={() => setAddOpen(false)}
          />
        )}

        {items && open.length === 0 && resolved.length === 0 && (
          <div style={{ color: 'var(--color-gb-fg4)', fontSize: 12, lineHeight: 1.6 }}>
            No notes yet. The brochure has a “✎” button bottom-right — readers can leave notes from there. They'll appear here.
          </div>
        )}

        {open.map((f) => (
          <FeedbackItem
            key={f.id}
            item={f}
            onResolve={(id) => setStatus(id, 'resolved')}
            onReopen={(id) => setStatus(id, 'open')}
            onDelete={remove}
          />
        ))}

        {resolved.length > 0 && (
          <>
            <button
              onClick={() => setShowResolved((v) => !v)}
              style={{
                ...btnStyle,
                marginTop: 12,
                marginBottom: 6,
                background: 'transparent',
                border: 'none',
                color: 'var(--color-gb-fg4)',
                padding: 0,
              }}
            >
              {showResolved ? '▾' : '▸'} resolved · {resolved.length}
            </button>
            {showResolved && resolved.map((f) => (
              <FeedbackItem
                key={f.id}
                item={f}
                onResolve={(id) => setStatus(id, 'resolved')}
                onReopen={(id) => setStatus(id, 'open')}
                onDelete={remove}
                onShowAnchor={onShowAnchor}
              />
            ))}
          </>
        )}
      </div>

      {applyOpen && (
        <ApplyModal
          briefing={briefing}
          openCount={open.length}
          onClose={() => setApplyOpen(false)}
          onResolveAll={resolveAll}
        />
      )}
    </div>
  );
}

function Tab({ active, count, label, tone, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...btnStyle,
        background: active ? 'var(--color-gb-bg1)' : 'transparent',
        border: 'none',
        borderBottom: active ? `2px solid ${tone}` : '2px solid transparent',
        borderRadius: 0,
        color: active ? 'var(--color-gb-fg0)' : 'var(--color-gb-fg3)',
        padding: '6px 10px',
        marginBottom: -1,
      }}
    >
      {label}{count > 0 && (
        <span style={{
          marginLeft: 6, padding: '0 5px', borderRadius: 8,
          background: tone, color: 'var(--color-gb-bg0)', fontSize: 9, fontWeight: 700,
        }}>{count}</span>
      )}
    </button>
  );
}

function Preview({ briefing }) {
  const [tab, setTab] = useState('preview');
  const [openCount, setOpenCount] = useState(briefing?.openFeedback || 0);
  const iframeRef = useRef(null);
  useEffect(() => { setOpenCount(briefing?.openFeedback || 0); }, [briefing?.scope, briefing?.id, briefing?.openFeedback]);

  const [scrollHint, setScrollHint] = useState(null);
  const pendingAnchorRef = useRef(null);
  const [allFeedback, setAllFeedback] = useState([]);

  // Fetch feedback for highlights (separately from FeedbackPanel which
  // does its own fetching for the list view). Cheap; both will pull on
  // briefings-changed and we want the iframe to get highlights even if
  // the user is on the preview tab and never opens FeedbackPanel.
  const fetchFeedbackForHighlights = useCallback(async () => {
    if (!briefing) return;
    try {
      const r = await fetch(`/api/briefings/feedback/${briefing.scope}/${briefing.id}`);
      const j = await r.json();
      setAllFeedback(Array.isArray(j.feedback) ? j.feedback : []);
    } catch {}
  }, [briefing?.scope, briefing?.id]);

  useEffect(() => { fetchFeedbackForHighlights(); }, [fetchFeedbackForHighlights]);

  useEffect(() => {
    const sub = window.__atelier?.subscribe?.('briefings', (frame) => {
      if ((frame.type === 'feedback-added' || frame.type === 'feedback-changed') &&
          frame.scope === briefing?.scope && frame.id === briefing?.id) {
        fetchFeedbackForHighlights();
      }
    });
    return sub;
  }, [briefing?.scope, briefing?.id, fetchFeedbackForHighlights]);

  // Push the open-with-anchor notes to the iframe for highlighting.
  // sendHighlights re-runs whenever feedback changes.
  const sendHighlights = useCallback(() => {
    const w = iframeRef.current?.contentWindow;
    if (!w) return;
    const open = (allFeedback || []).filter((f) => f.status !== 'resolved' && f.anchor);
    try { w.postMessage({ type: 'briefings.setHighlights', notes: open }, '*'); } catch {}
  }, [allFeedback]);

  useEffect(() => { sendHighlights(); }, [sendHighlights]);

  // Replay highlights once the iframe finishes loading — covers both the
  // initial mount and any forced reload (e.g. briefing switch).
  useEffect(() => {
    const el = iframeRef.current;
    if (!el) return;
    const onLoad = () => setTimeout(sendHighlights, 600);
    el.addEventListener('load', onLoad);
    return () => el.removeEventListener('load', onLoad);
  }, [sendHighlights]);

  // Iframe asks atelier to resolve a note (clicked the popover button).
  useEffect(() => {
    const onMsg = async (e) => {
      const d = e.data;
      if (!d || d.type !== 'briefings.resolve' || !d.id || !briefing) return;
      try {
        await fetch(`/api/briefings/feedback/${briefing.scope}/${briefing.id}/resolve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: d.id, status: 'resolved' }),
        });
        fetchFeedbackForHighlights();
      } catch {}
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [briefing?.scope, briefing?.id, fetchFeedbackForHighlights]);

  // Click an anchor in the feedback panel → switch to preview, then
  // postMessage the iframe so its widget bridge scrolls + flashes. We
  // first try messaging the live iframe (instant). If the iframe was
  // loaded before the widget had this bridge, the message just no-ops;
  // we also re-queue the anchor and force a reload via the load
  // listener below so stale iframes recover automatically next time.
  const showAnchor = useCallback((anchor) => {
    if (!anchor) return;
    setTab('preview');
    setScrollHint(anchor);
    setTimeout(() => setScrollHint(null), 2500);
    pendingAnchorRef.current = anchor;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const w = iframeRef.current?.contentWindow;
      if (w) {
        try { w.postMessage({ type: 'briefings.scrollTo', anchor }, '*'); } catch {}
      }
    }));
  }, []);

  // When the iframe finishes loading, drain any queued anchor request.
  // This catches the "I clicked before iframe was ready" race and the
  // "iframe content was stale, I just reloaded it" path.
  useEffect(() => {
    const el = iframeRef.current;
    if (!el) return;
    const onLoad = () => {
      const a = pendingAnchorRef.current;
      if (!a) return;
      // Brochure uses runtime Babel — give it a moment to mount before we
      // ask its DOM to find text.
      setTimeout(() => {
        try { el.contentWindow?.postMessage({ type: 'briefings.scrollTo', anchor: a }, '*'); } catch {}
        pendingAnchorRef.current = null;
      }, 800);
    };
    el.addEventListener('load', onLoad);
    return () => el.removeEventListener('load', onLoad);
  }, [briefing?.scope, briefing?.id]);

  if (!briefing) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-gb-fg4)',
        fontSize: 12,
      }}>
        select a briefing on the left
      </div>
    );
  }
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div style={{
        padding: '8px 14px',
        borderBottom: '1px solid var(--color-gb-bg2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flex: '0 0 auto',
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, color: 'var(--color-gb-fg0)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {briefing.name}
          </div>
          <div style={{ marginTop: 3 }}>
            <PathLine briefing={briefing} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flex: '0 0 auto' }}>
          <PublishButton briefing={briefing} />
          <PdfButton briefing={briefing} />
          <a
            href={viewUrl(briefing)}
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...btnStyle, textDecoration: 'none' }}
          >
            open in tab ↗
          </a>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: 0,
        borderBottom: '1px solid var(--color-gb-bg2)',
        flex: '0 0 auto',
        paddingLeft: 8,
      }}>
        <Tab active={tab === 'preview'}  label="preview"  tone="var(--color-gb-blue-br)"   onClick={() => setTab('preview')}  count={0} />
        <Tab active={tab === 'feedback'} label="feedback" tone="var(--color-gb-yellow-br)" onClick={() => setTab('feedback')} count={openCount} />
      </div>
      {briefing.publishUrl && (() => {
        const expired = briefing.expiresAt && Date.parse(briefing.expiresAt) < Date.now();
        const stateLabel = expired ? 'expired'
                         : briefing.lock ? 'locked'
                         : 'live';
        const stateTone  = expired ? 'var(--color-gb-red-br)'
                         : briefing.lock ? 'var(--color-gb-purple-br)'
                         : 'var(--color-gb-aqua-br)';
        return (
          <div style={{
            padding: '6px 14px',
            borderBottom: '1px solid var(--color-gb-bg2)',
            background: 'var(--color-gb-bg0-soft)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 11,
            flex: '0 0 auto',
            position: 'relative',
            flexWrap: 'wrap',
          }}>
            <span style={{ textTransform: 'uppercase', letterSpacing: 1, color: stateTone }}>{stateLabel}</span>
            <a
              href={briefing.publishUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--color-gb-fg1)',
                textDecoration: 'none',
                fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 100,
              }}
            >
              {briefing.publishUrl}
            </a>
            <CopyButton value={briefing.publishUrl} />
            <LockButton briefing={briefing} />
            <ExpireMenu briefing={briefing} />
            <UnpublishButton briefing={briefing} />
          </div>
        );
      })()}
      {!briefing.publishUrl && briefing.unpublishedAt && (
        <div style={{
          padding: '6px 14px',
          borderBottom: '1px solid var(--color-gb-bg2)',
          background: 'var(--color-gb-bg0-soft)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 11,
          flex: '0 0 auto',
        }}>
          <span style={{ textTransform: 'uppercase', letterSpacing: 1, color: 'var(--color-gb-fg4)' }}>unpublished</span>
          <span style={{ color: 'var(--color-gb-fg4)' }}>
            taken down {new Date(briefing.unpublishedAt).toISOString().slice(0, 16).replace('T', ' ')} UTC · re-publish to bring back
          </span>
        </div>
      )}
      {scrollHint && tab === 'preview' && (
        <div style={{
          position: 'absolute',
          top: 90, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--color-gb-yellow-fd)',
          color: 'var(--color-gb-fg0)',
          padding: '4px 10px', borderRadius: 3, fontSize: 11,
          zIndex: 20, pointerEvents: 'none',
          maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          scrolling to “{scrollHint}”
        </div>
      )}
      <iframe
        ref={iframeRef}
        key={`${briefing.scope}:${briefing.id}`}
        src={viewUrl(briefing)}
        title={briefing.name}
        style={{
          flex: tab === 'preview' ? 1 : 0,
          display: tab === 'preview' ? 'block' : 'none',
          width: '100%',
          border: 0,
          background: 'var(--color-gb-bg0-hard)',
        }}
      />
      {tab === 'feedback' && (
        <FeedbackPanel
          briefing={briefing}
          onCountChange={setOpenCount}
          onShowAnchor={showAnchor}
        />
      )}
    </div>
  );
}

export default function Module() {
  const [briefings, setBriefings] = useState(null);
  const [selected, setSelected]   = useState(null);
  const [error, setError]         = useState(null);
  const [busy, setBusy]           = useState(false);
  const lastSelectedRef = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/briefings/list');
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || ('http ' + r.status));
      setBriefings(j.briefings || []);
      setError(null);
      return j.briefings || [];
    } catch (e) {
      setError(e.message);
      return [];
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const sub = window.__atelier?.subscribe?.('briefings', (frame) => {
      if (frame.type === 'briefings-changed' ||
          frame.type === 'feedback-added' ||
          frame.type === 'feedback-changed') {
        refresh();
      }
    });
    return sub;
  }, [refresh]);

  // Auto-select once briefings load. Re-run if the previously selected
  // briefing disappeared (deleted) so the preview doesn't dangle.
  useEffect(() => {
    if (!briefings) return;
    const stillThere = selected && briefings.find((b) => sameItem(b, selected));
    if (stillThere) return;
    setSelected(briefings[0] || null);
  }, [briefings, selected]);

  const select = useCallback((b) => {
    setSelected(b);
    lastSelectedRef.current = b;
  }, []);

  const duplicate = useCallback(async (b) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch('/api/briefings/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromScope: b.scope, fromId: b.id }),
      });
      const j = await r.json();
      if (!r.ok || j.error) throw new Error(j.error || 'duplicate failed');
      const next = await refresh();
      const created = next.find((x) => x.scope === j.scope && x.id === j.id);
      if (created) setSelected(created);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }, [busy, refresh]);

  const remove = useCallback(async (b) => {
    if (b.scope !== 'item') return;
    const childCount = (briefings || []).filter((x) => x.parentId === b.id).length;
    const msg = childCount
      ? `Delete "${b.name}" and its ${childCount} child briefing${childCount === 1 ? '' : 's'}? This removes the folders permanently.`
      : `Delete "${b.name}"? This removes the folder permanently.`;
    if (!window.confirm(msg)) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch('/api/briefings/item/' + b.id, { method: 'DELETE' });
      const j = await r.json();
      if (!r.ok || j.error) throw new Error(j.error || 'delete failed');
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }, [refresh, briefings]);

  const addChild = useCallback(async (parent) => {
    if (busy) return;
    const name = (window.prompt(`Name for the new child of "${parent.name}":`, 'New section') || '').trim();
    if (!name) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch('/api/briefings/add-child', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId: parent.id, name }),
      });
      const j = await r.json();
      if (!r.ok || j.error) throw new Error(j.error || 'add-child failed');
      const next = await refresh();
      const created = next.find((x) => x.scope === j.scope && x.id === j.id);
      if (created) setSelected(created);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }, [busy, refresh]);

  // Group templates flat (seeds don't have children), and instances as a
  // tree: top-level items first, with each item's children rendered
  // immediately beneath their parent. Orphaned children (parent missing)
  // fall back to top level so they're still reachable from the dashboard.
  const grouped = useMemo(() => {
    const out = { template: [], instance: [] };
    if (!briefings) return out;
    for (const b of briefings) {
      if (b.kind !== 'instance') { (out[b.kind] || out.template).push(b); continue; }
    }
    const items = briefings.filter((b) => b.kind === 'instance');
    const childrenByParent = new Map();
    for (const b of items) {
      if (b.parentId) {
        if (!childrenByParent.has(b.parentId)) childrenByParent.set(b.parentId, []);
        childrenByParent.get(b.parentId).push(b);
      }
    }
    const itemIds = new Set(items.map((b) => b.id));
    const tree = [];
    for (const b of items) {
      if (b.parentId && itemIds.has(b.parentId)) continue;
      tree.push({ node: b, children: childrenByParent.get(b.id) || [] });
    }
    out.instance = tree;
    return out;
  }, [briefings]);

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      width: '100%',
      background: 'var(--color-gb-bg0)',
      color: 'var(--color-gb-fg1)',
    }}>
      {/* Left: list */}
      <div style={{
        flex: '0 0 320px',
        width: 320,
        height: '100%',
        boxSizing: 'border-box',
        padding: '12px 12px 12px 14px',
        borderRight: '1px solid var(--color-gb-bg2)',
        overflowY: 'auto',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 10,
        }}>
          <div style={{ fontSize: 13, color: 'var(--color-gb-fg0)' }}>Briefings</div>
          <button onClick={refresh} disabled={busy} style={{ ...btnStyle, padding: '2px 8px' }}>
            refresh
          </button>
        </div>

        {error && (
          <div style={{ color: 'var(--color-gb-red-br)', fontSize: 11, marginBottom: 10, lineHeight: 1.4 }}>
            {error}
          </div>
        )}

        {!briefings && !error && (
          <div style={{ color: 'var(--color-gb-fg4)', fontSize: 11 }}>loading…</div>
        )}

        {briefings && briefings.length === 0 && (
          <div style={{ color: 'var(--color-gb-fg4)', fontSize: 11, lineHeight: 1.5 }}>
            No briefings yet. Drop a Claude Design handover into{' '}
            <code style={{ color: 'var(--color-gb-fg2)' }}>briefings/seed/&lt;id&gt;/</code>{' '}
            (with a <code>briefing.json</code>) to add one.
          </div>
        )}

        {grouped.template.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: 1,
              color: KIND_TONE.template,
              marginBottom: 6,
            }}>
              templates <span style={{ color: 'var(--color-gb-fg4)' }}>· {grouped.template.length}</span>
            </div>
            {grouped.template.map((b) => (
              <Card
                key={`${b.scope}:${b.id}`}
                briefing={b}
                selected={sameItem(b, selected)}
                onSelect={select}
                onDuplicate={duplicate}
                onDelete={remove}
                onAddChild={addChild}
                busy={busy}
                isChild={false}
                childCount={0}
              />
            ))}
          </div>
        )}
        {grouped.instance.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: 1,
              color: KIND_TONE.instance,
              marginBottom: 6,
            }}>
              instances <span style={{ color: 'var(--color-gb-fg4)' }}>· {grouped.instance.reduce((n, t) => n + 1 + t.children.length, 0)}</span>
            </div>
            {grouped.instance.map(({ node, children }) => (
              <React.Fragment key={`${node.scope}:${node.id}`}>
                <Card
                  briefing={node}
                  selected={sameItem(node, selected)}
                  onSelect={select}
                  onDuplicate={duplicate}
                  onDelete={remove}
                  onAddChild={addChild}
                  busy={busy}
                  isChild={false}
                  childCount={children.length}
                />
                {children.map((c) => (
                  <Card
                    key={`${c.scope}:${c.id}`}
                    briefing={c}
                    selected={sameItem(c, selected)}
                    onSelect={select}
                    onDuplicate={duplicate}
                    onDelete={remove}
                    onAddChild={addChild}
                    busy={busy}
                    isChild={true}
                    childCount={0}
                  />
                ))}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Right: preview */}
      <Preview briefing={selected} />
    </div>
  );
}
