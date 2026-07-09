import React, { Suspense, lazy, useEffect, useState } from "react";
import useAreaStore from "../stores/useAreaStore";
import useAuthStore from "../stores/useAuthStore";
import { MapPin, CheckCircle, PauseCircle, Store } from "lucide-react";
import StatsCard from "../components/dashboard/StatsCard";
import PaginationControls from "../components/shared/PaginationControls";
import { AdminEmptyState, AdminErrorState, TableSkeleton } from "../components/shared/AdminListStates";
import api from "../utils/api";

const LocationPickerMap = lazy(() => import("../components/shared/LocationPickerMap"));

const MapFallback = () => (
  <div className="flex h-72 items-center justify-center rounded-2xl border border-primary/15 bg-primary/5 text-sm font-medium text-primary/60">
    Carregando mapa...
  </div>
);

const TYPE_BADGES = {
  commercial: { cls: "bg-blue-100 text-blue-700", label: "Comercial" },
  residential: { cls: "bg-purple-100 text-purple-700", label: "Residencial" },
  suburban: { cls: "bg-teal-100 text-teal-700", label: "Suburbana" },
  rural: { cls: "bg-emerald-100 text-emerald-700", label: "Rural" },
};


const Areas = () => {
  const { areas, pagination, loading, error, fetchAreas, createArea, updateArea, deleteArea } = useAreaStore();
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === "super_admin";

  const [showAddModal, setShowAddModal] = useState(false);
  const [editArea, setEditArea] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [form, setForm] = useState({ name: "", type: "residential", latitude: null, longitude: null, address: "", orgId: "", scaleFactor: 1.0 });
  const [editForm, setEditForm] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchAreas({ page: 1, limit: 10 }); }, [fetchAreas]);

  useEffect(() => {
    if (isSuperAdmin) {
      api.get("/super-admin/organizations")
        .then(({ data }) => setOrgs(data.organizations || [])).catch(() => {});
    }
  }, [isSuperAdmin]);

  const handleAdd = async (e) => {
    e.preventDefault(); setFormError("");
    if (!form.name || (isSuperAdmin && !form.orgId)) { setFormError("Preencha todos os campos obrigatórios"); return; }
    setSubmitting(true);
    const payload = {
      name: form.name,
      type: form.type,
      scaleFactor: Number(form.scaleFactor) || 1.0,
      ...(form.latitude && form.longitude ? { coordinates: { latitude: Number(form.latitude), longitude: Number(form.longitude) }, address: form.address } : {}),
      ...(isSuperAdmin && form.orgId ? { orgId: form.orgId } : {}),
    };
    const result = await createArea(payload);
    setSubmitting(false);
    if (result.success) { setShowAddModal(false); setForm({ name: "", type: "residential", latitude: null, longitude: null, address: "", orgId: "", scaleFactor: 1.0 }); }
    else setFormError(result.error);
  };

  const handleEdit = async (e) => {
    e.preventDefault(); setFormError(""); setSubmitting(true);
    const payload = {
      name: editForm.name,
      type: editForm.type,
      isActive: editForm.isActive,
      scaleFactor: Number(editForm.scaleFactor) || 1.0,
      ...(editForm.latitude && editForm.longitude ? { coordinates: { latitude: Number(editForm.latitude), longitude: Number(editForm.longitude) }, address: editForm.address } : {}),
      ...(isSuperAdmin && editForm.orgId ? { orgId: editForm.orgId } : {}),
    };
    const result = await updateArea(editArea._id, payload, { optimistic: true });
    setSubmitting(false);
    if (result.success) setEditArea(null); else setFormError(result.error);
  };

  const handleDelete = async () => {
    setFormError(""); setSubmitting(true);
    const result = await deleteArea(deleteTarget._id);
    setSubmitting(false);
    if (result.success) setDeleteTarget(null); else setFormError(result.error);
  };

  const openEdit = (d) => {
    setEditArea(d);
    setEditForm({
      name: d.name,
      type: d.type,
      latitude: d.coordinates?.latitude || null,
      longitude: d.coordinates?.longitude || null,
      address: d.address || "",
      orgId: d.orgId?._id || d.orgId || "",
      isActive: d.isActive !== false,
      scaleFactor: d.scaleFactor || 1.0,
    });
    setFormError("");
  };

  const totalCount = pagination?.total ?? areas.length;
  const activeCount = areas.filter(d => d.isActive !== false).length;
  const inactiveCount = areas.filter(d => d.isActive === false).length;
  const typeCount = (type) => areas.filter(d => d.type === type).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Áreas de coleta</h1>
          <p className="text-sm text-primary/50 mt-1">{isSuperAdmin ? "Gerencie áreas de coleta de todas as cooperativas" : "Veja as áreas atendidas pela sua organização"}</p>
        </div>
        {isSuperAdmin && (
          <button onClick={() => { setShowAddModal(true); setFormError(""); }} className="px-5 py-2.5 bg-primary text-white font-semibold text-sm rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 self-start sm:self-auto">
            <span className="text-lg leading-none">+</span> Nova área
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard title="Áreas totais" value={totalCount} label="Áreas cadastradas" icon={<MapPin className="w-5 h-5 text-primary" />} iconBg="bg-primary/8" />
        <StatsCard title="Ativas" value={activeCount} label="Em atendimento" icon={<CheckCircle className="w-5 h-5 text-emerald-600" />} iconBg="bg-emerald-100" valueColor="text-emerald-600" />
        <StatsCard title="Pausadas" value={inactiveCount} label="Sem atendimento" icon={<PauseCircle className="w-5 h-5 text-amber-600" />} iconBg="bg-amber-100" valueColor="text-amber-600" />
        <StatsCard title="Comerciais" value={typeCount("commercial")} label="Áreas de empresas" icon={<Store className="w-5 h-5 text-blue-600" />} iconBg="bg-blue-100" valueColor="text-blue-600" />
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton columns={isSuperAdmin ? 6 : 5} rows={7} />
      ) : error ? (
        <AdminErrorState message={error} onRetry={() => fetchAreas({ page: pagination?.page || 1, limit: 10 })} />
      ) : (
        <div className="bg-white rounded-2xl border border-primary/10 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-primary/8 bg-primary/3">
                  <th className="px-5 py-3.5 text-xs font-semibold text-primary/50 uppercase tracking-wider">Nome</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-primary/50 uppercase tracking-wider">Tipo</th>
                  {isSuperAdmin && <th className="px-5 py-3.5 text-xs font-semibold text-primary/50 uppercase tracking-wider">Organização</th>}
                  <th className="px-5 py-3.5 text-xs font-semibold text-primary/50 uppercase tracking-wider">Localização</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-primary/50 uppercase tracking-wider">Status</th>
                  {isSuperAdmin && <th className="px-5 py-3.5 text-xs font-semibold text-primary/50 uppercase tracking-wider">Ações</th>}
                </tr>
              </thead>
              <tbody>
                {areas.length === 0 ? (
                  <tr>
                    <td colSpan={isSuperAdmin ? 6 : 5} className="p-0">
                      <AdminEmptyState icon={MapPin} title="Nenhuma área encontrada" message="As áreas de coleta aparecem aqui depois do cadastro." />
                    </td>
                  </tr>
                ) : areas.map(d => {
                  const badge = TYPE_BADGES[d.type] || { cls: "bg-gray-100 text-gray-700", label: d.type || "--" };
                  const hasCoords = d.coordinates?.latitude && d.coordinates?.longitude;
                  return (
                    <tr key={d._id} className="border-b border-primary/5 hover:bg-primary/2 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-primary">{d.name}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      {isSuperAdmin && <td className="px-5 py-3.5 text-sm text-primary/60">{d.orgId?.name || "--"}</td>}
                      <td className="px-5 py-3.5 text-sm max-w-50">
                        {hasCoords ? (
                          <div>
                            {d.address ? (
                              <p className="text-primary/60 truncate" title={d.address}>{d.address}</p>
                            ) : (
                              <p className="text-primary/40 text-xs">{d.coordinates.latitude.toFixed(4)}, {d.coordinates.longitude.toFixed(4)}</p>
                            )}
                            <p className="text-emerald-500 text-[10px] flex items-center gap-0.5 mt-0.5">
                              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="4" /></svg>
                              GPS definido
                            </p>
                          </div>
                        ) : (
                          <span className="text-primary/30">--</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${d.isActive !== false ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${d.isActive !== false ? "bg-emerald-500" : "bg-gray-400"}`} />
                          {d.isActive !== false ? "Ativa" : "Pausada"}
                        </span>
                      </td>
                      {isSuperAdmin && (
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button onClick={() => openEdit(d)} className="px-2.5 py-1.5 text-xs font-semibold text-primary bg-primary/5 rounded-lg hover:bg-primary/10 transition">Editar</button>
                            <button onClick={() => { setDeleteTarget(d); setFormError(""); }} className="px-2.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition">Excluir</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <PaginationControls
            pagination={pagination}
            onPageChange={(nextPage) => fetchAreas({ page: nextPage, limit: 10 })}
            itemLabel="áreas"
          />
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-7 relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary/60 hover:bg-primary/10 transition z-10">
              <span className="text-lg leading-none">&times;</span>
            </button>
            <h2 className="text-lg font-bold text-primary mb-5">Adicionar área</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary/60 mb-1">Nome da área *</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="ex. Pinheiros" className="w-full px-4 py-2.5 rounded-xl border border-primary/12 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-primary/60 mb-1">Tipo</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-primary/12 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white text-sm">
                    <option value="residential">Residencial</option>
                    <option value="commercial">Comercial</option>
                    <option value="suburban">Suburbana</option>
                    <option value="rural">Rural</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary/60 mb-1">Escala da área</label>
                  <input type="number" step="0.1" min="0.1" max="5.0" value={form.scaleFactor} onChange={e => setForm({...form, scaleFactor: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-primary/12 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                  <p className="text-[11px] text-primary/40 mt-1">Multiplicador da IA (1.0 = média)</p>
                </div>
              </div>
              <Suspense fallback={<MapFallback />}>
                <LocationPickerMap
                  label="Centro da área"
                  placeholder="Buscar localização da área..."
                  height="220px"
                  value={{ latitude: form.latitude, longitude: form.longitude, address: form.address }}
                  onChange={({ latitude, longitude, address }) => setForm({ ...form, latitude, longitude, address })}
                />
              </Suspense>
              {isSuperAdmin && (
                <div>
                  <label className="block text-sm font-medium text-primary/60 mb-1">Organização *</label>
                  <select value={form.orgId} onChange={e => setForm({...form, orgId: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-primary/12 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white text-sm">
                    <option value="">Selecionar organização...</option>
                    {orgs.map(o => <option key={o._id} value={o._id}>{o.name}</option>)}
                  </select>
                </div>
              )}
              {formError && <p className="text-red-500 text-sm">{formError}</p>}
              <button type="submit" disabled={submitting} className="w-full py-2.5 bg-primary text-white font-semibold text-sm rounded-xl hover:bg-primary/90 transition disabled:opacity-50">{submitting ? "Adicionando..." : "Adicionar área"}</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editArea && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-7 relative">
            <button onClick={() => setEditArea(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary/60 hover:bg-primary/10 transition z-10">
              <span className="text-lg leading-none">&times;</span>
            </button>
            <h2 className="text-lg font-bold text-primary mb-5">Editar área</h2>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary/60 mb-1">Nome da área</label>
                <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-primary/12 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-primary/60 mb-1">Tipo</label>
                  <select value={editForm.type} onChange={e => setEditForm({...editForm, type: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-primary/12 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white text-sm">
                    <option value="residential">Residencial</option>
                    <option value="commercial">Comercial</option>
                    <option value="suburban">Suburbana</option>
                    <option value="rural">Rural</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary/60 mb-1">Escala da área</label>
                  <input type="number" step="0.1" min="0.1" max="5.0" value={editForm.scaleFactor} onChange={e => setEditForm({...editForm, scaleFactor: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-primary/12 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                  <p className="text-[11px] text-primary/40 mt-1">Multiplicador da IA (1.0 = média)</p>
                </div>
              </div>
              <Suspense fallback={<MapFallback />}>
                <LocationPickerMap
                  label="Centro da área"
                  placeholder="Buscar localização da área..."
                  height="220px"
                  value={{ latitude: editForm.latitude, longitude: editForm.longitude, address: editForm.address }}
                  onChange={({ latitude, longitude, address }) => setEditForm({ ...editForm, latitude, longitude, address })}
                />
              </Suspense>
              {isSuperAdmin && (
                <div>
                  <label className="block text-sm font-medium text-primary/60 mb-1">Organização</label>
                  <select value={editForm.orgId} onChange={e => setEditForm({...editForm, orgId: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-primary/12 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white text-sm">
                    <option value="">Selecionar organização...</option>
                    {orgs.map(o => <option key={o._id} value={o._id}>{o.name}</option>)}
                  </select>
                </div>
              )}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-primary/60">Ativa</label>
                <button type="button" onClick={() => setEditForm({...editForm, isActive: !editForm.isActive})} className={`w-12 h-6 rounded-full transition-colors ${editForm.isActive ? "bg-emerald-400" : "bg-gray-300"} relative`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${editForm.isActive ? "left-6" : "left-0.5"}`} />
                </button>
              </div>
              {formError && <p className="text-red-500 text-sm">{formError}</p>}
              <button type="submit" disabled={submitting} className="w-full py-2.5 bg-primary text-white font-semibold text-sm rounded-xl hover:bg-primary/90 transition disabled:opacity-50">{submitting ? "Salvando..." : "Salvar alterações"}</button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-7 relative mx-4">
            <button onClick={() => setDeleteTarget(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary/60 hover:bg-primary/10 transition">
              <span className="text-lg leading-none">&times;</span>
            </button>
            <h2 className="text-lg font-bold text-red-600 mb-2">Excluir área</h2>
            <p className="text-sm text-primary/50 mb-4">Area: <strong>{deleteTarget.name}</strong> ({TYPE_BADGES[deleteTarget.type]?.label || deleteTarget.type})</p>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                <p className="text-sm text-red-700">Isto exclui permanentemente a área e remove sua referência das agendas.</p>
              </div>
              {formError && <p className="text-red-500 text-sm">{formError}</p>}
              <button onClick={handleDelete} disabled={submitting} className="w-full py-2.5 bg-red-500 text-white font-semibold text-sm rounded-xl hover:bg-red-600 transition disabled:opacity-50">{submitting ? "Excluindo..." : "Confirmar exclusão"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Areas;
