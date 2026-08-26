import {
  DEMO_ADMIN_USER,
  DEMO_AUTH_TOKENS,
  DEMO_DRIVER_USER,
  DEMO_USER,
  getDemoSessionType,
  getDemoUserByToken,
  hasDemoSession,
  isDemoToken,
} from "./demoAuth.js";
import {
  DEMO_ADMIN_ANALYTICS,
  DEMO_ADMIN_ML_ANALYTICS,
  DEMO_ADMIN_SCHEDULES,
} from "./demoAdminData.js";

const nowIso = () => new Date().toISOString();

const dateKey = (offsetDays = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

const pagination = (items, page = 1, limit = 10) => ({
  page: Number(page),
  limit: Number(limit),
  total: items.length,
  pages: Math.max(1, Math.ceil(items.length / Number(limit || 10))),
});

const DEMO_ORGANIZATIONS = Object.freeze([
  {
    _id: "demo-org-sp",
    id: "demo-org-sp",
    name: "Cooperativa Centro Verde",
    location: {
      latitude: -23.561684,
      longitude: -46.655981,
      address: "Av. Paulista, 1000 - Bela Vista, São Paulo - SP",
    },
    admins: [
      {
        id: "demo-admin-org-001",
        name: "Ana Martins",
        email: "ana.martins@centroverde.com.br",
        phone: "(11) 98888-1201",
        role: "admin",
        createdAt: dateKey(-18),
      },
    ],
    fleet: ["demo-vehicle-001", "demo-vehicle-002"],
    driverCount: 3,
    createdAt: dateKey(-120),
  },
  {
    _id: "demo-org-pinheiros",
    id: "demo-org-pinheiros",
    name: "Recicla Pinheiros",
    location: {
      latitude: -23.566577,
      longitude: -46.690712,
      address: "Rua dos Pinheiros, 870 - Pinheiros, São Paulo - SP",
    },
    admins: [
      {
        id: "demo-admin-org-002",
        name: "Luiz Ferreira",
        email: "luiz.ferreira@reciclapinheiros.com.br",
        phone: "(11) 97777-4500",
        role: "admin",
        createdAt: dateKey(-34),
      },
    ],
    fleet: ["demo-vehicle-003"],
    driverCount: 2,
    createdAt: dateKey(-96),
  },
  {
    _id: "demo-org-sul",
    id: "demo-org-sul",
    name: "EcoSul Materiais",
    location: {
      latitude: -23.609017,
      longitude: -46.667186,
      address: "Av. Ibirapuera, 2500 - Moema, São Paulo - SP",
    },
    admins: [
      {
        id: "demo-admin-org-003",
        name: "Camila Souza",
        email: "camila.souza@ecosul.com.br",
        phone: "(11) 96666-2200",
        role: "admin",
        createdAt: dateKey(-9),
      },
    ],
    fleet: ["demo-vehicle-004"],
    driverCount: 2,
    createdAt: dateKey(-72),
  },
]);

const DEMO_AREAS = Object.freeze([
  {
    _id: "demo-area-001",
    name: "Bela Vista",
    type: "commercial",
    orgId: DEMO_ORGANIZATIONS[0],
    address: "Av. Paulista, 1000 - Bela Vista, São Paulo - SP",
    coordinates: { latitude: -23.561684, longitude: -46.655981 },
    isActive: true,
    scaleFactor: 1.25,
  },
  {
    _id: "demo-area-002",
    name: "Pinheiros",
    type: "mixed",
    orgId: DEMO_ORGANIZATIONS[1],
    address: "Rua dos Pinheiros, 870 - Pinheiros, São Paulo - SP",
    coordinates: { latitude: -23.566577, longitude: -46.690712 },
    isActive: true,
    scaleFactor: 1.4,
  },
  {
    _id: "demo-area-003",
    name: "Moema",
    type: "residential",
    orgId: DEMO_ORGANIZATIONS[2],
    address: "Av. Ibirapuera, 2500 - Moema, São Paulo - SP",
    coordinates: { latitude: -23.609017, longitude: -46.667186 },
    isActive: true,
    scaleFactor: 1.1,
  },
  {
    _id: "demo-area-004",
    name: "Vila Mariana",
    type: "residential",
    orgId: DEMO_ORGANIZATIONS[0],
    address: "Rua Domingos de Morais, 1600 - Vila Mariana, São Paulo - SP",
    coordinates: { latitude: -23.589719, longitude: -46.634307 },
    isActive: false,
    scaleFactor: 0.95,
  },
]);

const DEMO_DRIVERS = Object.freeze([
  {
    id: "demo-driver-001",
    _id: "demo-driver-001",
    name: DEMO_DRIVER_USER.name,
    email: DEMO_DRIVER_USER.email,
    phone: DEMO_DRIVER_USER.phone,
    status: "Available",
    organization: "Cooperativa Centro Verde",
    orgId: "demo-org-sp",
    truck: "ECV-2026",
    createdAt: dateKey(-41),
  },
  {
    id: "demo-driver-002",
    _id: "demo-driver-002",
    name: "Mariana Lopes",
    email: "mariana.coletas@ecoroute.com.br",
    phone: "(11) 97654-1122",
    status: "Busy",
    organization: "Recicla Pinheiros",
    orgId: "demo-org-pinheiros",
    truck: "PIN-4182",
    createdAt: dateKey(-28),
  },
  {
    id: "demo-driver-003",
    _id: "demo-driver-003",
    name: "Rafael Nogueira",
    email: "rafael.rotas@ecoroute.com.br",
    phone: "(11) 96543-2211",
    status: "Available",
    organization: "EcoSul Materiais",
    orgId: "demo-org-sul",
    truck: "No Truck",
    createdAt: dateKey(-14),
  },
]);

const DEMO_VEHICLES = Object.freeze([
  {
    id: "demo-vehicle-001",
    _id: "demo-vehicle-001",
    licensePlate: "ECV-2026",
    capacity: 1800,
    isAvailable: true,
    organization: "Cooperativa Centro Verde",
    orgId: "demo-org-sp",
    assignedDriver: { id: "demo-driver-001", name: DEMO_DRIVER_USER.name },
  },
  {
    id: "demo-vehicle-002",
    _id: "demo-vehicle-002",
    licensePlate: "CVR-7184",
    capacity: 3200,
    isAvailable: false,
    organization: "Cooperativa Centro Verde",
    orgId: "demo-org-sp",
    assignedDriver: { id: "demo-driver-002", name: "Mariana Lopes" },
  },
  {
    id: "demo-vehicle-003",
    _id: "demo-vehicle-003",
    licensePlate: "PIN-4182",
    capacity: 900,
    isAvailable: true,
    organization: "Recicla Pinheiros",
    orgId: "demo-org-pinheiros",
    assignedDriver: null,
  },
  {
    id: "demo-vehicle-004",
    _id: "demo-vehicle-004",
    licensePlate: "ECO-5541",
    capacity: 5200,
    isAvailable: true,
    organization: "EcoSul Materiais",
    orgId: "demo-org-sul",
    assignedDriver: { id: "demo-driver-003", name: "Rafael Nogueira" },
  },
]);

const DEMO_ADMINS = Object.freeze([
  {
    id: "demo-admin-001",
    _id: "demo-admin-001",
    name: DEMO_ADMIN_USER.name,
    email: DEMO_ADMIN_USER.email,
    phone: DEMO_ADMIN_USER.phone,
    role: "super_admin",
    organization: null,
    createdAt: dateKey(-60),
  },
  {
    id: "demo-admin-org-001",
    _id: "demo-admin-org-001",
    name: "Ana Martins",
    email: "ana.martins@centroverde.com.br",
    phone: "(11) 98888-1201",
    role: "admin",
    organization: { _id: "demo-org-sp", name: "Cooperativa Centro Verde" },
    createdAt: dateKey(-18),
  },
  {
    id: "demo-admin-org-002",
    _id: "demo-admin-org-002",
    name: "Luiz Ferreira",
    email: "luiz.ferreira@reciclapinheiros.com.br",
    phone: "(11) 97777-4500",
    role: "admin",
    organization: { _id: "demo-org-pinheiros", name: "Recicla Pinheiros" },
    createdAt: dateKey(-34),
  },
]);

const DEMO_USERS = Object.freeze([
  {
    id: DEMO_USER.id,
    _id: DEMO_USER.id,
    name: DEMO_USER.name,
    email: DEMO_USER.email,
    phone: DEMO_USER.phone,
    role: "customer_admin",
    isActive: true,
    address: DEMO_USER.address,
    organization: { _id: "demo-org-sp", name: "Cliente empresarial" },
    createdAt: dateKey(-16),
  },
  {
    id: DEMO_DRIVER_USER.id,
    _id: DEMO_DRIVER_USER.id,
    name: DEMO_DRIVER_USER.name,
    email: DEMO_DRIVER_USER.email,
    phone: DEMO_DRIVER_USER.phone,
    role: "driver",
    isActive: true,
    address: DEMO_DRIVER_USER.address,
    organization: { _id: "demo-org-sp", name: "Cooperativa Centro Verde" },
    createdAt: dateKey(-41),
  },
  {
    id: DEMO_ADMIN_USER.id,
    _id: DEMO_ADMIN_USER.id,
    name: DEMO_ADMIN_USER.name,
    email: DEMO_ADMIN_USER.email,
    phone: DEMO_ADMIN_USER.phone,
    role: "super_admin",
    isActive: true,
    address: DEMO_ADMIN_USER.address,
    organization: null,
    createdAt: dateKey(-60),
  },
  {
    id: "demo-customer-002",
    _id: "demo-customer-002",
    name: "Condomínio Paulista",
    email: "financeiro@condominiopaulista.com.br",
    phone: "(11) 3333-2026",
    role: "customer_admin",
    isActive: true,
    address: "Alameda Santos, 900 - Jardins, São Paulo - SP",
    organization: { _id: "demo-org-sp", name: "Cliente empresarial" },
    createdAt: dateKey(-22),
  },
]);

const DEMO_DRIVER_PICKUP = Object.freeze({
  id: "demo-pickup-4D1A11E2",
  _id: "demo-pickup-4D1A11E2",
  customerName: "Cliente Demonstração",
  customerPhone: "(11) 4002-8922",
  customer: {
    id: DEMO_USER.id,
    name: DEMO_USER.name,
    email: DEMO_USER.email,
    phone: DEMO_USER.phone,
  },
  category: "recyclable",
  level: "medium",
  wasteType: "Eletrônicos, papelão e plásticos recicláveis",
  description: "Coleta de equipamentos eletrônicos pequenos, caixas de papelão e embalagens plásticas separadas.",
  location: {
    latitude: -23.561684,
    longitude: -46.655981,
    address: "Av. Paulista, 1000 - Bela Vista, São Paulo - SP",
  },
  estimatedWeightKg: 32,
  weight: 32,
  volume: "3 caixas médias",
  price: 148,
  estimatedPrice: 148,
  status: "PENDING",
  paymentMethod: "cash",
  paymentStatus: "PENDING",
  createdAt: nowIso(),
  assignedAt: null,
  driverInfo: {
    id: DEMO_DRIVER_USER.id,
    name: DEMO_DRIVER_USER.name,
    licensePlate: "ECV-2026",
  },
});

const DEMO_PICKUP_PAYMENTS = Object.freeze([
  {
    id: "demo-payment-001",
    pickupId: "demo-pickup-4D1A11E2",
    amount: 148,
    currency: "BRL",
    method: "cash",
    status: "PENDING",
    createdAt: nowIso(),
    paidAt: null,
    customer: { id: DEMO_USER.id, name: DEMO_USER.name, email: DEMO_USER.email, phone: DEMO_USER.phone },
    driver: { id: DEMO_DRIVER_USER.id, name: DEMO_DRIVER_USER.name, email: DEMO_DRIVER_USER.email },
    organization: { id: DEMO_ORGANIZATIONS[0]._id, name: DEMO_ORGANIZATIONS[0].name },
    pickup: {
      id: "demo-pickup-4D1A11E2",
      status: "ASSIGNED",
      category: "recyclable",
      level: "medium",
      location: DEMO_DRIVER_PICKUP.location,
    },
  },
  {
    id: "demo-payment-002",
    pickupId: "demo-pickup-7F42A1C9",
    amount: 216,
    currency: "BRL",
    method: "pix",
    status: "COMPLETED",
    createdAt: dateKey(-1),
    paidAt: dateKey(-1),
    customer: { id: "demo-customer-002", name: "Condomínio Paulista", email: "financeiro@condominiopaulista.com.br" },
    driver: { id: "demo-driver-002", name: "Mariana Lopes", email: "mariana.coletas@ecoroute.com.br" },
    organization: { id: DEMO_ORGANIZATIONS[0]._id, name: DEMO_ORGANIZATIONS[0].name },
    pickup: {
      id: "demo-pickup-7F42A1C9",
      status: "COMPLETED",
      category: "both",
      level: "hard",
      location: { address: "Alameda Santos, 900 - Jardins, São Paulo - SP" },
    },
  },
  {
    id: "demo-payment-003",
    pickupId: "demo-pickup-3B9D217E",
    amount: 92,
    currency: "BRL",
    method: "cash",
    status: "COMPLETED",
    createdAt: dateKey(-3),
    paidAt: dateKey(-2),
    customer: { id: "demo-customer-003", name: "Mercado Santa Cecília", email: "operacoes@mercadosantacecilia.com.br" },
    driver: { id: "demo-driver-003", name: "Rafael Nogueira", email: "rafael.rotas@ecoroute.com.br" },
    organization: { id: DEMO_ORGANIZATIONS[1]._id, name: DEMO_ORGANIZATIONS[1].name },
    pickup: {
      id: "demo-pickup-3B9D217E",
      status: "COMPLETED",
      category: "recyclable",
      level: "easy",
      location: { address: "Rua das Palmeiras, 320 - Santa Cecília, São Paulo - SP" },
    },
  },
  {
    id: "demo-payment-004",
    pickupId: "demo-pickup-0C65E8B4",
    amount: 184,
    currency: "BRL",
    method: "pix",
    status: "COMPLETED",
    createdAt: dateKey(-5),
    paidAt: dateKey(-5),
    customer: { id: "demo-customer-004", name: "Clínica Ibirapuera", email: "administrativo@clinicaibirapuera.com.br" },
    driver: { id: "demo-driver-004", name: "Paulo Mendes", email: "paulo.mendes@ecosul.com.br" },
    organization: { id: DEMO_ORGANIZATIONS[2]._id, name: DEMO_ORGANIZATIONS[2].name },
    pickup: {
      id: "demo-pickup-0C65E8B4",
      status: "COMPLETED",
      category: "recyclable",
      level: "medium",
      location: { address: "Av. Ibirapuera, 1888 - Moema, São Paulo - SP" },
    },
  },
  {
    id: "demo-payment-005",
    pickupId: "demo-pickup-91A6D20F",
    amount: 126,
    currency: "BRL",
    method: "pix",
    status: "FAILED",
    createdAt: dateKey(-6),
    paidAt: null,
    customer: { id: "demo-customer-005", name: "Residencial Pinheiros", email: "sindico@residencialpinheiros.com.br" },
    driver: null,
    organization: { id: DEMO_ORGANIZATIONS[1]._id, name: DEMO_ORGANIZATIONS[1].name },
    pickup: {
      id: "demo-pickup-91A6D20F",
      status: "PAYMENT_REQUIRED",
      category: "both",
      level: "medium",
      location: { address: "Rua Cardeal Arcoverde, 1410 - Pinheiros, São Paulo - SP" },
    },
  },
  {
    id: "demo-payment-006",
    pickupId: "demo-pickup-5E42B80A",
    amount: 74,
    currency: "BRL",
    method: "cash",
    status: "COMPLETED",
    createdAt: dateKey(-8),
    paidAt: dateKey(-8),
    customer: { id: "demo-customer-006", name: "Café Bela Vista", email: "contato@cafebelavista.com.br" },
    driver: { id: DEMO_DRIVER_USER.id, name: DEMO_DRIVER_USER.name, email: DEMO_DRIVER_USER.email },
    organization: { id: DEMO_ORGANIZATIONS[0]._id, name: DEMO_ORGANIZATIONS[0].name },
    pickup: {
      id: "demo-pickup-5E42B80A",
      status: "COMPLETED",
      category: "recyclable",
      level: "easy",
      location: { address: "Rua Pamplona, 640 - Bela Vista, São Paulo - SP" },
    },
  },
]);

const DEMO_NOTIFICATIONS = Object.freeze([
  {
    _id: "demo-notification-001",
    title: "Agenda de coleta confirmada",
    message: "A rota de hoje foi confirmada para Bela Vista e Pinheiros.",
    type: "schedule_confirmed",
    severity: "info",
    isRead: false,
    read: false,
    createdAt: nowIso(),
  },
  {
    _id: "demo-notification-002",
    title: "Veículo exige atenção",
    message: "O veículo CVR-7184 está em rota e deve retornar para triagem após a próxima coleta.",
    type: "driverless_truck",
    severity: "warning",
    isRead: true,
    read: true,
    createdAt: dateKey(-1),
  },
]);

const DEMO_CONTACT_MESSAGES = Object.freeze([
  {
    _id: "demo-contact-001",
    name: "Cliente Demonstração",
    email: DEMO_USER.email,
    role: "customer_admin",
    orgName: "Cliente empresarial",
    subject: "Dúvida sobre coleta de eletrônicos",
    message: "Gostaria de confirmar se monitores e cabos podem ser enviados na mesma solicitação de coleta.",
    status: "unread",
    createdAt: nowIso(),
    userId: { name: DEMO_USER.name, email: DEMO_USER.email, role: "customer_admin" },
    orgId: { name: "Cliente empresarial" },
  },
  {
    _id: "demo-contact-002",
    name: "Ana Martins",
    email: "ana.martins@centroverde.com.br",
    role: "admin",
    orgName: "Cooperativa Centro Verde",
    subject: "Ajuste de área atendida",
    message: "Solicito revisão do perímetro de atendimento da Bela Vista para otimizar as rotas da frota.",
    status: "read",
    createdAt: dateKey(-2),
    userId: { name: "Ana Martins", email: "ana.martins@centroverde.com.br", role: "admin" },
    orgId: { name: "Cooperativa Centro Verde" },
  },
]);

const DEMO_PRICING_CONFIG = Object.freeze({
  _id: "demo-pricing-config",
  categoryBase: {
    recyclable: 120,
    nonRecyclable: 180,
    mixed: 220,
  },
  levelMultiplier: {
    easy: 1,
    medium: 1.8,
    hard: 3.2,
  },
  distanceRatePerKm: 8,
  minimumCharge: 90,
  updatedAt: nowIso(),
  updatedBy: { name: DEMO_ADMIN_USER.name },
});

const DEMO_DRIVER_ASSIGNMENTS = Object.freeze({
  today: {
    scheduleId: "demo-schedule-today",
    date: dateKey(0),
    dayName: new Date().toLocaleDateString("en-US", { weekday: "long" }),
    status: "confirmed",
    totalPredictedWasteKg: 1420,
    assignments: [
      {
        area: "Bela Vista",
        areaType: "commercial",
        orgName: "Cooperativa Centro Verde",
        action: "dispatch",
        predictedWasteKg: 620,
        wasteCategory: "high",
        wasteLevel: "high",
        truck: { id: "demo-vehicle-001", licensePlate: "ECV-2026" },
        recommendation: "Priorizar coleta de eletrônicos e recicláveis antes das 11h.",
        completionStatus: "pending",
      },
      {
        area: "Pinheiros",
        areaType: "mixed",
        orgName: "Recicla Pinheiros",
        action: "dispatch",
        predictedWasteKg: 800,
        wasteCategory: "critical",
        wasteLevel: "critical",
        truck: { id: "demo-vehicle-001", licensePlate: "ECV-2026" },
        recommendation: "Volume crítico previsto em pontos comerciais próximos ao metrô.",
        completionStatus: "pending",
      },
    ],
  },
  tomorrow: {
    scheduleId: "demo-schedule-tomorrow",
    date: dateKey(1),
    dayName: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { weekday: "long" }),
    status: "pending",
    totalPredictedWasteKg: 730,
    assignments: [
      {
        area: "Moema",
        areaType: "residential",
        orgName: "EcoSul Materiais",
        action: "reduced",
        predictedWasteKg: 730,
        wasteCategory: "medium",
        wasteLevel: "medium",
        truck: { id: "demo-vehicle-004", licensePlate: "ECO-5541" },
        recommendation: "Cobertura reduzida com foco em condomínios de maior volume.",
        completionStatus: "pending",
      },
    ],
  },
});

const DEMO_PICKUP_ANALYTICS = Object.freeze({
  summary: {
    total: 184,
    completed: 142,
    active: 29,
    cancelled: 4,
    expired: 9,
    completionRate: 77,
    avgResponseMs: 22 * 60 * 1000,
    avgTaskDurationMs: 138 * 60 * 1000,
  },
  statusDistribution: DEMO_ADMIN_ANALYTICS.statusDistribution,
  categoryDistribution: DEMO_ADMIN_ANALYTICS.categoryDistribution,
  levelDistribution: DEMO_ADMIN_ANALYTICS.levelDistribution,
  pickupTrend: DEMO_ADMIN_ANALYTICS.dailyTrend,
  topDrivers: DEMO_ADMIN_ANALYTICS.topDrivers,
  hourlyDistribution: DEMO_ADMIN_ANALYTICS.hourlyDistribution,
  responseTimeTrend: [
    { date: dateKey(-6), avgResponseMs: 27 * 60 * 1000 },
    { date: dateKey(-5), avgResponseMs: 25 * 60 * 1000 },
    { date: dateKey(-4), avgResponseMs: 24 * 60 * 1000 },
    { date: dateKey(-3), avgResponseMs: 23 * 60 * 1000 },
    { date: dateKey(-2), avgResponseMs: 21 * 60 * 1000 },
    { date: dateKey(-1), avgResponseMs: 19 * 60 * 1000 },
    { date: dateKey(0), avgResponseMs: 18 * 60 * 1000 },
  ],
  areaBreakdown: DEMO_ADMIN_ANALYTICS.areaBreakdown,
  orgBreakdown: DEMO_ADMIN_ANALYTICS.orgBreakdown,
});

const DEMO_HISTORY_PICKUPS = Object.freeze([
  {
    ...DEMO_DRIVER_PICKUP,
    _id: "demo-history-5A72C0F1",
    id: "demo-history-5A72C0F1",
    status: "COMPLETED",
    category: "recyclable",
    level: "medium",
    area: "Bela Vista",
    organization: "Cooperativa Centro Verde",
    driver: {
      id: DEMO_DRIVER_USER.id,
      name: DEMO_DRIVER_USER.name,
      phone: DEMO_DRIVER_USER.phone,
    },
    createdAt: dateKey(-2),
    assignedAt: dateKey(-2),
    completedAt: dateKey(-1),
    paymentMethod: "pix",
    paymentStatus: "PAID",
    responseTimeMs: 18 * 60 * 1000,
    taskDurationMs: 108 * 60 * 1000,
  },
  {
    ...DEMO_DRIVER_PICKUP,
    _id: "demo-history-A990B2D4",
    id: "demo-history-A990B2D4",
    category: "mixed",
    level: "hard",
    status: "CANCELLED",
    area: "Pinheiros",
    organization: "Recicla Pinheiros",
    driver: {
      id: "demo-driver-002",
      name: "Mariana Lopes",
      phone: "(11) 97654-1122",
    },
    createdAt: dateKey(-5),
    assignedAt: dateKey(-5),
    cancelledAt: dateKey(-4),
    cancelledBy: { name: "Cliente Demonstração", role: "customer" },
    completedAt: null,
    responseTimeMs: 26 * 60 * 1000,
    taskDurationMs: null,
  },
  {
    ...DEMO_DRIVER_PICKUP,
    _id: "demo-history-C13F48E7",
    id: "demo-history-C13F48E7",
    status: "PAYMENT_REQUIRED",
    category: "recyclable",
    level: "easy",
    area: "Vila Mariana",
    location: {
      latitude: -23.5892,
      longitude: -46.6344,
      address: "Rua Vergueiro, 3100 - Vila Mariana, São Paulo - SP",
    },
    estimatedPrice: 86,
    paymentMethod: null,
    paymentStatus: "UNPAID",
    createdAt: dateKey(-1),
    assignedAt: null,
    completedAt: null,
  },
]);

const DEMO_HISTORY_CUSTOMERS = Object.freeze([
  {
    customerId: DEMO_USER.id,
    name: DEMO_USER.name,
    email: DEMO_USER.email,
    phone: DEMO_USER.phone,
    totalPickups: 8,
    completed: 6,
    cancelled: 1,
    active: 1,
    lastPickupAt: dateKey(-1),
  },
  {
    customerId: "demo-customer-002",
    name: "Condomínio Paulista",
    email: "financeiro@condominiopaulista.com.br",
    phone: "(11) 3333-2026",
    totalPickups: 14,
    completed: 12,
    cancelled: 1,
    active: 1,
    lastPickupAt: dateKey(-2),
  },
]);

const DEMO_HISTORY_DRIVERS = Object.freeze([
  {
    driverId: DEMO_DRIVER_USER.id,
    name: DEMO_DRIVER_USER.name,
    email: DEMO_DRIVER_USER.email,
    phone: DEMO_DRIVER_USER.phone,
    totalPickups: 34,
    completed: 31,
    cancelled: 1,
    active: 2,
    avgResponseMs: 16 * 60 * 1000,
    avgTaskDurationMs: 112 * 60 * 1000,
  },
  {
    driverId: "demo-driver-002",
    name: "Mariana Lopes",
    email: "mariana.coletas@ecoroute.com.br",
    phone: "(11) 97654-1122",
    totalPickups: 29,
    completed: 26,
    cancelled: 2,
    active: 1,
    avgResponseMs: 19 * 60 * 1000,
    avgTaskDurationMs: 128 * 60 * 1000,
  },
]);

function getTokenFromConfig(config, explicitToken) {
  const headerValue = config?.headers?.Authorization || config?.headers?.authorization || "";
  return explicitToken || String(headerValue).replace(/^Bearer\s+/i, "");
}

function normalizeUrl(config) {
  const raw = config?.url || "/";
  const base = config?.baseURL || "http://demo.local";
  const url = new URL(raw, base);
  return {
    pathname: url.pathname.replace(/^\/api(?=\/)/, ""),
    searchParams: url.searchParams,
  };
}

function parseBody(data) {
  if (!data) return {};
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  return data;
}

function getDemoRole(token) {
  const sessionType = getDemoSessionType();
  if (sessionType) return sessionType;
  if (token === DEMO_AUTH_TOKENS.admin) return "admin";
  if (token === DEMO_AUTH_TOKENS.driver) return "driver";
  if (token === DEMO_AUTH_TOKENS.customer) return "customer";
  return null;
}

function withPagination(items, searchParams) {
  const page = searchParams.get("page") || 1;
  const limit = searchParams.get("limit") || 10;
  return pagination(items, page, limit);
}

const DEMO_RUNTIME_PICKUPS_KEY = "ecoroute-demo-runtime-pickups";
const demoRuntimePickups = new Map();

function saveDemoRuntimePickup(pickup) {
  const id = String(pickup.id || pickup._id);
  demoRuntimePickups.set(id, pickup);
  try {
    if (typeof localStorage !== "undefined") {
      const stored = JSON.parse(localStorage.getItem(DEMO_RUNTIME_PICKUPS_KEY) || "{}");
      localStorage.setItem(DEMO_RUNTIME_PICKUPS_KEY, JSON.stringify({ ...stored, [id]: pickup }));
    }
  } catch {
    // In-memory state remains available if browser storage is unavailable.
  }
}

function getDemoRuntimePickup(id) {
  const normalizedId = String(id);
  const inMemory = demoRuntimePickups.get(normalizedId);
  if (inMemory) return inMemory;
  try {
    if (typeof localStorage !== "undefined") {
      const stored = JSON.parse(localStorage.getItem(DEMO_RUNTIME_PICKUPS_KEY) || "{}");
      if (stored[normalizedId]) {
        demoRuntimePickups.set(normalizedId, stored[normalizedId]);
        return stored[normalizedId];
      }
    }
  } catch {
    // Fall through to the fixed demonstration dataset.
  }
  return null;
}

function pickupWithStatus(status = null) {
  const pickup = { ...DEMO_DRIVER_PICKUP };
  if (status) pickup.status = status;
  if (["ACCEPTED", "EN_ROUTE", "ARRIVED", "COLLECTING", "COMPLETED"].includes(pickup.status)) {
    pickup.assignedAt = pickup.assignedAt || nowIso();
  }
  if (pickup.status === "COMPLETED") {
    pickup.paymentStatus = "PAID";
  }
  return pickup;
}

function getPickupByPath(pathname) {
  const id = pathname.split("/")[2];
  const runtimePickup = getDemoRuntimePickup(id);
  if (runtimePickup) return { ...runtimePickup };
  const historyPickup = DEMO_HISTORY_PICKUPS.find(
    (pickup) => String(pickup.id || pickup._id) === String(id),
  );
  if (historyPickup) return { ...historyPickup };
  if (!id || id === DEMO_DRIVER_PICKUP.id) return { ...DEMO_DRIVER_PICKUP };
  return { ...DEMO_DRIVER_PICKUP, id, _id: id };
}

function demoResponse(data, status = 200) {
  return { data, status, statusText: status === 204 ? "No Content" : "OK" };
}

function buildDemoPickupEstimate(body = {}) {
  const category = body.category || "non-recyclable";
  const level = body.level || "easy";
  const categoryKey = category === "recyclable"
    ? "recyclable"
    : category === "both" || category === "mixed"
      ? "mixed"
      : "nonRecyclable";
  const categoryBase = DEMO_PRICING_CONFIG.categoryBase[categoryKey];
  const levelMultiplier = DEMO_PRICING_CONFIG.levelMultiplier[level] || 1;

  const depotLocation = {
    latitude: DEMO_ORGANIZATIONS[0].location.latitude,
    longitude: DEMO_ORGANIZATIONS[0].location.longitude,
    address: DEMO_ORGANIZATIONS[0].location.address,
  };
  const latitude = Number(body.latitude || DEMO_USER.location.latitude);
  const longitude = Number(body.longitude || DEMO_USER.location.longitude);
  const latDistance = Math.abs(latitude - depotLocation.latitude) * 111;
  const lngDistance = Math.abs(longitude - depotLocation.longitude) * 102;
  const distanceKm = Math.max(2.4, Math.round(Math.hypot(latDistance, lngDistance) * 12) / 10);
  const distanceCharge = Math.round(distanceKm * DEMO_PRICING_CONFIG.distanceRatePerKm * 100) / 100;
  const total = Math.max(
    DEMO_PRICING_CONFIG.minimumCharge,
    Math.round((categoryBase * levelMultiplier + distanceCharge) * 100) / 100,
  );

  return {
    success: true,
    estimatedPrice: total,
    priceBreakdown: {
      categoryBase,
      levelMultiplier,
      distanceCharge,
      total,
    },
    currency: "BRL",
    distanceKm,
    durationMinutes: Math.max(12, Math.round((distanceKm / 24) * 60)),
    routeGeometry: [
      [depotLocation.longitude, depotLocation.latitude],
      [longitude, latitude],
    ],
    fallback: false,
    depotLocation,
    orgId: DEMO_ORGANIZATIONS[0]._id,
    orgName: DEMO_ORGANIZATIONS[0].name,
    areaName: body.area || "Bela Vista",
  };
}

export function getDemoApiMockResponse(config, explicitToken = null) {
  const token = getTokenFromConfig(config, explicitToken);
  const user = getDemoUserByToken(token);
  if (!hasDemoSession() && !isDemoToken(token) && !user) return null;

  const method = String(config?.method || "get").toLowerCase();
  const { pathname, searchParams } = normalizeUrl(config);
  const role = getDemoRole(token);
  const body = parseBody(config?.data);

  if (method === "get" && pathname === "/auth/me") {
    return demoResponse({ user: user || (role === "admin" ? DEMO_ADMIN_USER : role === "driver" ? DEMO_DRIVER_USER : DEMO_USER) });
  }

  if (method === "get" && pathname === "/ml-schedule/public") {
    return demoResponse({ data: DEMO_ADMIN_SCHEDULES[0] });
  }

  if (method === "get" && pathname === "/ml-schedule/driver-assignments") {
    return demoResponse({ data: DEMO_DRIVER_ASSIGNMENTS });
  }

  if (method === "post" && pathname.includes("/complete-area")) {
    return demoResponse({ success: true, message: "Área marcada como concluída." });
  }

  if (method === "get" && pathname === "/ml-schedule/analytics") {
    return demoResponse({ data: DEMO_ADMIN_ML_ANALYTICS });
  }

  if (method === "get" && pathname === "/ml-schedule/completions") {
    return demoResponse({ data: DEMO_DRIVER_ASSIGNMENTS.today.assignments.map((assignment, index) => ({
      _id: `demo-completion-${index + 1}`,
      area: assignment.area,
      driverName: DEMO_DRIVER_USER.name,
      actualWasteKg: assignment.predictedWasteKg,
      completedAt: dateKey(-index),
    })) });
  }

  if (method === "get" && pathname === "/ml-schedule/health") {
    return demoResponse({ data: { status: "ok", mode: "demonstration" } });
  }

  if (method === "get" && pathname.startsWith("/ml-schedule/")) {
    const schedule = DEMO_ADMIN_SCHEDULES.find((item) => item._id === pathname.split("/")[2]) || DEMO_ADMIN_SCHEDULES[0];
    return demoResponse({ data: schedule });
  }

  if (method === "get" && pathname === "/ml-schedule") {
    return demoResponse({ data: DEMO_ADMIN_SCHEDULES, pagination: withPagination(DEMO_ADMIN_SCHEDULES, searchParams) });
  }

  if (method === "get" && pathname === "/pricing-config") {
    return demoResponse({ data: DEMO_PRICING_CONFIG });
  }

  if (method === "put" && pathname === "/pricing-config") {
    return demoResponse({ data: { ...DEMO_PRICING_CONFIG, ...body, updatedAt: nowIso() } });
  }

  if (method === "get" && pathname === "/pickups/pending") {
    return demoResponse({ pickups: [{ ...DEMO_DRIVER_PICKUP }] });
  }

  if (method === "post" && pathname === "/pickups/estimate") {
    return demoResponse(buildDemoPickupEstimate(body));
  }

  if (method === "post" && pathname === "/pickups") {
    const estimate = buildDemoPickupEstimate(body);
    const pickupId = "demo-pickup-ECO2026";
    const pickup = {
      id: pickupId,
      _id: pickupId,
      customer: DEMO_USER,
      category: body.category || "non-recyclable",
      level: body.level || "easy",
      wasteUploadId: body.wasteUploadId || null,
      location: {
        latitude: Number(body.latitude),
        longitude: Number(body.longitude),
        address: body.address || "Endereço selecionado no mapa",
      },
      area: body.area || estimate.areaName,
      organization: estimate.orgName,
      status: "PAYMENT_REQUIRED",
      paymentMethod: null,
      paymentStatus: "UNPAID",
      estimatedPrice: estimate.estimatedPrice,
      price: estimate.estimatedPrice,
      currency: estimate.currency,
      priceBreakdown: estimate.priceBreakdown,
      routeDistanceKm: estimate.distanceKm,
      routeDurationMinutes: estimate.durationMinutes,
      routeGeometry: estimate.routeGeometry,
      depotLocation: estimate.depotLocation,
      createdAt: nowIso(),
    };
    saveDemoRuntimePickup(pickup);
    return demoResponse({
      message: "Solicitação demonstrativa criada com sucesso.",
      pickup,
    }, 201);
  }

  if (method === "get" && pathname === "/pickups/my-pickups") {
    const pickups = [{ ...DEMO_DRIVER_PICKUP }, ...DEMO_HISTORY_PICKUPS];
    return demoResponse({
      pickups,
      activePickup: { ...DEMO_DRIVER_PICKUP },
      stats: {
        total: pickups.length,
        totalSpent: 148,
        statusCounts: { PENDING: 1, COMPLETED: 1, CANCELLED: 1, PAYMENT_REQUIRED: 1 },
        categoryCounts: { recyclable: 3, mixed: 1 },
        levelCounts: { easy: 1, medium: 2, hard: 1 },
        monthly: [
          {
            month: dateKey(0).slice(0, 7),
            created: pickups.length,
            completed: 1,
            cancelled: 1,
          },
        ],
      },
    });
  }

  if (method === "get" && pathname === "/pickups/active") {
    return demoResponse({ pickup: role === "driver" ? pickupWithStatus("EN_ROUTE") : null });
  }

  if (method === "get" && pathname === "/pickups/analytics") {
    return demoResponse({ success: true, data: DEMO_PICKUP_ANALYTICS });
  }

  if (method === "post" && pathname === "/pickups/route") {
    return demoResponse({
      distanceKm: 4.8,
      durationMinutes: 18,
      polyline: [],
      summary: "Rota demo calculada localmente.",
    });
  }

  if (method === "get" && /^\/pickups\/[^/]+\/events$/.test(pathname)) {
    return demoResponse({
      success: true,
      data: [
        {
          _id: "event-1",
          event: "CREATED",
          toStatus: "PENDING",
          performedBy: { name: DEMO_USER.name, role: "customer" },
          timestamp: dateKey(-2),
        },
        {
          _id: "event-2",
          event: "ACCEPTED",
          fromStatus: "PENDING",
          toStatus: "ASSIGNED",
          performedBy: { name: DEMO_DRIVER_USER.name, role: "driver" },
          timestamp: dateKey(-2),
          metadata: { responseTimeMs: 18 * 60 * 1000 },
        },
        {
          _id: "event-3",
          event: "COMPLETED",
          fromStatus: "COLLECTING",
          toStatus: "COMPLETED",
          performedBy: { name: DEMO_DRIVER_USER.name, role: "driver" },
          timestamp: dateKey(-1),
          metadata: { taskDurationMs: 108 * 60 * 1000 },
        },
      ],
    });
  }

  if (method === "get" && /^\/pickups\/[^/]+$/.test(pathname)) {
    return demoResponse({ pickup: getPickupByPath(pathname) });
  }

  if (method === "post" && /^\/pickups\/[^/]+\/accept$/.test(pathname)) {
    return demoResponse({ success: true, pickup: pickupWithStatus("ACCEPTED") });
  }

  if (method === "post" && /^\/pickups\/[^/]+\/status$/.test(pathname)) {
    return demoResponse({ success: true, pickup: pickupWithStatus(body.status || "EN_ROUTE") });
  }

  if (method === "post" && /^\/pickups\/[^/]+\/cancel$/.test(pathname)) {
    return demoResponse({ success: true, pickup: pickupWithStatus("CANCELLED") });
  }

  if (method === "post" && pathname === "/payments/initiate") {
    const pickup =
      getDemoRuntimePickup(body.pickupId) ||
      DEMO_HISTORY_PICKUPS.find(
        (item) => String(item.id || item._id) === String(body.pickupId),
      ) || DEMO_DRIVER_PICKUP;
    const paymentCompleted = body.method === "pix";
    return demoResponse({
      success: true,
      method: body.method,
      payment: {
        id: `demo-payment-${body.pickupId}`,
        pickupId: body.pickupId,
        amount: pickup.estimatedPrice || pickup.price,
        currency: pickup.currency || "BRL",
        method: body.method,
        status: paymentCompleted ? "COMPLETED" : "PENDING",
        paidAt: paymentCompleted ? nowIso() : null,
      },
      pickup: {
        id: body.pickupId,
        status: "PENDING",
        paymentMethod: body.method,
        paymentStatus: paymentCompleted ? "PAID" : "PENDING",
      },
    });
  }

  if (method === "post" && /^\/payments\/[^/]+\/cash-collected$/.test(pathname)) {
    return demoResponse({
      success: true,
      payment: { status: "PAID", method: "cash", amount: DEMO_DRIVER_PICKUP.price },
      pickup: { ...pickupWithStatus("COMPLETED"), paymentStatus: "PAID" },
    });
  }

  if (method === "get" && pathname.startsWith("/payments/pickup/")) {
    return demoResponse({ payment: { status: "PENDING", method: "cash", amount: DEMO_DRIVER_PICKUP.price } });
  }

  if (method === "get" && pathname === "/payments/all") {
    const paymentMethod = searchParams.get("method");
    const paymentStatus = searchParams.get("status");
    const payments = DEMO_PICKUP_PAYMENTS.filter((payment) => {
      if (paymentMethod && payment.method !== paymentMethod) return false;
      if (paymentStatus && payment.status !== paymentStatus) return false;
      return true;
    });
    const totals = ["pix", "cash"].map((paymentMethodKey) => {
      const completed = payments.filter(
        (payment) => payment.method === paymentMethodKey && payment.status === "COMPLETED"
      );
      return {
        _id: paymentMethodKey,
        total: completed.reduce((sum, payment) => sum + payment.amount, 0),
        count: completed.length,
      };
    });
    return demoResponse({ payments, totals });
  }

  if (method === "get" && pathname === "/driver/me") {
    return demoResponse({
      driver: {
        ...DEMO_DRIVER_USER,
        status: "Available",
        organization: "Cooperativa Centro Verde",
        truck: { licensePlate: "ECV-2026", capacity: 1800 },
      },
    });
  }

  if (method === "get" && pathname === "/super-admin/organizations") {
    return demoResponse({ organizations: DEMO_ORGANIZATIONS, pagination: withPagination(DEMO_ORGANIZATIONS, searchParams) });
  }

  if (method === "get" && /^\/super-admin\/organizations\/[^/]+$/.test(pathname)) {
    const id = pathname.split("/").pop();
    return demoResponse({ data: DEMO_ORGANIZATIONS.find((org) => org._id === id) || DEMO_ORGANIZATIONS[0] });
  }

  if (method === "get" && pathname === "/org-admin/organization") {
    return demoResponse({ data: DEMO_ORGANIZATIONS[0] });
  }

  if (method === "get" && pathname === "/areas") {
    return demoResponse({ data: DEMO_AREAS, pagination: withPagination(DEMO_AREAS, searchParams) });
  }

  if (method === "get" && ["/super-admin/vehicles", "/org-admin/trucks"].includes(pathname)) {
    return demoResponse({ data: DEMO_VEHICLES, pagination: withPagination(DEMO_VEHICLES, searchParams) });
  }

  if (method === "get" && ["/super-admin/drivers", "/org-admin/drivers"].includes(pathname)) {
    return demoResponse({ data: DEMO_DRIVERS, pagination: withPagination(DEMO_DRIVERS, searchParams) });
  }

  if (method === "get" && pathname === "/org-admin/admins") {
    const orgGroups = DEMO_ORGANIZATIONS.map((organization) => ({
      orgId: organization._id,
      orgName: organization.name,
      organization,
      admins: DEMO_ADMINS.filter((admin) => admin.organization?._id === organization._id),
    })).filter((group) => group.admins.length > 0);
    return demoResponse({
      data: DEMO_ADMINS,
      orgName: "Cooperativa Centro Verde",
      orgGroups,
      pagination: withPagination(DEMO_ADMINS, searchParams),
    });
  }

  if (method === "get" && ["/super-admin/users", "/org-admin/users"].includes(pathname)) {
    return demoResponse({
      users: DEMO_USERS,
      stats: {
        total: DEMO_USERS.length,
        active: DEMO_USERS.filter((item) => item.isActive).length,
        inactive: DEMO_USERS.filter((item) => !item.isActive).length,
        byRole: DEMO_USERS.reduce((acc, item) => {
          acc[item.role] = (acc[item.role] || 0) + 1;
          return acc;
        }, {}),
      },
      pagination: withPagination(DEMO_USERS, searchParams),
    });
  }

  if (method === "put" && (/^\/super-admin\/users\/[^/]+$/.test(pathname) || /^\/org-admin\/users\/[^/]+$/.test(pathname))) {
    const id = pathname.split("/").pop();
    const target = DEMO_USERS.find((item) => item.id === id) || DEMO_USERS[0];
    return demoResponse({ success: true, user: { ...target, ...body } });
  }

  if (method === "get" && pathname === "/notifications/unread-count") {
    return demoResponse({ count: DEMO_NOTIFICATIONS.filter((item) => !item.isRead).length });
  }

  if (method === "get" && pathname === "/notifications") {
    return demoResponse({
      success: true,
      data: DEMO_NOTIFICATIONS,
      notifications: DEMO_NOTIFICATIONS,
      unreadCount: DEMO_NOTIFICATIONS.filter((item) => !item.isRead).length,
      pagination: withPagination(DEMO_NOTIFICATIONS, searchParams),
    });
  }

  if ((method === "put" || method === "post") && pathname === "/notifications/read-all") {
    return demoResponse({ success: true });
  }

  if (method === "put" && /^\/notifications\/[^/]+\/read$/.test(pathname)) {
    return demoResponse({ success: true });
  }

  if (method === "get" && pathname === "/contact/unread-count") {
    return demoResponse({ count: DEMO_CONTACT_MESSAGES.filter((item) => item.status === "unread").length });
  }

  if (method === "get" && pathname === "/contact/messages") {
    return demoResponse({ data: DEMO_CONTACT_MESSAGES, pagination: withPagination(DEMO_CONTACT_MESSAGES, searchParams) });
  }

  if (method === "put" && /^\/contact\/[^/]+\/read$/.test(pathname)) {
    return demoResponse({ success: true });
  }

  if (method === "delete" && /^\/contact\/[^/]+$/.test(pathname)) {
    return demoResponse({}, 204);
  }

  if (method === "post" && ["/contact/admin-submit", "/contact/submit"].includes(pathname)) {
    return demoResponse({ success: true, message: "Mensagem enviada com sucesso." });
  }

  if (method === "get" && ["/internal-messages/org_admin/unread-count", "/internal-messages/driver/unread-count"].includes(pathname)) {
    return demoResponse({ count: 0 });
  }

  if (method === "get" && ["/internal-messages/org_admin", "/internal-messages/driver"].includes(pathname)) {
    return demoResponse({
      data: [],
      pagination: withPagination([], searchParams),
    });
  }

  if (method === "get" && ["/super-admin/deletion-requests/pending-count", "/org-admin/deletion-requests/pending-count"].includes(pathname)) {
    return demoResponse({ count: 0 });
  }

  if (method === "get" && pathname === "/history/pickups") {
    return demoResponse({
      success: true,
      data: {
        pickups: DEMO_HISTORY_PICKUPS,
        stats: {
          total: 184,
          completed: 142,
          active: 29,
          cancelled: 4,
          expired: 9,
          completionRate: 77,
          avgResponseMs: 22 * 60 * 1000,
          avgTaskDurationMs: 138 * 60 * 1000,
        },
        pagination: withPagination(DEMO_HISTORY_PICKUPS, searchParams),
      },
    });
  }

  if (method === "get" && pathname === "/history/customers") {
    return demoResponse({
      success: true,
      data: {
        customers: DEMO_HISTORY_CUSTOMERS,
        totalCustomers: DEMO_HISTORY_CUSTOMERS.length,
        totalPickups: DEMO_HISTORY_CUSTOMERS.reduce((sum, customer) => sum + customer.totalPickups, 0),
      },
    });
  }

  if (method === "get" && pathname === "/history/drivers") {
    return demoResponse({
      success: true,
      data: {
        drivers: DEMO_HISTORY_DRIVERS,
        totalDrivers: DEMO_HISTORY_DRIVERS.length,
        totalPickups: DEMO_HISTORY_DRIVERS.reduce((sum, driver) => sum + driver.totalPickups, 0),
      },
    });
  }

  if (["post", "put", "delete"].includes(method) && (
    pathname.startsWith("/areas") ||
    pathname.startsWith("/super-admin/organizations") ||
    pathname.startsWith("/super-admin/vehicles") ||
    pathname.startsWith("/org-admin/trucks") ||
    pathname.startsWith("/super-admin/drivers") ||
    pathname.startsWith("/org-admin/drivers") ||
    pathname.startsWith("/org-admin/admins") ||
    pathname.startsWith("/super-admin/admins") ||
    pathname.startsWith("/org-admin/deletion-requests")
  )) {
    return demoResponse({ success: true, data: body });
  }

  return null;
}
