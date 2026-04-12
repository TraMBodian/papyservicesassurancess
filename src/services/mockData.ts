// Données de démonstration — affichées quand le backend est indisponible

const today = new Date();
const d = (offset: number) => new Date(today.getTime() - offset * 86_400_000).toISOString().split('T')[0];

export const MOCK_ASSURES = [
  { id: "1", numero: "ASS-2024-001", nom: "Diallo",  prenom: "Mamadou",  dateNaissance: "1985-03-12", sexe: "M", pieceIdentite: "1234567890001", lien: "Principal", dateAdhesion: "2024-01-01", salaire: "750000", garantie: "Standard", telephone: "+221 77 421 33 10", email: "m.diallo@gmail.com",   adresse: "Dakar, Almadies",     numeroPolice: "POL-2024-001", type: "FAMILLE", statut: "ACTIF"    },
  { id: "2", numero: "ASS-2024-002", nom: "Sow",     prenom: "Fatou",    dateNaissance: "1990-07-25", sexe: "F", pieceIdentite: "1234567890002", lien: "Conjoint",  dateAdhesion: "2024-01-01", salaire: "",        garantie: "Standard", telephone: "+221 76 532 44 21", email: "f.sow@yahoo.fr",        adresse: "Thiès, Centre-ville", numeroPolice: "POL-2024-002", type: "FAMILLE", statut: "ACTIF"    },
  { id: "3", numero: "ASS-2024-003", nom: "Ndiaye",  prenom: "Ibrahima", dateNaissance: "1978-11-08", sexe: "M", pieceIdentite: "1234567890003", lien: "Principal", dateAdhesion: "2024-01-01", salaire: "900000", garantie: "Confort",  telephone: "+221 70 643 55 32", email: "i.ndiaye@outlook.com",  adresse: "Saint-Louis, Nord",   numeroPolice: "POL-2024-003", type: "GROUPE",  statut: "ACTIF"    },
  { id: "4", numero: "ASS-2024-004", nom: "Traoré",  prenom: "Aïssatou", dateNaissance: "1995-01-30", sexe: "F", pieceIdentite: "1234567890004", lien: "Enfant",    dateAdhesion: "2024-01-01", salaire: "",        garantie: "Standard", telephone: "+221 77 754 66 43", email: "a.traore@gmail.com",    adresse: "Ziguinchor, Sud",     numeroPolice: "POL-2024-004", type: "FAMILLE", statut: "SUSPENDU" },
  { id: "5", numero: "ASS-2024-005", nom: "Konaté",  prenom: "Ousmane",  dateNaissance: "1982-09-15", sexe: "M", pieceIdentite: "1234567890005", lien: "Principal", dateAdhesion: "2024-01-01", salaire: "650000", garantie: "Standard", telephone: "+221 76 865 77 54", email: "o.konate@gmail.com",    adresse: "Kaolack, Centre",     numeroPolice: "POL-2024-005", type: "GROUPE",  statut: "ACTIF"    },
  { id: "6", numero: "ASS-2024-006", nom: "Ba",      prenom: "Mariama",  dateNaissance: "1993-04-22", sexe: "F", pieceIdentite: "1234567890006", lien: "Conjoint",  dateAdhesion: "2024-01-01", salaire: "",        garantie: "Premium",  telephone: "+221 70 976 88 65", email: "m.ba@yahoo.fr",         adresse: "Dakar, Plateau",      numeroPolice: "POL-2024-006", type: "FAMILLE", statut: "ACTIF"    },
  { id: "7", numero: "ASS-2024-007", nom: "Sarr",    prenom: "Cheikh",   dateNaissance: "1987-12-05", sexe: "M", pieceIdentite: "1234567890007", lien: "Principal", dateAdhesion: "2024-01-01", salaire: "800000", garantie: "Confort",  telephone: "+221 77 087 99 76", email: "c.sarr@gmail.com",      adresse: "Rufisque, Est",       numeroPolice: "POL-2024-007", type: "FAMILLE", statut: "RESILIE"  },
  { id: "8", numero: "ASS-2024-008", nom: "Fall",    prenom: "Rokhaya",  dateNaissance: "1991-06-18", sexe: "F", pieceIdentite: "1234567890008", lien: "Enfant",    dateAdhesion: "2024-01-01", salaire: "",        garantie: "Standard", telephone: "+221 76 198 00 87", email: "r.fall@gmail.com",      adresse: "Mbour, Petite Côte",  numeroPolice: "POL-2024-008", type: "FAMILLE", statut: "ACTIF"    },
];

export const MOCK_POLICES = [
  { id: 1, numero: "POL-2024-001", type: "INDIVIDUELLE", statut: "ACTIVE",    prime: 85000,  dateDebut: d(300), dateFin: d(-65),  assure: { id:1, nom:"Diallo",  prenom:"Mamadou"  } },
  { id: 2, numero: "POL-2024-002", type: "FAMILIALE",    statut: "ACTIVE",    prime: 150000, dateDebut: d(280), dateFin: d(-85),  assure: { id:2, nom:"Sow",     prenom:"Fatou"    } },
  { id: 3, numero: "POL-2024-003", type: "INDIVIDUELLE", statut: "ACTIVE",    prime: 95000,  dateDebut: d(200), dateFin: d(-165), assure: { id:3, nom:"Ndiaye",  prenom:"Ibrahima" } },
  { id: 4, numero: "POL-2024-004", type: "INDIVIDUELLE", statut: "SUSPENDUE", prime: 75000,  dateDebut: d(400), dateFin: d(-30),  assure: { id:4, nom:"Traoré",  prenom:"Aïssatou" } },
  { id: 5, numero: "POL-2024-005", type: "GROUPE",       statut: "ACTIVE",    prime: 250000, dateDebut: d(150), dateFin: d(-215), assure: { id:5, nom:"Konaté",  prenom:"Ousmane"  } },
  { id: 6, numero: "POL-2024-006", type: "FAMILIALE",    statut: "ACTIVE",    prime: 180000, dateDebut: d(90),  dateFin: d(-275), assure: { id:6, nom:"Ba",      prenom:"Mariama"  } },
  { id: 7, numero: "POL-2024-007", type: "INDIVIDUELLE", statut: "RESILIEE",  prime: 70000,  dateDebut: d(500), dateFin: d(10),   assure: { id:7, nom:"Sarr",    prenom:"Cheikh"   } },
  { id: 8, numero: "POL-2024-008", type: "INDIVIDUELLE", statut: "ACTIVE",    prime: 90000,  dateDebut: d(60),  dateFin: d(-305), assure: { id:8, nom:"Fall",    prenom:"Rokhaya"  } },
];

export const MOCK_SINISTRES = [
  { id:1, numero:"SIN-2024-001", statut:"PAYE",       dateSinistre:d(60),  montantReclamation:320000, montantAccorde:280000, description:"Hospitalisation suite à une appendicite", assure:{id:1,nom:"Diallo",prenom:"Mamadou"}, police:{numero:"POL-2024-001"} },
  { id:2, numero:"SIN-2024-002", statut:"EN_ATTENTE", dateSinistre:d(15),  montantReclamation:95000,  montantAccorde:null,   description:"Consultation spécialiste cardiologie",    assure:{id:2,nom:"Sow",prenom:"Fatou"},       police:{numero:"POL-2024-002"} },
  { id:3, numero:"SIN-2024-003", statut:"APPROUVE",   dateSinistre:d(30),  montantReclamation:450000, montantAccorde:380000, description:"Chirurgie orthopédique genou droit",       assure:{id:3,nom:"Ndiaye",prenom:"Ibrahima"}, police:{numero:"POL-2024-003"} },
  { id:4, numero:"SIN-2024-004", statut:"REJETE",     dateSinistre:d(45),  montantReclamation:180000, montantAccorde:0,      description:"Soins non couverts par la police",         assure:{id:5,nom:"Konaté",prenom:"Ousmane"}, police:{numero:"POL-2024-005"} },
  { id:5, numero:"SIN-2024-005", statut:"EN_COURS",   dateSinistre:d(8),   montantReclamation:620000, montantAccorde:null,   description:"Accouchement par césarienne",              assure:{id:6,nom:"Ba",prenom:"Mariama"},      police:{numero:"POL-2024-006"} },
  { id:6, numero:"SIN-2024-006", statut:"PAYE",       dateSinistre:d(90),  montantReclamation:75000,  montantAccorde:65000,  description:"Analyse biologique et radiographie",       assure:{id:8,nom:"Fall",prenom:"Rokhaya"},   police:{numero:"POL-2024-008"} },
];

export const MOCK_PRESTATAIRES = [
  { id:1, nom:"Hôpital Principal de Dakar",     type:"HOPITAL",         statut:"ACTIF", telephone:"+221 33 889 02 02", email:"contact@hpd.sn",         adresse:"Avenue Nelson Mandela, Dakar" },
  { id:2, nom:"Clinique du Cap-Vert",           type:"CLINIQUE",        statut:"ACTIF", telephone:"+221 33 825 15 15", email:"info@cliniqueducapvert.sn",adresse:"Rue 10, Almadies, Dakar" },
  { id:3, nom:"Pharmacie Centrale Thiès",       type:"PHARMACIE",       statut:"ACTIF", telephone:"+221 77 500 12 34", email:"pharma.thies@gmail.com",  adresse:"Avenue Lamine Guèye, Thiès" },
  { id:4, nom:"Cabinet Dr. Mbaye",              type:"CABINET_MEDICAL", statut:"ACTIF", telephone:"+221 76 432 98 76", email:"dr.mbaye@cabinet.sn",     adresse:"Plateau, Dakar" },
  { id:5, nom:"Laboratoire Pasteur Sénégal",    type:"LABORATOIRE",     statut:"ACTIF", telephone:"+221 33 839 99 00", email:"labo@pasteur.sn",         adresse:"36 Avenue Pasteur, Dakar" },
  { id:6, nom:"Polyclinique Madeleine",         type:"CLINIQUE",        statut:"ACTIF", telephone:"+221 33 821 06 06", email:"info@polyclinique.sn",    adresse:"Rue Madeleine, Dakar" },
  { id:7, nom:"Pharmacie de la Paix",           type:"PHARMACIE",       statut:"INACTIF",telephone:"+221 77 612 34 56",email:"pharmapaix@yahoo.fr",     adresse:"Médina, Dakar" },
];

export const MOCK_CONSULTATIONS = [
  { id:1, dateConsultation:d(5),  statut:"COMPLETEE", motif:"Contrôle annuel",           diagnostic:"Bonne santé générale",       prestataire:{id:4,nom:"Cabinet Dr. Mbaye"},         assure:{id:1,nom:"Diallo",prenom:"Mamadou"} },
  { id:2, dateConsultation:d(10), statut:"COMPLETEE", motif:"Douleurs thoraciques",       diagnostic:"Hypertension légère",         prestataire:{id:1,nom:"Hôpital Principal de Dakar"}, assure:{id:2,nom:"Sow",prenom:"Fatou"} },
  { id:3, dateConsultation:d(2),  statut:"PLANIFIEE", motif:"Suivi grossesse",            diagnostic:"",                           prestataire:{id:2,nom:"Clinique du Cap-Vert"},        assure:{id:6,nom:"Ba",prenom:"Mariama"} },
  { id:4, dateConsultation:d(20), statut:"COMPLETEE", motif:"Douleur genou",              diagnostic:"Arthrose débutante",         prestataire:{id:4,nom:"Cabinet Dr. Mbaye"},          assure:{id:3,nom:"Ndiaye",prenom:"Ibrahima"} },
  { id:5, dateConsultation:d(1),  statut:"PLANIFIEE", motif:"Consultation diabète",       diagnostic:"",                           prestataire:{id:6,nom:"Polyclinique Madeleine"},     assure:{id:5,nom:"Konaté",prenom:"Ousmane"} },
  { id:6, dateConsultation:d(35), statut:"ANNULEE",   motif:"Dermatologie",               diagnostic:"Annulée par le patient",     prestataire:{id:4,nom:"Cabinet Dr. Mbaye"},          assure:{id:7,nom:"Sarr",prenom:"Cheikh"} },
];

export const MOCK_PRESCRIPTIONS = [
  { id:1, datePrescription:d(5),  medicaments:[{nom:"Amlodipine 5mg",dosage:"1 cp/j",duree:"30 jours"},{nom:"Ramipril 10mg",dosage:"1 cp/j",duree:"30 jours"}], consultation:{id:2}, assure:{id:2,nom:"Sow",prenom:"Fatou"},      prestataire:{id:1,nom:"Hôpital Principal de Dakar"} },
  { id:2, datePrescription:d(20), medicaments:[{nom:"Diclofénac 50mg",dosage:"2 cp/j",duree:"15 jours"},{nom:"Oméprazole 20mg",dosage:"1 cp/j",duree:"15 jours"}], consultation:{id:4}, assure:{id:3,nom:"Ndiaye",prenom:"Ibrahima"}, prestataire:{id:4,nom:"Cabinet Dr. Mbaye"} },
  { id:3, datePrescription:d(5),  medicaments:[{nom:"Acide folique 5mg",dosage:"1 cp/j",duree:"60 jours"},{nom:"Fer 200mg",dosage:"1 cp/j",duree:"60 jours"}],    consultation:{id:3}, assure:{id:6,nom:"Ba",prenom:"Mariama"},      prestataire:{id:2,nom:"Clinique du Cap-Vert"} },
];

export const MOCK_REMBOURSEMENTS = [
  { id:1, reference:"RBT-2024-001", montant:280000, statut:"PAYE",       dateRemboursement:d(45), sinistre:{id:1,numero:"SIN-2024-001"}, assure:{id:1,nom:"Diallo",prenom:"Mamadou"} },
  { id:2, reference:"RBT-2024-002", montant:380000, statut:"EN_ATTENTE", dateRemboursement:null,  sinistre:{id:3,numero:"SIN-2024-003"}, assure:{id:3,nom:"Ndiaye",prenom:"Ibrahima"} },
  { id:3, reference:"RBT-2024-003", montant:65000,  statut:"PAYE",       dateRemboursement:d(80), sinistre:{id:6,numero:"SIN-2024-006"}, assure:{id:8,nom:"Fall",prenom:"Rokhaya"} },
];

export const MOCK_USERS = [
  { id:"1", fullName:"Administrateur Bodian",    email:"bodianm372@gmail.com", role:"ADMIN",        statut:"ACTIVE",  createdAt:d(365) },
  { id:"2", fullName:"Administrateur Bassniang", email:"bassniang7@yahoo.fr",  role:"ADMIN",        statut:"ACTIVE",  createdAt:d(300) },
  { id:"3", fullName:"Dr. Mbaye Seck",           email:"dr.mbaye@cabinet.sn",  role:"PRESTATAIRE",  statut:"ACTIVE",  createdAt:d(200) },
  { id:"4", fullName:"Mamadou Diallo",           email:"m.diallo@gmail.com",   role:"CLIENT",       statut:"ACTIVE",  createdAt:d(150) },
  { id:"5", fullName:"Fatou Sow",                email:"f.sow@yahoo.fr",       role:"CLIENT",       statut:"PENDING", createdAt:d(5)   },
];

export const MOCK_CARTES = MOCK_ASSURES.map(a => ({
  id: a.id,
  numero: `CARTE-${String(a.id).padStart(4,'0')}`,
  statut: a.statut === "ACTIF" ? "ACTIVE" : "INACTIVE",
  dateExpiration: d(-365),
  assure: { id: a.id, nom: a.nom, prenom: a.prenom, dateNaissance: a.dateNaissance },
  police: { numero: a.numeroPolice },
}));

export const MOCK_DASHBOARD = {
  totalAssures: MOCK_ASSURES.length,
  totalPolices: MOCK_POLICES.length,
  totalSinistres: MOCK_SINISTRES.length,
  totalPrestataires: MOCK_PRESTATAIRES.length,
  totalConsultations: MOCK_CONSULTATIONS.length,
  totalPrescriptions: MOCK_PRESCRIPTIONS.length,
  sinistresEnAttente: MOCK_SINISTRES.filter(s => s.statut === "EN_ATTENTE").length,
  sinistresApprouves: MOCK_SINISTRES.filter(s => s.statut === "APPROUVE").length,
  sinistresPaies: MOCK_SINISTRES.filter(s => s.statut === "PAYE").length,
  montantRembourse: 345000,
  recentActivity: [
    { id:1, action:"Nouveau sinistre",        detail:"SIN-2024-005 — Ba Mariama",       type:"en_cours",   date:d(8),  time:"09:14" },
    { id:2, action:"Remboursement approuvé",  detail:"SIN-2024-003 — Ndiaye Ibrahima",  type:"approuve",   date:d(15), time:"14:32" },
    { id:3, action:"Nouvelle consultation",   detail:"Cabinet Dr. Mbaye — Konaté",      type:"en_attente", date:d(1),  time:"11:05" },
    { id:4, action:"Police créée",            detail:"POL-2024-008 — Fall Rokhaya",     type:"approuve",   date:d(60), time:"08:50" },
    { id:5, action:"Sinistre rejeté",         detail:"SIN-2024-004 — Konaté Ousmane",  type:"rejete",     date:d(45), time:"16:20" },
  ],
  chartData: [
    { mois:"Nov",  sinistres:4,  remboursements:320000  },
    { mois:"Déc",  sinistres:6,  remboursements:480000  },
    { mois:"Jan",  sinistres:5,  remboursements:410000  },
    { mois:"Fév",  sinistres:8,  remboursements:620000  },
    { mois:"Mar",  sinistres:7,  remboursements:550000  },
    { mois:"Avr",  sinistres:6,  remboursements:345000  },
  ],
};
