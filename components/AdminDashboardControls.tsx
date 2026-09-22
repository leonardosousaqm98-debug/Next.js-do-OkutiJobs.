"use client";

import { useEffect, useState } from "react";

export function AdminDashboardControls() {
  const [dark, setDark] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("okutijobs-admin-theme");
    const initialDark = stored === "dark";
    setDark(initialDark);
    document.documentElement.dataset.adminTheme = initialDark ? "dark" : "light";
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.adminTheme = next ? "dark" : "light";
    window.localStorage.setItem("okutijobs-admin-theme", next ? "dark" : "light");
  }

  function quickSearch(value: string) {
    const target = document.querySelector<HTMLInputElement>(".admin-report-tools input");
    if (target) {
      target.value = value;
      target.dispatchEvent(new Event("input", { bubbles: true }));
      target.focus();
    }
  }

  return <div className="admin-quickbar">
    <button className="admin-icon-button" type="button" aria-label={collapsed ? "Expandir menu" : "Recolher menu"} onClick={() => { const next = !collapsed; setCollapsed(next); document.documentElement.dataset.adminCollapsed = next ? "true" : "false"; }}>☰</button>
    <div className="admin-global-search"><span aria-hidden="true">⌕</span><input aria-label="Pesquisa global" placeholder="Pesquisar no backoffice…" onChange={(event) => quickSearch(event.target.value)} /></div>
    <div className="admin-quick-actions">
      <button className="admin-icon-button" type="button" aria-label="Alternar tema" onClick={toggleTheme}>{dark ? "☀" : "◐"}</button>
      <div className="admin-notification-wrap"><button className="admin-icon-button notification-button" type="button" aria-label="Notificações" onClick={() => setNotificationsOpen((value) => !value)}>♢<i /></button>{notificationsOpen ? <div className="admin-notification-popover"><strong>Centro de notificações</strong><span>Sem novos alertas operacionais.</span><a href="#comunicacoes">Ver comunicações →</a></div> : null}</div>
      <div className="admin-profile-chip"><span className="admin-avatar">LM</span><span><strong>Leonardo Miguel</strong><small>Admin Principal</small></span></div>
    </div>
  </div>;
}
