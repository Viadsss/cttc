// ─── URL Fix Registry ───
// Rules:
//   ://   →  ___
//   /     →  _
//   ?     →  __
//   =     →  _

import viads from "./viads.vercel.app"
import passportGovPh from "./passport.gov.ph_appointment_individual_site"

export const URL_FIXES: Record<string, () => void> = {
  "https://viads.vercel.app/": viads,
  "https://passport.gov.ph/appointment/individual/site": passportGovPh,
}
