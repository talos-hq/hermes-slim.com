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

for (const command of document.querySelectorAll(".installers .cmd")) {
  wireCopy(command.querySelector(".copy"), () => command.querySelector("code").textContent);
}
