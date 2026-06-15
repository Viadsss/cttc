export default function () {
  // =========================================================================
  // 0. DOCUMENT ROOT FIXES (WCAG 2 A 3.1.1)
  // =========================================================================

  // Fix: html-has-lang-attribute
  document.documentElement.setAttribute("lang", "en")

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
  // 2. ACCESSIBILITY STRUCTURE FIXES (Buttons, Images, Lists, & Links)
  // =========================================================================

  // Fix: link-has-discernible-text (WCAG 2 A 2.4.4 / 4.1.2)
  // Give descriptive screen-reader names to icon-only step navigation links
  document
    .querySelectorAll<HTMLAnchorElement>("a[href='javascript:void(0)']")
    .forEach((el) => {
      const icon = el.querySelector("i.fa")
      if (icon) {
        if (icon.classList.contains("fa-home")) {
          el.setAttribute("aria-label", "Go to Home Step")
        } else if (icon.classList.contains("fa-calendar")) {
          el.setAttribute("aria-label", "Go to Schedule Date Step")
        } else if (icon.classList.contains("fa-user")) {
          el.setAttribute("aria-label", "Go to Personal Information Step")
        } else if (icon.classList.contains("fa-users")) {
          el.setAttribute(
            "aria-label",
            "Go to Family or Group Information Step"
          )
        } else if (icon.classList.contains("fa-list-alt")) {
          el.setAttribute("aria-label", "Go to Application Review Step")
        } else if (icon.classList.contains("fa-phone")) {
          el.setAttribute("aria-label", "Go to Contact Details Step")
        }
      }
    })

  // Fix: button-has-visible-text (WCAG 2 A 4.1.2)
  document
    .querySelectorAll<HTMLButtonElement>("button.navbar-toggle")
    .forEach((el) => {
      if (el.getAttribute("data-target") === "#navbar-collapse-nav") {
        el.setAttribute("aria-label", "Toggle navigation menu")
      }
    })

  // Fix: image-alt-text (WCAG 2 A 1.1.1)
  document
    .querySelectorAll<HTMLImageElement>("img[src^='data:image']")
    .forEach((el) => {
      el.setAttribute("alt", "Banner of Department of Foreign Affairs")
      el.setAttribute("role", "presentation")
    })

  // Fix: description-list-hierarchy (WCAG 2 A 1.3.1)
  const sitemapLinks = document.querySelectorAll("a.sitemap-item")

  if (sitemapLinks.length > 0) {
    document.querySelectorAll("dl.text-gray-600").forEach((dlElement) => {
      const ulWrapper = document.createElement("ul")
      ulWrapper.className = dlElement.className
      ulWrapper.style.listStyle = "none"
      ulWrapper.style.padding = "0"

      const ddElements = dlElement.querySelectorAll("dd")

      ddElements.forEach((dd) => {
        const li = document.createElement("li")
        while (dd.firstChild) {
          li.appendChild(dd.firstChild)
        }
        ulWrapper.appendChild(li)
      })

      dlElement.parentNode?.replaceChild(ulWrapper, dlElement)
    })
  }

  // =========================================================================
  // 3. FOOTER CONTRAST FIXES (WCAG AAA compliant)
  // =========================================================================

  // Improve footer container contrast baseline
  const footer = document.querySelector<HTMLElement>("footer")
  if (footer) {
    footer.style.backgroundColor = "#4a4a4a"
    footer.style.color = "#ffffff"
  }

  // Footer Titles
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

  // Footer Address
  document
    .querySelectorAll<HTMLParagraphElement>("p.text-gray-600")
    .forEach((el) => {
      if (el.textContent?.includes("Aseana Business Park")) {
        el.style.color = "#f2f2f2"
      }
    })

  // Footer Version text
  document
    .querySelectorAll<HTMLSpanElement>("span.footer-item")
    .forEach((el) => {
      if (el.textContent?.includes("1.2.2")) {
        el.style.color = "#ffffff"
        el.style.fontWeight = "500"
      }
    })

  // Privacy Policy link
  const privacyLink = document.querySelector<HTMLAnchorElement>(
    'a[href="/privacy-policy/linkages-characteristics"]'
  )

  if (privacyLink) {
    privacyLink.style.color = "#ffffff"
    privacyLink.style.textDecoration = "underline"
  }
}
