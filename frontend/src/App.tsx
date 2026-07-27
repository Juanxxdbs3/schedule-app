import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./features/auth/hooks/useAuth.tsx";
import LoginForm from "./features/auth/components/LoginForm.tsx";
import RegisterForm from "./features/auth/components/RegisterForm.tsx";
import type { Pensum } from "./features/pensum/types.ts";
import type { Materia } from "./features/pensum/types.ts";
import { PensumService } from "./features/pensum/services/PensumService.ts";
import { useHorarioStore } from "./features/horario/store/horarioStore.ts";
import { HorarioService } from "./features/horario/services/HorarioService.ts";
import type { Horario } from "./features/horario/types.ts";
import CargarPensum from "./features/pensum/components/CargarPensum.tsx";
import FiltroPensum from "./features/pensum/components/FiltroPensum.tsx";
import PoolMaterias from "./features/pensum/components/PoolMaterias.tsx";
import HorarioPage from "./features/horario/components/HorarioPage.tsx";
import ConfigurarHorario from "./features/horario/components/ConfigurarHorario.tsx";

import NavBar from "./shared/components/NavBar.tsx";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="text-center p-8">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <><NavBar />{children}</>;
}

function DashboardPage() {
  const navigate = useNavigate();
  const [pensum, setPensum] = useState<Pensum | null>(null);
  const [pensums, setPensums] = useState<Pensum[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [filtradas, setFiltradas] = useState<Materia[]>([]);
  const [syncDone, setSyncDone] = useState(false);
  const [showCrear, setShowCrear] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [crearError, setCrearError] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);

  useEffect(() => {
    Promise.all([
      PensumService.list().catch(() => ({ pensums: [] as Pensum[] })),
      HorarioService.list().catch(() => ({ horarios: [] as Horario[] })),
    ]).then(([pRes, hRes]) => {
      setPensums(pRes.pensums);
      setHorarios(hRes.horarios);
      if (pRes.pensums.length > 0) {
        const p = pRes.pensums[0];
        setPensum(p);
        PensumService.storage.save(p);
      } else {
        PensumService.storage.remove();
      }
    }).catch(() => {
      const local = PensumService.storage.get();
      if (local) setPensum(local);
    }).finally(() => setSyncDone(true));
  }, []);

  useEffect(() => {
    if (pensum) setFiltradas(pensum.materias.filter((m) => m.estado !== "cursado"));
  }, [pensum]);

  function handlePensumLoaded(p: Pensum) {
    setPensum(p);
    setShowUpload(false);
    setPensums((prev) => { const exists = prev.find((x) => x.id === p.id); return exists ? prev.map((x) => x.id === p.id ? p : x) : [...prev, p]; });
  }

  function handleCargarNuevo() {
    PensumService.storage.remove();
    setPensum(null);
    setFiltradas([]);
    setShowUpload(true);
    useHorarioStore.getState().clear();
  }

  async function handleCrearHorario(params: { pensumId: string; semestreLabel: string; maxCreditos: number; unidadHoraMinutos: number }) {
    setCrearError(null);
    setCreando(true);
    try {
      const { horario } = await HorarioService.create(
        params.pensumId, params.semestreLabel,
        params.maxCreditos, params.unidadHoraMinutos,
      );
      useHorarioStore.getState().initHorarioReal(horario);
      setShowCrear(false);
      navigate(`/horario/${horario.id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al crear horario";
      setCrearError(msg);
      setCreando(false);
    }
  }

  if (!syncDone) return <div className="text-center p-8 text-muted">Cargando...</div>;

  const pensumActual = pensum;
  const materiasDisponibles = pensumActual
    ? pensumActual.materias.filter((m) => m.estado !== "cursado")
    : [];

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="flex gap-4 mb-6">
        {/* Pensums section */}
        <div className="flex-[7] min-w-0">
          <section className="border border-border rounded-md p-3">
            <div className="flex justify-between items-center mb-3">
              <h2 className="m-0 text-lg">Pensums</h2>
              {pensums.length > 0 && (
                <button type="button" onClick={handleCargarNuevo} className="px-4 py-1.5 bg-primary text-white border-none rounded-md cursor-pointer font-semibold text-sm">
                  + Cargar pensum
                </button>
              )}
            </div>

            {showUpload || pensums.length === 0 ? (
              <CargarPensum onPensumLoaded={handlePensumLoaded} />
            ) : (
              <div className="flex flex-col gap-2">
                {pensums.map((p) => (
                  <div key={p.id} onClick={() => setPensum(p)} className={`p-3 rounded-md cursor-pointer border transition-all duration-150 ${
                    pensumActual?.id === p.id ? "border-primary bg-primary-muted" : "border-border bg-surface"
                  }`}>
                    <div className="font-semibold text-sm">{p.nombre}</div>
                    <div className="text-xs text-muted">
                      {p.materias.length} materias
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Horarios section */}
        <div className="flex-[3] min-w-0">
          <section className="border border-border rounded-md p-3">
            <div className="flex justify-between items-center mb-3">
              <h2 className="m-0 text-lg">Mis horarios</h2>
              {pensums.length > 0 && (
                <button type="button" onClick={() => setShowCrear(!showCrear)} className="px-4 py-1.5 bg-primary text-white border-none rounded-md cursor-pointer font-semibold text-sm">
                  + Crear horario
                </button>
              )}
            </div>
            {horarios.length === 0 ? (
              <p className="text-sm text-muted text-center p-4">
                No hay horarios aún. Carga un pensum y crea tu primer horario.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {horarios.map((h) => (
                  <div key={h.id} onClick={() => navigate(`/horario/${h.id}`)} className="p-3 rounded-md cursor-pointer border border-border bg-surface transition-all duration-150 flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-sm">{h.semestreLabel}</div>
                      <div className="text-xs text-muted">
                        {h.bloques.length} bloque{h.bloques.length !== 1 ? "s" : ""} · {h.estado === "finalizado" ? "Finalizado" : "En progreso"}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-sm font-semibold ${
                      h.estado === "finalizado" ? "bg-[#f3f4f6] text-[#6b7280]" : "bg-success-bg text-[#166534]"
                    }`}>
                      {h.estado === "finalizado" ? "Finalizado" : "Activo"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <ConfigurarHorario
              isOpen={showCrear}
              onClose={() => setShowCrear(false)}
              pensums={pensums}
              pensumIdInicial={pensums[0]?.id}
              onSubmit={handleCrearHorario}
              loading={creando}
              error={crearError}
            />
          </section>
        </div>
      </div>

      {/* Pensum detail */}
      {pensumActual && !showUpload && (
        <section className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="m-0 text-lg">{pensumActual.nombre}</h2>
          </div>
          <FiltroPensum materias={materiasDisponibles} onFilter={setFiltradas} />
          <PoolMaterias materias={filtradas} />
        </section>
      )}
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<RegisterForm />} />
      <Route path="/horario/:id" element={<ProtectedRoute><HorarioPage /></ProtectedRoute>} />
      <Route path="/horario/nuevo" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
