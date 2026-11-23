// Installer controls and release downloads for hermes-slim.com.
const RELEASES = "https://github.com/talos-hq/hermes-slim/releases";

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

const PLATFORMS = [
  { name: "macOS", targets: [
    { id: "darwin-arm64", label: "Apple Silicon" },
    { id: "darwin-x64", label: "Intel" },
  ] },
  { name: "Linux", targets: [
    { id: "linux-x64", label: "x64 (glibc)" },
    { id: "linux-arm64", label: "ARM64 (glibc)" },
    { id: "linux-x64-musl", label: "x64 (Alpine / musl)" },
  ] },
  { name: "Windows", targets: [
    { id: "win32-x64", label: "x64 (Intel / AMD)" },
    { id: "win32-arm64", label: "ARM64" },
  ] },
];

for (const card of document.querySelectorAll("[data-shell]")) {
  const button = card.querySelector(".copy");
  const code = card.querySelector("code");
  const status = document.getElementById("copy-status");
  let reset;
  button.hidden = false;
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(code.textContent);
      button.textContent = "Copied";
      status.textContent = `${card.querySelector("h2").textContent} command copied.`;
    } catch (_) {
      const range = document.createRange();
      range.selectNodeContents(code);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      button.textContent = "Selected";
      status.textContent = "Command selected. Use your keyboard to copy it.";
    }
    clearTimeout(reset);
    reset = setTimeout(() => {
      button.textContent = "Copy";
      status.textContent = "";
    }, 1800);
  });
}

async function latestRelease() {
  const response = await fetch("https://api.github.com/repos/talos-hq/hermes-slim/releases/latest");
  if (!response.ok) throw new Error(response.status);
  const release = await response.json();
  const assets = {};
  for (const { targets } of PLATFORMS) {
    for (const { id } of targets) {
      const bundle = release.assets.find(({ name }) => name.endsWith(`-${id}.zip`))
        || release.assets.find(({ name }) => name.endsWith(`-${id}.tar.zst`));
      if (bundle) assets[id] = [bundle.name, bundle.size];
    }
  }
  return Object.keys(assets).length ? { tag: release.tag_name, assets } : FALLBACK;
}

function renderBundles({ tag, assets }) {
  const groups = document.getElementById("bundles");
  groups.replaceChildren();
  for (const { name, targets } of PLATFORMS) {
    const group = document.createElement("section");
    const heading = document.createElement("h3");
    const list = document.createElement("ul");
    heading.textContent = name;
    for (const { id, label } of targets) {
      if (!assets[id]) continue;
      const [file, size] = assets[id];
      const row = document.createElement("li");
      const link = document.createElement("a");
      const meta = document.createElement("span");
      row.id = `p-${id}`;
      link.href = `${RELEASES}/download/${tag}/${file}`;
      link.textContent = label;
      link.setAttribute("aria-label", `Download ${name} ${label}`);
      meta.textContent = `${file.endsWith(".zip") ? "ZIP" : "TAR.ZST"} · ${Math.round(size / 1e6)} MB`;
      link.append(meta);
      row.append(link);
      list.append(row);
    }
    if (list.childElementCount) {
      group.append(heading, list);
      groups.append(group);
    }
  }
  const releaseLink = document.getElementById("release-tag");
  releaseLink.textContent = tag;
  releaseLink.href = `${RELEASES}/tag/${tag}`;
}

latestRelease().catch(() => FALLBACK).then(renderBundles);
