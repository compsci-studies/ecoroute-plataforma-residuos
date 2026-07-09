const dateKey = (offsetDays = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

const monthKey = (offsetMonths = 0) => {
  const date = new Date();
  date.setMonth(date.getMonth() + offsetMonths);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

export const DEMO_ADMIN_ANALYTICS = Object.freeze({
  ecosystemStats: {
    totalOrganizations: 6,
    totalPickups: 184,
    completedPickups: 142,
    activePickups: 29,
    totalRevenue: 38680,
    completionRate: 77,
    avgResponseMs: 22 * 60 * 1000,
    avgTaskDurationMs: 2 * 60 * 60 * 1000 + 18 * 60 * 1000,
  },
  paymentMethodRevenue: {
    cash: 16420,
    online: 22260,
    total: 38680,
  },
  statusDistribution: [
    { status: "COMPLETED", count: 142 },
    { status: "PENDING", count: 18 },
    { status: "ASSIGNED", count: 9 },
    { status: "EN_ROUTE", count: 7 },
    { status: "COLLECTING", count: 4 },
    { status: "CANCELLED", count: 4 },
  ],
  categoryDistribution: [
    { category: "recyclable", count: 112 },
    { category: "both", count: 48 },
    { category: "non-recyclable", count: 24 },
  ],
  levelDistribution: [
    { level: "easy", count: 96 },
    { level: "medium", count: 68 },
    { level: "hard", count: 20 },
  ],
  dailyTrend: [
    { date: dateKey(-7), created: 18, completed: 15, cancelled: 1 },
    { date: dateKey(-6), created: 21, completed: 17, cancelled: 0 },
    { date: dateKey(-5), created: 17, completed: 14, cancelled: 1 },
    { date: dateKey(-4), created: 26, completed: 21, cancelled: 1 },
    { date: dateKey(-3), created: 24, completed: 19, cancelled: 0 },
    { date: dateKey(-2), created: 29, completed: 22, cancelled: 1 },
    { date: dateKey(-1), created: 25, completed: 20, cancelled: 0 },
    { date: dateKey(0), created: 24, completed: 14, cancelled: 0 },
  ],
  monthlyRevenue: [
    { month: monthKey(-5), revenue: 14800 },
    { month: monthKey(-4), revenue: 17250 },
    { month: monthKey(-3), revenue: 21400 },
    { month: monthKey(-2), revenue: 26720 },
    { month: monthKey(-1), revenue: 31860 },
    { month: monthKey(0), revenue: 38680 },
  ],
  hourlyDistribution: [
    { hour: 7, count: 9 },
    { hour: 8, count: 16 },
    { hour: 9, count: 21 },
    { hour: 10, count: 19 },
    { hour: 11, count: 14 },
    { hour: 13, count: 18 },
    { hour: 14, count: 22 },
    { hour: 15, count: 17 },
    { hour: 16, count: 12 },
    { hour: 17, count: 8 },
  ],
  topDrivers: [
    {
      driverId: "demo-driver-001",
      name: "Prestador Demonstração",
      email: "prestador@ecoroute.com.br",
      completed: 34,
      revenue: 9480,
      avgResponseMs: 16 * 60 * 1000,
      avgTaskDurationMs: 112 * 60 * 1000,
    },
    {
      driverId: "demo-driver-002",
      name: "Mariana Lopes",
      email: "mariana.coletas@ecoroute.com.br",
      completed: 29,
      revenue: 8120,
      avgResponseMs: 19 * 60 * 1000,
      avgTaskDurationMs: 128 * 60 * 1000,
    },
    {
      driverId: "demo-driver-003",
      name: "Rafael Nogueira",
      email: "rafael.rotas@ecoroute.com.br",
      completed: 26,
      revenue: 7460,
      avgResponseMs: 23 * 60 * 1000,
      avgTaskDurationMs: 137 * 60 * 1000,
    },
  ],
  orgBreakdown: [
    { name: "Cooperativa Centro Verde", total: 52, completed: 43, revenue: 12840 },
    { name: "Recicla Pinheiros", total: 41, completed: 34, revenue: 9760 },
    { name: "EcoSul Materiais", total: 33, completed: 26, revenue: 7140 },
    { name: "Vila Limpa", total: 29, completed: 21, revenue: 5480 },
    { name: "Circular Norte", total: 18, completed: 12, revenue: 3460 },
  ],
  areaBreakdown: [
    { name: "Pinheiros", total: 36, completed: 29, revenue: 8360 },
    { name: "Bela Vista", total: 31, completed: 25, revenue: 7180 },
    { name: "Moema", total: 24, completed: 19, revenue: 5620 },
    { name: "Vila Mariana", total: 22, completed: 16, revenue: 4720 },
  ],
  scheduleAnalytics: {
    summary: {
      totalAssignments: 42,
      completedAssignments: 34,
      completionRate: 81,
      predictedWasteKg: 4120,
    },
    dailyTrend: [
      { date: dateKey(-6), assigned: 5, completed: 4 },
      { date: dateKey(-5), assigned: 6, completed: 5 },
      { date: dateKey(-4), assigned: 7, completed: 6 },
      { date: dateKey(-3), assigned: 6, completed: 5 },
      { date: dateKey(-2), assigned: 8, completed: 7 },
      { date: dateKey(-1), assigned: 6, completed: 5 },
      { date: dateKey(0), assigned: 4, completed: 2 },
    ],
    areaBreakdown: [
      { name: "Pinheiros", assigned: 10, completed: 9 },
      { name: "Bela Vista", assigned: 9, completed: 7 },
      { name: "Moema", assigned: 8, completed: 6 },
      { name: "Vila Mariana", assigned: 7, completed: 6 },
      { name: "Santana", assigned: 5, completed: 4 },
    ],
    topDrivers: [
      { driverId: "demo-driver-001", name: "Prestador Demonstração", assigned: 12, completed: 10 },
      { driverId: "demo-driver-002", name: "Mariana Lopes", assigned: 10, completed: 8 },
      { driverId: "demo-driver-003", name: "Rafael Nogueira", assigned: 9, completed: 7 },
    ],
  },
});

export const DEMO_ADMIN_SCHEDULES = Object.freeze([
  {
    _id: "demo-schedule-today",
    date: dateKey(0),
    status: "confirmed",
    totalPredictedWasteKg: 4120,
    areas: [
      { area: "Pinheiros", action: "dispatch", predictedWasteKg: 980, wasteLevel: "critical" },
      { area: "Bela Vista", action: "dispatch", predictedWasteKg: 820, wasteLevel: "high" },
      { area: "Moema", action: "dispatch", predictedWasteKg: 730, wasteLevel: "high" },
      { area: "Vila Mariana", action: "reduced", predictedWasteKg: 610, wasteLevel: "medium" },
      { area: "Santana", action: "dispatch", predictedWasteKg: 540, wasteLevel: "medium" },
      { area: "Tatuapé", action: "skip", predictedWasteKg: 440, wasteLevel: "low" },
    ],
  },
  {
    _id: "demo-schedule-yesterday",
    date: dateKey(-1),
    status: "completed",
    totalPredictedWasteKg: 3860,
    areas: [
      { area: "Centro", action: "dispatch", predictedWasteKg: 910, wasteLevel: "high" },
      { area: "Perdizes", action: "dispatch", predictedWasteKg: 760, wasteLevel: "high" },
      { area: "Saúde", action: "dispatch", predictedWasteKg: 620, wasteLevel: "medium" },
      { area: "Lapa", action: "reduced", predictedWasteKg: 520, wasteLevel: "medium" },
    ],
  },
]);

export const DEMO_ADMIN_BILLING_SUMMARY = Object.freeze({
  totalRevenue: 24700,
  totalOutstanding: 5800,
  totalBills: 46,
  paid: 35,
  unpaid: 8,
  overdue: 3,
  cashPending: 2,
  paymentMethodRevenue: {
    cash: 9100,
    online: 15600,
    total: 24700,
  },
  monthlyRevenue: [
    { month: monthKey(-5), revenue: 6800 },
    { month: monthKey(-4), revenue: 8100 },
    { month: monthKey(-3), revenue: 9600 },
    { month: monthKey(-2), revenue: 11900 },
    { month: monthKey(-1), revenue: 15100 },
    { month: monthKey(0), revenue: 24700 },
  ],
  roleRevenue: [
    { role: "customer_admin", revenue: 17600, paidBills: 28 },
    { role: "admin", revenue: 7100, paidBills: 7 },
  ],
});

export const DEMO_ADMIN_BILLING_OVERVIEW = Object.freeze({
  bills: [
    {
      _id: "demo-bill-001",
      billedUserName: "Condomínio Paulista",
      billedUserEmail: "financeiro@condominiopaulista.com.br",
      billedRole: "customer_admin",
      amount: 690,
      status: "paid",
      paymentMethod: "esewa",
      paidAt: dateKey(-2),
      dueDate: dateKey(5),
    },
    {
      _id: "demo-bill-002",
      billedUserName: "Recicla Pinheiros",
      billedUserEmail: "admin@reciclapinheiros.com.br",
      billedRole: "admin",
      amount: 1500,
      status: "unpaid",
      paymentMethod: null,
      paidAt: null,
      dueDate: dateKey(7),
    },
    {
      _id: "demo-bill-003",
      billedUserName: "Empresa Paulista",
      billedUserEmail: "operacoes@empresapaulista.com.br",
      billedRole: "customer_admin",
      amount: 920,
      status: "overdue",
      paymentMethod: null,
      paidAt: null,
      dueDate: dateKey(-3),
    },
  ],
  accounts: [
    {
      _id: "demo-account-001",
      name: "Condomínio Paulista",
      email: "financeiro@condominiopaulista.com.br",
      role: "customer_admin",
      totalPaid: 4200,
      totalOutstanding: 0,
      billCount: 6,
    },
    {
      _id: "demo-account-002",
      name: "Recicla Pinheiros",
      email: "admin@reciclapinheiros.com.br",
      role: "admin",
      totalPaid: 7100,
      totalOutstanding: 1500,
      billCount: 7,
    },
    {
      _id: "demo-account-003",
      name: "Empresa Paulista",
      email: "operacoes@empresapaulista.com.br",
      role: "customer_admin",
      totalPaid: 3680,
      totalOutstanding: 920,
      billCount: 5,
    },
  ],
  summary: DEMO_ADMIN_BILLING_SUMMARY,
  defaulters: [
    {
      _id: "demo-account-003",
      name: "Empresa Paulista",
      email: "operacoes@empresapaulista.com.br",
      overdueAmount: 920,
      overdueBills: 1,
    },
  ],
  pagination: {
    page: 1,
    limit: 10,
    total: 3,
    pages: 1,
  },
});

export const DEMO_ADMIN_BILLING_CONFIGS = Object.freeze([
  {
    _id: "demo-config-global",
    orgId: null,
    customerMonthlyFee: 690,
    adminMonthlyFee: 1500,
    active: true,
  },
]);

export const DEMO_ADMIN_ML_ANALYTICS = Object.freeze({
  totalSchedules: 18,
  modelInfo: { model: "EcoRoute Forecast v1", r2Score: 0.86 },
  weeklyComparison: {
    thisWeekWaste: 4120,
    lastWeekWaste: 3860,
    changePercent: 6.7,
  },
  wasteTrend: [
    { date: dateKey(-6), totalWasteKg: 3320, dispatched: 4 },
    { date: dateKey(-5), totalWasteKg: 3480, dispatched: 5 },
    { date: dateKey(-4), totalWasteKg: 3710, dispatched: 5 },
    { date: dateKey(-3), totalWasteKg: 3590, dispatched: 4 },
    { date: dateKey(-2), totalWasteKg: 3980, dispatched: 6 },
    { date: dateKey(-1), totalWasteKg: 3860, dispatched: 5 },
    { date: dateKey(0), totalWasteKg: 4120, dispatched: 4 },
  ],
  areaBreakdown: [
    { area: "Pinheiros", avgWasteKg: 980 },
    { area: "Bela Vista", avgWasteKg: 820 },
    { area: "Moema", avgWasteKg: 730 },
    { area: "Vila Mariana", avgWasteKg: 610 },
  ],
  categoryDistribution: [
    { category: "critical", count: 1 },
    { category: "high", count: 2 },
    { category: "medium", count: 2 },
    { category: "low", count: 1 },
  ],
  scheduleStats: [
    { status: "confirmed", count: 7 },
    { status: "completed", count: 10 },
    { status: "draft", count: 1 },
  ],
  actionDistribution: [
    { action: "dispatch", count: 24 },
    { action: "reduced", count: 7 },
    { action: "skip", count: 4 },
  ],
  incompleteAreas: [
    { area: "Tatuapé", reason: "Skipped by ML model", predictedWasteKg: 440 },
  ],
  reasonBreakdown: [
    { reason: "Skipped by ML model", count: 3 },
    { reason: "Insufficient truck capacity for this area", count: 1 },
  ],
  driverlessTruckStats: [
    { date: dateKey(-6), driverlessTrucks: 1 },
    { date: dateKey(-5), driverlessTrucks: 0 },
    { date: dateKey(-4), driverlessTrucks: 1 },
    { date: dateKey(-3), driverlessTrucks: 0 },
    { date: dateKey(-2), driverlessTrucks: 0 },
    { date: dateKey(-1), driverlessTrucks: 1 },
    { date: dateKey(0), driverlessTrucks: 0 },
  ],
});
