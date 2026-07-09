import React, { useEffect, useMemo, useState } from "react";
import useVehicleStore from "../stores/useVehicleStore";
import useDriverStore from "../stores/useDriverStore";
import useAuthStore from "../stores/useAuthStore";
import { Truck, CheckCircle, Wrench, UserX } from "lucide-react";
import StatsCard from "../components/dashboard/StatsCard";
import PaginationControls from "../components/shared/PaginationControls";
import { AdminEmptyState, AdminErrorState, TableSkeleton } from "../components/shared/AdminListStates";
import api from "../utils/api";

const getDutyType = (capacity) => {
  const kg = Number(capacity);
  if (!kg || isNaN(kg)) return null;
  if (kg < 1000) return { label: "Leve", cls: "bg-blue-100 text-blue-700", desc: "< 1.000 kg" };
  if (kg <= 5000) return { label: "Médio", cls: "bg-amber-100 text-amber-700", desc: "1.000 - 5.000 kg" };
  return { label: "Pesado", cls: "bg-red-100 text-red-700", desc: "> 5.000 kg" };
};

const Vehicles = () => {
  const { vehicles, pagination, isLoading, error, fetchVehicles, addVehicle, updateVehicle, deleteVehicle, unassignDriverFromTruck, assignDriverToTruck, requestDeletion } = useVehicleStore();
  const { drivers, fetchDrivers } = useDriverStore();
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === "super_admin";

  const [showAddModal, setShowAddModal] = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);
  const [assignVehicle, setAssignVehicle] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [form, setForm] = useState({ capacity: "", licensePlate: "", orgId: "" });
  const [editForm, setEditForm] = useState({});
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetchVehicles({ page: 1, limit: 10, signal: controller.signal });
    fetchDrivers({ page: 1, limit: 10, signal: controller.signal });
    return () => controller.abort();
  }, [fetchVehicles, fetchDrivers]);

  useEffect(() => {
    if (isSuperAdmin) {
      const controller = new AbortController();
      api.get("/super-admin/organizations", { signal: controller.signal })
        .then(({ data }) => setOrgs(data.organizations || [])).catch(() => {});
      return () => controller.abort();
    }
  }, [isSuperAdmin]);

  const handleAdd = async (e) => {
    e.preventDefault(); setFormError("");
    if (!form.capacity || !form.licensePlate || (isSuperAdmin && !form.orgId)) { setFormError("Todos os campos obrigatórios devem ser preenchidos"); return; }
    setSubmitting(true);
    const result = await addVehicle({ ...form, capacity: Number(form.capacity) });
    setSubmitting(false);
    if (result.success) { setShowAddModal(false); setForm({ capacity: "", licensePlate: "", orgId: "" }); }
    else setFormError(result.error);
  };

  const handleEdit = async (e) => {
    e.preventDefault(); setFormError(""); setSubmitting(true);
    const result = await updateVehicle(editVehicle.id, { ...editForm, capacity: Number(editForm.capacity) }, { optimistic: true });
    setSubmitting(false);
    if (result.success) setEditVehicle(null); else setFormError(result.error);
  };

  const handleAssign = async () => {
    if (!selectedDriverId) { setFormError("Selecione um coletor"); return; }
    setSubmitting(true);
    const result = await assignDriverToTruck(selectedDriverId, assignVehicle.id);
    setSubmitting(false);
    if (result.success) { setAssignVehicle(null); setSelectedDriverId(""); fetchDrivers(); } else setFormError(result.error);
  };

  const handleUnassign = async (truckId) => {
    if (!confirm("Remover coletor deste veículo?")) return;
    await unassignDriverFromTruck(truckId);
    fetchDrivers();
  };

  const handleDelete = async () => {
    setFormError(""); setSubmitting(true);
    if (isSuperAdmin) {
      const result = await deleteVehicle(deleteTarget.id);
      setSubmitting(false);
      if (result.success) setDeleteTarget(null); else setFormError(result.error);
    } else {
      if (!deleteReason.trim()) { setFormError("Informe uma justificativa"); setSubmitting(false); return; }
      const result = await requestDeletion("vehicle", deleteTarget.id, deleteReason);
      setSubmitting(false);
      if (result.success) { setDeleteTarget(null); setDeleteReason(""); alert("Solicitação de exclusão enviada para aprovação."); }
      else setFormError(result.error);
    }
  };

  const openEdit = (v) => { setEditVehicle(v); setEditForm({ capacity: v.capacity, licensePlate: v.licensePlate, orgId: v.orgId || "", isAvailable: v.isAvailable }); setFormError(""); };
  const totalCount = pagination?.total ?? vehicles.length;
  const vehicleStats = useMemo(
    () => ({
      available: vehicles.filter((v) => v.isAvailable).length,
      inUse: vehicles.filter((v) => !v.isAvailable).length,
      noDriver: vehicles.filter((v) => !v.assignedDriver).length,
    }),
    [vehicles]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Gestão de veículos</h1>
          <p className="text-sm text-primary/50 mt-1">{isSuperAdmin ? "Gerencie veículos de todas as cooperativas" : "Gerencie a frota da sua organização"}</p>
        </div>
        <button onClick={() => { setShowAddModal(true); setFormError(""); }} className="px-5 py-2.5 bg-primary text-white font-semibold text-sm rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 self-start sm:self-auto">
          <span className="text-lg leading-none">+</span> Novo veículo
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard title="Veículos totais" value={totalCount} label="Tamanho da frota" icon={<Truck className="w-5 h-5 text-primary" />} iconBg="bg-primary/8" />
        <StatsCard title="Disponíveis" value={vehicleStats.available} label="Prontos para despacho" icon={<CheckCircle className="w-5 h-5 text-emerald-600" />} iconBg="bg-emerald-100" valueColor="text-emerald-600" />
        <StatsCard title="Em uso" value={vehicleStats.inUse} label="Ativos em rota" icon={<Wrench className="w-5 h-5 text-amber-600" />} iconBg="bg-amber-100" valueColor="text-amber-600" />
        <StatsCard title="Sem coletor" value={vehicleStats.noDriver} label="Exigem vinculação" icon={<UserX className="w-5 h-5 text-red-500" />} iconBg="bg-red-100" valueColor="text-red-500" />
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton columns={isSuperAdmin ? 6 : 5} rows={7} />
      ) : error ? (
        <AdminErrorState message={error} onRetry={() => fetchVehicles({ page: pagination?.page || 1, limit: 10 })} />
      ) : (
        <div className="bg-white rounded-2xl border border-primary/10 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-primary/8 bg-primary/3">
                  <th className="px-5 py-3.5 text-xs font-semibold text-primary/50 uppercase tracking-wider">Placa</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-primary/50 uppercase tracking-wider">Capacidade</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-primary/50 uppercase tracking-wider">Status</th>
                  {isSuperAdmin && <th className="px-5 py-3.5 text-xs font-semibold text-primary/50 uppercase tracking-wider">Organização</th>}
                  <th className="px-5 py-3.5 text-xs font-semibold text-primary/50 uppercase tracking-wider">Coletor vinculado</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-primary/50 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={isSuperAdmin ? 6 : 5} className="p-0">
                      <AdminEmptyState icon={Truck} title="Nenhum veículo encontrado" message="Os veículos da frota aparecem aqui depois do cadastro." />
                    </td>
                  </tr>
                ) : vehicles.map(v => {
                  const duty = getDutyType(v.capacity);
                  return (
                    <tr key={v.id} className="border-b border-primary/5 hover:bg-primary/2 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-primary">{v.licensePlate}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm text-primary/70">{v.capacity} kg</span>
                          {duty && <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold w-fit ${duty.cls}`}>{duty.label}</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${v.isAvailable ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${v.isAvailable ? "bg-emerald-500" : "bg-amber-500"}`} />
                          {v.isAvailable ? "Disponível" : "Em uso"}
                        </span>
                      </td>
                      {isSuperAdmin && <td className="px-5 py-3.5 text-sm text-primary/60">{v.organization}</td>}
                      <td className="px-5 py-3.5">
                        {v.assignedDriver ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center text-xs font-bold text-primary shrink-0">{v.assignedDriver.name?.charAt(0)?.toUpperCase()}</div>
                            <span className="text-sm text-primary">{v.assignedDriver.name}</span>
                            <button onClick={() => handleUnassign(v.id)} className="ml-1 text-red-400 hover:text-red-600 text-xs" title="Remover coletor">&times;</button>
                          </div>
                        ) : <span className="text-red-500 text-xs font-medium">Sem coletor</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button onClick={() => openEdit(v)} className="px-2.5 py-1.5 text-xs font-semibold text-primary bg-primary/5 rounded-lg hover:bg-primary/10 transition">Editar</button>
                          <button onClick={() => { setAssignVehicle(v); setSelectedDriverId(""); setFormError(""); }} className="px-2.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition">Vincular</button>
                          <button onClick={() => { setDeleteTarget(v); setDeleteReason(""); setFormError(""); }} className="px-2.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition">
                            {isSuperAdmin ? "Excluir" : "Solicitar exclusão"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <PaginationControls
            pagination={pagination}
            onPageChange={(nextPage) => fetchVehicles({ page: nextPage, limit: 10 })}
            itemLabel="veículos"
          />
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-7 relative mx-4">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary/60 hover:bg-primary/10 transition">
              <span className="text-lg leading-none">&times;</span>
            </button>
            <h2 className="text-lg font-bold text-primary mb-5">Adicionar veículo</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary/60 mb-1">Capacidade (kg)</label>
                <input type="number" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} placeholder="ex. 1800" className="w-full px-4 py-2.5 rounded-xl border border-primary/12 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                {form.capacity && getDutyType(form.capacity) && (
                  <div className={`mt-2 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 ${getDutyType(form.capacity).cls}`}>
                    <span>{getDutyType(form.capacity).label}</span>
                    <span className="opacity-60">({getDutyType(form.capacity).desc})</span>
                  </div>
                )}
              </div>
              <div><label className="block text-sm font-medium text-primary/60 mb-1">Placa</label><input type="text" value={form.licensePlate} onChange={e => setForm({...form, licensePlate: e.target.value})} placeholder="ex. ECO4R26" className="w-full px-4 py-2.5 rounded-xl border border-primary/12 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" /></div>
              {isSuperAdmin && <div><label className="block text-sm font-medium text-primary/60 mb-1">Organização</label><select value={form.orgId} onChange={e => setForm({...form, orgId: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-primary/12 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white text-sm"><option value="">Selecionar organização...</option>{orgs.map(o => <option key={o._id} value={o._id}>{o.name}</option>)}</select></div>}
              {formError && <p className="text-red-500 text-sm">{formError}</p>}
              <button type="submit" disabled={submitting} className="w-full py-2.5 bg-primary text-white font-semibold text-sm rounded-xl hover:bg-primary/90 transition disabled:opacity-50">{submitting ? "Adicionando..." : "Adicionar veículo"}</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editVehicle && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-7 relative mx-4">
            <button onClick={() => setEditVehicle(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary/60 hover:bg-primary/10 transition">
              <span className="text-lg leading-none">&times;</span>
            </button>
            <h2 className="text-lg font-bold text-primary mb-5">Editar veículo</h2>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary/60 mb-1">Capacidade (kg)</label>
                <input type="number" value={editForm.capacity} onChange={e => setEditForm({...editForm, capacity: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-primary/12 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                {editForm.capacity && getDutyType(editForm.capacity) && (
                  <div className={`mt-2 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 ${getDutyType(editForm.capacity).cls}`}>
                    <span>{getDutyType(editForm.capacity).label}</span>
                    <span className="opacity-60">({getDutyType(editForm.capacity).desc})</span>
                  </div>
                )}
              </div>
              <div><label className="block text-sm font-medium text-primary/60 mb-1">Placa</label><input type="text" value={editForm.licensePlate} onChange={e => setEditForm({...editForm, licensePlate: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-primary/12 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" /></div>
              {isSuperAdmin && <div><label className="block text-sm font-medium text-primary/60 mb-1">Organização</label><select value={editForm.orgId} onChange={e => setEditForm({...editForm, orgId: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-primary/12 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white text-sm"><option value="">Selecionar organização...</option>{orgs.map(o => <option key={o._id} value={o._id}>{o.name}</option>)}</select></div>}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-primary/60">Disponível</label>
                <button type="button" onClick={() => setEditForm({...editForm, isAvailable: !editForm.isAvailable})} className={`w-12 h-6 rounded-full transition-colors ${editForm.isAvailable ? "bg-emerald-400" : "bg-gray-300"} relative`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${editForm.isAvailable ? "left-6" : "left-0.5"}`} />
                </button>
              </div>
              {formError && <p className="text-red-500 text-sm">{formError}</p>}
              <button type="submit" disabled={submitting} className="w-full py-2.5 bg-primary text-white font-semibold text-sm rounded-xl hover:bg-primary/90 transition disabled:opacity-50">{submitting ? "Salvando..." : "Salvar alterações"}</button>
            </form>
          </div>
        </div>
      )}

      {/* Assign Driver Modal */}
      {assignVehicle && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-7 relative mx-4">
            <button onClick={() => setAssignVehicle(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary/60 hover:bg-primary/10 transition">
              <span className="text-lg leading-none">&times;</span>
            </button>
            <h2 className="text-lg font-bold text-primary mb-2">Vincular coletor ao veículo</h2>
            <p className="text-sm text-primary/50 mb-5">Veículo: <strong>{assignVehicle.licensePlate}</strong></p>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-primary/60 mb-1">Selecionar coletor</label><select value={selectedDriverId} onChange={e => setSelectedDriverId(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-primary/12 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white text-sm"><option value="">Escolha um coletor...</option>{drivers.map(d => (<option key={d.id} value={d.id}>{d.name} - {d.organization} {d.truck !== "No Truck" ? `(${d.truck})` : ""}</option>))}</select></div>
              {formError && <p className="text-red-500 text-sm">{formError}</p>}
              <button onClick={handleAssign} disabled={submitting} className="w-full py-2.5 bg-blue-500 text-white font-semibold text-sm rounded-xl hover:bg-blue-600 transition disabled:opacity-50">{submitting ? "Vinculando..." : "Vincular coletor"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete / Request Deletion Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-7 relative mx-4">
            <button onClick={() => setDeleteTarget(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary/60 hover:bg-primary/10 transition">
              <span className="text-lg leading-none">&times;</span>
            </button>
            <h2 className="text-lg font-bold text-red-600 mb-2">{isSuperAdmin ? "Excluir veículo" : "Solicitar exclusão de veículo"}</h2>
            <p className="text-sm text-primary/50 mb-4">Veículo: <strong>{deleteTarget.licensePlate}</strong></p>
            {isSuperAdmin ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-red-50 border border-red-200"><p className="text-sm text-red-700">Isto exclui o veículo permanentemente e remove qualquer coletor vinculado.</p></div>
                {formError && <p className="text-red-500 text-sm">{formError}</p>}
                <button onClick={handleDelete} disabled={submitting} className="w-full py-2.5 bg-red-500 text-white font-semibold text-sm rounded-xl hover:bg-red-600 transition disabled:opacity-50">{submitting ? "Excluindo..." : "Confirmar exclusão"}</button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200"><p className="text-sm text-amber-700">Isto envia uma solicitação para aprovação do super administrador.</p></div>
                <div><label className="block text-sm font-medium text-primary/60 mb-1">Justificativa da exclusão *</label><textarea value={deleteReason} onChange={e => setDeleteReason(e.target.value)} rows={3} placeholder="Explique por que este veículo deve ser removido..." className="w-full px-4 py-2.5 rounded-xl border border-primary/12 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none text-sm" /></div>
                {formError && <p className="text-red-500 text-sm">{formError}</p>}
                <button onClick={handleDelete} disabled={submitting} className="w-full py-2.5 bg-amber-500 text-white font-semibold text-sm rounded-xl hover:bg-amber-600 transition disabled:opacity-50">{submitting ? "Enviando..." : "Enviar solicitação"}</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehicles;
