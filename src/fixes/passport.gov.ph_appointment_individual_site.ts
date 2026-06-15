export default function () {
  // =========================================================================
  // 1. INITIAL CONTRAST FIXES (Nodes 01-08)
  // =========================================================================

  // Nodes 01-06: Navigation links (#ffffff on #666666 is 5.74:1)
  const navHrefs = [
    "/",
    "https://consular.dfa.gov.ph/services/passport/requirements",
    "/appointment",
    "/sites/site",
    "https://consular.dfa.gov.ph/services/passport/passport-faqs",
    "/appointment/payment/merchants",
  ]

  document.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((el) => {
    const href = el.getAttribute("href")
    if (href && navHrefs.includes(href)) {
      el.style.backgroundColor = "#444444"
      el.style.color = "#ffffff" // #ffffff on #444444 is 9.38:1 (Passes AAA)
      el.style.padding = "2px 4px"
      el.style.borderRadius = "4px"
    }
  })

  // Node 07: Required fields disclaimer (#dc143c on #ffffff is 4.98:1)
  document
    .querySelectorAll<HTMLParagraphElement>("p.text-danger")
    .forEach((el) => {
      if (el.textContent?.includes("Fields with asterisks")) {
        el.style.color = "#b30027" // Passes AAA (> 7:1)
      }
    })

  // Node 08: "Back" button (#ffffff on #337ab7 is 4.55:1)
  document.querySelectorAll<HTMLButtonElement>("button").forEach((el) => {
    if (
      el.textContent?.trim() === "Back" ||
      el.getAttribute("onclick")?.includes("/appointment")
    ) {
      el.style.backgroundColor = "#1b5380" // Passes AAA (> 7:1)
      el.style.color = "#ffffff"
      el.style.borderColor = "#154164"
    }
  })

  // =========================================================================
  // 2. ACCESSIBILITY STRUCUTRE FIXES (Buttons & Images)
  // =========================================================================

  // Fix: Mobile navbar toggle button missing screen-reader text
  document
    .querySelectorAll<HTMLButtonElement>("button.navbar-toggle")
    .forEach((el) => {
      if (el.getAttribute("data-target") === "#navbar-collapse-nav") {
        el.setAttribute("aria-label", "Toggle navigation menu")
      }
    })

  // Fix: Inline base64 image missing alt attribute
  document
    .querySelectorAll<HTMLImageElement>("img[src^='data:image']")
    .forEach((el) => {
      el.setAttribute("alt", "")
      el.setAttribute("role", "presentation")
    })

  // =========================================================================
  // 3. FOOTER CONTRAST FIXES (WCAG AAA compliant)
  // =========================================================================

  // Improve footer container contrast baseline (BEST FIX)
  const footer = document.querySelector<HTMLElement>("footer")
  if (footer) {
    footer.style.backgroundColor = "#4a4a4a" // darker than #666666
    footer.style.color = "#ffffff"
  }

  // Footer Titles (ensure AAA contrast)
  document
    .querySelectorAll<HTMLHeadingElement>("h4.text-gray-900")
    .forEach((el) => {
      if (
        el.textContent?.includes("DEPARTMENT OF FOREIGN AFFAIRS") ||
        el.textContent?.includes("SITEMAP")
      ) {
        el.style.color = "#ffffff"
        el.style.fontWeight = "600"
      }
    })

  // Footer Address (improve readability + contrast)
  document
    .querySelectorAll<HTMLParagraphElement>("p.text-gray-600")
    .forEach((el) => {
      if (el.textContent?.includes("Aseana Business Park")) {
        el.style.color = "#f2f2f2" // softer white improves contrast perception
      }
    })

  // Footer Version text (small text needs stronger contrast)
  document
    .querySelectorAll<HTMLSpanElement>("span.footer-item")
    .forEach((el) => {
      if (el.textContent?.includes("1.2.2")) {
        el.style.color = "#ffffff"
        el.style.fontWeight = "500"
      }
    })

  // Privacy Policy link (increase contrast + focus visibility)
  const privacyLink = document.querySelector<HTMLAnchorElement>(
    'a[href="/privacy-policy/linkages-characteristics"]'
  )

  if (privacyLink) {
    privacyLink.style.color = "#ffffff"
    privacyLink.style.textDecoration = "underline"
  }

  // Fix: button-has-visible-text (WCAG 2 A 4.1.2)
  // The mobile navbar toggle button contains only icon bars and lacks accessible text.
  // Solution: Add an aria-label="Toggle navigation menu" to the button.
  document
    .querySelectorAll<HTMLButtonElement>("button.navbar-toggle")
    .forEach((el) => {
      if (el.getAttribute("data-target") === "#navbar-collapse-nav") {
        el.setAttribute("aria-label", "Toggle navigation menu")
      }
    })

  // Fix: image-alt-text (WCAG 2 A 1.1.1)
  // Inline base64 image is missing an alternative text attribute.
  // Solution: Add alt="" and role="presentation" if decorative, or a descriptive alt string.
  document
    .querySelectorAll<HTMLImageElement>("img[src^='data:image']")
    .forEach((el) => {
      // If the image is decorative (e.g., a spacer, icon background, or loader):
      el.setAttribute("alt", "Banner of Department of Foreign Affairs")
      el.setAttribute("role", "presentation")

      // Note: If you discover this image actually represents something important (like a logo),
      // change the code above to: el.setAttribute("alt", "Descriptive text here")
    })
}
