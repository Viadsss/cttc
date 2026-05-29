// ─── Domain Fix Registry ──────────────────────────────────────────────────────
//
// Add a new domain by adding a key → function entry below.
// The function runs directly in the page context via chrome.scripting.executeScript
// so write it exactly like you're typing in the browser DevTools console.
//
// After "Apply Fixes" is clicked, the function is injected then axe rescans
// automatically — violations that are fixed will simply disappear from results.

export const DOMAIN_FIXES: Record<string, () => void> = {
  "viads.vercel.app": function () {
    // Fix: color-contrast-enhanced
    // <span>view more</span> — #969696 on #121212 is 6.33:1, needs 7:1
    document.querySelectorAll("span").forEach((el) => {
      if (el.textContent?.trim() === "view more") {
        el.style.color = "#fff"
      }
    })
  },

  // "philhealth.gov.ph": function () {
  //   // Fix: image-alt
  //   const logo = document.querySelector<HTMLImageElement>("img.logo")
  //   if (logo) logo.alt = "PhilHealth Logo"
  //
  //   // Fix: button-name
  //   const btn = document.querySelector("button.menu-toggle")
  //   if (btn) btn.setAttribute("aria-label", "Toggle navigation menu")
  //
  //   // Fix: html-has-lang
  //   document.documentElement.setAttribute("lang", "tl")
  //
  //   // Fix: focus-visible (needs a <style> tag — inline style can't do pseudo-classes)
  //   if (!document.querySelector("style[data-axe-fix]")) {
  //     const s = document.createElement("style")
  //     s.setAttribute("data-axe-fix", "true")
  //     s.textContent = `:focus-visible { outline: 3px solid #005fcc !important; outline-offset: 2px !important; }`
  //     document.head.appendChild(s)
  //   }
  // },
}
