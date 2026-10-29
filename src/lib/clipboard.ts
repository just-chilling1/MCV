/** Copy text. Clipboard API is missing on insecure origins such as http://192.168.x.x. */
export async function copyToClipboard(text: string): Promise<void> {
  const writeText = navigator.clipboard?.writeText?.bind(navigator.clipboard);
  if (writeText) {
    await writeText(text);
    return;
  }

  // ponytail: execCommand covers LAN http where Clipboard API is undefined.
  // Upgrade path: serve the app over https or localhost.
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.top = "0";
  area.style.left = "0";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.focus();
  area.select();
  const ok = document.execCommand("copy");
  area.remove();
  if (!ok) throw new Error("Clipboard is unavailable");
}
