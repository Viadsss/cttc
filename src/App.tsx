import { Button } from "@/components/ui/button"
import { AxeResults } from "axe-core"
import { useState } from "react"

export function App() {
  const [results, setResults] = useState<AxeResults | null>(null)

  const onClick = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

    // Step 1: Inject axe-core from its path in dist/
    await chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      files: ["node_modules/axe-core/axe.min.js"],
    })

    // Step 2: Run axe and return results back to the extension
    const injectionResults = await chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      func: () => {
        return new Promise<unknown>((resolve, reject) => {
          // @ts-expect-error - axe is injected into the page
          axe.run(document, {}, (err: Error, results: unknown) => {
            if (err) reject(err)
            else resolve(results)
          })
        })
      },
    })

    const axeResults = injectionResults[0].result as AxeResults
    console.log(axeResults)
    setResults(axeResults)
  }

  return (
    <div className="flex min-h-svh p-6 font-sans">
      <div className="flex max-w-full min-w-0 flex-col gap-4 text-sm leading-loose">
        <div>
          <h1 className="font-medium">Project ready!</h1>
          {results && (
            <pre className="mt-2 overflow-auto rounded-md bg-muted p-2 text-xs">
              {JSON.stringify(results, null, 2)}
            </pre>
          )}
          <Button className="mt-2" onClick={onClick}>
            Run Axe
          </Button>
        </div>
        <div className="font-mono text-xs text-muted-foreground">
          (Press <kbd>d</kbd> to toggle dark mode)
        </div>
      </div>
    </div>
  )
}

export default App
