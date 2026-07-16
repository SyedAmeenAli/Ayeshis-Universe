import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PHONE_APPS, PHONE_MESSAGES, PHONE_CONTACTS, PHONE_NOTES, PHONE_FILES, PUNGUN_BINARY, TERMINAL_HELP,
} from "@/data/caseData";
import { X, ChevronLeft } from "lucide-react";

/**
 * Fake phone OS shell — renders all 17 apps with meaningful content.
 * Every app icon opens something. Contents are read-only unless a puzzle overrides.
 */
export function PhoneOS({ children, openApp, onAppOpen, onAppClose, pinEvidence, pinnedEvidence, unlockedApps, act, actions }) {
  return (
    <div className="w-full max-w-[420px] mx-auto md:mx-0 relative select-none" data-testid="phone-os">
      <div className="relative rounded-[36px] border border-white/12 bg-archive-soft overflow-hidden shadow-2xl" style={{ aspectRatio: "9/19.5" }}>
        {/* Status bar */}
        <div className="absolute top-0 inset-x-0 z-30 flex justify-between items-center px-6 py-2 text-[10px] text-lavender/80 font-mono">
          <span>01:47</span>
          <div className="flex items-center gap-1">
            <span>◐</span>
            <span>▮▮▮</span>
            <span>◔</span>
          </div>
        </div>

        {!openApp && (
          <PhoneHome onOpen={onAppOpen} unlockedApps={unlockedApps} />
        )}

        <AnimatePresence>
          {openApp && (
            <motion.div
              key={openApp}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 z-20 bg-archive-soft flex flex-col"
              data-testid={`phone-app-${openApp}`}
            >
              <div className="flex items-center gap-2 px-4 pt-8 pb-2 border-b border-white/8">
                <button onClick={onAppClose} className="w-8 h-8 flex items-center justify-center text-text-secondary" data-testid="phone-back">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="type-mono text-[10px] text-lavender uppercase">
                  {PHONE_APPS.find((a) => a.key === openApp)?.label}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto">
                <AppContent app={openApp} pinEvidence={pinEvidence} pinnedEvidence={pinnedEvidence} act={act} actions={actions} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {children}
    </div>
  );
}

function PhoneHome({ onOpen, unlockedApps }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col pt-10">
      <div className="flex-1 grid grid-cols-4 gap-3 p-4 content-start">
        {PHONE_APPS.map((app) => {
          const locked = !unlockedApps.includes(app.key);
          return (
            <button
              key={app.key}
              onClick={() => !locked && onOpen(app.key)}
              disabled={locked}
              className={`flex flex-col items-center gap-1 rounded-2xl bg-surface-2 p-3 ${locked ? "opacity-30" : "hover:bg-surface-3"} transition-colors`}
              data-testid={`phone-icon-${app.key}`}
            >
              <span className="text-2xl">{app.icon}</span>
              <span className="text-[9px] text-text-secondary text-center leading-tight">{app.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AppContent({ app, pinEvidence, pinnedEvidence, act, actions }) {
  switch (app) {
    case "messages": return <MessagesApp pinEvidence={pinEvidence} pinnedEvidence={pinnedEvidence} />;
    case "phone": return <PhoneCallsApp pinEvidence={pinEvidence} />;
    case "contacts": return <ContactsApp pinEvidence={pinEvidence} />;
    case "gallery": return <GalleryApp pinEvidence={pinEvidence} />;
    case "camera": return <CameraApp />;
    case "files": return <FilesApp actions={actions} act={act} />;
    case "notes": return <NotesApp />;
    case "maps": return <MapsApp pinEvidence={pinEvidence} act={act} />;
    case "browser": return <BrowserApp />;
    case "mail": return <MailApp pinEvidence={pinEvidence} />;
    case "calculator": return <CalculatorApp />;
    case "settings": return <SettingsApp />;
    case "notif": return <NotificationsApp actions={actions} />;
    case "terminal": return <TerminalApp actions={actions} />;
    case "board": return <div className="p-4"><p className="type-mono text-[9px] text-text-muted">Open the Evidence Board panel to work with evidence.</p></div>;
    case "ghost": return <GhostApp act={act} />;
    case "logs": return <LogsApp />;
    default: return null;
  }
}

function MessagesApp({ pinEvidence, pinnedEvidence }) {
  const [active, setActive] = useState(null);
  const thread = PHONE_MESSAGES.find((m) => m.thread === active);
  if (thread) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-white/8">
          <button onClick={() => setActive(null)} className="type-mono text-[9px] text-lavender">← threads</button>
          <p className="text-sm mt-1">{thread.contact}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          {thread.messages.map((m, i) => (
            <div key={i} className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${m.from === "me" ? "self-end bg-lavender text-archive" : "self-start bg-surface-3"}`}>
              <p>{m.text}</p>
              <span className="type-mono text-[8px] opacity-60">{m.ts}</span>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-white/8">
          <button
            onClick={() => pinEvidence(`msg-${thread.thread}`, { kind: "chat", contact: thread.contact })}
            data-testid={`phone-msg-pin-${thread.thread}`}
            className="type-mono text-[9px] text-lavender border border-white/10 rounded-full px-3 py-1"
          >
            pin to evidence
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="p-3 divide-y divide-white/8">
      {PHONE_MESSAGES.map((m) => (
        <button key={m.thread} onClick={() => setActive(m.thread)} className="w-full text-left py-3 flex flex-col gap-1" data-testid={`phone-msg-${m.thread}`}>
          <div className="flex justify-between items-center">
            <span className="text-sm">{m.contact}</span>
            {m.corrupted && <span className="type-mono text-[9px] text-danger-red">⨯</span>}
          </div>
          <span className={`text-xs ${m.corrupted ? "text-danger-red/70" : "text-text-secondary"}`}>{m.preview}</span>
        </button>
      ))}
    </div>
  );
}

function PhoneCallsApp({ pinEvidence }) {
  const calls = [
    { key: "ayesha1", name: "Ayesha ♡", type: "outgoing", dur: "24:12", ts: "21:15" },
    { key: "unknown1", name: "Unknown", type: "missed", dur: "0:00", ts: "23:41" },
    { key: "unknown2", name: "Unknown", type: "missed", dur: "0:00", ts: "23:43" },
    { key: "hathim", name: "Hathim", type: "outgoing", dur: "0:47", ts: "20:12" },
    { key: "cravery", name: "Cravery Café", type: "outgoing", dur: "1:22", ts: "19:44" },
  ];
  return (
    <div className="p-3 divide-y divide-white/8">
      {calls.map((c) => (
        <div key={c.key} className="py-2 flex justify-between items-center">
          <div>
            <p className="text-sm">{c.name}</p>
            <p className="type-mono text-[9px] text-text-muted">{c.type} · {c.dur} · {c.ts}</p>
          </div>
          <button
            onClick={() => pinEvidence(`call-${c.key}`, { kind: "call", name: c.name, ts: c.ts })}
            className="type-mono text-[9px] text-lavender border border-white/10 rounded-full px-2 py-0.5"
            data-testid={`phone-call-pin-${c.key}`}
          >
            pin
          </button>
        </div>
      ))}
    </div>
  );
}

function ContactsApp({ pinEvidence }) {
  return (
    <div className="p-3 divide-y divide-white/8">
      {PHONE_CONTACTS.map((c) => (
        <div key={c.key} className="py-2 flex justify-between items-center">
          <div>
            <p className={`text-sm ${c.corrupted ? "text-danger-red" : ""}`}>{c.label}</p>
            <p className="type-mono text-[9px] text-text-muted">{c.subtitle}</p>
          </div>
          {c.pinnable && (
            <button
              onClick={() => pinEvidence(`contact-${c.key}`, { kind: "contact", label: c.label })}
              className="type-mono text-[9px] text-lavender border border-white/10 rounded-full px-2 py-0.5"
              data-testid={`phone-contact-pin-${c.key}`}
            >
              pin
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function GalleryApp({ pinEvidence }) {
  const photos = [
    { key: "cctv-cravery", label: "cctv_cravery_still.png", tag: "CCTV", note: "Café interior — table 4" },
    { key: "hathim-alibi", label: "hathim_alibi_thumb.png", tag: "photo", note: "Timestamp questionable" },
    { key: "grey-room", label: "unknown_room.png", tag: "unknown", note: "Corrupted metadata" },
    { key: "wagon-r", label: "wagon_r.png", tag: "vehicle", note: "Ameen's car" },
    { key: "tulip", label: "tulip.png", tag: "flower", note: "Ayesha loved these" },
  ];
  return (
    <div className="p-3 grid grid-cols-2 gap-2">
      {photos.map((p) => (
        <div key={p.key} className="rounded-lg border border-white/10 bg-surface-2 p-2">
          <div className="aspect-square rounded-md bg-gradient-to-br from-surface-3 to-surface-1 mb-2 flex items-center justify-center">
            <span className="type-mono text-[8px] text-text-muted">{p.tag}</span>
          </div>
          <p className="text-[10px] truncate">{p.label}</p>
          <p className="type-mono text-[8px] text-text-muted truncate">{p.note}</p>
          <button
            onClick={() => pinEvidence(`photo-${p.key}`, { kind: "photo", label: p.label })}
            className="mt-1 type-mono text-[9px] text-lavender"
            data-testid={`phone-photo-pin-${p.key}`}
          >
            + pin
          </button>
        </div>
      ))}
    </div>
  );
}

function CameraApp() {
  return (
    <div className="p-6 flex flex-col items-center gap-4">
      <div className="w-full aspect-square rounded-xl bg-surface-2 border border-white/10 flex items-center justify-center">
        <span className="type-mono text-[10px] text-text-muted">camera unavailable</span>
      </div>
      <p className="type-mono text-[9px] text-text-muted text-center">
        Front camera has been remotely disabled by an unknown process.
      </p>
    </div>
  );
}

function FilesApp({ actions, act }) {
  const [open, setOpen] = useState(null);
  const file = PHONE_FILES.find((f) => f.key === open);
  if (file) {
    return (
      <div className="p-3">
        <button onClick={() => setOpen(null)} className="type-mono text-[9px] text-lavender">← files</button>
        <p className="mt-2 text-sm">{file.name}</p>
        <p className="type-mono text-[9px] text-text-muted">{file.type}</p>
        {file.key === "pungun-bin" && (
          <div className="mt-3">
            <pre className="p-3 rounded-lg bg-surface-2 text-[10px] font-mono text-lavender-soft break-words whitespace-pre-wrap">{PUNGUN_BINARY}</pre>
            <p className="mt-2 type-mono text-[9px] text-text-muted">Use the Archive Terminal → "decode PUNGUN.bin" to translate.</p>
          </div>
        )}
        {file.key === "hathim-alibi" && (
          <div className="mt-3">
            {actions?.act1?.hathimUnlocked ? (
              <>
                <div className="rounded-lg bg-surface-2 p-3">
                  <p className="text-sm">Photograph of Hathim near the café.</p>
                  <ul className="mt-2 type-mono text-[9px] text-text-muted space-y-1">
                    <li>metadata timestamp: 22:31</li>
                    <li>visible clock in photo: 21:48</li>
                    <li>reflection: CRAVERY signage</li>
                    <li>editor metadata: ARCHIVIST_NODE</li>
                    <li>gps (recovered): CRAVERY</li>
                  </ul>
                </div>
                <p className="mt-2 type-mono text-[9px] text-warning-gold">Open Act I → Hathim Red Herring in the investigation panel.</p>
              </>
            ) : (
              <p className="type-mono text-[9px] text-danger-red">Encrypted. Password required.</p>
            )}
          </div>
        )}
        {file.key === "cctv-cravery" && (
          <div className="mt-3">
            <p className="text-sm">CCTV archive from Cravery — 12 stills.</p>
            <p className="type-mono text-[9px] text-text-muted mt-1">Open in the CCTV puzzle (Act II).</p>
          </div>
        )}
        {file.key === "letters" && (
          <div className="mt-3">
            <p className="text-sm">letters.rtf</p>
            <p className="type-mono text-[10px] text-text-secondary mt-2 whitespace-pre-line">
              Draft letters to Ayesha. Half-finished apologies. A recipe for sushi. Nothing relevant to the case.
            </p>
          </div>
        )}
        {file.key === "ghost" && (
          <div className="mt-3">
            <p className="text-sm">ghost17.bak</p>
            <p className="type-mono text-[9px] text-text-muted mt-1">Encrypted backup. Access blocked by ARCHIVIST_NODE.</p>
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="p-3 divide-y divide-white/8">
      {PHONE_FILES.map((f) => (
        <button key={f.key} onClick={() => setOpen(f.key)} className="w-full text-left py-2 flex justify-between" data-testid={`phone-file-${f.key}`}>
          <span className="text-sm">{f.name}</span>
          <span className="type-mono text-[9px] text-text-muted">{f.type}{f.locked ? " · locked" : ""}</span>
        </button>
      ))}
    </div>
  );
}

function NotesApp() {
  const [open, setOpen] = useState(null);
  const note = PHONE_NOTES.find((n) => n.key === open);
  if (note) {
    return (
      <div className="p-3">
        <button onClick={() => setOpen(null)} className="type-mono text-[9px] text-lavender">← notes</button>
        <p className="mt-2 text-sm">{note.title}</p>
        <p className="mt-2 text-xs whitespace-pre-line text-text-secondary">{note.body}</p>
      </div>
    );
  }
  return (
    <div className="p-3 divide-y divide-white/8">
      {PHONE_NOTES.map((n) => (
        <button key={n.key} onClick={() => setOpen(n.key)} className="w-full text-left py-2" data-testid={`phone-note-${n.key}`}>
          <p className="text-sm">{n.title}</p>
          <p className="type-mono text-[9px] text-text-muted truncate">{n.body.split("\n")[0]}</p>
        </button>
      ))}
    </div>
  );
}

function MapsApp({ pinEvidence, act }) {
  const nodes = [
    { key: "home", label: "Home", x: 20, y: 30 },
    { key: "cravery", label: "Cravery Café", x: 55, y: 55 },
    { key: "college", label: "North Medical Block", x: 78, y: 30 },
    { key: "orr", label: "ORR — GREY-17", x: 88, y: 70 },
  ];
  return (
    <div className="p-3">
      <div className="relative w-full aspect-video rounded-lg bg-surface-2 border border-white/10 overflow-hidden">
        <svg viewBox="0 0 100 60" className="absolute inset-0 w-full h-full">
          <path d="M 20 30 L 55 55 L 78 30 L 88 70" stroke="rgba(184,156,255,0.5)" strokeWidth="0.4" strokeDasharray="1 1" fill="none" />
          {nodes.map((n) => (
            <g key={n.key}>
              <circle cx={n.x} cy={n.y} r={2} fill="#B89CFF" />
              <text x={n.x + 3} y={n.y + 1} fontSize="2.5" fill="#F7F4F6">{n.label}</text>
            </g>
          ))}
        </svg>
      </div>
      <div className="mt-3 space-y-2">
        {nodes.map((n) => (
          <button
            key={n.key}
            onClick={() => pinEvidence(`map-${n.key}`, { kind: "location", label: n.label })}
            className="w-full text-left rounded-lg border border-white/10 bg-surface-2 p-2 flex justify-between text-xs"
            data-testid={`phone-map-${n.key}`}
          >
            <span>{n.label}</span>
            <span className="type-mono text-[9px] text-lavender">+ pin</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function BrowserApp() {
  const history = [
    { url: "search.private/organophosphate symptoms", when: "22:12" },
    { url: "cravery.hyd/menu", when: "19:33" },
    { url: "wagonr-servicing.in", when: "18:04" },
    { url: "how to remove someone from a group chat gently", when: "17:22" },
    { url: "archivist_node.log — cached", when: "23:47", flagged: true },
  ];
  return (
    <div className="p-3">
      <p className="type-mono text-[9px] text-text-muted">recent history</p>
      <div className="mt-2 divide-y divide-white/8">
        {history.map((h, i) => (
          <div key={i} className="py-2">
            <p className={`text-xs ${h.flagged ? "text-danger-red" : ""}`}>{h.url}</p>
            <p className="type-mono text-[9px] text-text-muted">{h.when}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MailApp({ pinEvidence }) {
  const mails = [
    { key: "cravery", from: "reservations@cravery.hyd", subj: "Your table is ready", ts: "19:45" },
    { key: "archivist", from: "ARCHIVIST_NODE", subj: "Do not resist the archive.", ts: "23:41", flagged: true },
    { key: "ayesha", from: "ayesha@private", subj: "did you eat", ts: "22:41" },
  ];
  return (
    <div className="p-3 divide-y divide-white/8">
      {mails.map((m) => (
        <div key={m.key} className="py-2 flex justify-between items-start gap-2">
          <div>
            <p className={`text-sm ${m.flagged ? "text-danger-red" : ""}`}>{m.subj}</p>
            <p className="type-mono text-[9px] text-text-muted">{m.from} · {m.ts}</p>
          </div>
          <button
            onClick={() => pinEvidence(`mail-${m.key}`, { kind: "mail", subject: m.subj })}
            className="type-mono text-[9px] text-lavender border border-white/10 rounded-full px-2 py-0.5"
            data-testid={`phone-mail-pin-${m.key}`}
          >
            pin
          </button>
        </div>
      ))}
    </div>
  );
}

function CalculatorApp() {
  const [expr, setExpr] = useState("");
  const [result, setResult] = useState("");
  function press(v) {
    if (v === "=") {
      try {
        // eslint-disable-next-line no-eval
        const r = Function(`"use strict"; return (${expr || "0"});`)();
        setResult(String(r));
      } catch (e) {
        setResult("err");
      }
    } else if (v === "C") {
      setExpr(""); setResult("");
    } else {
      setExpr((e) => e + v);
    }
  }
  const btns = ["7","8","9","/","4","5","6","*","1","2","3","-","0",".","=","+","(",")","C"];
  return (
    <div className="p-3">
      <div className="rounded-lg bg-surface-2 p-3">
        <p className="type-mono text-[9px] text-text-muted h-4 truncate">{expr}</p>
        <p className="font-editorial text-2xl text-right">{result || "0"}</p>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {btns.map((b) => (
          <button key={b} onClick={() => press(b)} className="rounded-lg bg-surface-2 border border-white/10 py-3 text-sm" data-testid={`calc-${b}`}>
            {b}
          </button>
        ))}
      </div>
    </div>
  );
}

function SettingsApp() {
  const items = [
    { k: "Device", v: "AMEEN's Phone · corrupted" },
    { k: "Storage", v: "42.7 GB / 128 GB · ARCHIVIST_NODE holding 12 GB" },
    { k: "Backup", v: "Last backup: ghost17.bak · corrupted" },
    { k: "Wallpaper", v: "Ayesha ♡" },
    { k: "Developer logs", v: "ghost_17 process active despite user delete" },
  ];
  return (
    <div className="p-3 divide-y divide-white/8">
      {items.map((i) => (
        <div key={i.k} className="py-2">
          <p className="type-mono text-[9px] text-lavender">{i.k}</p>
          <p className="text-xs mt-1">{i.v}</p>
        </div>
      ))}
    </div>
  );
}

function NotificationsApp({ actions }) {
  return (
    <div className="p-3">
      <p className="type-mono text-[9px] text-text-muted mb-3">deleted notifications · reorder puzzle available in Act I</p>
      <div className="rounded-lg bg-surface-2 p-3 text-xs text-text-secondary">
        Seven notifications were removed from this device between 07:12 and 21:03.
        Open the Notification Timeline puzzle in the investigation panel to reorder them.
      </div>
    </div>
  );
}

function TerminalApp({ actions }) {
  const [input, setInput] = useState("");
  const [lines, setLines] = useState([
    "ARCHIVE TERMINAL v1.709",
    "Type `help` for commands.",
  ]);
  const [history, setHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  function run(cmd) {
    const c = cmd.trim();
    if (!c) return;
    setHistory((h) => [c, ...h].slice(0, 30));
    setHistoryIdx(-1);
    const echo = `> ${c}`;
    setLines((l) => [...l, echo]);
    const parts = c.toLowerCase().split(/\s+/);
    const head = parts[0];
    const arg = parts.slice(1).join(" ");

    if (head === "help") {
      setLines((l) => [...l, ...TERMINAL_HELP]);
      return;
    }
    if (head === "clear") {
      setLines(["ARCHIVE TERMINAL v1.709"]);
      return;
    }
    if (head === "ls") {
      const evidenceList = actions?.evidenceList?.() || [];
      setLines((l) => [...l, ...(evidenceList.length ? evidenceList.map((e) => `- ${e}`) : ["(no evidence collected)"])]);
      return;
    }
    if (head === "cat") {
      if (arg.includes("pungun")) {
        setLines((l) => [...l, PUNGUN_BINARY]);
      } else if (arg.includes("hathim")) {
        setLines((l) => [...l, "HATHIM_ALIBI.enc — encrypted. Use `unlock hathim`."]);
      } else if (arg.includes("ghost")) {
        setLines((l) => [...l, "ghost17.bak — signature: AMEEN. locked until final act."]);
      } else {
        setLines((l) => [...l, `no such file: ${arg}`]);
      }
      return;
    }
    if (head === "decode" || head === "translate") {
      if (arg.includes("pungun")) {
        setLines((l) => [...l, "> decoding PUNGUN.bin ...", "HUM TOH AISE HI HAI"]);
      } else {
        setLines((l) => [...l, "unknown file to decode"]);
      }
      return;
    }
    if (head === "whois") {
      setLines((l) => [...l, "ARCHIVIST_NODE — signature not recognised. GHOST_17 — dormant."]);
      return;
    }
    if (head === "unlock") {
      setLines((l) => [...l, "Enter password in the investigation panel puzzle to unlock evidence."]);
      return;
    }
    // Behavioural checksum in Act V
    if (c.toLowerCase().replace(/\s+/g, "") === "humtohaisehihai") {
      actions?.terminalPhrase?.(c);
      setLines((l) => [...l, "CHECKSUM ACCEPTED", "TWO SUBJECTS DISPLAY CONSISTENTLY ILLOGICAL BEHAVIOUR", "HIDDEN DIRECTORY UNLOCKED"]);
      return;
    }
    setLines((l) => [...l, `command not found: ${head}`]);
  }

  function onKey(e) {
    if (e.key === "Enter") {
      run(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(history.length - 1, historyIdx + 1);
      if (history[next]) {
        setHistoryIdx(next);
        setInput(history[next]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.max(-1, historyIdx - 1);
      setHistoryIdx(next);
      setInput(next >= 0 ? history[next] : "");
    }
  }

  return (
    <div className="p-3 flex flex-col h-full">
      <div className="flex-1 overflow-y-auto font-mono text-[10px] text-lavender-soft space-y-1" data-testid="phone-terminal-output">
        {lines.map((l, i) => (
          <p key={i} className="whitespace-pre-wrap break-words">{l}</p>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2 border-t border-white/8 pt-2">
        <span className="type-mono text-[10px] text-lavender">▮</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          className="flex-1 bg-transparent outline-none border-0 text-xs font-mono text-lavender-soft placeholder:text-text-muted"
          placeholder="type a command…"
          data-testid="phone-terminal-input"
          autoFocus
        />
      </div>
    </div>
  );
}

function GhostApp({ act }) {
  return (
    <div className="p-4">
      {act < 4 ? (
        <div className="rounded-lg border border-danger-red/40 bg-danger-red/5 p-3">
          <p className="type-mono text-[9px] text-danger-red">GHOST_17 · corrupted</p>
          <p className="mt-2 text-xs">Access denied by ARCHIVIST_NODE. Progress further in the investigation to unlock.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-lavender/30 bg-lavender/5 p-3">
          <p className="type-mono text-[9px] text-lavender">GHOST_17 · online</p>
          <p className="mt-3 font-editorial text-sm whitespace-pre-line">
            {`Ayeshi, if you are reading this, the Archivist still controls the main system.
I hid one final access path in the thing we always say when nothing makes sense.
You already found it once.`}
          </p>
        </div>
      )}
    </div>
  );
}

function LogsApp() {
  const rows = [
    { t: "23:41:07", tag: "auth", msg: "session hijack: ARCHIVIST_NODE" },
    { t: "23:41:22", tag: "camera", msg: "front camera disabled by remote process" },
    { t: "23:42:14", tag: "notif", msg: "cleared 7 notifications (07:12..21:03)" },
    { t: "23:43:59", tag: "gps", msg: "coordinates scrubbed from HATHIM_ALIBI.enc" },
    { t: "23:47:11", tag: "backup", msg: "ghost17.bak reserved by GHOST_17" },
    { t: "23:52:00", tag: "net", msg: "outbound archive protocol packets: 3 failed" },
  ];
  const [filter, setFilter] = useState("");
  return (
    <div className="p-3">
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="filter logs…"
        className="w-full bg-surface-2 border border-white/10 rounded-md px-2 py-1 text-xs"
        data-testid="phone-logs-filter"
      />
      <div className="mt-2 font-mono text-[10px] space-y-1">
        {rows.filter((r) => !filter || r.msg.includes(filter) || r.tag.includes(filter)).map((r, i) => (
          <p key={i} className="text-text-secondary">
            <span className="text-lavender">{r.t}</span> <span className="text-warning-gold">[{r.tag}]</span> {r.msg}
          </p>
        ))}
      </div>
    </div>
  );
}
