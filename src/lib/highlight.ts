const AXE_ATTR = "data-axe-highlight"

export async function highlightElement(selector: string): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  await chrome.scripting.executeScript({
    target: { tabId: tab.id! },
    args: [selector, AXE_ATTR],
    func: (sel, attr) => {
      document.querySelectorAll(`[${attr}]`).forEach((el) => {
        ;(el as HTMLElement).style.removeProperty("outline")
        ;(el as HTMLElement).style.removeProperty("outline-offset")
        el.removeAttribute(attr)
      })
      const el = document.querySelector(sel) as HTMLElement | null
      if (!el) return
      el.setAttribute(attr, "true")
      el.style.outline = "3px solid #ef4444"
      el.style.outlineOffset = "3px"
      el.scrollIntoView({ behavior: "smooth", block: "center" })
    },
  })
}

export async function clearHighlights(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  await chrome.scripting.executeScript({
    target: { tabId: tab.id! },
    args: [AXE_ATTR],
    func: (attr) => {
      document.querySelectorAll(`[${attr}]`).forEach((el) => {
        ;(el as HTMLElement).style.removeProperty("outline")
        ;(el as HTMLElement).style.removeProperty("outline-offset")
        el.removeAttribute(attr)
      })
    },
  })
}
