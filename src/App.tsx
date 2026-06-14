import { useState } from "react"
import type { AxeResults, RunOptions } from "axe-core"
import { FileDown } from "lucide-react"
import { AppHeader } from "./components/AppHeader"
import { ScanButton } from "./components/ScanButton"
import { MetaPanel } from "./components/MetaPanel"
import { FixBanner } from "./components/FixBanner"
import { ScorePanel } from "./components/ScorePanel"
import { SeverityLegend } from "./components/SeverityLegend"
import { IssuesList } from "./components/IssuesList"
import { URL_FIXES } from "./fixes"
import { computeScore, checkCompliance } from "./lib/score"
import { exportCSV } from "./lib/csv"

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

        <div className="flex gap-2">
          <ScanButton
            loading={loading}
            disabled={loading || applyingFixes}
            onClick={() => runScan()}
          />
          {results && breakdown && compliance && (
            <button
              onClick={() => exportCSV(results, breakdown.score, compliance)}
              title="Export CSV report"
              className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-muted/50 px-4 text-sm font-bold tracking-[0.15em] text-foreground uppercase transition-all hover:border-foreground/20 hover:bg-muted"
            >
              <FileDown className="h-3.5 w-3.5" />
              csv
            </button>
          )}
        </div>

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
          <p className="py-4 text-center text-xs tracking-wide text-muted-foreground/70">
            — run audit to inspect this page —
          </p>
        )}
      </div>
    </div>
  )
}

export default App
