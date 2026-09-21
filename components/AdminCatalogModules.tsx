"use client";

import { useEffect, useState } from "react";

type User = { id: string; email?: string; confirmed: boolean; createdAt: string; lastSignIn?: string };
type Course = { slug: string; title: string; area: string; level: string; mode: string; duration: string; price: string; active: boolean; featured: boolean; updated_at: string };

export function AdminCatalogModules({ canManage }: { canManage: boolean }) {
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  useEffect(() => { fetch("/api/admin/catalog").then((response) => response.json()).then((data) => { setUsers(data.users ?? []); setCourses(data.courses ?? []); }).finally(() => setLoading(false)); }, []);
  async function update(body: Record<string, unknown>) {
    if (!canManage) return;
    setMessage("");
    const response = await fetch("/api/admin/catalog", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setMessage(data.error || "Não foi possível actualizar."); return; }
    setMessage("Alteração guardada com sucesso.");
    if (body.type === "user-status") setUsers((rows) => rows.map((row) => row.id === body.id ? { ...row, confirmed: row.confirmed } : row));
    if (body.type === "course-status") setCourses((rows) => rows.map((row) => row.slug === body.id ? { ...row, active: Boolean(body.active) } : row));
    if (body.type === "course-featured") setCourses((rows) => rows.map((row) => row.slug === body.id ? { ...row, featured: Boolean(body.featured) } : row));
  }
  return <div className="admin-catalog-modules"><section className="admin-panel wide" id="utilizadores"><div className="admin-panel-heading"><div><p className="eyebrow">Access directory</p><h2>Utilizadores.</h2></div><span className="admin-readonly">{canManage ? "Admin Principal · gestão activa" : "Moderador · consulta"}</span></div>{loading ? <p className="admin-empty">A carregar utilizadores…</p> : <div className="admin-table">{users.map((user) => <div className="admin-row" key={user.id}><div><strong>{user.email ?? "Email indisponível"}</strong><small>Registado em {new Date(user.createdAt).toLocaleDateString("pt-PT")} · {user.lastSignIn ? "Acesso recente" : "Sem acesso ainda"}</small></div><div className="admin-row-end"><span className={`status-pill ${user.confirmed ? "active" : "pending"}`}>{user.confirmed ? "email confirmado" : "email pendente"}</span>{canManage ? <button className="admin-inline-action" type="button" onClick={() => update({ type: "user-status", id: user.id, active: false })}>Suspender</button> : null}</div></div>)}</div>}</section><section className="admin-panel wide" id="formacoes"><div className="admin-panel-heading"><div><p className="eyebrow">Learning catalogue</p><h2>Formações.</h2></div><span className="admin-readonly">{courses.length} cursos no catálogo</span></div>{loading ? <p className="admin-empty">A carregar formações…</p> : <div className="admin-table">{courses.map((course) => <div className="admin-row" key={course.slug}><div><strong>{course.title}</strong><small>{course.area} · {course.mode} · {course.price} · {course.duration}</small></div><div className="admin-row-end"><span className={`status-pill ${course.active ? "active" : "suspended"}`}>{course.active ? "publicada" : "oculta"}</span>{course.featured ? <span className="status-pill approved">destaque</span> : null}{canManage ? <><button className="admin-inline-action" type="button" onClick={() => update({ type: "course-featured", id: course.slug, featured: !course.featured })}>{course.featured ? "Retirar destaque" : "Destacar"}</button><button className="admin-inline-action" type="button" onClick={() => update({ type: "course-status", id: course.slug, active: !course.active })}>{course.active ? "Ocultar" : "Publicar"}</button></> : null}</div></div>)}</div>}</section>{message ? <p className="admin-module-message" role="status">{message}</p> : null}</div>;
}
