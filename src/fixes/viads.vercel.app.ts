export default function () {
  // Fix: color-contrast-enhanced
  // <span>view more</span> — #969696 on #121212 is 6.33:1, needs 7:1
  document.querySelectorAll<HTMLElement>("span").forEach((el) => {
    if (el.textContent?.trim() === "view more") {
      el.style.color = "#fff"
    }
  })

  // Fix: identical-links-same-purpose
  // Multiple links share aria-label="GitHub profile" but go to different repos.
  // Multiple links share aria-label="YouTube channel" but go to different videos.
  // Solution: make each aria-label unique by including the repo/project name.
  const linkLabels: Record<string, string> = {
    // SEI DOST website badge
    "https://www.sei.dost.gov.ph": "SEI DOST official website",

    // Header & footer — personal GitHub profile
    "https://github.com/Viadsss": "GitHub profile of Viadsss",

    // Project badge links — each repo gets its own label
    "https://github.com/Viadsss/MeloBeats": "GitHub repository for MeloBeats",
    "https://github.com/Viadsss/DeparaviaApp":
      "GitHub repository for Deparavia",
    "https://github.com/PUP-The-Programmers-Guild/TPGWebsite":
      "GitHub repository for PUP TPG Website",
    "https://github.com/COMP-016-Web-Development-Group-1/HomeRoom":
      "GitHub repository for HomeRoom",

    // YouTube badge links — each video gets its own label
    "https://www.youtube.com/watch?v=V_nn7GmrllQ":
      "YouTube demo video for MeloBeats",
    "https://www.youtube.com/watch?v=qRJWe-ymJnM":
      "YouTube demo video for Isko360",
    "https://www.youtube.com/watch?v=c8CXg-bVZK0":
      "YouTube demo video for HomeRoom",
    "https://www.youtube.com/watch?v=trl7HTWvlbc":
      "YouTube demo video for Deparavia",
  }

  document.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((el) => {
    const match = Object.entries(linkLabels).find(
      ([href]) => el.href === href || el.getAttribute("href") === href
    )
    if (match) el.setAttribute("aria-label", match[1])
  })
}
