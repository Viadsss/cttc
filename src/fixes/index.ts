// ─── URL Fix Registry ───
// Rules:
//   ://   →  ___
//   /     →  _
//   ?     →  __
//   =     →  _

import viads from "./viads.vercel.app"

export const URL_FIXES: Record<string, () => void> = {
  "https://viads.vercel.app/": viads,
}
