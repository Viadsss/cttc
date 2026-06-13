import { useState } from "react"
import type { AxeResults, RunOptions } from "axe-core"
import { AppHeader } from "./components/AppHeader"
import { ScanButton } from "./components/ScanButton"
import { MetaPanel } from "./components/MetaPanel"
import { FixBanner } from "./components/FixBanner"
import { ScorePanel } from "./components/ScorePanel"
import { SeverityLegend } from "./components/SeverityLegend"
import { IssuesList } from "./components/IssuesList"
import { URL_FIXES } from "./fixes"
import { computeScore, checkCompliance } from "./lib/score"

export function App() {
  const [results, setResults] = useState<AxeResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [applyingFixes, setApplyingFixes] = useState(false)
  const [fixesApplied, setFixesApplied] = useState(false)
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null)
  const [currentTabUrl, setCurrentTabUrl] = useState("")

  // ── Scan ──────────────────────────────────────────────────────────────────

  async function runScan(preserveFixes = false) {
    try {
      setLoading(true)
      if (!preserveFixes) setFixesApplied(false)

      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      })
      setCurrentTabUrl(tab.url ?? "")

      await chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        files: ["node_modules/axe-core/axe.min.js"],
      })

      const axeOptions: RunOptions = {
        runOnly: {
          type: "tag",
          values: [
            "wcag2a",
            "wcag2aa",
            "wcag2aaa",
            "wcag21a",
            "wcag21aa",
            "wcag22aa",
          ],
        },
      }

      const injectionResults = await chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        args: [axeOptions],
        func: (options) =>
          new Promise<unknown>((resolve, reject) => {
            // @ts-expect-error - axe is injected into the page
            axe.run(document, options, (err: Error, results: unknown) => {
              if (err) reject(err)
              else resolve(results)
            })
          }),
      })

      setResults(injectionResults[0].result as AxeResults)
    } catch (error) {
      console.error("Error running accessibility check:", error)
    } finally {
      setLoading(false)
    }
  }

  // ── Apply fixes ───────────────────────────────────────────────────────────

  async function handleApplyFixes() {
    try {
      setApplyingFixes(true)
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      })
      const fixEntry = Object.entries(URL_FIXES).find(
        ([url]) => tab.url === url
      )
      if (!fixEntry) return
      const [, fixFn] = fixEntry
      await chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        func: fixFn,
      })
      setFixesApplied(true)
      await runScan(true)
    } catch (error) {
      console.error("Error applying fixes:", error)
    } finally {
      setApplyingFixes(false)
    }
  }

  // ── Derived state ─────────────────────────────────────────────────────────

  const breakdown = results ? computeScore(results) : null
  const compliance = results ? checkCompliance(results) : null
  const hasFix = currentTabUrl in URL_FIXES

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background p-4 font-mono text-foreground">
      <div className="mx-auto max-w-2xl space-y-5">
        <AppHeader />

        <ScanButton
          loading={loading}
          disabled={loading || applyingFixes}
          onClick={() => runScan()}
        />

        {results && breakdown && compliance && (
          <>
            <MetaPanel results={results} />

            {hasFix && (
              <FixBanner
                fixesApplied={fixesApplied}
                applyingFixes={applyingFixes}
                currentTabUrl={currentTabUrl}
                onApplyFixes={handleApplyFixes}
              />
            )}

            <ScorePanel
              results={results}
              breakdown={breakdown}
              compliance={compliance}
            />

            <SeverityLegend />

            <IssuesList
              results={{
                ...results,
                passes: breakdown.cleanPasses,
                incomplete: breakdown.cleanIncomplete,
              }}
              expandedIssue={expandedIssue}
              onToggle={(key) =>
                setExpandedIssue((prev) => (prev === key ? null : key))
              }
            />
          </>
        )}

        {!results && (
          <p className="py-4 text-center text-[11px] tracking-wide text-muted-foreground/40">
            — run audit to inspect this page —
          </p>
        )}
      </div>
    </div>
  )
}

export default App
