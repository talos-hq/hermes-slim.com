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

for (const command of document.querySelectorAll(".installers .terminal")) {
  wireCopy(command.querySelector(".copy"), () => command.querySelector("code").textContent);
}

// The HTML links are a working release snapshot for offline or rate-limited API access.
async function refreshBundleLinks() {
  const endpoint = "https://api.github.com/repos/talos-hq/hermes-slim/releases/latest";
  try {
    const response = await fetch(endpoint);
    if (!response.ok) return;
    const { assets } = await response.json();
    for (const link of document.querySelectorAll(".bundles [data-target]")) {
      const target = link.dataset.target;
      const isBundle = (asset, format) =>
        asset.name.startsWith("hermes-slim-") && asset.name.endsWith(`-${target}.${format}`);
      const asset = assets.find(item => isBundle(item, "zip")) ||
        assets.find(item => isBundle(item, "tar.zst"));
      if (asset) {
        link.href = asset.browser_download_url;
        link.querySelector("small").textContent = asset.name.endsWith(".zip") ? "ZIP ↓" : "TAR.ZST ↓";
      }
    }
  } catch {
    // Keep the links bundled with the page.
  }
}
refreshBundleLinks();
