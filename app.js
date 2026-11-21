// Platform detection, per-platform cards and live release assets for hermes-slim.com.
// The page works without the GitHub API: FALLBACK holds the last known release.
const REPO = "talos-hq/hermes-slim";
const RAW = `https://raw.githubusercontent.com/${REPO}/main/slim`;
const SH_CMD = `curl -fsSL ${RAW}/install.sh | sh`;
const PS_CMD = `& ([scriptblock]::Create((irm ${RAW}/install.ps1)))`;

const FALLBACK = {
  tag: "v0.1.1",
  assets: {
    "darwin-arm64": ["hermes-slim-4ce99a1abc-darwin-arm64.tar.zst", 109936271],
    "darwin-x64": ["hermes-slim-4ce99a1abc-darwin-x64.tar.zst", 100147608],
    "win32-x64": ["hermes-slim-4ce99a1abc-win32-x64.zip", 144225731],
    "linux-x64": ["hermes-slim-4ce99a1abc-linux-x64.tar.zst", 124112598],
    "linux-arm64": ["hermes-slim-4ce99a1abc-linux-arm64.tar.zst", 117589237],
    "linux-x64-musl": ["hermes-slim-4ce99a1abc-linux-x64-musl.tar.zst", 121564231],
  },
};

const GLYPH = {
  mac: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.8-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9-.1 0-2.6-1-2.6-4.1zM13.9 5c.7-.9 1.2-2 1.1-3.2-1 0-2.3.7-3 1.6-.7.8-1.2 2-1.1 3.1 1.1.1 2.3-.6 3-1.5z"/></svg>',
  win: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M2 4.3 10 3.2v7.7H2zM11 3.1 22 1.5v9.4H11zM2 12h8v7.8l-8-1.1zM11 12h11v9.5l-11-1.6z"/></svg>',
  linux: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 4h18v16H3zm2 2v12h14V6zm2 2.5 4 3-4 3-1.2-1.6L7.9 11.5 5.8 10zm5 5.5h5v2h-5z"/></svg>',
};

// One entry per release target, in display order.
const PLATFORMS = [
  { id: "darwin-arm64", family: "mac", name: "macOS — Apple Silicon", who: "Macs with an M1, M2, M3, M4 or M5 chip. Most Macs sold since late 2020." },
  { id: "darwin-x64", family: "mac", name: "macOS — Intel", who: "Older Macs with an Intel processor. Check Apple menu › About This Mac: it says “Intel”." },
  { id: "win32-x64", family: "win", name: "Windows 10 / 11", who: "Any 64-bit Windows PC (Intel or AMD)." },
  { id: "linux-x64", family: "linux", name: "Linux — x64", who: "Ubuntu, Debian, Fedora, Arch and other glibc distros on Intel/AMD." },
  { id: "linux-arm64", family: "linux", name: "Linux — ARM64", who: "Raspberry Pi 4/5 (64-bit OS), Ampere, Graviton and other ARM servers." },
  { id: "linux-x64-musl", family: "linux", name: "Linux — Alpine (musl)", who: "Alpine Linux and other musl-based systems on x64." },
];

const STEP1 = {
  mac: "Open <b>Terminal</b> (press <kbd>⌘ Space</kbd>, type “Terminal”).",
  win: "Open <b>PowerShell</b> (press <kbd>Win</kbd>, type “PowerShell”).",
  linux: "Open a terminal.",
};

const cmdFor = (p) => (p.family === "win" ? PS_CMD : SH_CMD);
const mb = (n) => `${Math.round(n / 1e6)} MB`;
const assetUrl = (tag, name) => `https://github.com/${REPO}/releases/download/${tag}/${name}`;

function manualText(p, file) {
  if (p.family === "win") {
    return `Offline install: download the zip, then run <code>install.ps1 -Archive ${file}</code>.`;
  }
  return `Offline install: download the bundle, then run <code>sh install.sh --archive ${file}</code>.`;
}

async function detect() {
  const ua = navigator.userAgent;
  const uad = navigator.userAgentData;
  let arch = "";
  if (uad && uad.getHighEntropyValues) {
    try { arch = (await uad.getHighEntropyValues(["architecture"])).architecture || ""; } catch (_) { /* not exposed */ }
  }
  if (/iPhone|iPad|Android/i.test(ua)) return null;
  if (/Windows/i.test(ua)) return { id: "win32-x64" };
  if (/Mac OS X|Macintosh/i.test(ua)) {
    // Safari never reports the CPU; Apple Silicon is by far the common case now.
    if (arch === "x86") return { id: "darwin-x64" };
    return { id: "darwin-arm64", guessed: arch !== "arm" };
  }
  if (/Linux|X11/i.test(ua)) {
    if (arch === "arm" || /aarch64|arm64/i.test(ua)) return { id: "linux-arm64" };
    return { id: "linux-x64" };
  }
  return null;
}

async function release() {
  try {
    const r = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: "application/vnd.github+json" } });
    if (!r.ok) throw new Error(r.status);
    const j = await r.json();
    const assets = {};
    for (const p of PLATFORMS) {
      const a = j.assets.find((x) => !x.name.endsWith(".sha256") && x.name.includes(`-${p.id}.`));
      if (a) assets[p.id] = [a.name, a.size];
    }
    if (Object.keys(assets).length) return { tag: j.tag_name, assets: { ...FALLBACK.assets, ...assets } };
  } catch (_) { /* rate-limited or offline: use the baked release */ }
  return FALLBACK;
}

function wireCopy(btn, getText) {
  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(getText());
      btn.textContent = "Copied";
    } catch (_) {
      btn.textContent = "Select & copy";
    }
    setTimeout(() => (btn.textContent = "Copy"), 1800);
  });
}

function render(rel, here) {
  const grid = document.getElementById("grid");
  const tpl = document.getElementById("card-tpl");
  grid.textContent = "";
  for (const p of PLATFORMS) {
    const [file, size] = rel.assets[p.id];
    const node = tpl.content.cloneNode(true);
    const card = node.querySelector(".card");
    card.id = `p-${p.id}`;
    node.querySelector(".os-glyph").innerHTML = GLYPH[p.family];
    node.querySelector(".card-os").textContent = p.name;
    node.querySelector(".card-who").textContent = p.who;
    const code = node.querySelector(".cmd code");
    code.textContent = cmdFor(p);
    wireCopy(node.querySelector(".cmd .copy"), () => code.textContent);
    const btn = node.querySelector(".btn");
    btn.href = assetUrl(rel.tag, file);
    btn.querySelector(".btn-label").textContent = p.family === "win" ? "Download .zip" : "Download bundle";
    btn.querySelector(".size").textContent = mb(size);
    node.querySelector(".card-manual").innerHTML = manualText(p, file);
    if (here && here.id === p.id) {
      card.classList.add("here");
      node.querySelector(".badge").hidden = false;
    }
    grid.appendChild(node);
  }
  const tag = document.getElementById("release-tag");
  tag.textContent = rel.tag;
  tag.href = `https://github.com/${REPO}/releases/tag/${rel.tag}`;
}

function renderMain(rel, here) {
  if (!here) {
    document.getElementById("detect-note").textContent =
      "We couldn't tell which computer you're on. Pick yours below — each card says who it's for.";
    return;
  }
  const p = PLATFORMS.find((x) => x.id === here.id);
  const [file, size] = rel.assets[p.id];
  document.getElementById("detected-name").textContent = p.name;
  document.getElementById("main-glyph").innerHTML = GLYPH[p.family];
  document.getElementById("main-os").textContent = p.name;
  document.getElementById("main-who").textContent = p.who;
  document.getElementById("main-step1").innerHTML = STEP1[p.family];
  const cmd = document.getElementById("main-cmd");
  cmd.textContent = cmdFor(p);
  wireCopy(document.querySelector("#main-card .copy"), () => cmd.textContent);
  const link = document.getElementById("main-bundle");
  link.href = assetUrl(rel.tag, file);
  document.getElementById("main-size").textContent = mb(size);
  document.getElementById("main-label").textContent = p.family === "win" ? "Download .zip" : "Download bundle";
  const note = document.getElementById("detect-note");
  note.innerHTML = here.guessed
    ? 'We think this is an Apple Silicon Mac. On an Intel Mac? <a href="#p-darwin-x64">Use the Intel card</a> — the install command is the same either way.'
    : 'Detected from your browser. Wrong? <a href="#all">Pick another platform</a>.';
  document.getElementById("main-card").hidden = false;
}

(async () => {
  const [here, rel] = await Promise.all([detect(), release()]);
  render(rel, here);
  renderMain(rel, here);
})();
