// Local notification store — persists cross-provider/client events in localStorage

export interface LocalNotification {
  id:       string;
  type:     "consultation" | "prescription" | "paiement" | "info";
  priority: "high" | "low";
  message:  string;
  detail:   string;
  link:     string;
  time:     string;
  targetRole?: string; // "admin" | "prestataire" | "client" | undefined = all
}

const STORE_KEY = "cnart_local_notifications";
const MAX_ITEMS = 50;

function load(): LocalNotification[] {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) ?? "[]");
  } catch { return []; }
}

function save(items: LocalNotification[]): void {
  localStorage.setItem(STORE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
}

export const notificationStore = {
  getAll(): LocalNotification[] {
    return load();
  },

  push(notif: Omit<LocalNotification, "id" | "time">): LocalNotification {
    const item: LocalNotification = {
      ...notif,
      id:   `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      time: new Date().toLocaleString("fr-FR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }),
    };
    save([item, ...load()]);
    window.dispatchEvent(new CustomEvent("cnart_notif_update"));
    return item;
  },

  remove(id: string): void {
    save(load().filter((n) => n.id !== id));
    window.dispatchEvent(new CustomEvent("cnart_notif_update"));
  },

  clear(): void {
    localStorage.removeItem(STORE_KEY);
    window.dispatchEvent(new CustomEvent("cnart_notif_update"));
  },

  /** Push a consultation-completed notification (notifies all prestataires + client) */
  notifyConsultationCompleted(params: { assureNom: string; medecinNom: string; specialite: string; date: string }): void {
    notificationStore.push({
      type:     "consultation",
      priority: "low",
      message:  `Consultation terminée — ${params.assureNom}`,
      detail:   `${params.medecinNom} · ${params.specialite} · ${params.date}`,
      link:     "/consultations",
      targetRole: undefined,
    });
  },

  /** Push a prescription-issued notification (notifies pharmacies + client) */
  notifyPrescriptionIssued(params: { assureNom: string; medecinNom: string; nbMeds: number; date: string }): void {
    notificationStore.push({
      type:     "prescription",
      priority: "low",
      message:  `Nouvelle ordonnance — ${params.assureNom}`,
      detail:   `${params.medecinNom} · ${params.nbMeds} médicament${params.nbMeds !== 1 ? "s" : ""} · ${params.date}`,
      link:     "/prescriptions",
      targetRole: undefined,
    });
  },

  /** Push a payment-reminder notification for a client */
  notifyPaymentReminder(params: { assureNom: string; montant: string; echeance: string }): void {
    notificationStore.push({
      type:     "paiement",
      priority: "high",
      message:  `Rappel de paiement — ${params.assureNom}`,
      detail:   `Montant dû : ${params.montant} · Échéance : ${params.echeance}`,
      link:     "/polices",
      targetRole: "client",
    });
  },
};
