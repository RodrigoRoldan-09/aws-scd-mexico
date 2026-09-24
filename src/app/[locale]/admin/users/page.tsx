"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/admin/avatar";
import { Cards, Empty, HardButton, PageHead, Tag } from "@/components/admin/ui";
import { Users as UsersIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { Plus, Send, CheckCircle, Clock, Pencil, KeyRound } from "lucide-react";
import { useConfirm } from "@/components/admin/confirm";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  allowedBadges: string[];
  hasPassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

interface BadgeOption { id: string; sponsorName: string; }

const roleOptions = [
  { value: "admin", label: "Admin" },
  { value: "organizer", label: "Organizador" },
  { value: "volunteer", label: "Voluntario" },
  { value: "badges", label: "Badges (solo dar sellos)" },
];

// Checklist reutilizable de badges permitidos (create + edit)
function BadgeChecklist({ options, selected, onToggle }: { options: BadgeOption[]; selected: string[]; onToggle: (id: string) => void }) {
  if (options.length === 0) {
    return <p className="font-mono text-xs text-surface-300">No hay badges creados aún (créalos en Pasaportes).</p>;
  }
  return (
    <div className="flex max-h-48 flex-col gap-1 overflow-y-auto border-2 border-surface-600 bg-surface-800 p-2">
      {options.map((b) => {
        const on = selected.includes(b.id);
        return (
          <button key={b.id} type="button" onClick={() => onToggle(b.id)}
            className={`flex items-center gap-2.5 px-3 py-2 text-left font-mono text-xs transition-colors ${on ? "bg-aws-orange/10 text-aws-orange" : "text-surface-300 hover:bg-surface-800"}`}>
            <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${on ? "border-aws-orange bg-aws-orange/20" : "border-surface-600"}`}>
              {on && <CheckCircle className="h-3 w-3" />}
            </span>
            {b.sponsorName}
          </button>
        );
      })}
    </div>
  );
}

function StatusBadge({ hasPassword }: { hasPassword: boolean }) {
  if (hasPassword) {
    return (
      <span className="inline-flex items-center gap-1 bg-emerald/10 px-2 py-0.5 font-mono text-xs font-medium text-emerald">
        <CheckCircle className="h-3 w-3" /> Activo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 bg-yellow-400/10 px-2 py-0.5 font-mono text-xs font-medium text-yellow-400">
      <Clock className="h-3 w-3" /> Pendiente
    </span>
  );
}

export default function UsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { confirm, dialog } = useConfirm();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [badgeOptions, setBadgeOptions] = useState<BadgeOption[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<{ name: string; email: string; role: string; allowedBadges: string[] }>({ name: "", email: "", role: "organizer", allowedBadges: [] });
  const [creating, setCreating] = useState(false);
  const [resending, setResending] = useState<string | null>(null);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState<{ role: string; allowedBadges: string[] }>({ role: "organizer", allowedBadges: [] });
  const [savingEdit, setSavingEdit] = useState(false);
  // Crear genérico (de respaldo): contraseña directa, sin correo
  const [showGeneric, setShowGeneric] = useState(false);
  const [genForm, setGenForm] = useState<{ name: string; email: string; password: string; role: string; allowedBadges: string[] }>({ name: "", email: "", password: "", role: "organizer", allowedBadges: [] });
  const [creatingGen, setCreatingGen] = useState(false);
  const toggleGenBadge = (id: string) => setGenForm((f) => ({ ...f, allowedBadges: f.allowedBadges.includes(id) ? f.allowedBadges.filter((x) => x !== id) : [...f.allowedBadges, id] }));

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(
          data.users.map((u: Record<string, unknown>) => ({
            ...u,
            id: u._id as string,
            allowedBadges: (u.allowedBadges as string[]) ?? [],
          })),
        );
      }
    } catch {
      // ignore
    }
  };

  const fetchBadges = async () => {
    try {
      const res = await fetch("/api/admin/sponsor-pins");
      if (res.ok) {
        const d = await res.json();
        setBadgeOptions(((d.pins as Record<string, unknown>[]) ?? []).map((s) => ({ id: String(s._id), sponsorName: String(s.sponsorName) })));
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchBadges();
  }, []);

  const toggleCreateBadge = (id: string) => setForm((f) => ({ ...f, allowedBadges: f.allowedBadges.includes(id) ? f.allowedBadges.filter((x) => x !== id) : [...f.allowedBadges, id] }));
  const toggleEditBadge = (id: string) => setEditForm((f) => ({ ...f, allowedBadges: f.allowedBadges.includes(id) ? f.allowedBadges.filter((x) => x !== id) : [...f.allowedBadges, id] }));

  const openEdit = (u: UserRow) => { setEditing(u); setEditForm({ role: u.role, allowedBadges: u.allowedBadges ?? [] }); };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/users/${editing.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: editForm.role, allowedBadges: editForm.role === "admin" ? [] : editForm.allowedBadges }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast(`${editing.name} actualizado`, "success");
      setEditing(null);
      fetchUsers();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setSavingEdit(false);
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="font-mono text-surface-400">No tienes acceso a esta sección</p>
      </div>
    );
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast(`Usuario ${form.name} creado`, "success");
      setShowModal(false);
      setForm({ name: "", email: "", role: "organizer", allowedBadges: [] });
      fetchUsers();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setCreating(false);
    }
  };

  const handleCreateGeneric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (genForm.password.length < 8) { toast("La contraseña debe tener al menos 8 caracteres", "error"); return; }
    setCreatingGen(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(genForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast(`Usuario ${genForm.name} creado (sin correo)`, "success");
      setShowGeneric(false);
      setGenForm({ name: "", email: "", password: "", role: "organizer", allowedBadges: [] });
      fetchUsers();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setCreatingGen(false);
    }
  };

  const handleResendInvite = async (userId: string, userName: string) => {
    const ok = await confirm({
      title: "Reenviar invitación",
      message: `Se le manda un enlace nuevo a ${userName}. El anterior deja de funcionar.`,
      confirmLabel: "Sí, reenviar",
      tone: "accent",
    });
    if (!ok) return;
    setResending(userId);
    try {
      const res = await fetch(`/api/users/${userId}/resend-invite`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast(`Invitación reenviada a ${userName}`, "success");
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setResending(null);
    }
  };

  return (
    <div>
      <PageHead
        title="cuentas de staff"
        actions={
          <>
            <HardButton tone="ghost" icon={KeyRound} onClick={() => setShowGeneric(true)}>
              Crear genérico
            </HardButton>
            <HardButton icon={Plus} onClick={() => setShowModal(true)}>
              Crear cuenta
            </HardButton>
          </>
        }
      />

      {/* En el teléfono cada cuenta es una tarjeta con sus dos botones debajo. */}
      <Cards>
        {users.length === 0 ? (
          <Empty icon={UsersIcon}>Todavía no hay cuentas.</Empty>
        ) : (
          users.map((u) => (
            <div key={u.id} className="border-2 border-surface-600 bg-surface-800 p-3">
              <div className="flex min-w-0 items-start gap-3">
                <Avatar seed={u.email} name={u.name} email={u.email} size={38} />
                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate font-mono text-sm font-bold text-surface-50">{u.name}</p>
                  <p className="m-0 mt-0.5 truncate font-mono text-[11px] text-surface-300">{u.email}</p>
                </div>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <Tag tone="accent">{u.role}</Tag>
                <StatusBadge hasPassword={u.hasPassword} />
                <Tag>
                  {u.lastLoginAt
                    ? new Date(u.lastLoginAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })
                    : "Nunca entró"}
                </Tag>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <HardButton tone="ghost" icon={Pencil} onClick={() => openEdit(u)}>
                  Editar
                </HardButton>
                <HardButton
                  tone="ghost"
                  icon={Send}
                  disabled={resending === u.id}
                  onClick={() => handleResendInvite(u.id, u.name)}
                >
                  {resending === u.id ? "Enviando…" : "Invitación"}
                </HardButton>
              </div>
            </div>
          ))
        )}
      </Cards>

      <div className="hidden overflow-x-auto border-2 border-surface-600 bg-surface-800 sm:block">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-surface-600">
              <th className="px-4 py-3 text-left font-mono text-xs font-semibold uppercase tracking-wider text-surface-400">Nombre</th>
              <th className="hidden px-4 py-3 text-left font-mono text-xs font-semibold uppercase tracking-wider text-surface-400 sm:table-cell">Email</th>
              <th className="px-4 py-3 text-left font-mono text-xs font-semibold uppercase tracking-wider text-surface-400">Rol</th>
              <th className="px-4 py-3 text-left font-mono text-xs font-semibold uppercase tracking-wider text-surface-400">Estado</th>
              <th className="hidden px-4 py-3 text-left font-mono text-xs font-semibold uppercase tracking-wider text-surface-400 md:table-cell">Último acceso</th>
              <th className="px-4 py-3 text-center font-mono text-xs font-semibold uppercase tracking-wider text-surface-400">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center font-mono text-sm text-surface-300">
                  No hay usuarios
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-surface-600/50 transition-colors hover:bg-surface-800">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar seed={u.email} name={u.name} email={u.email} size={32} />
                      <span className="font-mono text-sm font-medium text-surface-100">{u.name}</span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span className="font-mono text-xs text-surface-300">{u.email}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block bg-aws-orange/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-aws-orange">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge hasPassword={u.hasPassword} />
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <span className="font-mono text-xs text-surface-400">
                      {u.lastLoginAt
                        ? new Date(u.lastLoginAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                        : "Nunca"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        title="Editar rol y badges"
                        onClick={() => openEdit(u)}
                        className="inline-flex items-center gap-1.5 border-2 border-surface-600 px-2.5 py-1.5 font-mono text-xs text-surface-300 transition-colors hover:border-aws-orange hover:text-aws-orange"
                      >
                        <Pencil className="h-3 w-3" /> Editar
                      </button>
                      <button
                        type="button"
                        title="Reenviar invitación"
                        disabled={resending === u.id}
                        onClick={() => handleResendInvite(u.id, u.name)}
                        className="inline-flex items-center gap-1.5 border-2 border-surface-600 px-2.5 py-1.5 font-mono text-xs text-surface-300 transition-colors hover:border-aws-orange hover:text-aws-orange disabled:opacity-40"
                      >
                        <Send className="h-3 w-3" />
                        {resending === u.id ? "Enviando..." : "Invitación"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Crear Usuario">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input
            label="Nombre"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Select
            label="Rol"
            options={roleOptions}
            value={form.role}
            onChange={(v) => setForm({ ...form, role: v })}
            required
          />
          {form.role !== "admin" && (
            <div>
              <p className="mb-1.5 font-mono text-xs font-medium text-surface-300">Badges que puede dar</p>
              <BadgeChecklist options={badgeOptions} selected={form.allowedBadges} onToggle={toggleCreateBadge} />
            </div>
          )}
          <div className="mt-2 flex justify-end gap-3">
            <Button variant="ghost" size="sm" type="button" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button size="sm" type="submit" disabled={creating}>
              {creating ? "Creando..." : "Crear"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={showGeneric} onClose={() => setShowGeneric(false)} title="Crear usuario genérico (respaldo)">
        <form onSubmit={handleCreateGeneric} className="flex flex-col gap-4">
          <p className="font-mono text-xs text-surface-400">
            Crea el usuario con su contraseña directamente. No se envía ningún correo ni enlace — queda listo para entrar de una.
          </p>
          <Input
            label="Nombre"
            value={genForm.name}
            onChange={(e) => setGenForm({ ...genForm, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={genForm.email}
            onChange={(e) => setGenForm({ ...genForm, email: e.target.value })}
            required
          />
          <Input
            label="Contraseña (mín. 8 caracteres)"
            type="text"
            value={genForm.password}
            onChange={(e) => setGenForm({ ...genForm, password: e.target.value })}
            required
          />
          <Select
            label="Rol"
            options={roleOptions}
            value={genForm.role}
            onChange={(v) => setGenForm({ ...genForm, role: v })}
            required
          />
          {genForm.role !== "admin" && (
            <div>
              <p className="mb-1.5 font-mono text-xs font-medium text-surface-300">Badges que puede dar</p>
              <BadgeChecklist options={badgeOptions} selected={genForm.allowedBadges} onToggle={toggleGenBadge} />
            </div>
          )}
          <div className="mt-2 flex justify-end gap-3">
            <Button variant="ghost" size="sm" type="button" onClick={() => setShowGeneric(false)}>
              Cancelar
            </Button>
            <Button size="sm" type="submit" disabled={creatingGen}>
              {creatingGen ? "Creando..." : "Crear usuario"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing ? `Editar — ${editing.name}` : "Editar"}>
        {editing && (
          <div className="flex flex-col gap-4">
            <Select label="Rol" options={roleOptions} value={editForm.role} onChange={(v) => setEditForm({ ...editForm, role: v })} />
            {editForm.role !== "admin" ? (
              <div>
                <p className="mb-1.5 font-mono text-xs font-medium text-surface-300">Badges que puede dar</p>
                <BadgeChecklist options={badgeOptions} selected={editForm.allowedBadges} onToggle={toggleEditBadge} />
              </div>
            ) : (
              <p className="font-mono text-xs text-surface-300">Admin puede dar todos los badges.</p>
            )}
            <div className="mt-2 flex justify-end gap-3">
              <Button variant="ghost" size="sm" type="button" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button size="sm" type="button" onClick={handleSaveEdit} disabled={savingEdit}>{savingEdit ? "Guardando..." : "Guardar"}</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmaciones propias, no el popup del navegador. */}
      {dialog}
    </div>
  );
}
