// ─── Types Garanties par contrat ─────────────────────────────────────────────

export const ACTES_CATEGORIES = [
  "Honoraires médicaux",
  "Pharmacie",
  "Auxiliaires médicaux",
  "Analyses biologiques",
  "Imagerie médicale",
  "Soins dentaires",
  "Optique",
  "Hospitalisation — Clinique",
  "Hospitalisation — Hôpital",
  "Orthophonie",
  "Maternité — Simple",
  "Maternité — Gémellaire",
  "Maternité — Chirurgical",
  "Transport terrestre",
] as const;

export type ActeCategorie = (typeof ACTES_CATEGORIES)[number];

export interface GarantieContrat {
  categorie: ActeCategorie;
  taux:      number;   // %, ex: 80
  active:    boolean;  // faux = exclu du contrat
}

export type GarantiesContrat = GarantieContrat[];

export function defaultGaranties(tauxDefaut = 80): GarantiesContrat {
  return ACTES_CATEGORIES.map(categorie => ({
    categorie,
    taux:   tauxDefaut,
    active: true,
  }));
}

export function parseGaranties(raw: any, tauxDefaut = 80): GarantiesContrat {
  if (!raw) return defaultGaranties(tauxDefaut);
  try {
    const parsed: GarantieContrat[] = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed) || parsed.length === 0) return defaultGaranties(tauxDefaut);
    // Compléter les catégories manquantes (migration)
    const existing = new Set(parsed.map(g => g.categorie));
    const missing  = ACTES_CATEGORIES
      .filter(c => !existing.has(c))
      .map(c => ({ categorie: c, taux: tauxDefaut, active: true }));
    return [...parsed, ...missing];
  } catch {
    return defaultGaranties(tauxDefaut);
  }
}
