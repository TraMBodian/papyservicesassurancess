// ─── Service de gestion des tarifs (stockage localStorage) ───────────────────
// Permet à l'administrateur de modifier les primes et taux sans redéploiement.

export interface TarifSettings {
  primeEnfant:        number;   // FCFA par enfant (< 21 ans)
  primeAdulte:        number;   // FCFA par adulte (21–59 ans)
  primeAdulteAge:     number;   // FCFA par personne âgée (60 ans et +)
  tauxTaxe:           number;   // en %, ex: 10
  tauxCP:             number;   // Coût de police en %, ex: 10
  tauxRemboursement:  number;   // Taux de remboursement par défaut, ex: 80
  // Plafonds de remboursement (FCFA)
  plafondDentaire:             number;
  plafondOptique:              number;
  plafondHospitalisationJour:  number;
  plafondOrthophonie:          number;
  plafondMaterniteSimple:      number;
  plafondMaterniteGemellaire:  number;
  plafondMaterniteChirurgical: number;
  plafondTransport:            number;
}

export const TARIF_DEFAULTS: TarifSettings = {
  primeEnfant:    237_500,
  primeAdulte:    475_000,
  primeAdulteAge: 712_500,
  tauxTaxe:          10,
  tauxCP:            10,
  tauxRemboursement: 80,
  plafondDentaire:             250_000,
  plafondOptique:              250_000,
  plafondHospitalisationJour:   45_000,
  plafondOrthophonie:          100_000,
  plafondMaterniteSimple:      400_000,
  plafondMaterniteGemellaire:  500_000,
  plafondMaterniteChirurgical: 600_000,
  plafondTransport:            100_000,
};

const STORAGE_KEY = "cnart_tarifs";

export function getTarifs(): TarifSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...TARIF_DEFAULTS };
    return { ...TARIF_DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...TARIF_DEFAULTS };
  }
}

export function saveTarifs(t: TarifSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
}
