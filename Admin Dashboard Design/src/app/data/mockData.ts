// Mock data for MirrorEffect Admin Dashboard

export interface Event {
  id: string;
  dateEvent: string;
  nom: string;
  pack: 'Découverte' | 'Essentiel' | 'Premium';
  lieu: string;
  commercial: string;
  margeBrute: number;
  acompteStatus: 'Payé' | 'Attention';
  eventDetails: {
    email: string;
    phone: string;
    nbPersonnes: number;
    nbMiroirs: number;
    caGenere: number;
    coutOperationnel: number;
    invoiceLink?: string;
    galleryLink?: string;
    zipLink?: string;
  };
}

export interface Student {
  id: string;
  name: string;
  month: string;
  hours: number;
  cost: number;
  assignedEvents: number;
}

export interface KPIData {
  caTotal: number;
  caGenere: number;
  margeBruteOpe: number;
  cashflowNet: number;
}

export interface ChartDataPoint {
  month: string;
  value: number;
}

// KPI Data
export const kpiData: KPIData = {
  caTotal: 147800,
  caGenere: 125300,
  margeBruteOpe: 78450,
  cashflowNet: 62100,
};

// CA Generated Over Time
export const caGeneratedData: ChartDataPoint[] = [
  { month: 'Jan', value: 45000 },
  { month: 'Fév', value: 52000 },
  { month: 'Mar', value: 48000 },
  { month: 'Avr', value: 61000 },
  { month: 'Mai', value: 58000 },
  { month: 'Juin', value: 72000 },
  { month: 'Juil', value: 68000 },
  { month: 'Aoû', value: 85000 },
  { month: 'Sep', value: 91000 },
  { month: 'Oct', value: 87000 },
  { month: 'Nov', value: 78000 },
  { month: 'Déc', value: 95000 },
];

// Events per Pack
export const eventsPerPackData: ChartDataPoint[] = [
  { month: 'Découverte', value: 28 },
  { month: 'Essentiel', value: 45 },
  { month: 'Premium', value: 19 },
];

// Events Data
export const eventsData: Event[] = [
  {
    id: 'EVT-001',
    dateEvent: '2026-01-25',
    nom: 'Mariage Dupont-Martin',
    pack: 'Premium',
    lieu: 'Château de Versailles',
    commercial: 'Sophie Laurent',
    margeBrute: 3200,
    acompteStatus: 'Payé',
    eventDetails: {
      email: 'marie.dupont@email.com',
      phone: '+33 6 12 34 56 78',
      nbPersonnes: 150,
      nbMiroirs: 3,
      caGenere: 5800,
      coutOperationnel: 2600,
      invoiceLink: 'https://example.com/invoice/001',
      galleryLink: 'https://example.com/gallery/001',
      zipLink: 'https://example.com/zip/001',
    },
  },
  {
    id: 'EVT-002',
    dateEvent: '2026-01-28',
    nom: 'Mariage Bernard',
    pack: 'Essentiel',
    lieu: 'Domaine des Roses, Lyon',
    commercial: 'Thomas Blanc',
    margeBrute: 1850,
    acompteStatus: 'Payé',
    eventDetails: {
      email: 'claire.bernard@email.com',
      phone: '+33 6 23 45 67 89',
      nbPersonnes: 100,
      nbMiroirs: 2,
      caGenere: 3200,
      coutOperationnel: 1350,
      invoiceLink: 'https://example.com/invoice/002',
    },
  },
  {
    id: 'EVT-003',
    dateEvent: '2026-02-01',
    nom: 'Mariage Lefebvre',
    pack: 'Découverte',
    lieu: 'Salle Émeraude, Paris',
    commercial: 'Sophie Laurent',
    margeBrute: 950,
    acompteStatus: 'Attention',
    eventDetails: {
      email: 'julie.lefebvre@email.com',
      phone: '+33 6 34 56 78 90',
      nbPersonnes: 80,
      nbMiroirs: 1,
      caGenere: 1800,
      coutOperationnel: 850,
    },
  },
  {
    id: 'EVT-004',
    dateEvent: '2026-02-05',
    nom: 'Anniversaire Moreau',
    pack: 'Premium',
    lieu: 'Villa Méditerranée, Nice',
    commercial: 'Marc Durand',
    margeBrute: 2950,
    acompteStatus: 'Payé',
    eventDetails: {
      email: 'antoine.moreau@email.com',
      phone: '+33 6 45 67 89 01',
      nbPersonnes: 120,
      nbMiroirs: 3,
      caGenere: 5200,
      coutOperationnel: 2250,
      invoiceLink: 'https://example.com/invoice/004',
      galleryLink: 'https://example.com/gallery/004',
    },
  },
  {
    id: 'EVT-005',
    dateEvent: '2026-02-08',
    nom: 'Mariage Petit-Rousseau',
    pack: 'Essentiel',
    lieu: 'Manoir de Bretagne',
    commercial: 'Sophie Laurent',
    margeBrute: 2100,
    acompteStatus: 'Payé',
    eventDetails: {
      email: 'emma.petit@email.com',
      phone: '+33 6 56 78 90 12',
      nbPersonnes: 110,
      nbMiroirs: 2,
      caGenere: 3600,
      coutOperationnel: 1500,
      invoiceLink: 'https://example.com/invoice/005',
      galleryLink: 'https://example.com/gallery/005',
      zipLink: 'https://example.com/zip/005',
    },
  },
  {
    id: 'EVT-006',
    dateEvent: '2026-02-12',
    nom: 'Soirée Corporate TechCorp',
    pack: 'Premium',
    lieu: 'Grand Hôtel, Paris',
    commercial: 'Thomas Blanc',
    margeBrute: 3500,
    acompteStatus: 'Payé',
    eventDetails: {
      email: 'events@techcorp.com',
      phone: '+33 1 23 45 67 89',
      nbPersonnes: 200,
      nbMiroirs: 4,
      caGenere: 6200,
      coutOperationnel: 2700,
      invoiceLink: 'https://example.com/invoice/006',
    },
  },
  {
    id: 'EVT-007',
    dateEvent: '2026-02-15',
    nom: 'Mariage Girard',
    pack: 'Découverte',
    lieu: 'Mairie du 15ème, Paris',
    commercial: 'Marc Durand',
    margeBrute: 1050,
    acompteStatus: 'Attention',
    eventDetails: {
      email: 'laura.girard@email.com',
      phone: '+33 6 67 89 01 23',
      nbPersonnes: 75,
      nbMiroirs: 1,
      caGenere: 1950,
      coutOperationnel: 900,
    },
  },
  {
    id: 'EVT-008',
    dateEvent: '2026-02-18',
    nom: 'Mariage Roux-Fontaine',
    pack: 'Premium',
    lieu: 'Château de Loire',
    commercial: 'Sophie Laurent',
    margeBrute: 4100,
    acompteStatus: 'Payé',
    eventDetails: {
      email: 'camille.roux@email.com',
      phone: '+33 6 78 90 12 34',
      nbPersonnes: 180,
      nbMiroirs: 4,
      caGenere: 7200,
      coutOperationnel: 3100,
      invoiceLink: 'https://example.com/invoice/008',
      galleryLink: 'https://example.com/gallery/008',
      zipLink: 'https://example.com/zip/008',
    },
  },
  {
    id: 'EVT-009',
    dateEvent: '2026-02-22',
    nom: 'Mariage Simon',
    pack: 'Essentiel',
    lieu: 'Orangerie de Provence',
    commercial: 'Thomas Blanc',
    margeBrute: 1900,
    acompteStatus: 'Payé',
    eventDetails: {
      email: 'sarah.simon@email.com',
      phone: '+33 6 89 01 23 45',
      nbPersonnes: 95,
      nbMiroirs: 2,
      caGenere: 3300,
      coutOperationnel: 1400,
      invoiceLink: 'https://example.com/invoice/009',
    },
  },
  {
    id: 'EVT-010',
    dateEvent: '2026-02-25',
    nom: 'Anniversaire Laurent',
    pack: 'Découverte',
    lieu: 'Restaurant Le Gourmet',
    commercial: 'Marc Durand',
    margeBrute: 800,
    acompteStatus: 'Payé',
    eventDetails: {
      email: 'pierre.laurent@email.com',
      phone: '+33 6 90 12 34 56',
      nbPersonnes: 60,
      nbMiroirs: 1,
      caGenere: 1600,
      coutOperationnel: 800,
      invoiceLink: 'https://example.com/invoice/010',
      galleryLink: 'https://example.com/gallery/010',
    },
  },
];

// Students Data
export const studentsData: Student[] = [
  {
    id: 'STU-001',
    name: 'Lucas Mercier',
    month: 'Janvier 2026',
    hours: 32,
    cost: 480,
    assignedEvents: 4,
  },
  {
    id: 'STU-002',
    name: 'Léa Dubois',
    month: 'Janvier 2026',
    hours: 28,
    cost: 420,
    assignedEvents: 3,
  },
  {
    id: 'STU-003',
    name: 'Hugo Martinez',
    month: 'Février 2026',
    hours: 40,
    cost: 600,
    assignedEvents: 5,
  },
  {
    id: 'STU-004',
    name: 'Chloé Robert',
    month: 'Février 2026',
    hours: 36,
    cost: 540,
    assignedEvents: 4,
  },
];

// Availability Calendar Data - Number of events per day
export const availabilityData: Record<string, number> = {
  '2026-01-25': 1,
  '2026-01-28': 1,
  '2026-02-01': 1,
  '2026-02-05': 2,
  '2026-02-08': 1,
  '2026-02-12': 2,
  '2026-02-15': 3,
  '2026-02-18': 1,
  '2026-02-22': 2,
  '2026-02-25': 1,
  '2026-02-26': 4, // Blocked day
  '2026-03-01': 3,
  '2026-03-05': 2,
};
