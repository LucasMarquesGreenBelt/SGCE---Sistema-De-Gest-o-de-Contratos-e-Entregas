// ========================================================================
// SGCE - Sistema de Gestão de Contratos e Entregas
// ========================================================================

// ========== DATA STORE ==========
const DB = {
    get(key) { return JSON.parse(localStorage.getItem('gp_' + key) || '[]'); },
    set(key, data) { localStorage.setItem('gp_' + key, JSON.stringify(data)); },
    id() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 5); }
};

// ========== DOM HELPERS ==========
const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);

// ========== STATE ==========
let currentTab = 'dashboard';
let rcStatusFilter = 'Todas';
let dateFilterDe = '';
let dateFilterAte = '';

// ========== NAVIGATION ==========
function navigate(tab) {
    currentTab = tab;
    $$('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.tab === tab));
    closeSidebar();
    renderCurrentTab();
}

function renderCurrentTab() {
    const renderers = {
        dashboard: renderDashboard,
        materiais: renderMateriais,
        fornecedores: renderFornecedores,
        contratos: renderContratos,
        rcs: renderRCs,
        entregas: renderEntregas,
        pendencias: renderPendencias,
        email: renderEmailConfig
    };
    const titles = {
        dashboard: 'Dashboard',
        materiais: 'Materiais',
        fornecedores: 'Fornecedores',
        contratos: 'Contratos',
        rcs: 'Requisições de Compra',
        entregas: 'Controle de Entregas',
        pendencias: 'Pendências',
        email: 'Configuração de E-Mail'
    };
    const tab = currentTab;
    $('#headerTitle').textContent = titles[tab] || '';
    (renderers[tab] || renderDashboard)();
}

function toggleSidebar() {
    $('#sidebar').classList.toggle('open');
}

function closeSidebar() {
    $('#sidebar').classList.remove('open');
}

// ========== MODAL ==========
function openModal(title, html) {
    $('#modalTitle').textContent = title;
    $('#modalBody').innerHTML = html;
    $('#modalOverlay').classList.add('active');
}

function closeModal() {
    $('#modalOverlay').classList.remove('active');
}

function handleOverlayClick(e) {
    if (e.target === $('#modalOverlay')) closeModal();
}

// ========== TOAST ==========
function toast(msg, type = 'success') {
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.textContent = msg;
    $('#toastContainer').appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => {
        t.classList.remove('show');
        setTimeout(() => t.remove(), 300);
    }, 3000);
}

// ========== FORMATTING ==========
function fmt(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
}

function fmtDate(d) {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');
}

function escHtml(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ========== DATE HELPERS (BR FORMAT) ==========
function todayISO() {
    return new Date().toISOString().split('T')[0];
}

function dateToBR(iso) {
    if (!iso) return '';
    const p = iso.split('-');
    if (p.length !== 3) return iso;
    return p[2] + '/' + p[1] + '/' + p[0];
}

function brToISO(br) {
    if (!br) return '';
    const p = br.split('/');
    if (p.length !== 3) return '';
    return p[2] + '-' + p[1] + '-' + p[0];
}

function badge(text, color) {
    return `<span class="badge badge-${color}">${escHtml(text)}</span>`;
}

function contractStatusColor(s) {
    return { 'Ativo': 'green', 'Em Aprovação': 'blue', 'Inativo': 'gray', 'Vencido': 'red', 'Em Renovação': 'orange', 'Esgotado': 'purple' }[s] || 'gray';
}

function rcStatusColor(s) {
    return { 'Pendente': 'orange', 'Aprovada': 'blue', 'Em Andamento': 'purple', 'Concluída': 'green', 'Cancelada': 'red' }[s] || 'gray';
}

function entregaStatusColor(s) {
    return { 'Pendente': 'orange', 'Rota de Entrega': 'purple', 'Recebida': 'green', 'Parcial': 'blue', 'Devolvida': 'red' }[s] || 'gray';
}

// ========== SEARCH ICON HTML ==========
const searchIcon = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>`;

// ========== TABLE HELPER ==========
function renderTable(headers, rows, emptyMsg = 'Nenhum registro encontrado') {
    if (!rows || rows.length === 0) {
        return `<div class="table-container"><div class="empty-state">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
            <p>${emptyMsg}</p>
            <small>Clique em "Novo" para adicionar</small>
        </div></div>`;
    }
    return `<div class="table-container"><div class="table-responsive"><table class="table sortable-table">
        <thead><tr>${headers.map((h, i) => h ? `<th class="sortable-th" data-col="${i}" onclick="sortTableColumn(this, ${i})">${h} <span class="sort-icon">⇅</span></th>` : `<th></th>`).join('')}</tr></thead>
        <tbody>${rows.join('')}</tbody>
    </table></div></div>`;
}

function actionBtns(editFn, deleteFn, viewFn) {
    let html = '<div class="actions">';
    if (viewFn) html += `<button class="btn-icon" onclick="${viewFn}" title="Ver detalhes"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>`;
    html += `<button class="btn-icon" onclick="${editFn}" title="Editar"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>`;
    html += `<button class="btn-icon danger" onclick="${deleteFn}" title="Excluir"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>`;
    html += '</div>';
    return html;
}

// ========== CONFIRM DELETE ==========
function confirmDelete(name, callback) {
    openModal('Confirmar Exclusão', `
        <div class="confirm-text">Tem certeza que deseja excluir <strong>${escHtml(name)}</strong>?</div>
        <div class="confirm-warning">Esta ação não pode ser desfeita.</div>
        <div class="form-actions">
            <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-danger" onclick="closeModal(); ${callback}">Excluir</button>
        </div>
    `);
}


// ========================================================================
// DASHBOARD
// ========================================================================
function renderDashboard() {
    const materiais = DB.get('materiais');
    const fornecedores = DB.get('fornecedores');
    const contratos = DB.get('contratos');
    const rcs = DB.get('rcs');
    const entregas = DB.get('entregas');

    const pendencias = DB.get('pendencias');
    const contratosAtivos = contratos.filter(c => c.status === 'Ativo').length;
    const rcsPendentes = rcs.filter(r => r.status === 'Pendente' || r.status === 'Aprovada').length;
    const entregasPendentes = entregas.filter(e => e.status === 'Pendente' || e.status === 'Rota de Entrega').length;
    const pedidosSemRC = rcs.filter(r => r.semRC).length;
    const pendenciasAbertas = pendencias.filter(p => p.status === 'Aberta' || p.status === 'Em Andamento').length;

    // Contratos vencendo em 30 dias
    const hoje = new Date();
    const em30dias = new Date();
    em30dias.setDate(hoje.getDate() + 30);
    const hojeISO = hoje.toISOString().split('T')[0];
    const em30diasISO = em30dias.toISOString().split('T')[0];
    const contratosVencendo = contratos.filter(c => c.status === 'Ativo' && c.dataFim && c.dataFim >= hojeISO && c.dataFim <= em30diasISO);

    // Recent RCs
    const recentRcs = [...rcs].sort((a, b) => (b.dataCriacao || '').localeCompare(a.dataCriacao || '')).slice(0, 5);
    // Recent Deliveries
    const recentEntregas = [...entregas].sort((a, b) => (b.data || '').localeCompare(a.data || '')).slice(0, 5);

    $('#content').innerHTML = `
        <div class="page-header"><h2>Dashboard</h2></div>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon green">📦</div>
                <div class="stat-info">
                    <span class="stat-value">${materiais.length}</span>
                    <span class="stat-label">Materiais</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon blue">👥</div>
                <div class="stat-info">
                    <span class="stat-value">${fornecedores.length}</span>
                    <span class="stat-label">Fornecedores</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon purple">📋</div>
                <div class="stat-info">
                    <span class="stat-value">${contratosAtivos}</span>
                    <span class="stat-label">Contratos Ativos</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange">📝</div>
                <div class="stat-info">
                    <span class="stat-value">${rcsPendentes}</span>
                    <span class="stat-label">RCs Pendentes</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon red">🚚</div>
                <div class="stat-info">
                    <span class="stat-value">${entregasPendentes}</span>
                    <span class="stat-label">Entregas Pendentes</span>
                </div>
            </div>
            ${pendenciasAbertas > 0 ? `<div class="stat-card" onclick="navigate('pendencias')" style="cursor:pointer">
                <div class="stat-icon orange">⚠️</div>
                <div class="stat-info">
                    <span class="stat-value">${pendenciasAbertas}</span>
                    <span class="stat-label">Pendências Abertas</span>
                </div>
            </div>` : ''}
        </div>

        ${pedidosSemRC > 0 ? `<div style="margin-bottom:12px;padding:14px 20px;background:var(--warning-dim);border:1px solid rgba(255,165,2,0.25);border-radius:var(--radius-lg);display:flex;align-items:center;justify-content:space-between;gap:12px">
            <span style="font-size:13px;color:var(--warning)">⚠️ <strong>${pedidosSemRC}</strong> pedido${pedidosSemRC > 1 ? 's' : ''} pendente${pedidosSemRC > 1 ? 's' : ''} de regularização <span style="opacity:0.7">(sem RC)</span></span>
            <a onclick="navigate('rcs')" style="font-size:12px;color:var(--warning);white-space:nowrap;cursor:pointer">Ver pendências →</a>
        </div>` : ''}

        ${(() => {
            const entregasAtrasadas = entregas.filter(e => {
                if (e.status === 'Recebida' || e.status === 'Devolvida' || e.status === 'Parcial') return false;
                if (!e.dataPrevisao) return false;
                return e.dataPrevisao < hojeISO;
            });
            if (entregasAtrasadas.length === 0) return '';
            return `<div style="margin-bottom:12px;padding:14px 20px;background:var(--danger-dim);border:1px solid rgba(255,71,87,0.25);border-radius:var(--radius-lg)">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:${entregasAtrasadas.length > 1 ? '10px' : '0'}">
                    <span style="font-size:13px;color:var(--danger)">🚨 <strong>${entregasAtrasadas.length}</strong> entrega${entregasAtrasadas.length > 1 ? 's' : ''} em atraso</span>
                    <a onclick="navigate('entregas')" style="font-size:12px;color:var(--danger);white-space:nowrap;cursor:pointer">Ver entregas →</a>
                </div>
                ${entregasAtrasadas.slice(0, 5).map(e => {
                    const rc = rcs.find(r => r.id === e.rcId);
                    const diasAtraso = Math.ceil((hoje - new Date(e.dataPrevisao + 'T00:00:00')) / (1000 * 60 * 60 * 24));
                    const contrato = rc ? contratos.find(c => c.id === rc.contratoId) : null;
                    const forn = contrato ? fornecedores.find(f => f.id === contrato.fornecedorId) : null;
                    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-top:1px solid rgba(255,71,87,0.15);font-size:12px">
                        <span style="color:var(--text)">NF <strong>${escHtml(e.notaFiscal || '—')}</strong> — RC ${rc ? escHtml(rc.numero) : '—'} — ${forn ? escHtml(forn.nome) : '—'}</span>
                        <span style="color:var(--danger);font-weight:600">${diasAtraso} dia${diasAtraso !== 1 ? 's' : ''} de atraso</span>
                    </div>`;
                }).join('')}
                ${entregasAtrasadas.length > 5 ? `<div style="font-size:11px;color:var(--text-muted);padding-top:6px;border-top:1px solid rgba(255,71,87,0.15)">...e mais ${entregasAtrasadas.length - 5} entrega${entregasAtrasadas.length - 5 > 1 ? 's' : ''}</div>` : ''}
            </div>`;
        })()}

        ${contratosVencendo.length > 0 ? `<div style="margin-bottom:20px;padding:14px 20px;background:var(--danger-dim);border:1px solid rgba(255,71,87,0.25);border-radius:var(--radius-lg)">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:${contratosVencendo.length > 1 ? '10px' : '0'}">
                <span style="font-size:13px;color:var(--danger)">🔔 <strong>${contratosVencendo.length}</strong> contrato${contratosVencendo.length > 1 ? 's' : ''} vencendo nos próximos 30 dias</span>
                <a onclick="navigate('contratos')" style="font-size:12px;color:var(--danger);white-space:nowrap;cursor:pointer">Ver contratos →</a>
            </div>
            ${contratosVencendo.map(c => {
                const forn = fornecedores.find(f => f.id === c.fornecedorId);
                const diasRestantes = Math.ceil((new Date(c.dataFim + 'T00:00:00') - hoje) / (1000 * 60 * 60 * 24));
                return `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-top:1px solid rgba(255,71,87,0.15);font-size:12px">
                    <span style="color:var(--text)"><strong>${escHtml(c.numero)}</strong> — ${forn ? escHtml(forn.nome) : '—'}</span>
                    <span style="color:${diasRestantes <= 7 ? 'var(--danger)' : 'var(--warning)'};font-weight:600">${diasRestantes} dia${diasRestantes !== 1 ? 's' : ''} restante${diasRestantes !== 1 ? 's' : ''} (${fmtDate(c.dataFim)})</span>
                </div>`;
            }).join('')}
        </div>` : ''}

        <div class="dashboard-grid" style="margin-bottom:20px">
            <div class="dashboard-card">
                <div class="dashboard-card-header">
                    <h4>Últimas Requisições</h4>
                    <a onclick="navigate('rcs')" style="font-size:12px">Ver todas →</a>
                </div>
                <div class="dashboard-card-body">
                    ${recentRcs.length === 0 ? '<p style="color:var(--text-muted);font-size:13px">Nenhuma RC cadastrada</p>' : `
                    <div class="mini-list">
                        ${recentRcs.map(rc => {
                            const contrato = contratos.find(c => c.id === rc.contratoId);
                            return `<div class="mini-list-item">
                                <span><strong>${escHtml(rc.numero)}</strong> — ${contrato ? escHtml(contrato.numero) : '—'}</span>
                                ${badge(rc.status, rcStatusColor(rc.status))}
                            </div>`;
                        }).join('')}
                    </div>`}
                </div>
            </div>
            <div class="dashboard-card">
                <div class="dashboard-card-header">
                    <h4>Últimas Entregas</h4>
                    <a onclick="navigate('entregas')" style="font-size:12px">Ver todas →</a>
                </div>
                <div class="dashboard-card-body">
                    ${recentEntregas.length === 0 ? '<p style="color:var(--text-muted);font-size:13px">Nenhuma entrega cadastrada</p>' : `
                    <div class="mini-list">
                        ${recentEntregas.map(e => {
                            const rc = rcs.find(r => r.id === e.rcId);
                            return `<div class="mini-list-item">
                                <span><strong>NF ${escHtml(e.notaFiscal || '—')}</strong> — RC ${rc ? escHtml(rc.numero) : '—'}</span>
                                ${badge(e.status, entregaStatusColor(e.status))}
                            </div>`;
                        }).join('')}
                    </div>`}
                </div>
            </div>
        </div>

        <div class="dashboard-card">
            <div class="dashboard-card-header">
                <h4>Materiais — Visão Geral</h4>
                <a onclick="navigate('materiais')" style="font-size:12px">Gerenciar →</a>
            </div>
            <div class="dashboard-card-body">
                ${materiais.length === 0 ? '<p style="color:var(--text-muted);font-size:13px">Nenhum material cadastrado</p>' : `
                <div class="mat-overview-list">
                    ${materiais.map(m => {
                        const matFornecedores = fornecedores.filter(f => (f.materiaisIds || []).includes(m.id));
                        const matContratos = contratos.filter(c => c.materialId === m.id);
                        const matContratosAtivos = matContratos.filter(c => c.status === 'Ativo').length;
                        const matRcs = rcs.filter(r => r.materialId === m.id);
                        const matRcsAbertas = matRcs.filter(r => r.status === 'Pendente' || r.status === 'Aprovada' || r.status === 'Em Andamento').length;
                        return `<div class="mat-overview-item" onclick="viewMaterialDashboard('${m.id}')">
                            <div class="mat-overview-main">
                                <span class="mat-overview-code">${escHtml(m.codigoSap)}</span>
                                <span class="mat-overview-name">${escHtml(m.nome)}</span>
                                <span class="mat-overview-unit">${escHtml(m.unidade)}</span>
                            </div>
                            <div class="mat-overview-stats">
                                <span class="mat-overview-tag">${matFornecedores.length} fornec.</span>
                                <span class="mat-overview-tag">${matContratosAtivos} contr. ativos</span>
                                ${matRcsAbertas > 0 ? `<span class="mat-overview-tag warn">${matRcsAbertas} RC aberta${matRcsAbertas > 1 ? 's' : ''}</span>` : ''}
                            </div>
                        </div>`;
                    }).join('')}
                </div>`}
            </div>
        </div>

        <div class="dashboard-card" style="margin-top:20px">
            <div class="dashboard-card-header">
                <h4>📝 Notas Rápidas</h4>
                <span style="font-size:11px;color:var(--text-muted)">Salva automaticamente</span>
            </div>
            <div class="dashboard-card-body">
                <textarea id="quickNotesArea" class="form-control" rows="5" placeholder="Anote aqui suas observações rápidas..." style="font-size:13px;line-height:1.6;resize:vertical" oninput="saveQuickNotes(this.value)">${escHtml(getQuickNotes())}</textarea>
            </div>
        </div>
    `;
}

function viewMaterialDashboard(materialId) {
    const m = DB.get('materiais').find(x => x.id === materialId);
    if (!m) return;
    const fornecedores = DB.get('fornecedores');
    const contratos = DB.get('contratos');
    const rcs = DB.get('rcs');
    const entregas = DB.get('entregas');

    // Fornecedores que atendem este material
    const matFornecedores = fornecedores.filter(f => (f.materiaisIds || []).includes(materialId));
    // Contratos deste material
    const matContratos = contratos.filter(c => c.materialId === materialId);
    // RCs deste material
    const matRcs = rcs.filter(r => r.materialId === materialId);
    const rcsAbertas = matRcs.filter(r => r.status !== 'Concluída' && r.status !== 'Cancelada');
    const rcsConcluidas = matRcs.filter(r => r.status === 'Concluída');
    // Entregas vinculadas às RCs deste material
    const rcIds = matRcs.map(r => r.id);
    const matEntregas = entregas.filter(e => rcIds.includes(e.rcId));

    openModal(`${m.codigoSap} — ${m.nome}`, `
        <div class="detail-section">
            <h4>Informações do Material</h4>
            <div class="detail-grid">
                <div class="detail-item"><span class="label">Código SAP</span><span class="value">${escHtml(m.codigoSap)}</span></div>
                <div class="detail-item"><span class="label">Nome</span><span class="value">${escHtml(m.nome)}</span></div>
                <div class="detail-item"><span class="label">Unidade</span><span class="value">${escHtml(m.unidade)}</span></div>
                <div class="detail-item"><span class="label">Grupo</span><span class="value">${escHtml(m.grupo || '—')}</span></div>
                <div class="detail-item"><span class="label">Composição</span><span class="value">${escHtml(m.composicao || '—')}</span></div>
            </div>
        </div>

        <div class="detail-section">
            <h4>Fornecedores (${matFornecedores.length})</h4>
            ${matFornecedores.length > 0
                ? `<div class="mini-list">${matFornecedores.map(f => `<div class="mini-list-item">
                    <span><strong>${escHtml(f.nome)}</strong></span>
                    <span style="font-size:12px;color:var(--text-secondary)">${escHtml(f.telefone || '')} ${f.email ? '· ' + escHtml(f.email) : ''}</span>
                </div>`).join('')}</div>`
                : '<p style="color:var(--text-muted);font-size:13px">Nenhum fornecedor vinculado</p>'}
        </div>

        <div class="detail-section">
            <h4>Contratos (${matContratos.length})</h4>
            ${matContratos.length > 0
                ? `<div class="mini-list">${matContratos.map(c => {
                    const forn = fornecedores.find(f => f.id === c.fornecedorId);
                    return `<div class="mini-list-item">
                        <span><strong>${escHtml(c.numero)}</strong> — ${forn ? escHtml(forn.nome) : '?'} · ${fmtDate(c.dataInicio)} a ${fmtDate(c.dataFim)} · ${fmt(c.valor)}</span>
                        ${badge(c.status, contractStatusColor(c.status))}
                    </div>`;
                }).join('')}</div>`
                : '<p style="color:var(--text-muted);font-size:13px">Nenhum contrato</p>'}
        </div>

        <div class="detail-section">
            <h4>RCs Abertas (${rcsAbertas.length})</h4>
            ${rcsAbertas.length > 0
                ? `<div class="mini-list">${rcsAbertas.map(rc => {
                    const contrato = contratos.find(c => c.id === rc.contratoId);
                    return `<div class="mini-list-item">
                        <span><strong>${escHtml(rc.numero)}</strong> — Contrato ${contrato ? escHtml(contrato.numero) : '?'} · Qtd: ${rc.quantidade} ${m.unidade} · ${fmtDate(rc.data)}</span>
                        ${badge(rc.status, rcStatusColor(rc.status))}
                    </div>`;
                }).join('')}</div>`
                : '<p style="color:var(--text-muted);font-size:13px">Nenhuma RC aberta</p>'}
        </div>

        <div class="detail-section">
            <h4>Histórico de Entregas (${matEntregas.length})</h4>
            ${matEntregas.length > 0
                ? `<div class="mini-list">${matEntregas.sort((a,b) => (b.data||'').localeCompare(a.data||'')).map(e => {
                    const rc = rcs.find(r => r.id === e.rcId);
                    return `<div class="mini-list-item">
                        <span><strong>NF ${escHtml(e.notaFiscal || '—')}</strong> — RC ${rc ? escHtml(rc.numero) : '?'} · Qtd: ${e.quantidade} · ${fmtDate(e.data)}</span>
                        ${badge(e.status, entregaStatusColor(e.status))}
                    </div>`;
                }).join('')}</div>`
                : '<p style="color:var(--text-muted);font-size:13px">Nenhuma entrega registrada</p>'}
        </div>

        ${rcsConcluidas.length > 0 ? `<div class="detail-section">
            <h4>RCs Concluídas (${rcsConcluidas.length})</h4>
            <div class="mini-list">${rcsConcluidas.map(rc => {
                const contrato = contratos.find(c => c.id === rc.contratoId);
                return `<div class="mini-list-item">
                    <span><strong>${escHtml(rc.numero)}</strong> — Contrato ${contrato ? escHtml(contrato.numero) : '?'} · Qtd: ${rc.quantidade} ${m.unidade}</span>
                    ${badge(rc.status, rcStatusColor(rc.status))}
                </div>`;
            }).join('')}</div>
        </div>` : ''}

        <div class="form-actions">
            <button class="btn btn-secondary" onclick="closeModal()">Fechar</button>
        </div>
    `);
}


// ========================================================================
// MATERIAIS
// ========================================================================
function renderMateriais() {
    const data = DB.get('materiais');
    const searchHtml = `<div class="search-box">${searchIcon}<input class="search-input" placeholder="Buscar material..." oninput="filterMateriais(this.value)"></div>`;

    const rows = data.map(m => `<tr class="clickable-row" onclick="if(!event.target.closest('.actions'))verDetalhesMaterial('${m.id}')" data-search="${escHtml((m.codigoSap + ' ' + m.nome + ' ' + m.unidade).toLowerCase())}">
        <td><strong>${escHtml(m.codigoSap)}</strong></td>
        <td>${escHtml(m.nome)}</td>
        <td>${escHtml(m.unidade)}</td>
        <td>${escHtml(m.grupo || '—')}</td>
        <td>${escHtml(m.composicao || '—')}</td>
        <td class="col-actions"><div class="actions">
            <button class="btn-icon" onclick="editMaterial('${m.id}')" title="Editar"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
            <button class="btn-icon danger" onclick="deleteMaterial('${m.id}','${escHtml(m.nome)}')" title="Excluir"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>
        </div></td>
    </tr>`);

    $('#content').innerHTML = `
        <div class="page-header">
            <h2>Materiais</h2>
            <div class="page-actions">
                ${searchHtml}
                <button class="btn btn-secondary" onclick="exportCSV('materiais')" style="font-size:12px" title="Exportar CSV">📥 CSV</button>
                <button class="btn btn-primary" onclick="editMaterial()">+ Novo Material</button>
            </div>
        </div>
        ${renderTable(['Código SAP', 'Nome', 'Unidade', 'Grupo', 'Composição', ''], rows, 'Nenhum material cadastrado')}
    `;
}

function filterMateriais(q) {
    q = q.toLowerCase();
    $$('.table tbody tr').forEach(tr => {
        tr.style.display = tr.dataset.search.includes(q) ? '' : 'none';
    });
}

function editMaterial(id) {
    const item = id ? DB.get('materiais').find(m => m.id === id) : {};
    const title = id ? 'Editar Material' : 'Novo Material';

    openModal(title, `
        <div class="form-grid">
            <div class="form-group">
                <label>Código SAP <span class="required">*</span></label>
                <input class="form-control" id="fMatCodigoSap" value="${escHtml(item.codigoSap || '')}" placeholder="Ex: 10001234">
            </div>
            <div class="form-group">
                <label>Unidade <span class="required">*</span></label>
                <select class="form-control" id="fMatUnidade">
                    ${['UN', 'KG', 'G', 'M', 'M²', 'M³', 'L', 'ML', 'CX', 'PC', 'PAR', 'JG', 'RL', 'FD', 'PT', 'SC', 'TON'].map(u =>
                        `<option ${item.unidade === u ? 'selected' : ''}>${u}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="form-group full">
                <label>Nome do Material <span class="required">*</span></label>
                <input class="form-control" id="fMatNome" value="${escHtml(item.nome || '')}" placeholder="Descrição do material">
            </div>
            <div class="form-group">
                <label>Grupo</label>
                <input class="form-control" id="fMatGrupo" value="${escHtml(item.grupo || '')}" placeholder="Ex: Elétrico, Hidráulico...">
            </div>
            <div class="form-group">
                <label>Composição</label>
                <input class="form-control" id="fMatComposicao" value="${escHtml(item.composicao || '')}" placeholder="Ex: Aço, Plástico...">
            </div>
        </div>
        <div class="form-actions">
            <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="saveMaterial('${id || ''}')">Salvar</button>
        </div>
    `);
}

function saveMaterial(id) {
    const codigoSap = $('#fMatCodigoSap').value.trim();
    const nome = $('#fMatNome').value.trim();
    const unidade = $('#fMatUnidade').value;
    const grupo = $('#fMatGrupo').value.trim();
    const composicao = $('#fMatComposicao').value.trim();

    if (!codigoSap || !nome) { toast('Preencha os campos obrigatórios', 'error'); return; }

    const data = DB.get('materiais');
    if (id) {
        const idx = data.findIndex(m => m.id === id);
        if (idx >= 0) data[idx] = { ...data[idx], codigoSap, nome, unidade, grupo, composicao };
    } else {
        data.push({ id: DB.id(), codigoSap, nome, unidade, grupo, composicao });
    }
    DB.set('materiais', data);
    closeModal();
    toast(id ? 'Material atualizado!' : 'Material cadastrado!');
    renderMateriais();
}

function deleteMaterial(id, nome) {
    confirmDelete(nome, `doDeleteMaterial('${id}')`);
}

function doDeleteMaterial(id) {
    const data = DB.get('materiais').filter(m => m.id !== id);
    DB.set('materiais', data);
    toast('Material excluído!');
    renderMateriais();
}


function verDetalhesMaterial(matId) {
    const mat = DB.get('materiais').find(m => m.id === matId);
    if (!mat) return;
    const fornecedores = DB.get('fornecedores').filter(f => (f.materiaisIds || []).includes(matId));
    const contratos = DB.get('contratos').filter(c => c.materialId === matId);
    const rcs = DB.get('rcs').filter(r => r.materialId === matId);
    const rcIds = rcs.map(r => r.id);
    const entregas = DB.get('entregas').filter(e => rcIds.includes(e.rcId));

    const fornHtml = fornecedores.length > 0
        ? fornecedores.map(f => `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
            <span style="font-size:13px"><strong>${escHtml(f.nome)}</strong> · ${escHtml(f.cnpj || '—')}</span>
            <span style="font-size:12px;color:var(--text-secondary)">${escHtml(f.email || '—')}</span>
        </div>`).join('')
        : '<p style="color:var(--text-muted);font-size:13px;padding:8px 0">Nenhum fornecedor vinculado</p>';

    const contratosHtml = contratos.length > 0
        ? contratos.map(c => {
            const forn = DB.get('fornecedores').find(f => f.id === c.fornecedorId);
            return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
                <span style="font-size:13px"><strong>${escHtml(c.numero)}</strong> · ${forn ? escHtml(forn.nome) : '—'} · ${fmt(c.valor)}</span>
                ${badge(c.status, contractStatusColor(c.status))}
            </div>`;
        }).join('')
        : '<p style="color:var(--text-muted);font-size:13px;padding:8px 0">Nenhum contrato vinculado</p>';

    const rcsHtml = rcs.length > 0
        ? rcs.slice(0, 10).map(rc => `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
            <span style="font-size:13px"><strong>${escHtml(rc.numero)}</strong> · ${rc.quantidade || 0} ${mat.unidade} · ${fmtDate(rc.data)}</span>
            ${badge(rc.status, rcStatusColor(rc.status))}
        </div>`).join('') + (rcs.length > 10 ? `<div style="font-size:12px;color:var(--text-muted);padding:6px 0">...e mais ${rcs.length - 10}</div>` : '')
        : '<p style="color:var(--text-muted);font-size:13px;padding:8px 0">Nenhuma RC vinculada</p>';

    const entregasHtml = entregas.length > 0
        ? entregas.slice(0, 10).map(e => `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
            <span style="font-size:13px">NF <strong>${escHtml(e.notaFiscal || '—')}</strong> · ${e.quantidade || 0} ${mat.unidade} · ${fmtDate(e.data)}</span>
            ${badge(e.status, entregaStatusColor(e.status))}
        </div>`).join('') + (entregas.length > 10 ? `<div style="font-size:12px;color:var(--text-muted);padding:6px 0">...e mais ${entregas.length - 10}</div>` : '')
        : '<p style="color:var(--text-muted);font-size:13px;padding:8px 0">Nenhuma entrega vinculada</p>';

    openModal('Detalhes — ' + mat.nome, `
        <div style="display:grid;gap:16px">
            <div style="padding:14px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--neon);margin-bottom:8px;letter-spacing:0.5px">Material</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
                    <div><span style="font-size:11px;color:var(--text-muted)">Código SAP</span><div style="font-weight:600">${escHtml(mat.codigoSap)}</div></div>
                    <div><span style="font-size:11px;color:var(--text-muted)">Unidade</span><div style="font-weight:600">${escHtml(mat.unidade)}</div></div>
                    <div><span style="font-size:11px;color:var(--text-muted)">Nome</span><div style="font-weight:600">${escHtml(mat.nome)}</div></div>
                    <div><span style="font-size:11px;color:var(--text-muted)">Grupo</span><div>${escHtml(mat.grupo || '—')}</div></div>
                </div>
            </div>
            <div style="padding:14px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--neon);margin-bottom:8px;letter-spacing:0.5px">Fornecedores (${fornecedores.length})</div>
                ${fornHtml}
            </div>
            <div style="padding:14px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--neon);margin-bottom:8px;letter-spacing:0.5px">Contratos (${contratos.length})</div>
                ${contratosHtml}
            </div>
            <div style="padding:14px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--neon);margin-bottom:8px;letter-spacing:0.5px">Requisições (${rcs.length})</div>
                ${rcsHtml}
            </div>
            <div style="padding:14px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--neon);margin-bottom:8px;letter-spacing:0.5px">Entregas (${entregas.length})</div>
                ${entregasHtml}
            </div>
        </div>
        <div class="form-actions" style="margin-top:16px">
            <button class="btn btn-secondary" onclick="closeModal()">Fechar</button>
        </div>
    `);
}


// ========================================================================
// FORNECEDORES
// ========================================================================
function renderFornecedores() {
    const data = DB.get('fornecedores');
    const materiais = DB.get('materiais');
    const searchHtml = `<div class="search-box">${searchIcon}<input class="search-input" placeholder="Buscar fornecedor..." oninput="filterTable(this.value)"></div>`;

    const rows = data.map(f => {
        const matNames = (f.materiaisIds || []).map(mid => {
            const mat = materiais.find(m => m.id === mid);
            return mat ? mat.nome : '';
        }).filter(Boolean);
        const matDisplay = matNames.length > 2 ? matNames.slice(0,2).join(', ') + ` +${matNames.length-2}` : matNames.join(', ') || '—';

        return `<tr class="clickable-row" onclick="if(!event.target.closest('.actions'))viewFornecedor('${f.id}')" data-search="${escHtml((f.nome + ' ' + f.cnpj + ' ' + f.email + ' ' + f.responsavel).toLowerCase())}">
            <td><strong>${escHtml(f.nome)}</strong></td>
            <td>${escHtml(f.cnpj || '—')}</td>
            <td>${escHtml(f.telefone || '—')}</td>
            <td>${escHtml(f.email || '—')}</td>
            <td>${escHtml(f.responsavel || '—')}</td>
            <td><span style="font-size:12px;color:var(--text-secondary)">${escHtml(matDisplay)}</span></td>
            <td class="col-actions">${actionBtns(`editFornecedor('${f.id}')`, `deleteFornecedor('${f.id}','${escHtml(f.nome)}')`)}</td>
        </tr>`;
    });

    $('#content').innerHTML = `
        <div class="page-header">
            <h2>Fornecedores</h2>
            <div class="page-actions">
                ${searchHtml}
                <button class="btn btn-secondary" onclick="exportCSV('fornecedores')" style="font-size:12px" title="Exportar CSV">📥 CSV</button>
                <button class="btn btn-secondary" onclick="openRelatorioFornecedor()" style="font-size:12px">🖨️ Relatório</button>
                <button class="btn btn-primary" onclick="editFornecedor()">+ Novo Fornecedor</button>
            </div>
        </div>
        ${renderTable(['Nome', 'CNPJ', 'Telefone', 'Email', 'Responsável', 'Materiais', ''], rows, 'Nenhum fornecedor cadastrado')}
    `;
}

function filterTable(q) {
    q = q.toLowerCase();
    $$('.table tbody tr').forEach(tr => {
        tr.style.display = tr.dataset.search.includes(q) ? '' : 'none';
    });
}

function editFornecedor(id) {
    const item = id ? DB.get('fornecedores').find(f => f.id === id) : {};
    const materiais = DB.get('materiais');
    const selectedIds = item.materiaisIds || [];
    const title = id ? 'Editar Fornecedor' : 'Novo Fornecedor';

    const matCheckboxes = materiais.length > 0
        ? `<div class="checkbox-grid">${materiais.map(m =>
            `<label class="checkbox-item"><input type="checkbox" value="${m.id}" ${selectedIds.includes(m.id) ? 'checked' : ''}> ${escHtml(m.codigoSap)} - ${escHtml(m.nome)}</label>`
          ).join('')}</div>`
        : '<p style="color:var(--text-muted);font-size:13px">Cadastre materiais primeiro</p>';

    openModal(title, `
        <div class="form-grid">
            <div class="form-group full">
                <label>Nome / Razão Social <span class="required">*</span></label>
                <input class="form-control" id="fFornNome" value="${escHtml(item.nome || '')}">
            </div>
            <div class="form-group">
                <label>CNPJ</label>
                <input class="form-control" id="fFornCnpj" value="${escHtml(item.cnpj || '')}" placeholder="00.000.000/0000-00">
            </div>
            <div class="form-group">
                <label>Telefone</label>
                <input class="form-control" id="fFornTel" value="${escHtml(item.telefone || '')}" placeholder="(00) 00000-0000">
            </div>
            <div class="form-group">
                <label>Email</label>
                <input class="form-control" id="fFornEmail" type="email" value="${escHtml(item.email || '')}">
            </div>
            <div class="form-group">
                <label>Responsável</label>
                <input class="form-control" id="fFornResp" value="${escHtml(item.responsavel || '')}">
            </div>
            <div class="form-group full">
                <label>Endereço</label>
                <input class="form-control" id="fFornEndereco" value="${escHtml(item.endereco || '')}">
            </div>
            <div class="form-group">
                <label>Contato Adicional</label>
                <input class="form-control" id="fFornContato" value="${escHtml(item.contato || '')}" placeholder="Informações adicionais de contato">
            </div>
            <div class="form-group">
                <label>Lead Time (dias de entrega)</label>
                <input class="form-control" id="fFornLeadTime" type="number" min="0" value="${item.leadTime || ''}" placeholder="Ex: 15">
            </div>
            <div class="form-group full">
                <label>Materiais que Atende</label>
                ${matCheckboxes}
            </div>
            <div class="form-group full">
                <label>Observações</label>
                <textarea class="form-control" id="fFornObs" rows="3">${escHtml(item.observacoes || '')}</textarea>
            </div>
        </div>
        <div class="form-actions">
            <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="saveFornecedor('${id || ''}')">Salvar</button>
        </div>
    `);
}

function saveFornecedor(id) {
    const nome = $('#fFornNome').value.trim();
    if (!nome) { toast('Informe o nome do fornecedor', 'error'); return; }

    const materiaisIds = [...$$('#modalBody .checkbox-grid input:checked')].map(cb => cb.value);

    const obj = {
        nome,
        cnpj: $('#fFornCnpj').value.trim(),
        telefone: $('#fFornTel').value.trim(),
        email: $('#fFornEmail').value.trim(),
        responsavel: $('#fFornResp').value.trim(),
        endereco: $('#fFornEndereco').value.trim(),
        contato: $('#fFornContato').value.trim(),
        leadTime: parseInt($('#fFornLeadTime').value) || 0,
        observacoes: $('#fFornObs').value.trim(),
        materiaisIds
    };

    const data = DB.get('fornecedores');
    if (id) {
        const idx = data.findIndex(f => f.id === id);
        if (idx >= 0) data[idx] = { ...data[idx], ...obj };
    } else {
        obj.id = DB.id();
        data.push(obj);
    }
    DB.set('fornecedores', data);
    closeModal();
    toast(id ? 'Fornecedor atualizado!' : 'Fornecedor cadastrado!');
    renderFornecedores();
}

function deleteFornecedor(id, nome) {
    confirmDelete(nome, `doDeleteFornecedor('${id}')`);
}

function doDeleteFornecedor(id) {
    DB.set('fornecedores', DB.get('fornecedores').filter(f => f.id !== id));
    toast('Fornecedor excluído!');
    renderFornecedores();
}

function viewFornecedor(id) {
    const f = DB.get('fornecedores').find(x => x.id === id);
    if (!f) return;
    const materiais = DB.get('materiais');
    const contratos = DB.get('contratos').filter(c => c.fornecedorId === id);
    const contratoIds = contratos.map(c => c.id);
    const rcs = DB.get('rcs').filter(r => contratoIds.includes(r.contratoId));
    const rcIds = rcs.map(r => r.id);
    const entregas = DB.get('entregas').filter(e => rcIds.includes(e.rcId));

    // Calcular prazo médio de entrega
    const entregasRecebidas = entregas.filter(e => (e.status === 'Recebida' || e.status === 'Parcial') && e.dataRecebimento && e.data);
    let prazoMedioHtml = '';
    if (entregasRecebidas.length > 0) {
        const totalDias = entregasRecebidas.reduce((soma, e) => {
            const dataInicio = new Date(e.data + 'T00:00:00');
            const dataFim = new Date(e.dataRecebimento + 'T00:00:00');
            return soma + Math.max(0, Math.ceil((dataFim - dataInicio) / (1000 * 60 * 60 * 24)));
        }, 0);
        const media = Math.round(totalDias / entregasRecebidas.length);
        const mediaColor = media <= (f.leadTime || 999) ? 'var(--neon)' : 'var(--danger)';
        prazoMedioHtml = `<div><span style="font-size:11px;color:var(--text-muted)">Prazo Médio Real</span><div style="color:${mediaColor};font-weight:700">${media} dias <span style="font-size:11px;font-weight:400;color:var(--text-secondary)">(${entregasRecebidas.length} entrega${entregasRecebidas.length > 1 ? 's' : ''})</span></div></div>`;
    }

    const matNames = (f.materiaisIds || []).map(mid => {
        const m = materiais.find(x => x.id === mid);
        return m ? m : null;
    }).filter(Boolean);

    const matHtml = matNames.length > 0
        ? matNames.map(m => `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
            <span style="font-size:13px"><strong>${escHtml(m.codigoSap)}</strong> — ${escHtml(m.nome)}</span>
            <span style="font-size:12px;color:var(--text-secondary)">${escHtml(m.unidade)}</span>
        </div>`).join('')
        : '<p style="color:var(--text-muted);font-size:13px;padding:8px 0">Nenhum material vinculado</p>';

    const contratosHtml = contratos.length > 0
        ? contratos.map(c => {
            const mat = materiais.find(m => m.id === c.materialId);
            return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
                <span style="font-size:13px"><strong>${escHtml(c.numero)}</strong> · ${mat ? escHtml(mat.nome) : '—'} · ${fmt(c.valor)}</span>
                ${badge(c.status, contractStatusColor(c.status))}
            </div>`;
        }).join('')
        : '<p style="color:var(--text-muted);font-size:13px;padding:8px 0">Nenhum contrato vinculado</p>';

    const rcsHtml = rcs.length > 0
        ? rcs.slice(0, 10).map(rc => {
            const mat = materiais.find(m => m.id === rc.materialId);
            return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
                <span style="font-size:13px"><strong>${escHtml(rc.numero)}</strong> · ${mat ? escHtml(mat.nome) : '—'} · ${fmtDate(rc.data)}</span>
                ${badge(rc.status, rcStatusColor(rc.status))}
            </div>`;
        }).join('') + (rcs.length > 10 ? `<div style="font-size:12px;color:var(--text-muted);padding:6px 0">...e mais ${rcs.length - 10}</div>` : '')
        : '<p style="color:var(--text-muted);font-size:13px;padding:8px 0">Nenhuma RC vinculada</p>';

    const entregasHtml = entregas.length > 0
        ? entregas.slice(0, 10).map(e => `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
            <span style="font-size:13px">NF <strong>${escHtml(e.notaFiscal || '—')}</strong> · ${e.quantidade || 0} un · ${fmtDate(e.data)}</span>
            ${badge(e.status, entregaStatusColor(e.status))}
        </div>`).join('') + (entregas.length > 10 ? `<div style="font-size:12px;color:var(--text-muted);padding:6px 0">...e mais ${entregas.length - 10}</div>` : '')
        : '<p style="color:var(--text-muted);font-size:13px;padding:8px 0">Nenhuma entrega vinculada</p>';

    openModal('Detalhes — ' + f.nome, `
        <div style="display:grid;gap:16px">
            <div style="padding:14px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--neon);margin-bottom:8px;letter-spacing:0.5px">Fornecedor</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
                    <div><span style="font-size:11px;color:var(--text-muted)">Nome</span><div style="font-weight:600">${escHtml(f.nome)}</div></div>
                    <div><span style="font-size:11px;color:var(--text-muted)">CNPJ</span><div>${escHtml(f.cnpj || '—')}</div></div>
                    <div><span style="font-size:11px;color:var(--text-muted)">Telefone</span><div>${escHtml(f.telefone || '—')}</div></div>
                    <div><span style="font-size:11px;color:var(--text-muted)">Email</span><div>${escHtml(f.email || '—')}</div></div>
                    <div><span style="font-size:11px;color:var(--text-muted)">Responsável</span><div>${escHtml(f.responsavel || '—')}</div></div>
                    <div><span style="font-size:11px;color:var(--text-muted)">Lead Time</span><div>${f.leadTime ? f.leadTime + ' dias' : '—'}</div></div>
                    ${prazoMedioHtml}
                    ${f.endereco ? `<div style="grid-column:1/-1"><span style="font-size:11px;color:var(--text-muted)">Endereço</span><div>${escHtml(f.endereco)}</div></div>` : ''}
                </div>
            </div>
            <div style="padding:14px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--neon);margin-bottom:8px;letter-spacing:0.5px">Materiais (${matNames.length})</div>
                ${matHtml}
            </div>
            <div style="padding:14px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--neon);margin-bottom:8px;letter-spacing:0.5px">Contratos (${contratos.length})</div>
                ${contratosHtml}
            </div>
            <div style="padding:14px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--neon);margin-bottom:8px;letter-spacing:0.5px">Requisições (${rcs.length})</div>
                ${rcsHtml}
            </div>
            <div style="padding:14px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--neon);margin-bottom:8px;letter-spacing:0.5px">Entregas (${entregas.length})</div>
                ${entregasHtml}
            </div>
            ${f.observacoes ? `<div style="padding:14px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--neon);margin-bottom:8px;letter-spacing:0.5px">Observações</div>
                <div style="font-size:13px;color:var(--text-secondary);white-space:pre-wrap">${escHtml(f.observacoes)}</div>
            </div>` : ''}
        </div>
        <div class="form-actions" style="margin-top:16px">
            <button class="btn btn-secondary" onclick="closeModal()">Fechar</button>
            <button class="btn btn-primary" onclick="closeModal(); editFornecedor('${id}')">Editar</button>
        </div>
    `);
}


// ========================================================================
// CONTRATOS
// ========================================================================
function renderContratos() {
    const data = DB.get('contratos');
    const fornecedores = DB.get('fornecedores');
    const searchHtml = `<div class="search-box">${searchIcon}<input class="search-input" placeholder="Buscar contrato..." oninput="filterTable(this.value)"></div>`;

    const matList = DB.get('materiais');
    const allRcs = DB.get('rcs');

    const rows = data.map(c => {
        const forn = fornecedores.find(f => f.id === c.fornecedorId);
        const mat = matList.find(m => m.id === c.materialId);
        const qtdTotal = c.quantidadeContratada || 0;
        const qtdUsada = allRcs.filter(r => r.contratoId === c.id && r.status !== 'Cancelada').reduce((s, r) => s + (parseFloat(r.quantidade) || 0), 0);
        const qtdDisp = qtdTotal - qtdUsada;
        const pct = qtdTotal > 0 ? (qtdDisp / qtdTotal) * 100 : 0;
        const unidade = mat ? mat.unidade : '';
        const pctUsed = qtdTotal > 0 ? (qtdUsada / qtdTotal) * 100 : 0;
        const barColor = pctUsed < 70 ? 'var(--neon)' : pctUsed < 90 ? 'var(--warning)' : 'var(--danger)';
        const progressHtml = qtdTotal > 0
            ? `<div class="progress-bar-container"><div class="progress-bar-fill" style="width:${Math.min(pctUsed, 100)}%;background:${barColor}"></div></div><span style="font-size:11px;color:var(--text-secondary)">${qtdUsada}/${qtdTotal} ${escHtml(unidade)} (${Math.round(pctUsed)}%)</span>`
            : '<span style="color:var(--text-muted)">—</span>';
        const aditivosCount = (c.aditivos || []).length;

        return `<tr class="clickable-row" onclick="if(!event.target.closest('.actions'))verDetalhesContrato('${c.id}')" data-search="${escHtml((c.numero + ' ' + c.descricao + ' ' + (forn ? forn.nome : '') + ' ' + (mat ? mat.nome : '')).toLowerCase())}">
            <td><strong>${escHtml(c.numero)}</strong>${aditivosCount > 0 ? ` <span style="font-size:10px;color:var(--info)">(${aditivosCount} adit.)</span>` : ''}</td>
            <td>${forn ? escHtml(forn.nome) : '<span style="color:var(--text-muted)">—</span>'}</td>
            <td>${mat ? escHtml(mat.nome) : '<span style="color:var(--text-muted)">—</span>'}</td>
            <td>${progressHtml}</td>
            <td>${fmt(c.precoUnitario || 0)}</td>
            <td>${fmt(c.valor)}</td>
            <td>${fmtDate(c.dataInicio)} — ${fmtDate(c.dataFim)}</td>
            <td>${badge(c.status, contractStatusColor(c.status))}</td>
            <td class="col-actions"><div class="actions">
                <button class="btn-icon" onclick="viewAditivos('${c.id}')" title="Aditivos"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg></button>
                <button class="btn-icon" onclick="editContrato('${c.id}')" title="Editar"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                <button class="btn-icon danger" onclick="deleteContrato('${c.id}','${escHtml(c.numero)}')" title="Excluir"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>
            </div></td>
        </tr>`;
    });

    $('#content').innerHTML = `
        <div class="page-header">
            <h2>Contratos</h2>
            <div class="page-actions">
                ${searchHtml}
                <button class="btn btn-secondary" onclick="exportCSV('contratos')" style="font-size:12px" title="Exportar CSV">📥 CSV</button>
                <button class="btn btn-primary" onclick="editContrato()">+ Novo Contrato</button>
            </div>
        </div>
        ${renderTable(['Nº Contrato', 'Fornecedor', 'Material', 'Consumo', 'Preço Unit.', 'Valor Total', 'Vigência', 'Status', ''], rows, 'Nenhum contrato cadastrado')}
    `;
}

function editContrato(id) {
    const item = id ? DB.get('contratos').find(c => c.id === id) : {};
    const fornecedores = DB.get('fornecedores');
    const title = id ? 'Editar Contrato' : 'Novo Contrato';

    if (fornecedores.length === 0) {
        openModal('Aviso', `
            <p style="margin-bottom:16px">Cadastre pelo menos um fornecedor antes de criar um contrato.</p>
            <div class="form-actions"><button class="btn btn-primary" onclick="closeModal(); navigate('fornecedores')">Ir para Fornecedores</button></div>
        `);
        return;
    }

    openModal(title, `
        <div class="form-grid">
            <div class="form-group">
                <label>Nº do Contrato <span class="required">*</span></label>
                <input class="form-control" id="fConNumero" value="${escHtml(item.numero || '')}">
            </div>
            <div class="form-group">
                <label>Fornecedor <span class="required">*</span></label>
                <select class="form-control" id="fConFornecedor" onchange="onContratoFornecedorChange()">
                    <option value="">Selecione...</option>
                    ${fornecedores.map(f => `<option value="${f.id}" ${item.fornecedorId === f.id ? 'selected' : ''}>${escHtml(f.nome)}</option>`).join('')}
                </select>
            </div>
            <div class="form-group full">
                <label>Material <span class="required">*</span></label>
                <select class="form-control" id="fConMaterial">
                    <option value="">Selecione o fornecedor primeiro</option>
                </select>
            </div>
            <div class="form-group full">
                <label>Descrição</label>
                <input class="form-control" id="fConDescricao" value="${escHtml(item.descricao || '')}">
            </div>
            <div class="form-group">
                <label>Quantidade Contratada <span class="required">*</span></label>
                <input class="form-control" id="fConQtd" type="number" step="0.01" value="${item.quantidadeContratada || ''}" oninput="calcContratoTotal()">
            </div>
            <div class="form-group">
                <label>Preço Unitário (R$) <span class="required">*</span></label>
                <input class="form-control" id="fConPrecoUnit" type="number" step="0.01" value="${item.precoUnitario || ''}" oninput="calcContratoTotal()">
            </div>
            <div class="form-group">
                <label>Valor Total (R$)</label>
                <input class="form-control" id="fConValor" type="text" value="${fmt(item.valor || 0)}" readonly style="opacity:0.7;cursor:default">
            </div>
            <div class="form-group">
                <label>Data Início</label>
                <input class="form-control" id="fConInicio" type="text" value="${dateToBR(item.dataInicio)}" placeholder="DD/MM/AAAA" maxlength="10">
            </div>
            <div class="form-group">
                <label>Data Fim</label>
                <input class="form-control" id="fConFim" type="text" value="${dateToBR(item.dataFim)}" placeholder="DD/MM/AAAA" maxlength="10">
            </div>
            <div class="form-group">
                <label>Status</label>
                <select class="form-control" id="fConStatus">
                    ${['Ativo', 'Em Aprovação', 'Inativo', 'Vencido', 'Em Renovação', 'Esgotado'].map(s => `<option ${item.status === s ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
            </div>
            <div class="form-group full">
                <label>Observações</label>
                <textarea class="form-control" id="fConObs" rows="3">${escHtml(item.observacoes || '')}</textarea>
            </div>
        </div>
        <div class="form-actions">
            <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="saveContrato('${id || ''}')">Salvar</button>
        </div>
    `);

    // Populate material dropdown if editing
    if (item.fornecedorId) {
        onContratoFornecedorChange(item.materialId);
    }
}

function calcContratoTotal() {
    const qtd = parseFloat($('#fConQtd').value) || 0;
    const preco = parseFloat($('#fConPrecoUnit').value) || 0;
    $('#fConValor').value = fmt(qtd * preco);
}

function onContratoFornecedorChange(selectedMaterialId) {
    const fornecedorId = $('#fConFornecedor').value;
    const select = $('#fConMaterial');
    select.innerHTML = '<option value="">Selecione...</option>';
    if (!fornecedorId) { select.innerHTML = '<option value="">Selecione o fornecedor primeiro</option>'; return; }
    const fornecedor = DB.get('fornecedores').find(f => f.id === fornecedorId);
    if (!fornecedor) return;
    const materiais = DB.get('materiais');
    const fornMats = (fornecedor.materiaisIds || []).map(mid => materiais.find(m => m.id === mid)).filter(Boolean);
    if (fornMats.length === 0) { select.innerHTML = '<option value="">Nenhum material vinculado ao fornecedor</option>'; return; }
    select.innerHTML = '<option value="">Selecione...</option>' + fornMats.map(m =>
        `<option value="${m.id}" ${selectedMaterialId === m.id ? 'selected' : ''}>${escHtml(m.codigoSap)} - ${escHtml(m.nome)} (${m.unidade})</option>`
    ).join('');
}

function saveContrato(id) {
    const numero = $('#fConNumero').value.trim();
    const fornecedorId = $('#fConFornecedor').value;
    const materialId = $('#fConMaterial').value;
    if (!numero || !fornecedorId || !materialId) { toast('Preencha número, fornecedor e material', 'error'); return; }

    const quantidadeContratada = parseFloat($('#fConQtd').value) || 0;
    const precoUnitario = parseFloat($('#fConPrecoUnit').value) || 0;

    if (!quantidadeContratada || !precoUnitario) { toast('Preencha quantidade e preço unitário', 'error'); return; }

    const obj = {
        numero,
        fornecedorId,
        materialId,
        descricao: $('#fConDescricao').value.trim(),
        quantidadeContratada,
        precoUnitario,
        valor: quantidadeContratada * precoUnitario,
        dataInicio: brToISO($('#fConInicio').value),
        dataFim: brToISO($('#fConFim').value),
        status: $('#fConStatus').value,
        observacoes: $('#fConObs').value.trim()
    };

    const data = DB.get('contratos');
    if (id) {
        const idx = data.findIndex(c => c.id === id);
        if (idx >= 0) data[idx] = { ...data[idx], ...obj };
    } else {
        obj.id = DB.id();
        data.push(obj);
    }
    DB.set('contratos', data);
    closeModal();
    toast(id ? 'Contrato atualizado!' : 'Contrato cadastrado!');
    renderContratos();
}

function deleteContrato(id, nome) {
    confirmDelete(nome, `doDeleteContrato('${id}')`);
}

function doDeleteContrato(id) {
    DB.set('contratos', DB.get('contratos').filter(c => c.id !== id));
    toast('Contrato excluído!');
    renderContratos();
}

function verDetalhesContrato(contratoId) {
    const c = DB.get('contratos').find(x => x.id === contratoId);
    if (!c) return;
    const fornecedores = DB.get('fornecedores');
    const materiais = DB.get('materiais');
    const forn = fornecedores.find(f => f.id === c.fornecedorId);
    const mat = materiais.find(m => m.id === c.materialId);
    const allRcs = DB.get('rcs');
    const rcs = allRcs.filter(r => r.contratoId === contratoId);
    const rcIds = rcs.map(r => r.id);
    const entregas = DB.get('entregas').filter(e => rcIds.includes(e.rcId));
    const aditivos = c.aditivos || [];

    const qtdUsada = rcs.filter(r => r.status !== 'Cancelada').reduce((s, r) => s + (parseFloat(r.quantidade) || 0), 0);
    const qtdTotal = c.quantidadeContratada || 0;
    const pctUsed = qtdTotal > 0 ? (qtdUsada / qtdTotal) * 100 : 0;
    const barColor = pctUsed < 70 ? 'var(--neon)' : pctUsed < 90 ? 'var(--warning)' : 'var(--danger)';

    const rcsHtml = rcs.length > 0
        ? rcs.slice(0, 10).map(rc => `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
            <span style="font-size:13px"><strong>${escHtml(rc.numero)}</strong> · ${rc.quantidade || 0} ${mat ? mat.unidade : ''} · ${fmtDate(rc.data)}</span>
            ${badge(rc.status, rcStatusColor(rc.status))}
        </div>`).join('') + (rcs.length > 10 ? `<div style="font-size:12px;color:var(--text-muted);padding:6px 0">...e mais ${rcs.length - 10}</div>` : '')
        : '<p style="color:var(--text-muted);font-size:13px;padding:8px 0">Nenhuma RC vinculada</p>';

    const entregasHtml = entregas.length > 0
        ? entregas.slice(0, 10).map(e => `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
            <span style="font-size:13px">NF <strong>${escHtml(e.notaFiscal || '—')}</strong> · ${e.quantidade || 0} un · ${fmtDate(e.data)}</span>
            ${badge(e.status, entregaStatusColor(e.status))}
        </div>`).join('') + (entregas.length > 10 ? `<div style="font-size:12px;color:var(--text-muted);padding:6px 0">...e mais ${entregas.length - 10}</div>` : '')
        : '<p style="color:var(--text-muted);font-size:13px;padding:8px 0">Nenhuma entrega vinculada</p>';

    const aditivosHtml = aditivos.length > 0
        ? aditivos.map(a => `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
            <span style="font-size:13px">${badge(a.tipo, a.tipo === 'Quantidade' ? 'blue' : a.tipo === 'Prazo' ? 'orange' : 'green')} ${a.valorAnterior} → <strong>${a.valorNovo}</strong></span>
            <span style="font-size:12px;color:var(--text-secondary)">${fmtDate(a.data)}</span>
        </div>`).join('')
        : '<p style="color:var(--text-muted);font-size:13px;padding:8px 0">Nenhum aditivo</p>';

    openModal('Detalhes — ' + c.numero, `
        <div style="display:grid;gap:16px">
            <div style="padding:14px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--neon);margin-bottom:8px;letter-spacing:0.5px">Contrato</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
                    <div><span style="font-size:11px;color:var(--text-muted)">Nº Contrato</span><div style="font-weight:600">${escHtml(c.numero)}</div></div>
                    <div><span style="font-size:11px;color:var(--text-muted)">Status</span><div>${badge(c.status, contractStatusColor(c.status))}</div></div>
                    <div><span style="font-size:11px;color:var(--text-muted)">Vigência</span><div>${fmtDate(c.dataInicio)} a ${fmtDate(c.dataFim)}</div></div>
                    <div><span style="font-size:11px;color:var(--text-muted)">Valor Total</span><div style="font-weight:700;color:var(--neon)">${fmt(c.valor)}</div></div>
                </div>
                <div style="margin-top:10px">
                    <span style="font-size:11px;color:var(--text-muted)">Consumo</span>
                    <div class="progress-bar-container" style="margin-top:4px"><div class="progress-bar-fill" style="width:${Math.min(pctUsed, 100)}%;background:${barColor}"></div></div>
                    <span style="font-size:12px;color:var(--text-secondary)">${qtdUsada}/${qtdTotal} ${mat ? mat.unidade : ''} (${Math.round(pctUsed)}%)</span>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                <div style="padding:14px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--neon);margin-bottom:8px;letter-spacing:0.5px">Material</div>
                    ${mat ? `<div style="font-weight:600">${escHtml(mat.nome)}</div><div style="font-size:12px;color:var(--text-secondary)">SAP: ${escHtml(mat.codigoSap)} · ${escHtml(mat.unidade)}</div>` : '<span style="color:var(--text-muted)">—</span>'}
                </div>
                <div style="padding:14px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--neon);margin-bottom:8px;letter-spacing:0.5px">Fornecedor</div>
                    ${forn ? `<div style="font-weight:600">${escHtml(forn.nome)}</div><div style="font-size:12px;color:var(--text-secondary)">${forn.cnpj || '—'} · ${forn.email || '—'}</div>` : '<span style="color:var(--text-muted)">—</span>'}
                </div>
            </div>
            <div style="padding:14px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--neon);margin-bottom:8px;letter-spacing:0.5px">Requisições (${rcs.length})</div>
                ${rcsHtml}
            </div>
            <div style="padding:14px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--neon);margin-bottom:8px;letter-spacing:0.5px">Entregas (${entregas.length})</div>
                ${entregasHtml}
            </div>
            <div style="padding:14px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--neon);margin-bottom:8px;letter-spacing:0.5px">Aditivos (${aditivos.length})</div>
                ${aditivosHtml}
            </div>
            ${c.observacoes ? `<div style="padding:14px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--neon);margin-bottom:8px;letter-spacing:0.5px">Observações</div>
                <div style="font-size:13px;color:var(--text-secondary);white-space:pre-wrap">${escHtml(c.observacoes)}</div>
            </div>` : ''}
        </div>
        <div class="form-actions" style="margin-top:16px">
            <button class="btn btn-secondary" onclick="closeModal()">Fechar</button>
        </div>
    `);
}

function viewAditivos(contratoId) {
    const contrato = DB.get('contratos').find(c => c.id === contratoId);
    if (!contrato) return;
    const aditivos = contrato.aditivos || [];
    const aditivoRows = aditivos.length === 0
        ? '<p style="color:var(--text-muted);font-size:13px;text-align:center;padding:20px 0">Nenhum aditivo registrado</p>'
        : aditivos.map(a => `<div style="padding:10px 0;border-bottom:1px solid var(--border)">
            <div style="display:flex;justify-content:space-between;align-items:center">
                <span>${badge(a.tipo, a.tipo === 'Quantidade' ? 'blue' : a.tipo === 'Prazo' ? 'purple' : 'green')}</span>
                <span style="font-size:12px;color:var(--text-secondary)">${fmtDate(a.data)}</span>
            </div>
            <div style="font-size:13px;margin-top:4px">
                <span style="color:var(--text-muted)">De:</span> <strong>${a.valorAnterior}</strong>
                <span style="color:var(--text-muted);margin:0 4px">→</span>
                <span style="color:var(--neon)"><strong>${a.valorNovo}</strong></span>
            </div>
            ${a.motivo ? `<div style="font-size:12px;color:var(--text-secondary);margin-top:2px">${escHtml(a.motivo)}</div>` : ''}
        </div>`).join('');

    openModal('Aditivos — ' + contrato.numero, `
        <div style="margin-bottom:16px">${aditivoRows}</div>
        <div class="form-actions">
            <button class="btn btn-secondary" onclick="closeModal()">Fechar</button>
            <button class="btn btn-primary" onclick="closeModal(); addAditivo('${contratoId}')">+ Novo Aditivo</button>
        </div>
    `);
}

function addAditivo(contratoId) {
    const contrato = DB.get('contratos').find(c => c.id === contratoId);
    if (!contrato) return;
    openModal('Novo Aditivo — ' + contrato.numero, `
        <div class="form-grid">
            <div class="form-group">
                <label>Tipo <span class="required">*</span></label>
                <select class="form-control" id="fAdtTipo" onchange="onAditivoTipoChange('${contratoId}')">
                    <option value="Quantidade">Quantidade</option>
                    <option value="Prazo">Prazo (Data Fim)</option>
                    <option value="Valor">Valor Total</option>
                </select>
            </div>
            <div class="form-group">
                <label>Data do Aditivo</label>
                <input class="form-control" id="fAdtData" type="text" value="${dateToBR(todayISO())}" placeholder="DD/MM/AAAA" maxlength="10">
            </div>
            <div class="form-group">
                <label>Valor Anterior</label>
                <input class="form-control" id="fAdtAnterior" value="${contrato.quantidadeContratada || 0}" readonly style="opacity:0.7">
            </div>
            <div class="form-group">
                <label>Novo Valor <span class="required">*</span></label>
                <input class="form-control" id="fAdtNovo" type="text">
            </div>
            <div class="form-group full">
                <label>Motivo</label>
                <textarea class="form-control" id="fAdtMotivo" rows="2"></textarea>
            </div>
        </div>
        <div class="form-actions">
            <button class="btn btn-secondary" onclick="closeModal(); viewAditivos('${contratoId}')">Cancelar</button>
            <button class="btn btn-primary" onclick="saveAditivo('${contratoId}')">Salvar Aditivo</button>
        </div>
    `);
}

function onAditivoTipoChange(contratoId) {
    const contrato = DB.get('contratos').find(c => c.id === contratoId);
    if (!contrato) return;
    const tipo = $('#fAdtTipo').value;
    const field = $('#fAdtAnterior');
    if (tipo === 'Quantidade') field.value = contrato.quantidadeContratada || 0;
    else if (tipo === 'Prazo') field.value = dateToBR(contrato.dataFim);
    else if (tipo === 'Valor') field.value = fmt(contrato.valor || 0);
}

function saveAditivo(contratoId) {
    const tipo = $('#fAdtTipo').value;
    const novoRaw = $('#fAdtNovo').value.trim();
    if (!novoRaw) { toast('Preencha o novo valor', 'error'); return; }

    const data = DB.get('contratos');
    const idx = data.findIndex(c => c.id === contratoId);
    if (idx < 0) return;
    const contrato = data[idx];
    if (!contrato.aditivos) contrato.aditivos = [];

    let valorAnterior, valorNovo;
    if (tipo === 'Quantidade') {
        valorAnterior = contrato.quantidadeContratada;
        valorNovo = parseFloat(novoRaw);
        contrato.quantidadeContratada = valorNovo;
        contrato.valor = valorNovo * (contrato.precoUnitario || 0);
    } else if (tipo === 'Prazo') {
        valorAnterior = dateToBR(contrato.dataFim);
        valorNovo = brToISO(novoRaw);
        contrato.dataFim = valorNovo;
        valorNovo = novoRaw;
    } else {
        valorAnterior = fmt(contrato.valor || 0);
        valorNovo = parseFloat(novoRaw);
        contrato.valor = valorNovo;
        valorNovo = fmt(valorNovo);
    }

    contrato.aditivos.push({
        id: DB.id(), data: brToISO($('#fAdtData').value) || todayISO(),
        tipo, valorAnterior: String(valorAnterior), valorNovo: String(valorNovo),
        motivo: $('#fAdtMotivo').value.trim()
    });

    data[idx] = contrato;
    DB.set('contratos', data);
    closeModal();
    toast('Aditivo registrado!');
    renderContratos();
}


// ========================================================================
// REQUISIÇÕES DE COMPRA (RCs)
// ========================================================================
function renderRCs() {
    const data = DB.get('rcs');
    const contratos = DB.get('contratos');
    const fornecedores = DB.get('fornecedores');
    const materiais = DB.get('materiais');
    const searchHtml = `<div class="search-box">${searchIcon}<input class="search-input" placeholder="Buscar RC..." oninput="filterTable(this.value)"></div>`;

    // Filtros
    let filteredData = data;
    if (rcStatusFilter !== 'Todas') filteredData = filteredData.filter(rc => rc.status === rcStatusFilter);
    if (dateFilterDe) filteredData = filteredData.filter(rc => rc.data >= dateFilterDe);
    if (dateFilterAte) filteredData = filteredData.filter(rc => rc.data <= dateFilterAte);

    const statusFilters = ['Todas', 'Pendente', 'Aprovada', 'Em Andamento', 'Concluída', 'Cancelada'];
    const filterBarHtml = `<div class="filter-pills">${statusFilters.map(s => `<button class="pill-btn ${rcStatusFilter === s ? 'pill-active' : ''}" onclick="setRcStatusFilter('${s}')">${s}</button>`).join('')}</div>`;
    const dateFilterHtml = `<div style="display:flex;gap:8px;align-items:center;margin-bottom:16px;flex-wrap:wrap"><label style="font-size:12px;color:var(--text-secondary)">Período:</label><input class="form-control" type="text" id="fDateDe" placeholder="De DD/MM/AAAA" maxlength="10" value="${dateToBR(dateFilterDe)}" style="width:130px;padding:6px 10px;font-size:12px" onchange="applyDateFilter()"><input class="form-control" type="text" id="fDateAte" placeholder="Até DD/MM/AAAA" maxlength="10" value="${dateToBR(dateFilterAte)}" style="width:130px;padding:6px 10px;font-size:12px" onchange="applyDateFilter()">${(dateFilterDe || dateFilterAte) ? `<button class="btn-icon" onclick="clearDateFilter()" title="Limpar filtro data"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>` : ''}</div>`;

    const rows = filteredData.map(rc => {
        const contrato = contratos.find(c => c.id === rc.contratoId);
        const forn = contrato ? fornecedores.find(f => f.id === contrato.fornecedorId) : null;
        const mat = materiais.find(m => m.id === rc.materialId);
        const semRcBadge = rc.semRC ? ' <span class="badge badge-orange" style="font-size:9px;padding:2px 6px">SEM RC</span>' : '';

        return `<tr class="clickable-row" onclick="if(!event.target.closest('.actions'))verDetalhesRC('${rc.id}')" data-search="${escHtml((rc.numero + ' ' + (contrato ? contrato.numero : '') + ' ' + (forn ? forn.nome : '') + ' ' + (mat ? mat.nome : '') + ' ' + (rc.localEntrega || '')).toLowerCase())}">
            <td><strong>${escHtml(rc.numero)}</strong>${semRcBadge}</td>
            <td>${contrato ? escHtml(contrato.numero) : '—'}</td>
            <td>${forn ? escHtml(forn.nome) : '—'}</td>
            <td>${mat ? escHtml(mat.nome) : '—'}</td>
            <td>${rc.quantidade || '—'} ${mat ? mat.unidade : ''}</td>
            <td>${fmt(rc.valorUnitario)}</td>
            <td>${escHtml(rc.localEntrega || '—')}</td>
            <td>${fmtDate(rc.data)}</td>
            <td>${fmtDate(rc.dataPrevisao)}</td>
            <td>${badge(rc.status, rcStatusColor(rc.status))}</td>
            <td class="col-actions"><div class="actions">
                ${rc.semRC ? `<button class="btn-icon" style="color:var(--neon)" onclick="inserirNumeroRC('${rc.id}')" title="Inserir Nº RC"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>` : ''}
                <button class="btn-icon" onclick="viewHistoricoRC('${rc.id}')" title="Histórico"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></button>
                ${(rc.emailsEnviados && rc.emailsEnviados.length > 0) ? `<button class="btn-icon" style="color:var(--cyan)" onclick="viewEmailsEnviados('${rc.id}')" title="E-mails enviados (${rc.emailsEnviados.length})"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg></button>` : ''}
                <button class="btn-icon" onclick="duplicarRC('${rc.id}')" title="Duplicar"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg></button>
                <button class="btn-icon" onclick="printRC('${rc.id}')" title="Imprimir extrato"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg></button>
                <button class="btn-icon" onclick="editRC('${rc.id}')" title="Editar"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                <button class="btn-icon danger" onclick="deleteRC('${rc.id}','${escHtml(rc.numero)}')" title="Excluir"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>
            </div></td>
        </tr>`;
    });

    $('#content').innerHTML = `
        <div class="page-header">
            <h2>Requisições de Compra</h2>
            <div class="page-actions">
                ${searchHtml}
                <button class="btn btn-secondary" onclick="exportCSV('rcs')" style="font-size:12px" title="Exportar CSV">📥 CSV</button>
                <button class="btn btn-secondary" onclick="openRelatorioMensal()" style="font-size:12px">📊 Mensal</button>
                <button class="btn btn-secondary" onclick="printRelatorioRCs()" style="font-size:12px">🖨️ Relatório</button>
                <button class="btn btn-primary" onclick="editRC()">+ Nova RC</button>
            </div>
        </div>
        ${filterBarHtml}
        ${dateFilterHtml}
        ${renderTable(['Nº RC', 'Contrato', 'Fornecedor', 'Material', 'Qtd', 'Valor Unit.', 'Local Entrega', 'Data', 'Previsão', 'Status', ''], rows, 'Nenhuma RC cadastrada')}
    `;
}

function editRC(id) {
    const item = id ? DB.get('rcs').find(r => r.id === id) : {};
    const contratos = DB.get('contratos');
    const title = id ? 'Editar RC' : 'Nova Requisição de Compra';

    if (contratos.length === 0) {
        openModal('Aviso', `
            <p style="margin-bottom:16px">Cadastre pelo menos um contrato antes de criar uma RC.</p>
            <div class="form-actions"><button class="btn btn-primary" onclick="closeModal(); navigate('contratos')">Ir para Contratos</button></div>
        `);
        return;
    }

    openModal(title, `
        <div style="margin-bottom:16px">
            <label style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:10px 14px;background:var(--warning-dim);border:1px solid rgba(255,165,2,0.2);border-radius:var(--radius);font-size:13px;color:var(--warning)">
                <input type="checkbox" id="fRcSemRC" ${item.semRC ? 'checked' : ''} onchange="toggleSemRC()" style="accent-color:var(--warning);width:18px;height:18px;cursor:pointer">
                <span><strong>Pedido sem RC</strong> — Regularizar depois (ficará como pendência)</span>
            </label>
        </div>
        <div class="form-grid">
            <div class="form-group">
                <label>Nº da RC <span class="required">*</span></label>
                <input class="form-control" id="fRcNumero" value="${escHtml(item.numero || '')}" ${item.semRC ? 'readonly style="opacity:0.6"' : ''}>
            </div>
            <div class="form-group">
                <label>Contrato <span class="required">*</span></label>
                <select class="form-control" id="fRcContrato" onchange="onRcContratoChange()">
                    <option value="">Selecione...</option>
                    ${contratos.map(c => {
                        const forn = DB.get('fornecedores').find(f => f.id === c.fornecedorId);
                        return `<option value="${c.id}" ${item.contratoId === c.id ? 'selected' : ''}>${escHtml(c.numero)} — ${forn ? escHtml(forn.nome) : '?'}</option>`;
                    }).join('')}
                </select>
            </div>
            <div class="form-group full" id="rcContratoInfo"></div>
            <div class="form-group full">
                <label>Material <span class="required">*</span></label>
                <select class="form-control" id="fRcMaterial">
                    <option value="">Selecione o contrato primeiro</option>
                </select>
            </div>
            <div class="form-group">
                <label>Quantidade</label>
                <input class="form-control" id="fRcQtd" type="number" step="0.01" value="${item.quantidade || ''}">
            </div>
            <div class="form-group">
                <label>Valor Unitário (R$)</label>
                <input class="form-control" id="fRcValor" type="number" step="0.01" value="${item.valorUnitario || ''}">
            </div>
            <div class="form-group">
                <label>Local de Entrega</label>
                <select class="form-control" id="fRcLocal">
                    <option value="">Selecione...</option>
                    <option ${item.localEntrega === 'Divisão Água Clara - MS' ? 'selected' : ''}>Divisão Água Clara - MS</option>
                    <option ${item.localEntrega === 'Divisão Bataguassu - MS' ? 'selected' : ''}>Divisão Bataguassu - MS</option>
                </select>
            </div>
            <div class="form-group">
                <label>Data</label>
                <input class="form-control" id="fRcData" type="text" value="${id ? dateToBR(item.data) : dateToBR(todayISO())}" placeholder="DD/MM/AAAA" maxlength="10">
            </div>
            <div class="form-group">
                <label>Previsão de Entrega</label>
                <input class="form-control" id="fRcPrevisao" type="text" value="${dateToBR(item.dataPrevisao || '')}" placeholder="DD/MM/AAAA" maxlength="10">
            </div>
            <div class="form-group">
                <label>Status</label>
                <select class="form-control" id="fRcStatus">
                    ${['Pendente', 'Aprovada', 'Em Andamento', 'Concluída', 'Cancelada'].map(s => `<option ${item.status === s ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
            </div>
            <div class="form-group full">
                <label>Observações</label>
                <textarea class="form-control" id="fRcObs" rows="3">${escHtml(item.observacoes || '')}</textarea>
            </div>
        </div>
        <div class="form-actions">
            <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="saveRC('${id || ''}')">Salvar</button>
        </div>
    `);

    // Trigger material dropdown population
    if (item.contratoId) {
        onRcContratoChange(item.materialId);
    }
}

function onRcContratoChange(selectedMaterialId) {
    const contratoId = $('#fRcContrato').value;
    const select = $('#fRcMaterial');
    const infoEl = $('#rcContratoInfo');
    select.innerHTML = '<option value="">Selecione...</option>';
    if (infoEl) infoEl.innerHTML = '';

    if (!contratoId) return;

    const contrato = DB.get('contratos').find(c => c.id === contratoId);
    if (!contrato) return;

    const materiais = DB.get('materiais');
    const allRcs = DB.get('rcs');

    // Auto-fill material from contract
    if (contrato.materialId) {
        const mat = materiais.find(m => m.id === contrato.materialId);
        if (mat) {
            select.innerHTML = `<option value="${mat.id}" selected>${escHtml(mat.codigoSap)} - ${escHtml(mat.nome)} (${mat.unidade})</option>`;
        }
    } else {
        // Fallback: show materials from supplier
        const fornecedor = DB.get('fornecedores').find(f => f.id === contrato.fornecedorId);
        if (fornecedor) {
            const fornMateriais = (fornecedor.materiaisIds || []).map(mid => materiais.find(m => m.id === mid)).filter(Boolean);
            select.innerHTML = '<option value="">Selecione...</option>' + fornMateriais.map(m =>
                `<option value="${m.id}" ${selectedMaterialId === m.id ? 'selected' : ''}>${escHtml(m.codigoSap)} - ${escHtml(m.nome)} (${m.unidade})</option>`
            ).join('');
        }
    }

    // Auto-fill valor unitário from contract
    if (contrato.precoUnitario) {
        const valorField = $('#fRcValor');
        if (valorField && !valorField.value) {
            valorField.value = contrato.precoUnitario;
        }
    }

    // Auto-calculate previsão from supplier lead time
    const fornecedor = DB.get('fornecedores').find(f => f.id === contrato.fornecedorId);
    if (fornecedor && fornecedor.leadTime && fornecedor.leadTime > 0) {
        const previsaoField = $('#fRcPrevisao');
        if (previsaoField && !previsaoField.value) {
            const hoje = new Date();
            hoje.setDate(hoje.getDate() + fornecedor.leadTime);
            const isoPrevisao = hoje.toISOString().split('T')[0];
            previsaoField.value = dateToBR(isoPrevisao);
        }
    }

    // Show available quantity info
    if (infoEl && contrato.quantidadeContratada) {
        const qtdUsada = allRcs.filter(r => r.contratoId === contratoId && r.status !== 'Cancelada').reduce((s, r) => s + (parseFloat(r.quantidade) || 0), 0);
        const qtdDisp = (contrato.quantidadeContratada || 0) - qtdUsada;
        const mat = materiais.find(m => m.id === contrato.materialId);
        const un = mat ? mat.unidade : '';
        const color = qtdDisp > 0 ? 'var(--neon)' : 'var(--danger)';
        const ltInfo = fornecedor && fornecedor.leadTime ? ` · Lead Time: <strong>${fornecedor.leadTime} dias</strong>` : '';
        infoEl.innerHTML = `<div style="padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);font-size:12px;margin-top:4px">
            Contrato: <strong>${escHtml(contrato.numero)}</strong> ·
            Qtd Contratada: <strong>${contrato.quantidadeContratada} ${un}</strong> ·
            Preço Unit.: <strong>${fmt(contrato.precoUnitario || 0)}</strong> ·
            <span style="color:${color}">Disponível: <strong>${qtdDisp} ${un}</strong></span>${ltInfo}
        </div>`;
    }
}

function saveRC(id) {
    const semRC = $('#fRcSemRC').checked;
    const numero = $('#fRcNumero').value.trim();
    const contratoId = $('#fRcContrato').value;
    const materialId = $('#fRcMaterial').value;

    if (!numero || !contratoId || !materialId) { toast('Preencha número, contrato e material', 'error'); return; }

    const obj = {
        numero,
        contratoId,
        materialId,
        semRC,
        localEntrega: $('#fRcLocal').value,
        quantidade: parseFloat($('#fRcQtd').value) || 0,
        valorUnitario: parseFloat($('#fRcValor').value) || 0,
        data: brToISO($('#fRcData').value),
        dataPrevisao: brToISO($('#fRcPrevisao').value),
        status: $('#fRcStatus').value,
        observacoes: $('#fRcObs').value.trim(),
        dataCriacao: id ? undefined : todayISO()
    };

    const data = DB.get('rcs');
    let rcId = id;
    if (id) {
        const idx = data.findIndex(r => r.id === id);
        if (idx >= 0) {
            delete obj.dataCriacao;
            const oldStatus = data[idx].status;
            if (oldStatus && obj.status && oldStatus !== obj.status) {
                if (!data[idx].historico) data[idx].historico = [];
                data[idx].historico.push({ de: oldStatus, para: obj.status, data: todayISO() });
            }
            data[idx] = { ...data[idx], ...obj };
        }
    } else {
        obj.id = DB.id();
        obj.historico = [];
        rcId = obj.id;
        data.push(obj);
    }
    DB.set('rcs', data);

    // Auto-create Entrega when status is "Concluída"
    if (obj.status === 'Concluída') {
        const entregas = DB.get('entregas');
        const jaExiste = entregas.some(e => e.rcId === rcId && e.autoCreated);
        if (!jaExiste) {
            entregas.push({
                id: DB.id(),
                rcId: rcId,
                quantidade: obj.quantidade,
                notaFiscal: '',
                data: obj.data || todayISO(),
                dataPrevisao: obj.dataPrevisao || '',
                localEntrega: obj.localEntrega || '',
                status: 'Rota de Entrega',
                observacoes: 'Entrega gerada automaticamente ao concluir RC',
                autoCreated: true
            });
            DB.set('entregas', entregas);
            toast('Entrega criada automaticamente (Rota de Entrega)', 'success');
        }
    }

    const shouldPromptEmail = obj.status === 'Concluída';
    const finalRcId = id || rcId;

    // Check if contract is exhausted
    checkContratoEsgotado(obj.contratoId);

    closeModal();
    toast(id ? 'RC atualizada!' : 'RC cadastrada!');
    renderRCs();

    // Prompt to send email when RC is Concluída
    if (shouldPromptEmail) {
        setTimeout(() => promptEnviarEmail(finalRcId), 400);
    }
}

function deleteRC(id, nome) {
    confirmDelete(nome, `doDeleteRC('${id}')`);
}

function doDeleteRC(id) {
    DB.set('rcs', DB.get('rcs').filter(r => r.id !== id));
    toast('RC excluída!');
    renderRCs();
}

function setRcStatusFilter(status) {
    rcStatusFilter = status;
    renderRCs();
}

function applyDateFilter() {
    dateFilterDe = brToISO($('#fDateDe') ? $('#fDateDe').value : '');
    dateFilterAte = brToISO($('#fDateAte') ? $('#fDateAte').value : '');
    renderRCs();
}

function clearDateFilter() {
    dateFilterDe = '';
    dateFilterAte = '';
    renderRCs();
}

function viewHistoricoRC(rcId) {
    const rc = DB.get('rcs').find(r => r.id === rcId);
    if (!rc) return;
    const historico = rc.historico || [];
    const rows = historico.length === 0
        ? '<p style="color:var(--text-muted);font-size:13px;text-align:center;padding:20px 0">Nenhuma alteração de status registrada</p>'
        : historico.map(h => `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
            <span>${badge(h.de, rcStatusColor(h.de))} <span style="color:var(--text-muted);margin:0 6px">→</span> ${badge(h.para, rcStatusColor(h.para))}</span>
            <span style="font-size:12px;color:var(--text-secondary)">${fmtDate(h.data)}</span>
        </div>`).join('');

    openModal('Histórico — ' + rc.numero, `
        <div style="margin-bottom:16px">${rows}</div>
        <div class="form-actions">
            <button class="btn btn-secondary" onclick="closeModal()">Fechar</button>
        </div>
    `);
}

function duplicarRC(id) {
    const original = DB.get('rcs').find(r => r.id === id);
    if (!original) return;
    const clone = { ...original, id: DB.id(), numero: original.numero + '-COPIA', dataCriacao: todayISO(), status: 'Pendente', historico: [], semRC: false };
    const data = DB.get('rcs');
    data.push(clone);
    DB.set('rcs', data);
    toast('RC duplicada! Editando cópia...');
    editRC(clone.id);
}

function toggleSemRC() {
    const checked = $('#fRcSemRC').checked;
    const numField = $('#fRcNumero');
    if (checked) {
        numField.value = 'PEND-' + Date.now().toString(36).toUpperCase();
        numField.readOnly = true;
        numField.style.opacity = '0.6';
    } else {
        numField.value = '';
        numField.readOnly = false;
        numField.style.opacity = '1';
    }
}

function printRC(id) {
    const rc = DB.get('rcs').find(r => r.id === id);
    if (!rc) return;
    const contratos = DB.get('contratos');
    const fornecedores = DB.get('fornecedores');
    const materiais = DB.get('materiais');

    const contrato = contratos.find(c => c.id === rc.contratoId);
    const forn = contrato ? fornecedores.find(f => f.id === contrato.fornecedorId) : null;
    const mat = materiais.find(m => m.id === rc.materialId);
    const valorTotal = (rc.quantidade || 0) * (rc.valorUnitario || 0);
    const isSemRC = rc.semRC;
    const un = mat ? mat.unidade : '';

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Extrato - ${rc.numero}</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"><\/script>
<style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Segoe UI',Arial,sans-serif; background:#fff; color:#1a1a1a; padding:0; font-size:13px; }
    .page { max-width:700px; margin:20px auto; padding:0; }
    .toolbar { max-width:700px; margin:10px auto 0; display:flex; gap:8px; justify-content:flex-end; }
    .toolbar button { padding:8px 18px; border:none; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:6px; transition:all 0.2s; }
    .btn-copy { background:#0a0a0a; color:#00ff41; }
    .btn-copy:hover { background:#1a2a1a; }
    .btn-copy.copied { background:#00801a; color:#fff; }
    .btn-print { background:#0055cc; color:#fff; }
    .btn-print:hover { background:#0044aa; }
    .header { background:linear-gradient(135deg, #0a0a0a 0%, #1a2a1a 100%); color:#00ff41; padding:24px 30px; border-radius:12px 12px 0 0; display:flex; align-items:center; justify-content:space-between; }
    .header h1 { font-size:18px; font-weight:700; letter-spacing:-0.3px; }
    .header .sub { font-size:11px; color:#8aff8a; margin-top:2px; }
    .header .doc-type { text-align:right; }
    .header .doc-type span { display:block; font-size:20px; font-weight:700; }
    .header .doc-type small { font-size:11px; color:#8aff8a; }
    .body-content { border:2px solid #0a0a0a; border-top:none; border-radius:0 0 12px 12px; overflow:hidden; }
    .section { padding:16px 24px; border-bottom:1px solid #e0e0e0; }
    .section:last-child { border-bottom:none; }
    .section-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; color:#00aa30; margin-bottom:10px; padding-bottom:4px; border-bottom:2px solid #00ff41; display:inline-block; }
    .grid { display:grid; grid-template-columns:1fr 1fr; gap:8px 24px; }
    .grid3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px 24px; }
    .field { margin-bottom:4px; }
    .field .lbl { font-size:10px; color:#777; text-transform:uppercase; letter-spacing:0.3px; }
    .field .val { font-size:14px; font-weight:600; color:#1a1a1a; }
    .field .val.big { font-size:18px; color:#00801a; }
    .field.full { grid-column:1/-1; }
    .badge { display:inline-block; padding:3px 12px; border-radius:20px; font-size:11px; font-weight:600; }
    .badge-green { background:#e6ffe6; color:#00801a; border:1px solid #00cc2a; }
    .badge-orange { background:#fff5e6; color:#cc7700; border:1px solid #ff9900; }
    .badge-blue { background:#e6f0ff; color:#0055cc; border:1px solid #3388ff; }
    .badge-purple { background:#f3e6ff; color:#7722cc; border:1px solid #9944ff; }
    .badge-red { background:#ffe6e6; color:#cc0022; border:1px solid #ff3344; }
    .badge-gray { background:#f0f0f0; color:#666; border:1px solid #ccc; }
    .sem-rc-alert { background:#fff5e6; border:1px solid #ffcc66; border-radius:8px; padding:10px 16px; margin:12px 24px; font-size:12px; color:#996600; display:flex; align-items:center; gap:8px; }
    .footer { background:#f8f8f8; padding:14px 24px; display:flex; justify-content:space-between; align-items:center; font-size:11px; color:#999; border-top:1px solid #e0e0e0; }
    .footer .brand { color:#00aa88; font-weight:600; }
    .obs-text { font-size:13px; color:#444; line-height:1.5; padding:6px 0; white-space:pre-wrap; }
    @media print { .toolbar { display:none !important; } body { padding:0; } .page { margin:0; max-width:100%; } }
</style>
</head>
<body>
<div class="toolbar">
    <button class="btn-copy" onclick="copyAsImage()">📋 Copiar Imagem</button>
    <button class="btn-print" onclick="window.print()">🖨️ Imprimir</button>
</div>
<div class="page" id="captureArea">
    <div class="header">
        <div>
            <h1>SGCE</h1>
            <div class="sub">Sistema de Gestão de Contratos e Entregas</div>
        </div>
        <div class="doc-type">
            <span>EXTRATO ${isSemRC ? 'DE PEDIDO' : 'DE RC'}</span>
            <small>${new Date().toLocaleDateString('pt-BR')}</small>
        </div>
    </div>
    <div class="body-content">
        ${isSemRC ? '<div class="sem-rc-alert">⚠️ <strong>Pedido sem RC</strong> — Pendente de regularização</div>' : ''}
        <div class="section">
            <div class="section-title">${isSemRC ? 'Dados do Pedido' : 'Dados da Requisição'}</div>
            <div class="grid">
                <div class="field"><div class="lbl">Nº ${isSemRC ? 'Pedido' : 'RC'}</div><div class="val">${rc.numero}</div></div>
                <div class="field"><div class="lbl">Data</div><div class="val">${rc.data ? new Date(rc.data + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</div></div>
                <div class="field"><div class="lbl">Status</div><div class="val"><span class="badge badge-${rcStatusColor(rc.status)}">${rc.status}</span></div></div>
                <div class="field"><div class="lbl">Local de Entrega</div><div class="val">${rc.localEntrega || '—'}</div></div>
            </div>
        </div>
        <div class="section">
            <div class="section-title">Fornecedor</div>
            <div class="grid">
                <div class="field full"><div class="lbl">Razão Social</div><div class="val">${forn ? forn.nome : '—'}</div></div>
                <div class="field"><div class="lbl">CNPJ</div><div class="val">${forn ? (forn.cnpj || '—') : '—'}</div></div>
                <div class="field"><div class="lbl">Telefone</div><div class="val">${forn ? (forn.telefone || '—') : '—'}</div></div>
                <div class="field"><div class="lbl">Email</div><div class="val">${forn ? (forn.email || '—') : '—'}</div></div>
                <div class="field"><div class="lbl">Responsável</div><div class="val">${forn ? (forn.responsavel || '—') : '—'}</div></div>
            </div>
        </div>
        <div class="section">
            <div class="section-title">Material</div>
            <div class="grid3">
                <div class="field"><div class="lbl">Código SAP</div><div class="val">${mat ? mat.codigoSap : '—'}</div></div>
                <div class="field full" style="grid-column:2/-1"><div class="lbl">Descrição</div><div class="val">${mat ? mat.nome : '—'}</div></div>
            </div>
        </div>
        <div class="section">
            <div class="section-title">Detalhes do Pedido</div>
            <div class="grid">
                <div class="field"><div class="lbl">Quantidade</div><div class="val big">${rc.quantidade || 0} ${un}</div></div>
                <div class="field"><div class="lbl">Valor Unitário</div><div class="val big">${new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(rc.valorUnitario||0)}</div></div>
                <div class="field"><div class="lbl">Valor Total</div><div class="val big">${new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(valorTotal)}</div></div>
                <div class="field"><div class="lbl">Unidade</div><div class="val">${un}</div></div>
                ${rc.dataPrevisao ? `<div class="field"><div class="lbl">Previsão de Entrega</div><div class="val" style="color:#0055cc;font-weight:700">${new Date(rc.dataPrevisao + 'T00:00:00').toLocaleDateString('pt-BR')}</div></div>` : ''}
            </div>
        </div>
        ${isSemRC && contrato ? `<div class="section">
            <div class="section-title">Contrato Vinculado</div>
            <div class="grid">
                <div class="field"><div class="lbl">Nº Contrato</div><div class="val">${contrato.numero}</div></div>
                <div class="field"><div class="lbl">Vigência</div><div class="val">${contrato.dataInicio ? new Date(contrato.dataInicio+'T00:00:00').toLocaleDateString('pt-BR') : '—'} a ${contrato.dataFim ? new Date(contrato.dataFim+'T00:00:00').toLocaleDateString('pt-BR') : '—'}</div></div>
                <div class="field"><div class="lbl">Status do Contrato</div><div class="val"><span class="badge badge-${contractStatusColor(contrato.status)}">${contrato.status}</span></div></div>
            </div>
        </div>` : ''}
        ${rc.observacoes ? `<div class="section">
            <div class="section-title">Observações</div>
            <div class="obs-text">${rc.observacoes}</div>
        </div>` : ''}
        <div class="footer">
            <span class="brand">Feito por Lucas Marques</span>
            <span>Impresso em: ${new Date().toLocaleString('pt-BR')}</span>
        </div>
    </div>
</div>
<script>
function copyAsImage() {
    var btn = document.querySelector('.btn-copy');
    btn.textContent = '⏳ Gerando...';
    html2canvas(document.getElementById('captureArea'), { scale: 2, useCORS: true, backgroundColor: '#ffffff' }).then(function(canvas) {
        canvas.toBlob(function(blob) {
            navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).then(function() {
                btn.textContent = '✅ Copiado!';
                btn.classList.add('copied');
                setTimeout(function() { btn.textContent = '📋 Copiar Imagem'; btn.classList.remove('copied'); }, 2500);
            }).catch(function() {
                btn.textContent = '❌ Erro';
                setTimeout(function() { btn.textContent = '📋 Copiar Imagem'; }, 2000);
            });
        }, 'image/png');
    });
}
<\/script>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) {
        win.document.write(html);
        win.document.close();
    } else {
        toast('Não foi possível abrir a janela de impressão. Verifique se popups estão permitidos.', 'error');
    }
}


function printRelatorioRCs() {
    const rcs = DB.get('rcs');
    if (rcs.length === 0) {
        toast('Nenhuma RC cadastrada', 'error');
        return;
    }

    const contratos = DB.get('contratos');
    const fornecedores = DB.get('fornecedores');
    const materiais = DB.get('materiais');

    const tableRows = rcs.map((rc, i) => {
        const contrato = contratos.find(c => c.id === rc.contratoId);
        const forn = contrato ? fornecedores.find(f => f.id === contrato.fornecedorId) : null;
        const mat = materiais.find(m => m.id === rc.materialId);
        const un = mat ? mat.unidade : '';
        const bg = i % 2 === 0 ? '#fff' : '#f8fdf8';
        const dataSol = rc.data ? new Date(rc.data + 'T00:00:00').toLocaleDateString('pt-BR') : '—';
        const dataPrev = rc.dataPrevisao ? new Date(rc.dataPrevisao + 'T00:00:00').toLocaleDateString('pt-BR') : '—';
        const statusColors = { 'Pendente': '#e67e00', 'Em Análise': '#0066cc', 'Aprovada': '#008822', 'Concluída': '#00aa44', 'Cancelada': '#cc0000' };
        const sColor = statusColors[rc.status] || '#666';
        const semRcLabel = rc.semRC ? ' <span style="color:#cc6600;font-size:10px;font-weight:700">[SEM RC]</span>' : '';

        return `<tr style="background:${bg}">
            <td style="padding:10px 12px;border-bottom:1px solid #e0e0e0;font-weight:600">${rc.numero}${semRcLabel}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e0e0e0">${contrato ? contrato.numero : '—'}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e0e0e0">${forn ? forn.nome : '—'}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e0e0e0">${mat ? mat.nome : '—'}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e0e0e0;text-align:center;font-weight:600">${rc.quantidade || 0} ${un}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e0e0e0">${rc.localEntrega || '—'}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e0e0e0;text-align:center">${dataSol}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e0e0e0;text-align:center;color:#0055cc;font-weight:700">${dataPrev}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e0e0e0;text-align:center"><span style="color:${sColor};font-weight:700">${rc.status}</span></td>
        </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Relatório de Requisições</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"><\/script>
<style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Segoe UI',Arial,sans-serif; background:#fff; color:#1a1a1a; padding:0; font-size:13px; }
    .page { max-width:1100px; margin:20px auto; padding:0; }
    .toolbar { max-width:1100px; margin:10px auto 0; display:flex; gap:8px; justify-content:flex-end; }
    .toolbar button { padding:8px 18px; border:none; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:6px; transition:all 0.2s; }
    .btn-copy { background:#0a0a0a; color:#00ff41; }
    .btn-copy:hover { background:#1a2a1a; }
    .btn-copy.copied { background:#00801a; color:#fff; }
    .btn-print { background:#0055cc; color:#fff; }
    .btn-print:hover { background:#0044aa; }
    .header { background:linear-gradient(135deg, #0a0a0a 0%, #1a2a1a 100%); color:#00ff41; padding:24px 30px; border-radius:12px 12px 0 0; display:flex; align-items:center; justify-content:space-between; }
    .header h1 { font-size:18px; font-weight:700; letter-spacing:-0.3px; }
    .header .sub { font-size:11px; color:#8aff8a; margin-top:2px; }
    .header .doc-type { text-align:right; }
    .header .doc-type span { display:block; font-size:18px; font-weight:700; }
    .header .doc-type small { font-size:11px; color:#8aff8a; }
    .body-content { border:2px solid #0a0a0a; border-top:none; border-radius:0 0 12px 12px; overflow:hidden; }
    .summary { padding:14px 24px; background:#f0fff0; border-bottom:2px solid #00cc2a; display:flex; justify-content:space-between; align-items:center; }
    .summary .count { font-size:14px; font-weight:700; color:#00801a; }
    .summary .date { font-size:12px; color:#666; }
    table { width:100%; border-collapse:collapse; }
    th { background:#0a0a0a; color:#00ff41; padding:10px 12px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; font-weight:700; }
    .footer { background:#f8f8f8; padding:14px 24px; display:flex; justify-content:space-between; align-items:center; font-size:11px; color:#999; border-top:1px solid #e0e0e0; }
    .footer .brand { color:#00aa88; font-weight:600; }
    @media print { .toolbar { display:none !important; } body { padding:0; } .page { margin:0; max-width:100%; } }
</style>
</head>
<body>
<div class="toolbar">
    <button class="btn-copy" onclick="copyAsImage()">📋 Copiar Imagem</button>
    <button class="btn-print" onclick="window.print()">🖨️ Imprimir</button>
</div>
<div class="page" id="captureArea">
    <div class="header">
        <div>
            <h1>SGCE</h1>
            <div class="sub">Sistema de Gestão de Contratos e Entregas</div>
        </div>
        <div class="doc-type">
            <span>RELATÓRIO DE REQUISIÇÕES</span>
            <small>${new Date().toLocaleDateString('pt-BR')}</small>
        </div>
    </div>
    <div class="body-content">
        <div class="summary">
            <div class="count">📋 ${rcs.length} requisição${rcs.length > 1 ? 'ões' : ''}</div>
            <div class="date">Emitido em: ${new Date().toLocaleString('pt-BR')}</div>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Nº RC</th>
                    <th>Contrato</th>
                    <th>Fornecedor</th>
                    <th>Material</th>
                    <th style="text-align:center">Qtd</th>
                    <th>Local Entrega</th>
                    <th style="text-align:center">Data</th>
                    <th style="text-align:center">Previsão</th>
                    <th style="text-align:center">Status</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
        <div class="footer">
            <span class="brand">Feito por Lucas Marques</span>
            <span>Impresso em: ${new Date().toLocaleString('pt-BR')}</span>
        </div>
    </div>
</div>
<script>
function copyAsImage() {
    var btn = document.querySelector('.btn-copy');
    btn.textContent = '⏳ Gerando...';
    html2canvas(document.getElementById('captureArea'), { scale: 2, useCORS: true, backgroundColor: '#ffffff' }).then(function(canvas) {
        canvas.toBlob(function(blob) {
            navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).then(function() {
                btn.textContent = '✅ Copiado!';
                btn.classList.add('copied');
                setTimeout(function() { btn.textContent = '📋 Copiar Imagem'; btn.classList.remove('copied'); }, 2500);
            }).catch(function() {
                btn.textContent = '❌ Erro';
                setTimeout(function() { btn.textContent = '📋 Copiar Imagem'; }, 2000);
            });
        }, 'image/png');
    });
}
<\/script>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) {
        win.document.write(html);
        win.document.close();
    } else {
        toast('Não foi possível abrir a janela de impressão. Verifique se popups estão permitidos.', 'error');
    }
}


// ========================================================================
// ENTREGAS
// ========================================================================
function renderEntregas() {
    const data = DB.get('entregas');
    const rcs = DB.get('rcs');
    const contratos = DB.get('contratos');
    const fornecedores = DB.get('fornecedores');
    const materiais = DB.get('materiais');
    const searchHtml = `<div class="search-box">${searchIcon}<input class="search-input" placeholder="Buscar entrega..." oninput="filterTable(this.value)"></div>`;

    const rows = data.map(e => {
        const rc = rcs.find(r => r.id === e.rcId);
        const mat = rc ? materiais.find(m => m.id === rc.materialId) : null;
        const contrato = rc ? contratos.find(c => c.id === rc.contratoId) : null;
        const forn = contrato ? fornecedores.find(f => f.id === contrato.fornecedorId) : null;
        const localEnt = e.localEntrega || (rc ? rc.localEntrega : '') || '';

        const confirmBtn = e.status === 'Rota de Entrega' ? `<button class="btn-icon" style="color:var(--neon)" onclick="confirmarEntrega('${e.id}')" title="Confirmar Entrega"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg></button>` : '';
            const fotoBtn = e.fotoNF
                ? `<button class="btn-icon" style="color:var(--info)" onclick="viewFotoNF('${e.id}')" title="Ver Foto NF"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></button>`
                : `<button class="btn-icon" onclick="addFotoNF('${e.id}')" title="Foto NF"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></button>`;

        return `<tr class="clickable-row" onclick="if(!event.target.closest('.actions'))verDetalhesEntrega('${e.id}')" data-search="${escHtml((e.notaFiscal + ' ' + (rc ? rc.numero : '') + ' ' + (mat ? mat.nome : '') + ' ' + (forn ? forn.nome : '') + ' ' + localEnt).toLowerCase())}">
            <td>${rc ? `<strong>${escHtml(rc.numero)}</strong>` : '—'}</td>
            <td>${forn ? escHtml(forn.nome) : '—'}</td>
            <td>${mat ? escHtml(mat.nome) : '—'}</td>
            <td>${e.quantidade || '—'} ${mat ? mat.unidade : ''}</td>
            <td>${escHtml(e.notaFiscal || '—')}</td>
            <td>${escHtml(localEnt || '—')}</td>
            <td>${fmtDate(e.data)}</td>
            <td>${fmtDate(e.dataPrevisao)}</td>
            <td>${(e.status === 'Recebida' || e.status === 'Parcial') && e.dataRecebimento ? fmtDate(e.dataRecebimento) : '—'}</td>
            <td>${badge(e.status, entregaStatusColor(e.status))}${e.entregaParcialOrigem ? ' <span style="font-size:10px;color:var(--info)">(saldo)</span>' : ''}</td>
            <td class="col-actions"><div class="actions">
                ${confirmBtn}
                ${fotoBtn}
                <button class="btn-icon" onclick="editEntrega('${e.id}')" title="Editar"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                <button class="btn-icon danger" onclick="deleteEntrega('${e.id}','NF ${escHtml(e.notaFiscal || e.id)}')" title="Excluir"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>
            </div></td>
        </tr>`;
    });

    const temRotaEntrega = data.some(e => e.status === 'Rota de Entrega');

    $('#content').innerHTML = `
        <div class="page-header">
            <h2>Controle de Entregas</h2>
            <div class="page-actions">
                ${searchHtml}
                <button class="btn btn-secondary" onclick="exportCSV('entregas')" style="font-size:12px" title="Exportar CSV">📥 CSV</button>
                ${temRotaEntrega ? '<button class="btn btn-secondary" onclick="printProgramacao()" style="border-color:var(--neon);color:var(--neon)">🖨️ Programação</button>' : ''}
                <button class="btn btn-primary" onclick="editEntrega()">+ Nova Entrega</button>
            </div>
        </div>
        ${renderTable(['RC', 'Fornecedor', 'Material', 'Qtd', 'NF', 'Local Entrega', 'Data Solicitação', 'Previsão Entrega', 'Dt Recebimento', 'Status', ''], rows, 'Nenhuma entrega cadastrada')}
    `;
}

function editEntrega(id) {
    const item = id ? DB.get('entregas').find(e => e.id === id) : {};
    const rcs = DB.get('rcs');
    const contratos = DB.get('contratos');
    const fornecedores = DB.get('fornecedores');
    const materiais = DB.get('materiais');
    const title = id ? 'Editar Entrega' : 'Nova Entrega';

    if (rcs.length === 0) {
        openModal('Aviso', `
            <p style="margin-bottom:16px">Cadastre pelo menos uma RC antes de registrar entregas.</p>
            <div class="form-actions"><button class="btn btn-primary" onclick="closeModal(); navigate('rcs')">Ir para RCs</button></div>
        `);
        return;
    }

    const rcOptions = rcs.map(rc => {
        const contrato = contratos.find(c => c.id === rc.contratoId);
        const forn = contrato ? fornecedores.find(f => f.id === contrato.fornecedorId) : null;
        const mat = materiais.find(m => m.id === rc.materialId);
        const label = `${rc.numero} — ${mat ? mat.nome : '?'} — ${forn ? forn.nome : '?'}`;
        return `<option value="${rc.id}" ${item.rcId === rc.id ? 'selected' : ''}>${escHtml(label)}</option>`;
    }).join('');

    openModal(title, `
        <div class="form-grid">
            <div class="form-group full">
                <label>Requisição de Compra (RC) <span class="required">*</span></label>
                <select class="form-control" id="fEntRc">
                    <option value="">Selecione...</option>
                    ${rcOptions}
                </select>
            </div>
            <div class="form-group">
                <label>Quantidade Recebida <span class="required">*</span></label>
                <input class="form-control" id="fEntQtd" type="number" step="0.01" value="${item.quantidade || ''}">
            </div>
            <div class="form-group">
                <label>Nota Fiscal</label>
                <input class="form-control" id="fEntNF" value="${escHtml(item.notaFiscal || '')}">
            </div>
            <div class="form-group">
                <label>Data da Solicitação <span class="required">*</span></label>
                <input class="form-control" id="fEntData" type="text" value="${dateToBR(item.data)}" placeholder="DD/MM/AAAA" maxlength="10">
            </div>
            <div class="form-group">
                <label>Previsão de Entrega</label>
                <input class="form-control" id="fEntPrevisao" type="text" value="${dateToBR(item.dataPrevisao || '')}" placeholder="DD/MM/AAAA" maxlength="10">
            </div>
            <div class="form-group">
                <label>Status</label>
                <select class="form-control" id="fEntStatus">
                    ${['Pendente', 'Rota de Entrega', 'Recebida', 'Parcial', 'Devolvida'].map(s => `<option ${item.status === s ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
            </div>
            <div class="form-group full">
                <label>Observações</label>
                <textarea class="form-control" id="fEntObs" rows="3">${escHtml(item.observacoes || '')}</textarea>
            </div>
        </div>
        <div class="form-actions">
            <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="saveEntrega('${id || ''}')">Salvar</button>
        </div>
    `);
}

function saveEntrega(id) {
    const rcId = $('#fEntRc').value;
    const quantidade = parseFloat($('#fEntQtd').value);
    const dataVal = brToISO($('#fEntData').value);

    if (!rcId || !quantidade || !dataVal) { toast('Preencha RC, quantidade e data', 'error'); return; }

    const obj = {
        rcId,
        quantidade,
        notaFiscal: $('#fEntNF').value.trim(),
        data: dataVal,
        dataPrevisao: brToISO($('#fEntPrevisao').value),
        status: $('#fEntStatus').value,
        observacoes: $('#fEntObs').value.trim()
    };

    const list = DB.get('entregas');
    if (id) {
        const idx = list.findIndex(e => e.id === id);
        if (idx >= 0) list[idx] = { ...list[idx], ...obj };
    } else {
        obj.id = DB.id();
        list.push(obj);
    }
    DB.set('entregas', list);
    closeModal();
    toast(id ? 'Entrega atualizada!' : 'Entrega registrada!');
    renderEntregas();
}

function deleteEntrega(id, nome) {
    confirmDelete(nome, `doDeleteEntrega('${id}')`);
}

function doDeleteEntrega(id) {
    DB.set('entregas', DB.get('entregas').filter(e => e.id !== id));
    toast('Entrega excluída!');
    renderEntregas();
}

function verDetalhesEntrega(entregaId) {
    const e = DB.get('entregas').find(x => x.id === entregaId);
    if (!e) return;
    const rcs = DB.get('rcs');
    const contratos = DB.get('contratos');
    const fornecedores = DB.get('fornecedores');
    const materiais = DB.get('materiais');

    const rc = rcs.find(r => r.id === e.rcId);
    const contrato = rc ? contratos.find(c => c.id === rc.contratoId) : null;
    const forn = contrato ? fornecedores.find(f => f.id === contrato.fornecedorId) : null;
    const mat = rc ? materiais.find(m => m.id === rc.materialId) : null;
    const un = mat ? mat.unidade : '';

    openModal('Detalhes — Entrega ' + (e.notaFiscal || entregaId), `
        <div style="display:grid;gap:16px">
            <div style="padding:14px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--neon);margin-bottom:8px;letter-spacing:0.5px">Entrega</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
                    <div><span style="font-size:11px;color:var(--text-muted)">Nota Fiscal</span><div style="font-weight:600">${escHtml(e.notaFiscal || '—')}</div></div>
                    <div><span style="font-size:11px;color:var(--text-muted)">Status</span><div>${badge(e.status, entregaStatusColor(e.status))}${e.entregaParcialOrigem ? ' <span style="font-size:10px;color:var(--info)">(saldo)</span>' : ''}</div></div>
                    <div><span style="font-size:11px;color:var(--text-muted)">Quantidade</span><div style="font-weight:700">${e.quantidade || 0} ${un}</div></div>
                    <div><span style="font-size:11px;color:var(--text-muted)">Local Entrega</span><div>${escHtml(e.localEntrega || (rc ? rc.localEntrega : '') || '—')}</div></div>
                    <div><span style="font-size:11px;color:var(--text-muted)">Data Solicitação</span><div>${fmtDate(e.data)}</div></div>
                    <div><span style="font-size:11px;color:var(--text-muted)">Previsão Entrega</span><div style="color:var(--info)">${fmtDate(e.dataPrevisao)}</div></div>
                    ${e.dataRecebimento ? `<div><span style="font-size:11px;color:var(--text-muted)">Data Recebimento</span><div style="color:var(--neon);font-weight:600">${fmtDate(e.dataRecebimento)}</div></div>` : ''}
                </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                <div style="padding:14px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--neon);margin-bottom:8px;letter-spacing:0.5px">Material</div>
                    ${mat ? `<div style="font-weight:600">${escHtml(mat.nome)}</div><div style="font-size:12px;color:var(--text-secondary)">SAP: ${escHtml(mat.codigoSap)} · ${escHtml(mat.unidade)}</div>` : '<span style="color:var(--text-muted)">—</span>'}
                </div>
                <div style="padding:14px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--neon);margin-bottom:8px;letter-spacing:0.5px">Fornecedor</div>
                    ${forn ? `<div style="font-weight:600">${escHtml(forn.nome)}</div><div style="font-size:12px;color:var(--text-secondary)">${forn.cnpj || '—'} · ${forn.email || '—'}</div>` : '<span style="color:var(--text-muted)">—</span>'}
                </div>
            </div>
            <div style="padding:14px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--neon);margin-bottom:8px;letter-spacing:0.5px">Requisição</div>
                ${rc ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
                    <div><span style="font-size:11px;color:var(--text-muted)">Nº RC</span><div style="font-weight:600">${escHtml(rc.numero)}</div></div>
                    <div><span style="font-size:11px;color:var(--text-muted)">Status RC</span><div>${badge(rc.status, rcStatusColor(rc.status))}</div></div>
                    <div><span style="font-size:11px;color:var(--text-muted)">Qtd Solicitada</span><div>${rc.quantidade || 0} ${un}</div></div>
                    <div><span style="font-size:11px;color:var(--text-muted)">Valor Total RC</span><div style="color:var(--neon)">${fmt((rc.quantidade || 0) * (rc.valorUnitario || 0))}</div></div>
                </div>` : '<p style="color:var(--text-muted);font-size:13px">—</p>'}
            </div>
            <div style="padding:14px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--neon);margin-bottom:8px;letter-spacing:0.5px">Contrato</div>
                ${contrato ? `<div style="font-size:13px"><strong>${escHtml(contrato.numero)}</strong> · ${badge(contrato.status, contractStatusColor(contrato.status))}<br>
                    <span style="color:var(--text-secondary)">Vigência: ${fmtDate(contrato.dataInicio)} a ${fmtDate(contrato.dataFim)} · Valor: ${fmt(contrato.valor)}</span></div>` : '<p style="color:var(--text-muted);font-size:13px">—</p>'}
            </div>
            ${e.observacoes ? `<div style="padding:14px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--neon);margin-bottom:8px;letter-spacing:0.5px">Observações</div>
                <div style="font-size:13px;color:var(--text-secondary);white-space:pre-wrap">${escHtml(e.observacoes)}</div>
            </div>` : ''}
            ${e.fotoNF ? `<div style="padding:14px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--neon);margin-bottom:8px;letter-spacing:0.5px">Foto NF</div>
                <img src="${e.fotoNF}" style="max-width:100%;max-height:300px;border-radius:var(--radius);border:1px solid var(--border)">
            </div>` : ''}
        </div>
        <div class="form-actions" style="margin-top:16px">
            <button class="btn btn-secondary" onclick="closeModal()">Fechar</button>
        </div>
    `);
}

function confirmarEntrega(id) {
    const item = DB.get('entregas').find(e => e.id === id);
    if (!item) return;

    const rcs = DB.get('rcs');
    const rc = rcs.find(r => r.id === item.rcId);
    const materiais = DB.get('materiais');
    const mat = rc ? materiais.find(m => m.id === rc.materialId) : null;
    const un = mat ? mat.unidade : '';

    openModal('Confirmar Recebimento', `
        <div style="margin-bottom:16px;padding:12px 16px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);font-size:13px">
            <strong style="color:var(--neon)">RC: ${rc ? escHtml(rc.numero) : '—'}</strong> ·
            ${mat ? escHtml(mat.nome) : '—'} ·
            Qtd solicitada: <strong>${item.quantidade || 0} ${un}</strong>
        </div>
        <div class="form-grid">
            <div class="form-group">
                <label>Data de Recebimento <span class="required">*</span></label>
                <input class="form-control" id="fConfData" type="text" value="${dateToBR(todayISO())}" placeholder="DD/MM/AAAA" maxlength="10">
            </div>
            <div class="form-group">
                <label>Quantidade Recebida <span class="required">*</span></label>
                <input class="form-control" id="fConfQtd" type="number" step="0.01" value="${item.quantidade || ''}">
            </div>
            <div class="form-group full">
                <label>Nº Nota Fiscal <span class="required">*</span></label>
                <input class="form-control" id="fConfNF" value="" placeholder="Informe o número da NF">
            </div>
        </div>
        <div class="form-actions">
            <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-primary" style="background:var(--neon);color:#000" onclick="salvarConfirmacao('${id}')">✓ Confirmar Entrega</button>
        </div>
    `);
}

function salvarConfirmacao(id) {
    const dataReceb = brToISO($('#fConfData').value);
    const qtdRecebida = parseFloat($('#fConfQtd').value);
    const notaFiscal = $('#fConfNF').value.trim();

    if (!dataReceb || !qtdRecebida || !notaFiscal) {
        toast('Preencha data, quantidade e nota fiscal', 'error');
        return;
    }

    const list = DB.get('entregas');
    const idx = list.findIndex(e => e.id === id);
    if (idx < 0) return;

    const original = list[idx];
    const qtdOriginal = parseFloat(original.quantidade) || 0;

    if (qtdRecebida < qtdOriginal) {
        // Entrega parcial
        list[idx] = { ...original, dataRecebimento: dataReceb, quantidade: qtdRecebida, notaFiscal, status: 'Parcial' };
        const saldo = qtdOriginal - qtdRecebida;
        list.push({
            id: DB.id(), rcId: original.rcId, quantidade: saldo, notaFiscal: '',
            data: original.data, dataPrevisao: original.dataPrevisao || '',
            localEntrega: original.localEntrega || '', status: 'Rota de Entrega',
            observacoes: 'Saldo de entrega parcial (NF ' + notaFiscal + ')',
            autoCreated: true, entregaParcialOrigem: id
        });
        DB.set('entregas', list);
        closeModal();
        toast(`Entrega parcial! Saldo de ${saldo} gerado automaticamente.`, 'info');
    } else {
        list[idx] = { ...original, dataRecebimento: dataReceb, quantidade: qtdRecebida, notaFiscal, status: 'Recebida' };
        DB.set('entregas', list);
        closeModal();
        toast('Entrega confirmada com sucesso!');
    }
    renderEntregas();
}

function printProgramacao() {
    const entregas = DB.get('entregas').filter(e => e.status === 'Rota de Entrega');
    if (entregas.length === 0) {
        toast('Nenhuma entrega em Rota de Entrega', 'error');
        return;
    }

    const rcs = DB.get('rcs');
    const contratos = DB.get('contratos');
    const fornecedores = DB.get('fornecedores');
    const materiais = DB.get('materiais');

    const tableRows = entregas.map((e, i) => {
        const rc = rcs.find(r => r.id === e.rcId);
        const contrato = rc ? contratos.find(c => c.id === rc.contratoId) : null;
        const forn = contrato ? fornecedores.find(f => f.id === contrato.fornecedorId) : null;
        const mat = rc ? materiais.find(m => m.id === rc.materialId) : null;
        const un = mat ? mat.unidade : '';
        const localEnt = e.localEntrega || (rc ? rc.localEntrega : '') || '—';
        const dataSol = e.data ? new Date(e.data + 'T00:00:00').toLocaleDateString('pt-BR') : '—';
        const dataPrev = e.dataPrevisao ? new Date(e.dataPrevisao + 'T00:00:00').toLocaleDateString('pt-BR') : '—';
        const bg = i % 2 === 0 ? '#fff' : '#f8fdf8';

        return `<tr style="background:${bg}">
            <td style="padding:10px 12px;border-bottom:1px solid #e0e0e0;font-weight:600">${rc ? rc.numero : '—'}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e0e0e0">${forn ? forn.nome : '—'}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e0e0e0">${mat ? mat.nome : '—'}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e0e0e0;text-align:center;font-weight:600">${e.quantidade || 0} ${un}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e0e0e0">${localEnt}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e0e0e0;text-align:center">${dataSol}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e0e0e0;text-align:center;color:#0055cc;font-weight:700">${dataPrev}</td>
        </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Programação de Entregas</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"><\/script>
<style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Segoe UI',Arial,sans-serif; background:#fff; color:#1a1a1a; padding:0; font-size:13px; }
    .page { max-width:960px; margin:20px auto; padding:0; }
    .toolbar { max-width:960px; margin:10px auto 0; display:flex; gap:8px; justify-content:flex-end; }
    .toolbar button { padding:8px 18px; border:none; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:6px; transition:all 0.2s; }
    .btn-copy { background:#0a0a0a; color:#00ff41; }
    .btn-copy:hover { background:#1a2a1a; }
    .btn-copy.copied { background:#00801a; color:#fff; }
    .btn-print { background:#0055cc; color:#fff; }
    .btn-print:hover { background:#0044aa; }
    .header { background:linear-gradient(135deg, #0a0a0a 0%, #1a2a1a 100%); color:#00ff41; padding:24px 30px; border-radius:12px 12px 0 0; display:flex; align-items:center; justify-content:space-between; }
    .header h1 { font-size:18px; font-weight:700; letter-spacing:-0.3px; }
    .header .sub { font-size:11px; color:#8aff8a; margin-top:2px; }
    .header .doc-type { text-align:right; }
    .header .doc-type span { display:block; font-size:18px; font-weight:700; }
    .header .doc-type small { font-size:11px; color:#8aff8a; }
    .body-content { border:2px solid #0a0a0a; border-top:none; border-radius:0 0 12px 12px; overflow:hidden; }
    .summary { padding:14px 24px; background:#f0fff0; border-bottom:2px solid #00cc2a; display:flex; justify-content:space-between; align-items:center; }
    .summary .count { font-size:14px; font-weight:700; color:#00801a; }
    .summary .date { font-size:12px; color:#666; }
    table { width:100%; border-collapse:collapse; }
    th { background:#0a0a0a; color:#00ff41; padding:10px 12px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; font-weight:700; }
    .footer { background:#f8f8f8; padding:14px 24px; display:flex; justify-content:space-between; align-items:center; font-size:11px; color:#999; border-top:1px solid #e0e0e0; }
    .footer .brand { color:#00aa88; font-weight:600; }
    @media print { .toolbar { display:none !important; } body { padding:0; } .page { margin:0; max-width:100%; } }
</style>
</head>
<body>
<div class="toolbar">
    <button class="btn-copy" onclick="copyAsImage()">📋 Copiar Imagem</button>
    <button class="btn-print" onclick="window.print()">🖨️ Imprimir</button>
</div>
<div class="page" id="captureArea">
    <div class="header">
        <div>
            <h1>SGCE</h1>
            <div class="sub">Sistema de Gestão de Contratos e Entregas</div>
        </div>
        <div class="doc-type">
            <span>PROGRAMAÇÃO DE ENTREGAS</span>
            <small>${new Date().toLocaleDateString('pt-BR')}</small>
        </div>
    </div>
    <div class="body-content">
        <div class="summary">
            <div class="count">🚚 ${entregas.length} entrega${entregas.length > 1 ? 's' : ''} em rota</div>
            <div class="date">Emitido em: ${new Date().toLocaleString('pt-BR')}</div>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Nº RC</th>
                    <th>Fornecedor</th>
                    <th>Material</th>
                    <th style="text-align:center">Qtd</th>
                    <th>Local Entrega</th>
                    <th style="text-align:center">Data Solicitação</th>
                    <th style="text-align:center">Previsão Entrega</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
        <div class="footer">
            <span class="brand">Feito por Lucas Marques</span>
            <span>Impresso em: ${new Date().toLocaleString('pt-BR')}</span>
        </div>
    </div>
</div>
<script>
function copyAsImage() {
    var btn = document.querySelector('.btn-copy');
    btn.textContent = '⏳ Gerando...';
    html2canvas(document.getElementById('captureArea'), { scale: 2, useCORS: true, backgroundColor: '#ffffff' }).then(function(canvas) {
        canvas.toBlob(function(blob) {
            navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).then(function() {
                btn.textContent = '✅ Copiado!';
                btn.classList.add('copied');
                setTimeout(function() { btn.textContent = '📋 Copiar Imagem'; btn.classList.remove('copied'); }, 2500);
            }).catch(function() {
                btn.textContent = '❌ Erro';
                setTimeout(function() { btn.textContent = '📋 Copiar Imagem'; }, 2000);
            });
        }, 'image/png');
    });
}
<\/script>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) {
        win.document.write(html);
        win.document.close();
    } else {
        toast('Não foi possível abrir a janela de impressão. Verifique se popups estão permitidos.', 'error');
    }
}


// ========================================================================
// PENDÊNCIAS
// ========================================================================
function pendenciaStatusColor(s) {
    return { 'Aberta': 'orange', 'Em Andamento': 'blue', 'Resolvida': 'green', 'Cancelada': 'gray' }[s] || 'gray';
}

function pendenciaCriticidadeColor(c) {
    return { 'Baixa': 'gray', 'Média': 'blue', 'Alta': 'orange', 'Urgente': 'red' }[c] || 'gray';
}

function renderPendencias() {
    const data = DB.get('pendencias');
    const searchHtml = `<div class="search-box">${searchIcon}<input class="search-input" placeholder="Buscar pendência..." oninput="filterPendencias(this.value)"></div>`;

    const rows = data.map(p => {
        const canFinalize = (p.status === 'Aberta' || p.status === 'Em Andamento');
        const canReopen = (p.status === 'Resolvida' || p.status === 'Cancelada');
        let extraBtns = '';
        if (canFinalize) {
            extraBtns = `<button class="btn-icon" style="color:var(--neon)" onclick="finalizarPendencia('${p.id}')" title="Finalizar"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg></button>`;
        } else if (canReopen) {
            extraBtns = `<button class="btn-icon" style="color:var(--warning)" onclick="reabrirPendencia('${p.id}')" title="Reabrir"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 105.64-11.36L3 10"/></svg></button>`;
        }
        const vinculoIcons = [];
        if (p.vinculoRcId) vinculoIcons.push('<span title="Vinculada a RC" style="font-size:10px;color:var(--info);margin-left:4px">📋RC</span>');
        if (p.vinculoContratoId) vinculoIcons.push('<span title="Vinculada a Contrato" style="font-size:10px;color:var(--purple);margin-left:4px">📄CT</span>');

        return `<tr class="clickable-row" onclick="if(!event.target.closest('.actions'))verDetalhesPendencia('${p.id}')" data-search="${escHtml((p.assunto + ' ' + (p.descricao || '') + ' ' + (p.envolvidos || '') + ' ' + p.status + ' ' + p.criticidade).toLowerCase())}">
            <td><strong>${escHtml(p.assunto)}</strong>${vinculoIcons.join('')}</td>
            <td>${badge(p.criticidade, pendenciaCriticidadeColor(p.criticidade))}</td>
            <td>${badge(p.status, pendenciaStatusColor(p.status))}</td>
            <td>${escHtml(p.envolvidos || '—')}</td>
            <td>${fmtDate(p.prazo)}</td>
            <td>${fmtDate(p.dataCriacao)}</td>
            <td class="col-actions"><div class="actions">${extraBtns}<button class="btn-icon" onclick="editPendencia('${p.id}')" title="Editar"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button><button class="btn-icon danger" onclick="deletePendencia('${p.id}','${escHtml(p.assunto)}')" title="Excluir"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button></div></td>
        </tr>`;
    });

    const abertas = data.filter(p => p.status === 'Aberta' || p.status === 'Em Andamento').length;

    $('#content').innerHTML = `
        <div class="page-header">
            <h2>Pendências</h2>
            <div class="page-actions">
                ${searchHtml}
                ${abertas > 0 ? `<span style="font-size:12px;color:var(--warning);margin-right:8px">${abertas} aberta${abertas > 1 ? 's' : ''}</span>` : ''}
                <button class="btn btn-secondary" onclick="exportCSV('pendencias')" style="font-size:12px" title="Exportar CSV">📥 CSV</button>
                <button class="btn btn-secondary" onclick="printRelatorioPendencias()" style="font-size:12px">🖨️ Relatório</button>
                <button class="btn btn-primary" onclick="editPendencia()">+ Nova Pendência</button>
            </div>
        </div>
        ${renderTable(['Assunto', 'Criticidade', 'Status', 'Envolvidos', 'Prazo', 'Criado em', ''], rows, 'Nenhuma pendência cadastrada')}
    `;
}

function filterPendencias(q) {
    q = q.toLowerCase();
    $$('.table tbody tr').forEach(tr => {
        tr.style.display = tr.dataset.search.includes(q) ? '' : 'none';
    });
}

function editPendencia(id) {
    const item = id ? DB.get('pendencias').find(p => p.id === id) : {};
    const title = id ? 'Editar Pendência' : 'Nova Pendência';

    // Build RC options
    const allRcs = DB.get('rcs');
    const allContratos = DB.get('contratos');
    const allFornecedores = DB.get('fornecedores');
    const rcOptions = allRcs.map(rc => {
        const contrato = allContratos.find(c => c.id === rc.contratoId);
        const forn = contrato ? allFornecedores.find(f => f.id === contrato.fornecedorId) : null;
        return `<option value="${rc.id}" ${item.vinculoRcId === rc.id ? 'selected' : ''}>${escHtml(rc.numero)} — ${forn ? escHtml(forn.nome) : '?'}</option>`;
    }).join('');
    const contratoOptions = allContratos.map(c => {
        const forn = allFornecedores.find(f => f.id === c.fornecedorId);
        return `<option value="${c.id}" ${item.vinculoContratoId === c.id ? 'selected' : ''}>${escHtml(c.numero)} — ${forn ? escHtml(forn.nome) : '?'}</option>`;
    }).join('');

    openModal(title, `
        <div class="form-grid">
            <div class="form-group full">
                <label>Assunto <span class="required">*</span></label>
                <input class="form-control" id="fPenAssunto" value="${escHtml(item.assunto || '')}" placeholder="Título da pendência">
            </div>
            <div class="form-group">
                <label>Criticidade <span class="required">*</span></label>
                <select class="form-control" id="fPenCriticidade">
                    ${['Baixa', 'Média', 'Alta', 'Urgente'].map(c => `<option ${item.criticidade === c ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Status</label>
                <select class="form-control" id="fPenStatus">
                    ${['Aberta', 'Em Andamento', 'Resolvida', 'Cancelada'].map(s => `<option ${item.status === s ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
            </div>
            <div class="form-group full">
                <label>Envolvidos</label>
                <input class="form-control" id="fPenEnvolvidos" value="${escHtml(item.envolvidos || '')}" placeholder="Pessoas envolvidas (ex: João, Maria, Equipe X)">
            </div>
            <div class="form-group">
                <label>Prazo</label>
                <input class="form-control" id="fPenPrazo" type="text" value="${dateToBR(item.prazo || '')}" placeholder="DD/MM/AAAA" maxlength="10">
            </div>
            <div class="form-group">
                <label>Categoria</label>
                <select class="form-control" id="fPenCategoria">
                    <option value="">Selecione...</option>
                    ${['Contrato', 'Entrega', 'Fornecedor', 'Material', 'Financeiro', 'Documentação', 'Outro'].map(c => `<option ${item.categoria === c ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Vincular a RC <span style="font-size:10px;color:var(--text-muted)">(opcional)</span></label>
                <select class="form-control" id="fPenVinculoRC">
                    <option value="">Nenhuma</option>
                    ${rcOptions}
                </select>
            </div>
            <div class="form-group">
                <label>Vincular a Contrato <span style="font-size:10px;color:var(--text-muted)">(opcional)</span></label>
                <select class="form-control" id="fPenVinculoContrato">
                    <option value="">Nenhum</option>
                    ${contratoOptions}
                </select>
            </div>
            <div class="form-group full">
                <label>Descrição</label>
                <textarea class="form-control" id="fPenDescricao" rows="3" placeholder="Descreva a pendência em detalhes...">${escHtml(item.descricao || '')}</textarea>
            </div>
            <div class="form-group full">
                <label>Observações</label>
                <textarea class="form-control" id="fPenObs" rows="2">${escHtml(item.observacoes || '')}</textarea>
            </div>
        </div>
        <div class="form-actions">
            <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="savePendencia('${id || ''}')">Salvar</button>
        </div>
    `);
}

function savePendencia(id) {
    const assunto = $('#fPenAssunto').value.trim();
    if (!assunto) { toast('Informe o assunto da pendência', 'error'); return; }

    const obj = {
        assunto,
        criticidade: $('#fPenCriticidade').value,
        status: $('#fPenStatus').value,
        envolvidos: $('#fPenEnvolvidos').value.trim(),
        prazo: brToISO($('#fPenPrazo').value),
        categoria: $('#fPenCategoria').value,
        vinculoRcId: $('#fPenVinculoRC').value || '',
        vinculoContratoId: $('#fPenVinculoContrato').value || '',
        descricao: $('#fPenDescricao').value.trim(),
        observacoes: $('#fPenObs').value.trim(),
        dataCriacao: id ? undefined : todayISO()
    };

    const data = DB.get('pendencias');
    if (id) {
        const idx = data.findIndex(p => p.id === id);
        if (idx >= 0) {
            delete obj.dataCriacao;
            data[idx] = { ...data[idx], ...obj };
        }
    } else {
        obj.id = DB.id();
        data.push(obj);
    }
    DB.set('pendencias', data);
    closeModal();
    toast(id ? 'Pendência atualizada!' : 'Pendência cadastrada!');
    renderPendencias();
}

function deletePendencia(id, nome) {
    confirmDelete(nome, `doDeletePendencia('${id}')`);
}

function doDeletePendencia(id) {
    DB.set('pendencias', DB.get('pendencias').filter(p => p.id !== id));
    toast('Pendência excluída!');
    renderPendencias();
}

function finalizarPendencia(id) {
    const data = DB.get('pendencias');
    const idx = data.findIndex(p => p.id === id);
    if (idx >= 0) {
        data[idx].status = 'Resolvida';
        data[idx].dataResolucao = todayISO();
        DB.set('pendencias', data);
        toast('Pendência finalizada!', 'success');
        renderPendencias();
    }
}

function verDetalhesPendencia(penId) {
    const p = DB.get('pendencias').find(x => x.id === penId);
    if (!p) return;

    // Resolve vínculos
    let vinculoRcHtml = '';
    if (p.vinculoRcId) {
        const rc = DB.get('rcs').find(r => r.id === p.vinculoRcId);
        if (rc) vinculoRcHtml = `<div><span style="font-size:11px;color:var(--text-muted)">Vinculada à RC</span><div><a onclick="closeModal(); verDetalhesRC('${rc.id}')" style="cursor:pointer;color:var(--info);font-weight:600">${escHtml(rc.numero)}</a></div></div>`;
    }
    let vinculoContratoHtml = '';
    if (p.vinculoContratoId) {
        const c = DB.get('contratos').find(x => x.id === p.vinculoContratoId);
        if (c) vinculoContratoHtml = `<div><span style="font-size:11px;color:var(--text-muted)">Vinculada ao Contrato</span><div><a onclick="closeModal(); verDetalhesContrato('${c.id}')" style="cursor:pointer;color:var(--info);font-weight:600">${escHtml(c.numero)}</a></div></div>`;
    }

    openModal('Detalhes — ' + p.assunto, `
        <div style="display:grid;gap:16px">
            <div style="padding:14px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--neon);margin-bottom:8px;letter-spacing:0.5px">Pendência</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
                    <div style="grid-column:1/-1"><span style="font-size:11px;color:var(--text-muted)">Assunto</span><div style="font-weight:600;font-size:15px">${escHtml(p.assunto)}</div></div>
                    <div><span style="font-size:11px;color:var(--text-muted)">Criticidade</span><div>${badge(p.criticidade, pendenciaCriticidadeColor(p.criticidade))}</div></div>
                    <div><span style="font-size:11px;color:var(--text-muted)">Status</span><div>${badge(p.status, pendenciaStatusColor(p.status))}</div></div>
                    <div><span style="font-size:11px;color:var(--text-muted)">Categoria</span><div>${escHtml(p.categoria || '—')}</div></div>
                    <div><span style="font-size:11px;color:var(--text-muted)">Criado em</span><div>${fmtDate(p.dataCriacao)}</div></div>
                    <div><span style="font-size:11px;color:var(--text-muted)">Prazo</span><div style="${p.prazo && p.prazo < todayISO() && p.status !== 'Resolvida' && p.status !== 'Cancelada' ? 'color:var(--danger);font-weight:600' : ''}">${fmtDate(p.prazo) || '—'}</div></div>
                    <div><span style="font-size:11px;color:var(--text-muted)">Envolvidos</span><div>${escHtml(p.envolvidos || '—')}</div></div>
                    ${p.dataResolucao ? `<div><span style="font-size:11px;color:var(--text-muted)">Resolvida em</span><div style="color:var(--neon);font-weight:600">${fmtDate(p.dataResolucao)}</div></div>` : ''}
                    ${vinculoRcHtml}
                    ${vinculoContratoHtml}
                </div>
            </div>
            ${p.descricao ? `<div style="padding:14px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--neon);margin-bottom:8px;letter-spacing:0.5px">Descrição</div>
                <div style="font-size:13px;color:var(--text-secondary);white-space:pre-wrap;line-height:1.5">${escHtml(p.descricao)}</div>
            </div>` : ''}
            ${p.observacoes ? `<div style="padding:14px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--neon);margin-bottom:8px;letter-spacing:0.5px">Observações</div>
                <div style="font-size:13px;color:var(--text-secondary);white-space:pre-wrap;line-height:1.5">${escHtml(p.observacoes)}</div>
            </div>` : ''}
        </div>
        <div class="form-actions" style="margin-top:16px">
            <button class="btn btn-secondary" onclick="closeModal()">Fechar</button>
            <button class="btn btn-primary" onclick="closeModal(); editPendencia('${penId}')">Editar</button>
        </div>
    `);
}

function inserirNumeroRC(rcId) {
    const rc = DB.get('rcs').find(r => r.id === rcId);
    if (!rc) return;

    openModal('Inserir Nº da RC', `
        <div style="margin-bottom:16px;padding:12px;background:rgba(0,255,65,0.08);border:1px solid var(--neon);border-radius:8px">
            <strong style="color:var(--neon)">Pedido: ${escHtml(rc.numero)}</strong>
            <div style="color:var(--text-secondary);font-size:13px;margin-top:4px">Este pedido foi criado sem número de RC. Insira o número da RC para regularizar.</div>
        </div>
        <div class="form-grid">
            <div class="form-group full">
                <label>Nº da RC <span class="required">*</span></label>
                <input class="form-control" id="fInsRcNumero" placeholder="Ex: RC-2024-001" value="">
            </div>
        </div>
        <div class="form-actions">
            <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-primary" style="background:var(--neon);color:#000" onclick="salvarNumeroRC('${rcId}')">✓ Regularizar RC</button>
        </div>
    `);
}

function salvarNumeroRC(rcId) {
    const novoNumero = $('#fInsRcNumero').value.trim();
    if (!novoNumero) { toast('Informe o número da RC', 'error'); return; }

    const data = DB.get('rcs');
    const idx = data.findIndex(r => r.id === rcId);
    if (idx >= 0) {
        data[idx].numero = novoNumero;
        data[idx].semRC = false;
        DB.set('rcs', data);
        closeModal();
        toast(`RC regularizada! Novo Nº: ${novoNumero}`, 'success');
        renderRCs();
    }
}

function verDetalhesRC(rcId) {
    const rc = DB.get('rcs').find(r => r.id === rcId);
    if (!rc) return;
    const contratos = DB.get('contratos');
    const fornecedores = DB.get('fornecedores');
    const materiais = DB.get('materiais');
    const entregas = DB.get('entregas').filter(e => e.rcId === rcId);
    const pendencias = DB.get('pendencias');

    const contrato = contratos.find(c => c.id === rc.contratoId);
    const forn = contrato ? fornecedores.find(f => f.id === contrato.fornecedorId) : null;
    const mat = materiais.find(m => m.id === rc.materialId);
    const valorTotal = (rc.quantidade || 0) * (rc.valorUnitario || 0);

    const entregasHtml = entregas.length > 0
        ? entregas.map(e => `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
            <span style="font-size:13px">NF <strong>${escHtml(e.notaFiscal || '—')}</strong> · ${e.quantidade || 0} un · ${fmtDate(e.data)}</span>
            ${badge(e.status, entregaStatusColor(e.status))}
        </div>`).join('')
        : '<p style="color:var(--text-muted);font-size:13px;padding:8px 0">Nenhuma entrega vinculada</p>';

    const historicoHtml = (rc.historico || []).length > 0
        ? (rc.historico || []).map(h => `<span style="font-size:11px">${badge(h.de, rcStatusColor(h.de))} → ${badge(h.para, rcStatusColor(h.para))} <span style="color:var(--text-muted)">${fmtDate(h.data)}</span></span>`).join('<br>')
        : '<span style="font-size:12px;color:var(--text-muted)">Sem alterações</span>';

    // Contract consumption
    let contratoHtml = '<p style="color:var(--text-muted);font-size:13px">—</p>';
    if (contrato) {
        const qtdUsada = DB.get('rcs').filter(r => r.contratoId === contrato.id && r.status !== 'Cancelada').reduce((s, r) => s + (parseFloat(r.quantidade) || 0), 0);
        const qtdTotal = contrato.quantidadeContratada || 0;
        const pctUsed = qtdTotal > 0 ? (qtdUsada / qtdTotal) * 100 : 0;
        contratoHtml = `<div style="font-size:13px">
            <strong>${escHtml(contrato.numero)}</strong> · ${badge(contrato.status, contractStatusColor(contrato.status))}<br>
            <span style="color:var(--text-secondary)">Vigência: ${fmtDate(contrato.dataInicio)} a ${fmtDate(contrato.dataFim)}</span><br>
            <span style="color:var(--text-secondary)">Consumo: ${qtdUsada}/${qtdTotal} (${pctUsed.toFixed(0)}%) · Valor: ${fmt(contrato.valor)}</span>
        </div>`;
    }

    openModal('Detalhes — ' + rc.numero, `
        <div style="display:grid;gap:16px">
            <div style="padding:14px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--neon);margin-bottom:8px;letter-spacing:0.5px">Requisição</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
                    <div><span style="font-size:11px;color:var(--text-muted)">Nº RC</span><div style="font-weight:600">${escHtml(rc.numero)}</div></div>
                    <div><span style="font-size:11px;color:var(--text-muted)">Status</span><div>${badge(rc.status, rcStatusColor(rc.status))}${rc.semRC ? ' <span class="badge badge-orange" style="font-size:9px">SEM RC</span>' : ''}</div></div>
                    <div><span style="font-size:11px;color:var(--text-muted)">Data</span><div>${fmtDate(rc.data)}</div></div>
                    <div><span style="font-size:11px;color:var(--text-muted)">Previsão</span><div style="color:var(--info)">${fmtDate(rc.dataPrevisao)}</div></div>
                    <div><span style="font-size:11px;color:var(--text-muted)">Local Entrega</span><div>${escHtml(rc.localEntrega || '—')}</div></div>
                    <div><span style="font-size:11px;color:var(--text-muted)">Valor Total</span><div style="font-weight:700;color:var(--neon)">${fmt(valorTotal)}</div></div>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                <div style="padding:14px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--neon);margin-bottom:8px;letter-spacing:0.5px">Material</div>
                    ${mat ? `<div style="font-weight:600">${escHtml(mat.nome)}</div><div style="font-size:12px;color:var(--text-secondary)">SAP: ${escHtml(mat.codigoSap)} · ${escHtml(mat.unidade)}</div><div style="font-size:13px;margin-top:4px">Qtd: <strong>${rc.quantidade || 0}</strong> · Unit.: <strong>${fmt(rc.valorUnitario)}</strong></div>` : '<span style="color:var(--text-muted)">—</span>'}
                </div>
                <div style="padding:14px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--neon);margin-bottom:8px;letter-spacing:0.5px">Fornecedor</div>
                    ${forn ? `<div style="font-weight:600">${escHtml(forn.nome)}</div><div style="font-size:12px;color:var(--text-secondary)">${forn.cnpj || '—'} · ${forn.telefone || '—'}</div><div style="font-size:12px;color:var(--text-secondary)">${forn.email || '—'}</div>` : '<span style="color:var(--text-muted)">—</span>'}
                </div>
            </div>
            <div style="padding:14px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--neon);margin-bottom:8px;letter-spacing:0.5px">Contrato</div>
                ${contratoHtml}
            </div>
            <div style="padding:14px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--neon);margin-bottom:8px;letter-spacing:0.5px">Entregas (${entregas.length})</div>
                ${entregasHtml}
            </div>
            <div style="padding:14px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--neon);margin-bottom:8px;letter-spacing:0.5px">Histórico de Alterações</div>
                ${historicoHtml}
            </div>
            ${rc.observacoes ? `<div style="padding:14px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--neon);margin-bottom:8px;letter-spacing:0.5px">Observações</div>
                <div style="font-size:13px;color:var(--text-secondary);white-space:pre-wrap">${escHtml(rc.observacoes)}</div>
            </div>` : ''}
        </div>
        <div class="form-actions" style="margin-top:16px">
            <button class="btn btn-secondary" onclick="closeModal()">Fechar</button>
            <button class="btn btn-primary" onclick="closeModal(); printRC('${rcId}')">🖨️ Extrato</button>
        </div>
    `);
}

function reabrirPendencia(id) {
    const data = DB.get('pendencias');
    const idx = data.findIndex(p => p.id === id);
    if (idx >= 0) {
        data[idx].status = 'Aberta';
        DB.set('pendencias', data);
        toast('Pendência reaberta!', 'warning');
        renderPendencias();
    }
}


// ========================================================================
// BUSCA GLOBAL
// ========================================================================
function openGlobalSearch() {
    $('#searchOverlay').classList.add('active');
    setTimeout(() => $('#globalSearchInput').focus(), 100);
}

function closeGlobalSearch() {
    $('#searchOverlay').classList.remove('active');
    $('#globalSearchInput').value = '';
    $('#globalSearchResults').innerHTML = '<div class="search-empty">Digite para buscar em todas as áreas do sistema</div>';
}

function doGlobalSearch(query) {
    const q = query.trim().toLowerCase();
    const results = $('#globalSearchResults');
    if (q.length < 2) {
        results.innerHTML = '<div class="search-empty">Digite pelo menos 2 caracteres</div>';
        return;
    }

    const materiais = DB.get('materiais');
    const fornecedores = DB.get('fornecedores');
    const contratos = DB.get('contratos');
    const rcs = DB.get('rcs');
    const entregas = DB.get('entregas');
    const pendencias = DB.get('pendencias');

    let html = '';
    let total = 0;

    // Materiais
    const matResults = materiais.filter(m => (m.codigoSap + ' ' + m.nome + ' ' + m.unidade + ' ' + (m.grupo || '')).toLowerCase().includes(q));
    if (matResults.length > 0) {
        html += '<div class="search-group-title">📦 Materiais</div>';
        matResults.slice(0, 5).forEach(m => {
            html += `<div class="search-result-item" onclick="closeGlobalSearch(); navigate('materiais')">
                <div class="sr-main"><div class="sr-title">${escHtml(m.codigoSap)} — ${escHtml(m.nome)}</div><div class="sr-sub">${escHtml(m.unidade)} · ${escHtml(m.grupo || '—')}</div></div>
            </div>`;
        });
        total += matResults.length;
    }

    // Fornecedores
    const fornResults = fornecedores.filter(f => (f.nome + ' ' + (f.cnpj || '') + ' ' + (f.email || '') + ' ' + (f.responsavel || '')).toLowerCase().includes(q));
    if (fornResults.length > 0) {
        html += '<div class="search-group-title">👥 Fornecedores</div>';
        fornResults.slice(0, 5).forEach(f => {
            html += `<div class="search-result-item" onclick="closeGlobalSearch(); navigate('fornecedores')">
                <div class="sr-main"><div class="sr-title">${escHtml(f.nome)}</div><div class="sr-sub">${escHtml(f.cnpj || '—')} · ${escHtml(f.email || '—')}</div></div>
            </div>`;
        });
        total += fornResults.length;
    }

    // Contratos
    const conResults = contratos.filter(c => {
        const forn = fornecedores.find(f => f.id === c.fornecedorId);
        return (c.numero + ' ' + (c.descricao || '') + ' ' + (forn ? forn.nome : '')).toLowerCase().includes(q);
    });
    if (conResults.length > 0) {
        html += '<div class="search-group-title">📋 Contratos</div>';
        conResults.slice(0, 5).forEach(c => {
            const forn = fornecedores.find(f => f.id === c.fornecedorId);
            html += `<div class="search-result-item" onclick="closeGlobalSearch(); navigate('contratos')">
                <div class="sr-main"><div class="sr-title">${escHtml(c.numero)}</div><div class="sr-sub">${forn ? escHtml(forn.nome) : '—'} · ${escHtml(c.status)} · ${fmt(c.valor)}</div></div>
                ${badge(c.status, contractStatusColor(c.status))}
            </div>`;
        });
        total += conResults.length;
    }

    // RCs
    const rcResults = rcs.filter(rc => {
        const contrato = contratos.find(c => c.id === rc.contratoId);
        const mat = materiais.find(m => m.id === rc.materialId);
        return (rc.numero + ' ' + (contrato ? contrato.numero : '') + ' ' + (mat ? mat.nome : '') + ' ' + (rc.localEntrega || '')).toLowerCase().includes(q);
    });
    if (rcResults.length > 0) {
        html += '<div class="search-group-title">📝 Requisições</div>';
        rcResults.slice(0, 5).forEach(rc => {
            const mat = materiais.find(m => m.id === rc.materialId);
            html += `<div class="search-result-item" onclick="closeGlobalSearch(); navigate('rcs')">
                <div class="sr-main"><div class="sr-title">${escHtml(rc.numero)}</div><div class="sr-sub">${mat ? escHtml(mat.nome) : '—'} · ${fmtDate(rc.data)}</div></div>
                ${badge(rc.status, rcStatusColor(rc.status))}
            </div>`;
        });
        total += rcResults.length;
    }

    // Entregas
    const entResults = entregas.filter(e => {
        const rc = rcs.find(r => r.id === e.rcId);
        return ((e.notaFiscal || '') + ' ' + (rc ? rc.numero : '')).toLowerCase().includes(q);
    });
    if (entResults.length > 0) {
        html += '<div class="search-group-title">🚚 Entregas</div>';
        entResults.slice(0, 5).forEach(e => {
            const rc = rcs.find(r => r.id === e.rcId);
            html += `<div class="search-result-item" onclick="closeGlobalSearch(); navigate('entregas')">
                <div class="sr-main"><div class="sr-title">NF ${escHtml(e.notaFiscal || '—')}</div><div class="sr-sub">RC ${rc ? escHtml(rc.numero) : '—'} · ${fmtDate(e.data)}</div></div>
                ${badge(e.status, entregaStatusColor(e.status))}
            </div>`;
        });
        total += entResults.length;
    }

    // Pendências
    const penResults = pendencias.filter(p => (p.assunto + ' ' + (p.descricao || '') + ' ' + (p.envolvidos || '')).toLowerCase().includes(q));
    if (penResults.length > 0) {
        html += '<div class="search-group-title">⚠️ Pendências</div>';
        penResults.slice(0, 5).forEach(p => {
            html += `<div class="search-result-item" onclick="closeGlobalSearch(); navigate('pendencias')">
                <div class="sr-main"><div class="sr-title">${escHtml(p.assunto)}</div><div class="sr-sub">${escHtml(p.envolvidos || '—')} · ${fmtDate(p.prazo)}</div></div>
                ${badge(p.status, pendenciaStatusColor(p.status))}
            </div>`;
        });
        total += penResults.length;
    }

    if (total === 0) {
        results.innerHTML = '<div class="search-empty">Nenhum resultado encontrado</div>';
    } else {
        results.innerHTML = html;
    }
}


// ========================================================================
// TEMA CLARO / ESCURO
// ========================================================================
function initTheme() {
    const saved = localStorage.getItem('gp_theme');
    if (saved === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        updateThemeIcon('light');
    }
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    if (next === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('gp_theme', next);
    updateThemeIcon(next);
}

function updateThemeIcon(theme) {
    const btn = $('#themeToggleBtn');
    if (!btn) return;
    if (theme === 'light') {
        btn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>';
        btn.title = 'Modo Escuro';
    } else {
        btn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
        btn.title = 'Modo Claro';
    }
}


// ========================================================================
// ATALHOS DE TECLADO
// ========================================================================
function showShortcutsHelp() {
    openModal('Atalhos de Teclado', `
        <div class="shortcuts-grid">
            <div class="shortcut-key"><kbd>Ctrl</kbd>+<kbd>K</kbd></div><div>Busca Global</div>
            <div class="shortcut-key"><kbd>Ctrl</kbd>+<kbd>N</kbd></div><div>Novo registro (na aba atual)</div>
            <div class="shortcut-key"><kbd>Ctrl</kbd>+<kbd>P</kbd></div><div>Imprimir / Relatório</div>
            <div class="shortcut-key"><kbd>Ctrl</kbd>+<kbd>T</kbd></div><div>Alternar tema claro/escuro</div>
            <div class="shortcut-key"><kbd>?</kbd></div><div>Mostrar esta ajuda</div>
            <div class="shortcut-key"><kbd>Esc</kbd></div><div>Fechar modal / busca</div>
            <div class="shortcut-key"><kbd>1</kbd>-<kbd>8</kbd></div><div>Navegar pelas abas</div>
        </div>
        <div class="form-actions" style="margin-top:20px">
            <button class="btn btn-secondary" onclick="closeModal()">Fechar</button>
        </div>
    `);
}


// ========================================================================
// EXPORTAR CSV
// ========================================================================
function exportCSV(entity) {
    const data = DB.get(entity);
    if (!data || data.length === 0) {
        toast('Nenhum dado para exportar', 'error');
        return;
    }

    const materiais = DB.get('materiais');
    const fornecedores = DB.get('fornecedores');
    const contratos = DB.get('contratos');
    const rcs = DB.get('rcs');

    let headers, rows;
    const sep = ';';

    switch (entity) {
        case 'materiais':
            headers = ['Código SAP', 'Nome', 'Unidade', 'Grupo', 'Composição'];
            rows = data.map(m => [m.codigoSap, m.nome, m.unidade, m.grupo || '', m.composicao || '']);
            break;
        case 'fornecedores':
            headers = ['Nome', 'CNPJ', 'Telefone', 'Email', 'Responsável', 'Lead Time'];
            rows = data.map(f => [f.nome, f.cnpj || '', f.telefone || '', f.email || '', f.responsavel || '', f.leadTime || '']);
            break;
        case 'contratos':
            headers = ['Nº Contrato', 'Fornecedor', 'Material', 'Qtd Contratada', 'Preço Unit.', 'Valor Total', 'Data Início', 'Data Fim', 'Status'];
            rows = data.map(c => {
                const forn = fornecedores.find(f => f.id === c.fornecedorId);
                const mat = materiais.find(m => m.id === c.materialId);
                return [c.numero, forn ? forn.nome : '', mat ? mat.nome : '', c.quantidadeContratada || 0, c.precoUnitario || 0, c.valor || 0, dateToBR(c.dataInicio), dateToBR(c.dataFim), c.status];
            });
            break;
        case 'rcs':
            headers = ['Nº RC', 'Contrato', 'Fornecedor', 'Material', 'Quantidade', 'Valor Unit.', 'Local Entrega', 'Data', 'Previsão', 'Status'];
            rows = data.map(rc => {
                const contrato = contratos.find(c => c.id === rc.contratoId);
                const forn = contrato ? fornecedores.find(f => f.id === contrato.fornecedorId) : null;
                const mat = materiais.find(m => m.id === rc.materialId);
                return [rc.numero, contrato ? contrato.numero : '', forn ? forn.nome : '', mat ? mat.nome : '', rc.quantidade || 0, rc.valorUnitario || 0, rc.localEntrega || '', dateToBR(rc.data), dateToBR(rc.dataPrevisao), rc.status];
            });
            break;
        case 'entregas':
            headers = ['RC', 'Fornecedor', 'Material', 'Quantidade', 'Nota Fiscal', 'Local Entrega', 'Data', 'Previsão', 'Status'];
            rows = data.map(e => {
                const rc = rcs.find(r => r.id === e.rcId);
                const contrato = rc ? contratos.find(c => c.id === rc.contratoId) : null;
                const forn = contrato ? fornecedores.find(f => f.id === contrato.fornecedorId) : null;
                const mat = rc ? materiais.find(m => m.id === rc.materialId) : null;
                return [rc ? rc.numero : '', forn ? forn.nome : '', mat ? mat.nome : '', e.quantidade || 0, e.notaFiscal || '', e.localEntrega || '', dateToBR(e.data), dateToBR(e.dataPrevisao), e.status];
            });
            break;
        case 'pendencias':
            headers = ['Assunto', 'Criticidade', 'Status', 'Envolvidos', 'Prazo', 'Categoria', 'Criado em'];
            rows = data.map(p => [p.assunto, p.criticidade, p.status, p.envolvidos || '', dateToBR(p.prazo), p.categoria || '', dateToBR(p.dataCriacao)]);
            break;
        default:
            toast('Entidade não reconhecida', 'error');
            return;
    }

    const csvContent = '\uFEFF' + [headers.join(sep), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(sep))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const now = new Date();
    a.download = `SGCE_${entity}_${now.getDate().toString().padStart(2,'0')}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getFullYear()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast(`CSV exportado: ${entity}`);
}


// ========================================================================
// RELATÓRIO MENSAL
// ========================================================================
function openRelatorioMensal() {
    const now = new Date();
    const mes = (now.getMonth() + 1).toString().padStart(2, '0');
    const ano = now.getFullYear();

    openModal('Relatório Mensal', `
        <div class="form-grid">
            <div class="form-group">
                <label>Mês</label>
                <select class="form-control" id="fRelMes">
                    ${['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => `<option value="${m}" ${m === mes ? 'selected' : ''}>${['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][parseInt(m)-1]}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Ano</label>
                <input class="form-control" id="fRelAno" type="number" value="${ano}" min="2020" max="2099">
            </div>
        </div>
        <div class="form-actions">
            <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="gerarRelatorioMensal()">Gerar Relatório</button>
        </div>
    `);
}

function gerarRelatorioMensal() {
    const mes = $('#fRelMes').value;
    const ano = $('#fRelAno').value;
    const prefix = `${ano}-${mes}`;
    const mesNome = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][parseInt(mes)-1];

    const rcs = DB.get('rcs').filter(r => (r.data || '').startsWith(prefix));
    const entregas = DB.get('entregas').filter(e => (e.data || '').startsWith(prefix));
    const contratos = DB.get('contratos');
    const fornecedores = DB.get('fornecedores');
    const materiais = DB.get('materiais');

    const totalRcs = rcs.length;
    const totalEntregas = entregas.length;
    const entregasRecebidas = entregas.filter(e => e.status === 'Recebida').length;
    const valorTotalRcs = rcs.reduce((s, r) => s + ((r.quantidade || 0) * (r.valorUnitario || 0)), 0);

    const rcRows = rcs.map((rc, i) => {
        const contrato = contratos.find(c => c.id === rc.contratoId);
        const forn = contrato ? fornecedores.find(f => f.id === contrato.fornecedorId) : null;
        const mat = materiais.find(m => m.id === rc.materialId);
        const bg = i % 2 === 0 ? '#fff' : '#f8fdf8';
        return `<tr style="background:${bg}">
            <td style="padding:8px 12px;border-bottom:1px solid #e0e0e0;font-weight:600">${rc.numero}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e0e0e0">${forn ? forn.nome : '—'}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e0e0e0">${mat ? mat.nome : '—'}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e0e0e0;text-align:center">${rc.quantidade || 0}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e0e0e0;text-align:right">${new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format((rc.quantidade||0)*(rc.valorUnitario||0))}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e0e0e0;text-align:center"><span style="font-weight:600">${rc.status}</span></td>
        </tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Relatório Mensal ${mesNome}/${ano}</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"><\/script>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#1a1a1a;font-size:13px}.page{max-width:900px;margin:20px auto}.toolbar{max-width:900px;margin:10px auto 0;display:flex;gap:8px;justify-content:flex-end}.toolbar button{padding:8px 18px;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px}.btn-copy{background:#0a0a0a;color:#00ff41}.btn-copy.copied{background:#00801a;color:#fff}.btn-print{background:#0055cc;color:#fff}.header{background:linear-gradient(135deg,#0a0a0a,#1a2a1a);color:#00ff41;padding:24px 30px;border-radius:12px 12px 0 0;display:flex;justify-content:space-between;align-items:center}.header h1{font-size:18px;font-weight:700}.header .sub{font-size:11px;color:#8aff8a;margin-top:2px}.header .doc-type{text-align:right}.header .doc-type span{display:block;font-size:18px;font-weight:700}.header .doc-type small{font-size:11px;color:#8aff8a}.body-content{border:2px solid #0a0a0a;border-top:none;border-radius:0 0 12px 12px;overflow:hidden}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border-bottom:2px solid #00cc2a}.stat-box{padding:16px;text-align:center;border-right:1px solid #e0e0e0}.stat-box:last-child{border-right:none}.stat-box .num{font-size:24px;font-weight:700;color:#00801a}.stat-box .lbl{font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.3px}table{width:100%;border-collapse:collapse}th{background:#0a0a0a;color:#00ff41;padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;font-weight:700}.footer{background:#f8f8f8;padding:14px 24px;display:flex;justify-content:space-between;font-size:11px;color:#999}@media print{.toolbar{display:none!important}.page{margin:0;max-width:100%}}</style></head><body>
<div class="toolbar"><button class="btn-copy" onclick="copyAsImage()">📋 Copiar Imagem</button><button class="btn-print" onclick="window.print()">🖨️ Imprimir</button></div>
<div class="page" id="captureArea"><div class="header"><div><h1>SGCE</h1><div class="sub">Sistema de Gestão de Contratos e Entregas</div></div><div class="doc-type"><span>RELATÓRIO MENSAL</span><small>${mesNome} / ${ano}</small></div></div>
<div class="body-content"><div class="stats"><div class="stat-box"><div class="num">${totalRcs}</div><div class="lbl">RCs no mês</div></div><div class="stat-box"><div class="num">${totalEntregas}</div><div class="lbl">Entregas</div></div><div class="stat-box"><div class="num">${entregasRecebidas}</div><div class="lbl">Recebidas</div></div><div class="stat-box"><div class="num">${new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(valorTotalRcs)}</div><div class="lbl">Valor Total RCs</div></div></div>
${totalRcs > 0 ? `<table><thead><tr><th>Nº RC</th><th>Fornecedor</th><th>Material</th><th style="text-align:center">Qtd</th><th style="text-align:right">Valor</th><th style="text-align:center">Status</th></tr></thead><tbody>${rcRows}</tbody></table>` : '<div style="padding:30px;text-align:center;color:#999">Nenhuma RC neste período</div>'}
<div class="footer"><span style="color:#00aa88;font-weight:600">Feito por Lucas Marques</span><span>Gerado em: ${new Date().toLocaleString('pt-BR')}</span></div></div></div>
<script>function copyAsImage(){var b=document.querySelector('.btn-copy');b.textContent='⏳ Gerando...';html2canvas(document.getElementById('captureArea'),{scale:2,useCORS:true,backgroundColor:'#ffffff'}).then(function(c){c.toBlob(function(bl){navigator.clipboard.write([new ClipboardItem({'image/png':bl})]).then(function(){b.textContent='✅ Copiado!';b.classList.add('copied');setTimeout(function(){b.textContent='📋 Copiar Imagem';b.classList.remove('copied')},2500)}).catch(function(){b.textContent='❌ Erro';setTimeout(function(){b.textContent='📋 Copiar Imagem'},2000)});},'image/png');});}<\/script></body></html>`;

    closeModal();
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
    else toast('Popups bloqueados', 'error');
}


// ========================================================================
// RELATÓRIO POR FORNECEDOR
// ========================================================================
function openRelatorioFornecedor() {
    const fornecedores = DB.get('fornecedores');
    if (fornecedores.length === 0) { toast('Nenhum fornecedor cadastrado', 'error'); return; }

    openModal('Relatório por Fornecedor', `
        <div class="form-group">
            <label>Fornecedor <span class="required">*</span></label>
            <select class="form-control" id="fRelForn">
                <option value="">Selecione...</option>
                ${fornecedores.map(f => `<option value="${f.id}">${escHtml(f.nome)}</option>`).join('')}
            </select>
        </div>
        <div class="form-actions">
            <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="gerarRelatorioFornecedor()">Gerar Relatório</button>
        </div>
    `);
}

function gerarRelatorioFornecedor() {
    const fornecedorId = $('#fRelForn').value;
    if (!fornecedorId) { toast('Selecione um fornecedor', 'error'); return; }

    const fornecedor = DB.get('fornecedores').find(f => f.id === fornecedorId);
    const contratos = DB.get('contratos').filter(c => c.fornecedorId === fornecedorId);
    const materiais = DB.get('materiais');
    const allRcs = DB.get('rcs');
    const allEntregas = DB.get('entregas');

    const contratoIds = contratos.map(c => c.id);
    const fornRcs = allRcs.filter(r => contratoIds.includes(r.contratoId));
    const rcIds = fornRcs.map(r => r.id);
    const fornEntregas = allEntregas.filter(e => rcIds.includes(e.rcId));

    const contratoRows = contratos.map((c, i) => {
        const mat = materiais.find(m => m.id === c.materialId);
        const bg = i % 2 === 0 ? '#fff' : '#f8fdf8';
        const qtdUsada = allRcs.filter(r => r.contratoId === c.id && r.status !== 'Cancelada').reduce((s, r) => s + (parseFloat(r.quantidade) || 0), 0);
        return `<tr style="background:${bg}"><td style="padding:8px 12px;border-bottom:1px solid #e0e0e0;font-weight:600">${c.numero}</td><td style="padding:8px 12px;border-bottom:1px solid #e0e0e0">${mat ? mat.nome : '—'}</td><td style="padding:8px 12px;border-bottom:1px solid #e0e0e0;text-align:center">${qtdUsada}/${c.quantidadeContratada||0}</td><td style="padding:8px 12px;border-bottom:1px solid #e0e0e0;text-align:right">${new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(c.valor||0)}</td><td style="padding:8px 12px;border-bottom:1px solid #e0e0e0;text-align:center;font-weight:600">${c.status}</td></tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Relatório - ${fornecedor.nome}</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"><\/script>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#1a1a1a;font-size:13px}.page{max-width:900px;margin:20px auto}.toolbar{max-width:900px;margin:10px auto 0;display:flex;gap:8px;justify-content:flex-end}.toolbar button{padding:8px 18px;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px}.btn-copy{background:#0a0a0a;color:#00ff41}.btn-copy.copied{background:#00801a;color:#fff}.btn-print{background:#0055cc;color:#fff}.header{background:linear-gradient(135deg,#0a0a0a,#1a2a1a);color:#00ff41;padding:24px 30px;border-radius:12px 12px 0 0;display:flex;justify-content:space-between;align-items:center}.header h1{font-size:18px}.header .sub{font-size:11px;color:#8aff8a;margin-top:2px}.header .doc-type{text-align:right}.header .doc-type span{display:block;font-size:16px;font-weight:700}.header .doc-type small{font-size:11px;color:#8aff8a}.body-content{border:2px solid #0a0a0a;border-top:none;border-radius:0 0 12px 12px;overflow:hidden}.info{padding:16px 24px;background:#f0fff0;border-bottom:1px solid #e0e0e0}.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 20px}.info .lbl{font-size:10px;color:#777;text-transform:uppercase}.info .val{font-size:14px;font-weight:600}.stats{display:grid;grid-template-columns:repeat(3,1fr);border-bottom:2px solid #00cc2a}.stat-box{padding:14px;text-align:center;border-right:1px solid #e0e0e0}.stat-box:last-child{border-right:none}.stat-box .num{font-size:22px;font-weight:700;color:#00801a}.stat-box .lbl{font-size:11px;color:#666;text-transform:uppercase}table{width:100%;border-collapse:collapse}th{background:#0a0a0a;color:#00ff41;padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;font-weight:700}.section-title{padding:12px 24px;font-size:12px;font-weight:700;text-transform:uppercase;color:#00801a;border-bottom:1px solid #e0e0e0;background:#fafafa}.footer{background:#f8f8f8;padding:14px 24px;display:flex;justify-content:space-between;font-size:11px;color:#999}@media print{.toolbar{display:none!important}.page{margin:0;max-width:100%}}</style></head><body>
<div class="toolbar"><button class="btn-copy" onclick="copyAsImage()">📋 Copiar Imagem</button><button class="btn-print" onclick="window.print()">🖨️ Imprimir</button></div>
<div class="page" id="captureArea"><div class="header"><div><h1>SGCE</h1><div class="sub">Sistema de Gestão de Contratos e Entregas</div></div><div class="doc-type"><span>RELATÓRIO POR FORNECEDOR</span><small>${new Date().toLocaleDateString('pt-BR')}</small></div></div>
<div class="body-content"><div class="info"><div class="info-grid"><div><div class="lbl">Fornecedor</div><div class="val">${fornecedor.nome}</div></div><div><div class="lbl">CNPJ</div><div class="val">${fornecedor.cnpj || '—'}</div></div><div><div class="lbl">Telefone</div><div class="val">${fornecedor.telefone || '—'}</div></div><div><div class="lbl">Email</div><div class="val">${fornecedor.email || '—'}</div></div></div></div>
<div class="stats"><div class="stat-box"><div class="num">${contratos.length}</div><div class="lbl">Contratos</div></div><div class="stat-box"><div class="num">${fornRcs.length}</div><div class="lbl">RCs</div></div><div class="stat-box"><div class="num">${fornEntregas.length}</div><div class="lbl">Entregas</div></div></div>
<div class="section-title">Contratos</div>
${contratos.length > 0 ? `<table><thead><tr><th>Nº Contrato</th><th>Material</th><th style="text-align:center">Consumo</th><th style="text-align:right">Valor</th><th style="text-align:center">Status</th></tr></thead><tbody>${contratoRows}</tbody></table>` : '<div style="padding:20px;text-align:center;color:#999">Nenhum contrato</div>'}
<div class="footer"><span style="color:#00aa88;font-weight:600">Feito por Lucas Marques</span><span>Gerado em: ${new Date().toLocaleString('pt-BR')}</span></div></div></div>
<script>function copyAsImage(){var b=document.querySelector('.btn-copy');b.textContent='⏳ Gerando...';html2canvas(document.getElementById('captureArea'),{scale:2,useCORS:true,backgroundColor:'#ffffff'}).then(function(c){c.toBlob(function(bl){navigator.clipboard.write([new ClipboardItem({'image/png':bl})]).then(function(){b.textContent='✅ Copiado!';b.classList.add('copied');setTimeout(function(){b.textContent='📋 Copiar Imagem';b.classList.remove('copied')},2500)}).catch(function(){b.textContent='❌ Erro';setTimeout(function(){b.textContent='📋 Copiar Imagem'},2000)});},'image/png');});}<\/script></body></html>`;

    closeModal();
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
    else toast('Popups bloqueados', 'error');
}


// ========================================================================
// RELATÓRIO DE PENDÊNCIAS
// ========================================================================
function printRelatorioPendencias() {
    const pendencias = DB.get('pendencias');
    if (pendencias.length === 0) { toast('Nenhuma pendência cadastrada', 'error'); return; }

    const abertas = pendencias.filter(p => p.status === 'Aberta' || p.status === 'Em Andamento');
    const resolvidas = pendencias.filter(p => p.status === 'Resolvida');
    const urgentes = pendencias.filter(p => p.criticidade === 'Urgente' && p.status !== 'Resolvida' && p.status !== 'Cancelada');

    const critColors = { 'Baixa': '#666', 'Média': '#0055cc', 'Alta': '#cc7700', 'Urgente': '#cc0022' };
    const statusColors = { 'Aberta': '#e67e00', 'Em Andamento': '#0066cc', 'Resolvida': '#00aa44', 'Cancelada': '#999' };

    const tableRows = pendencias.map((p, i) => {
        const bg = i % 2 === 0 ? '#fff' : '#f8fdf8';
        return `<tr style="background:${bg}"><td style="padding:8px 12px;border-bottom:1px solid #e0e0e0;font-weight:600">${p.assunto}</td><td style="padding:8px 12px;border-bottom:1px solid #e0e0e0;text-align:center"><span style="color:${critColors[p.criticidade] || '#666'};font-weight:700">${p.criticidade}</span></td><td style="padding:8px 12px;border-bottom:1px solid #e0e0e0;text-align:center"><span style="color:${statusColors[p.status] || '#666'};font-weight:700">${p.status}</span></td><td style="padding:8px 12px;border-bottom:1px solid #e0e0e0">${p.envolvidos || '—'}</td><td style="padding:8px 12px;border-bottom:1px solid #e0e0e0;text-align:center">${p.prazo ? new Date(p.prazo+'T00:00:00').toLocaleDateString('pt-BR') : '—'}</td></tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Relatório de Pendências</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"><\/script>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#1a1a1a;font-size:13px}.page{max-width:900px;margin:20px auto}.toolbar{max-width:900px;margin:10px auto 0;display:flex;gap:8px;justify-content:flex-end}.toolbar button{padding:8px 18px;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px}.btn-copy{background:#0a0a0a;color:#00ff41}.btn-copy.copied{background:#00801a;color:#fff}.btn-print{background:#0055cc;color:#fff}.header{background:linear-gradient(135deg,#0a0a0a,#1a2a1a);color:#00ff41;padding:24px 30px;border-radius:12px 12px 0 0;display:flex;justify-content:space-between;align-items:center}.header h1{font-size:18px}.header .sub{font-size:11px;color:#8aff8a;margin-top:2px}.header .doc-type{text-align:right}.header .doc-type span{display:block;font-size:18px;font-weight:700}.header .doc-type small{font-size:11px;color:#8aff8a}.body-content{border:2px solid #0a0a0a;border-top:none;border-radius:0 0 12px 12px;overflow:hidden}.stats{display:grid;grid-template-columns:repeat(3,1fr);border-bottom:2px solid #00cc2a}.stat-box{padding:14px;text-align:center;border-right:1px solid #e0e0e0}.stat-box:last-child{border-right:none}.stat-box .num{font-size:22px;font-weight:700;color:#00801a}.stat-box .lbl{font-size:11px;color:#666;text-transform:uppercase}table{width:100%;border-collapse:collapse}th{background:#0a0a0a;color:#00ff41;padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;font-weight:700}.footer{background:#f8f8f8;padding:14px 24px;display:flex;justify-content:space-between;font-size:11px;color:#999}@media print{.toolbar{display:none!important}.page{margin:0;max-width:100%}}</style></head><body>
<div class="toolbar"><button class="btn-copy" onclick="copyAsImage()">📋 Copiar Imagem</button><button class="btn-print" onclick="window.print()">🖨️ Imprimir</button></div>
<div class="page" id="captureArea"><div class="header"><div><h1>SGCE</h1><div class="sub">Sistema de Gestão de Contratos e Entregas</div></div><div class="doc-type"><span>RELATÓRIO DE PENDÊNCIAS</span><small>${new Date().toLocaleDateString('pt-BR')}</small></div></div>
<div class="body-content"><div class="stats"><div class="stat-box"><div class="num">${abertas.length}</div><div class="lbl">Abertas</div></div><div class="stat-box"><div class="num">${urgentes.length}</div><div class="lbl" style="color:#cc0022">Urgentes</div></div><div class="stat-box"><div class="num">${resolvidas.length}</div><div class="lbl">Resolvidas</div></div></div>
<table><thead><tr><th>Assunto</th><th style="text-align:center">Criticidade</th><th style="text-align:center">Status</th><th>Envolvidos</th><th style="text-align:center">Prazo</th></tr></thead><tbody>${tableRows}</tbody></table>
<div class="footer"><span style="color:#00aa88;font-weight:600">Feito por Lucas Marques</span><span>Gerado em: ${new Date().toLocaleString('pt-BR')}</span></div></div></div>
<script>function copyAsImage(){var b=document.querySelector('.btn-copy');b.textContent='⏳ Gerando...';html2canvas(document.getElementById('captureArea'),{scale:2,useCORS:true,backgroundColor:'#ffffff'}).then(function(c){c.toBlob(function(bl){navigator.clipboard.write([new ClipboardItem({'image/png':bl})]).then(function(){b.textContent='✅ Copiado!';b.classList.add('copied');setTimeout(function(){b.textContent='📋 Copiar Imagem';b.classList.remove('copied')},2500)}).catch(function(){b.textContent='❌ Erro';setTimeout(function(){b.textContent='📋 Copiar Imagem'},2000)});},'image/png');});}<\/script></body></html>`;

    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
    else toast('Popups bloqueados', 'error');
}


// ========================================================================
// FOTO DA NF (Entrega)
// ========================================================================
function addFotoNF(entregaId) {
    openModal('Foto da NF', `
        <div style="margin-bottom:16px;text-align:center">
            <div id="fotoNFPreview" style="margin-bottom:12px"></div>
            <label style="display:inline-flex;align-items:center;gap:8px;padding:10px 20px;background:var(--neon-dim);border:2px dashed var(--neon);border-radius:var(--radius);cursor:pointer;color:var(--neon);font-size:13px;font-weight:600">
                📷 Selecionar Foto
                <input type="file" id="fotoNFInput" accept="image/*" style="display:none" onchange="previewFotoNF(this)">
            </label>
            <p style="font-size:11px;color:var(--text-muted);margin-top:8px">Máximo 500KB · JPG, PNG</p>
        </div>
        <div class="form-actions">
            <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="salvarFotoNF('${entregaId}')">Salvar Foto</button>
        </div>
    `);

    // Show existing photo if any
    const entrega = DB.get('entregas').find(e => e.id === entregaId);
    if (entrega && entrega.fotoNF) {
        $('#fotoNFPreview').innerHTML = `<img src="${entrega.fotoNF}" style="max-width:100%;max-height:300px;border-radius:var(--radius);border:1px solid var(--border)">`;
    }
}

function previewFotoNF(input) {
    const file = input.files[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
        toast('Imagem muito grande (máx 500KB). Reduza o tamanho.', 'error');
        input.value = '';
        return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
        $('#fotoNFPreview').innerHTML = `<img src="${e.target.result}" style="max-width:100%;max-height:300px;border-radius:var(--radius);border:1px solid var(--border)">`;
        window._pendingFotoNF = e.target.result;
    };
    reader.readAsDataURL(file);
}

function salvarFotoNF(entregaId) {
    const fotoData = window._pendingFotoNF;
    if (!fotoData) {
        // Check if we want to remove existing photo
        const entrega = DB.get('entregas').find(e => e.id === entregaId);
        if (entrega && entrega.fotoNF) {
            toast('Foto mantida', 'info');
        } else {
            toast('Selecione uma foto', 'error');
            return;
        }
    }

    if (fotoData) {
        const list = DB.get('entregas');
        const idx = list.findIndex(e => e.id === entregaId);
        if (idx >= 0) {
            list[idx].fotoNF = fotoData;
            DB.set('entregas', list);
        }
    }

    delete window._pendingFotoNF;
    closeModal();
    toast('Foto da NF salva!');
    renderEntregas();
}

function viewFotoNF(entregaId) {
    const entrega = DB.get('entregas').find(e => e.id === entregaId);
    if (!entrega || !entrega.fotoNF) { toast('Nenhuma foto cadastrada', 'error'); return; }
    openModal('Foto da NF — ' + (entrega.notaFiscal || entregaId), `
        <div style="text-align:center">
            <img src="${entrega.fotoNF}" style="max-width:100%;max-height:500px;border-radius:var(--radius)">
        </div>
        <div class="form-actions">
            <button class="btn btn-secondary" onclick="closeModal()">Fechar</button>
            <button class="btn btn-primary" onclick="closeModal(); addFotoNF('${entregaId}')">Trocar Foto</button>
        </div>
    `);
}


// ========================================================================
// CONFIGURAÇÃO DE E-MAIL
// ========================================================================
function getEmailConfig() {
    const stored = localStorage.getItem('gp_emailConfig');
    if (stored) return JSON.parse(stored);
    return { ccEmails: [], corpoEmail: 'Prezados,\n\nSegue em anexo a solicitação de compra conforme requisição referenciada no assunto.\n\nFicamos à disposição para quaisquer esclarecimentos.\n\nAtenciosamente,' };
}

function saveEmailConfig(config) {
    localStorage.setItem('gp_emailConfig', JSON.stringify(config));
}

function renderEmailConfig() {
    const config = getEmailConfig();
    const ccRows = config.ccEmails.map((email, i) => `<tr>
        <td style="padding:10px 14px">${escHtml(email)}</td>
        <td class="col-actions" style="width:80px"><div class="actions">
            <button class="btn-icon" onclick="editCCEmail(${i})" title="Editar"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
            <button class="btn-icon danger" onclick="removeCCEmail(${i})" title="Remover"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>
        </div></td>
    </tr>`);

    $('#content').innerHTML = `
        <div class="page-header">
            <h2>Configuração de E-Mail</h2>
        </div>
        <div style="display:grid;gap:20px;max-width:800px">
            <div style="padding:20px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg)">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
                    <h4 style="color:var(--neon);font-size:14px;margin:0">E-mails em Cópia (CC)</h4>
                    <button class="btn btn-primary" onclick="addCCEmail()" style="font-size:12px">+ Adicionar E-mail</button>
                </div>
                <p style="font-size:12px;color:var(--text-secondary);margin-bottom:12px">Estes e-mails serão incluídos automaticamente em cópia ao enviar solicitações por e-mail.</p>
                ${ccRows.length > 0
                    ? `<div class="table-container"><div class="table-responsive"><table class="table"><thead><tr><th>E-mail</th><th></th></tr></thead><tbody>${ccRows.join('')}</tbody></table></div></div>`
                    : '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px;border:1px dashed var(--border);border-radius:var(--radius)">Nenhum e-mail de cópia cadastrado</div>'}
            </div>
            <div style="padding:20px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg)">
                <h4 style="color:var(--neon);font-size:14px;margin:0 0 14px">Corpo Padrão do E-mail</h4>
                <p style="font-size:12px;color:var(--text-secondary);margin-bottom:12px">Texto padrão que será inserido no corpo do e-mail ao enviar solicitações. A assinatura do Outlook será adicionada automaticamente.</p>
                <textarea class="form-control" id="fEmailCorpo" rows="8" style="font-size:13px;line-height:1.6">${escHtml(config.corpoEmail)}</textarea>
                <div class="form-actions" style="margin-top:12px">
                    <button class="btn btn-primary" onclick="salvarCorpoEmail()">Salvar Corpo do E-mail</button>
                </div>
            </div>
        </div>
    `;
}

function addCCEmail() {
    openModal('Adicionar E-mail CC', `
        <div class="form-group">
            <label>E-mail <span class="required">*</span></label>
            <input class="form-control" id="fCCEmail" type="email" placeholder="email@exemplo.com">
        </div>
        <div class="form-actions">
            <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="salvarCCEmail()">Adicionar</button>
        </div>
    `);
}

function salvarCCEmail(editIndex) {
    const email = $('#fCCEmail').value.trim();
    if (!email || !email.includes('@')) { toast('Informe um e-mail válido', 'error'); return; }
    const config = getEmailConfig();
    if (editIndex !== undefined && editIndex !== null) {
        config.ccEmails[editIndex] = email;
    } else {
        if (config.ccEmails.includes(email)) { toast('Este e-mail já está na lista', 'error'); return; }
        config.ccEmails.push(email);
    }
    saveEmailConfig(config);
    closeModal();
    toast(editIndex !== undefined ? 'E-mail atualizado!' : 'E-mail adicionado!');
    renderEmailConfig();
}

function editCCEmail(index) {
    const config = getEmailConfig();
    const email = config.ccEmails[index];
    openModal('Editar E-mail CC', `
        <div class="form-group">
            <label>E-mail <span class="required">*</span></label>
            <input class="form-control" id="fCCEmail" type="email" value="${escHtml(email)}">
        </div>
        <div class="form-actions">
            <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="salvarCCEmail(${index})">Salvar</button>
        </div>
    `);
}

function removeCCEmail(index) {
    const config = getEmailConfig();
    const email = config.ccEmails[index];
    confirmDelete(email, `doRemoveCCEmail(${index})`);
}

function doRemoveCCEmail(index) {
    const config = getEmailConfig();
    config.ccEmails.splice(index, 1);
    saveEmailConfig(config);
    toast('E-mail removido!');
    renderEmailConfig();
}

function salvarCorpoEmail() {
    const corpo = $('#fEmailCorpo').value;
    const config = getEmailConfig();
    config.corpoEmail = corpo;
    saveEmailConfig(config);
    toast('Corpo do e-mail salvo!');
}


// ========================================================================
// ENVIAR E-MAIL VIA OUTLOOK
// ========================================================================
function enviarEmailRC(rcId) {
    const rc = DB.get('rcs').find(r => r.id === rcId);
    if (!rc) return;
    const contratos = DB.get('contratos');
    const fornecedores = DB.get('fornecedores');
    const materiais = DB.get('materiais');
    const config = getEmailConfig();

    const contrato = contratos.find(c => c.id === rc.contratoId);
    const forn = contrato ? fornecedores.find(f => f.id === contrato.fornecedorId) : null;
    const mat = materiais.find(m => m.id === rc.materialId);
    const valorTotal = (rc.quantidade || 0) * (rc.valorUnitario || 0);

    const emailTo = forn ? (forn.email || '') : '';
    const matNome = mat ? mat.nome : 'Material';
    const subject = `Requisição de ${matNome} - ${rc.numero}`;
    const ccList = config.ccEmails.join(';');

    // Build email body with extrato info
    const un = mat ? mat.unidade : '';
    const extratoTexto = [
        `Nº RC: ${rc.numero}`,
        `Material: ${mat ? mat.nome : '—'} (SAP: ${mat ? mat.codigoSap : '—'})`,
        `Quantidade: ${rc.quantidade || 0} ${un}`,
        `Valor Unitário: ${fmt(rc.valorUnitario || 0)}`,
        `Valor Total: ${fmt(valorTotal)}`,
        `Local de Entrega: ${rc.localEntrega || '—'}`,
        `Data: ${fmtDate(rc.data)}`,
        `Previsão de Entrega: ${fmtDate(rc.dataPrevisao)}`,
        `Contrato: ${contrato ? contrato.numero : '—'}`,
        `Fornecedor: ${forn ? forn.nome : '—'}`
    ].join('\n');

    const body = config.corpoEmail + '\n\n--- EXTRATO DA SOLICITAÇÃO ---\n\n' + extratoTexto;

    // Build mailto URL
    let mailtoUrl = 'mailto:' + encodeURIComponent(emailTo);
    mailtoUrl += '?subject=' + encodeURIComponent(subject);
    if (ccList) mailtoUrl += '&cc=' + encodeURIComponent(ccList);
    mailtoUrl += '&body=' + encodeURIComponent(body);

    // Registrar no histórico de e-mails
    registrarEmailEnviado(rcId, emailTo, subject);

    window.open(mailtoUrl, '_self');
    toast('Abrindo Outlook para envio do e-mail...', 'info');
}

function promptEnviarEmail(rcId) {
    const rc = DB.get('rcs').find(r => r.id === rcId);
    if (!rc) return;
    const contratos = DB.get('contratos');
    const fornecedores = DB.get('fornecedores');
    const materiais = DB.get('materiais');

    const contrato = contratos.find(c => c.id === rc.contratoId);
    const forn = contrato ? fornecedores.find(f => f.id === contrato.fornecedorId) : null;
    const mat = materiais.find(m => m.id === rc.materialId);
    const config = getEmailConfig();

    openModal('Enviar E-mail da Solicitação', `
        <div style="margin-bottom:16px;padding:14px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">
            <div style="font-size:13px"><strong style="color:var(--neon)">${escHtml(rc.numero)}</strong> — ${mat ? escHtml(mat.nome) : '—'}</div>
        </div>
        <div style="display:grid;gap:10px;font-size:13px;margin-bottom:16px">
            <div><span style="color:var(--text-secondary)">Para:</span> <strong>${forn && forn.email ? escHtml(forn.email) : '<span style="color:var(--danger)">Fornecedor sem e-mail cadastrado</span>'}</strong></div>
            <div><span style="color:var(--text-secondary)">Assunto:</span> <strong>Requisição de ${mat ? escHtml(mat.nome) : '—'} - ${escHtml(rc.numero)}</strong></div>
            ${config.ccEmails.length > 0 ? `<div><span style="color:var(--text-secondary)">CC:</span> ${config.ccEmails.map(e => escHtml(e)).join(', ')}</div>` : '<div style="color:var(--text-muted)">Nenhum e-mail em cópia configurado. <a onclick="closeModal(); navigate(\'email\')" style="color:var(--neon);cursor:pointer">Configurar</a></div>'}
        </div>
        <div style="padding:10px 14px;background:var(--warning-dim);border:1px solid rgba(255,165,2,0.2);border-radius:var(--radius);font-size:12px;color:var(--warning);margin-bottom:16px">
            O e-mail será aberto no Outlook com a assinatura padrão. O extrato da RC será incluído no corpo do e-mail.
        </div>
        <div class="form-actions">
            <button class="btn btn-secondary" onclick="closeModal()">Não enviar</button>
            <button class="btn btn-primary" onclick="closeModal(); enviarEmailRC('${rcId}')">Enviar E-mail</button>
        </div>
    `);
}


// ========================================================================
// BACKUP — EXPORT / IMPORT
// ========================================================================
function exportBackup() {
    const keys = ['materiais', 'fornecedores', 'contratos', 'rcs', 'entregas', 'pendencias'];
    const backup = {};
    keys.forEach(key => {
        backup[key] = DB.get(key);
    });
    backup._meta = {
        app: 'SGCE',
        version: '2.0',
        exportDate: new Date().toISOString()
    };
    backup.settings = {
        theme: localStorage.getItem('gp_theme') || 'dark'
    };
    backup.emailConfig = getEmailConfig();
    backup.quickNotes = getQuickNotes();

    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const filename = `SGCE.${dd}.${mm}.${yyyy}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast(`Backup exportado: ${filename}`);
}

function importBackup(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const backup = JSON.parse(e.target.result);
            const keys = ['materiais', 'fornecedores', 'contratos', 'rcs', 'entregas', 'pendencias'];
            const validKeys = keys.filter(key => Array.isArray(backup[key]));

            if (validKeys.length === 0) {
                toast('Arquivo inválido: nenhum dado reconhecido', 'error');
                return;
            }

            openModal('Importar Backup', `
                <div style="margin-bottom:16px">
                    <p style="margin-bottom:12px;color:var(--text-secondary)">Arquivo: <strong style="color:var(--text)">${escHtml(file.name)}</strong></p>
                    ${backup._meta ? `<p style="font-size:12px;color:var(--text-muted);margin-bottom:12px">Exportado em: ${new Date(backup._meta.exportDate).toLocaleString('pt-BR')}</p>` : ''}
                    <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:12px;font-size:13px">
                        ${validKeys.map(key => `<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border)">
                            <span style="text-transform:capitalize">${key}</span>
                            <strong style="color:var(--neon)">${backup[key].length} registros</strong>
                        </div>`).join('')}
                    </div>
                    <div style="margin-top:14px;padding:10px;background:var(--warning-dim);border:1px solid rgba(255,165,2,0.2);border-radius:var(--radius);font-size:12px;color:var(--warning)">
                        ⚠️ Atenção: Esta ação substituirá todos os dados atuais pelos dados do backup.
                    </div>
                </div>
                <div class="form-actions">
                    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                    <button class="btn btn-primary" onclick="confirmImport()">Confirmar Importação</button>
                </div>
            `);

            // Store backup data temporarily
            window._pendingImport = backup;

        } catch (err) {
            toast('Erro ao ler o arquivo: formato inválido', 'error');
        }
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again
    event.target.value = '';
}

function confirmImport() {
    const backup = window._pendingImport;
    if (!backup) { toast('Nenhum backup pendente', 'error'); return; }

    const keys = ['materiais', 'fornecedores', 'contratos', 'rcs', 'entregas', 'pendencias'];
    keys.forEach(key => {
        if (Array.isArray(backup[key])) {
            DB.set(key, backup[key]);
        }
    });

    // Restore email config if present
    if (backup.emailConfig) {
        saveEmailConfig(backup.emailConfig);
    }

    // Restore quick notes if present
    if (backup.quickNotes !== undefined) {
        saveQuickNotes(backup.quickNotes);
    }

    // Restore theme setting if present
    if (backup.settings && backup.settings.theme) {
        localStorage.setItem('gp_theme', backup.settings.theme);
        if (backup.settings.theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        updateThemeIcon(backup.settings.theme);
    }

    delete window._pendingImport;
    closeModal();
    toast('Backup importado com sucesso!');
    renderCurrentTab();
}


// ========================================================================
// ORDENAÇÃO DE COLUNAS
// ========================================================================
let currentSortCol = -1;
let currentSortDir = 'asc';

function sortTableColumn(th, colIndex) {
    const table = th.closest('table');
    if (!table) return;
    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    if (currentSortCol === colIndex) {
        currentSortDir = currentSortDir === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortCol = colIndex;
        currentSortDir = 'asc';
    }

    // Update sort icons
    table.querySelectorAll('.sortable-th .sort-icon').forEach(icon => icon.textContent = '⇅');
    th.querySelector('.sort-icon').textContent = currentSortDir === 'asc' ? '↑' : '↓';

    const rows = Array.from(tbody.querySelectorAll('tr'));
    rows.sort((a, b) => {
        const cellA = a.children[colIndex];
        const cellB = b.children[colIndex];
        if (!cellA || !cellB) return 0;

        let valA = cellA.textContent.trim().toLowerCase();
        let valB = cellB.textContent.trim().toLowerCase();

        // Try parse as number
        const numA = parseFloat(valA.replace(/[^\d.,-]/g, '').replace(',', '.'));
        const numB = parseFloat(valB.replace(/[^\d.,-]/g, '').replace(',', '.'));
        if (!isNaN(numA) && !isNaN(numB)) {
            return currentSortDir === 'asc' ? numA - numB : numB - numA;
        }

        // Try parse as BR date (DD/MM/YYYY)
        const dateA = parseBRDate(valA);
        const dateB = parseBRDate(valB);
        if (dateA && dateB) {
            return currentSortDir === 'asc' ? dateA - dateB : dateB - dateA;
        }

        // String compare
        return currentSortDir === 'asc' ? valA.localeCompare(valB, 'pt-BR') : valB.localeCompare(valA, 'pt-BR');
    });

    rows.forEach(r => tbody.appendChild(r));
}

function parseBRDate(str) {
    const m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return null;
    return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]));
}


// ========================================================================
// NOTAS RÁPIDAS
// ========================================================================
function getQuickNotes() {
    return localStorage.getItem('gp_quicknotes') || '';
}

function saveQuickNotes(text) {
    localStorage.setItem('gp_quicknotes', text);
}


// ========================================================================
// VERIFICAR CONTRATO ESGOTADO
// ========================================================================
function checkContratoEsgotado(contratoId) {
    const contratos = DB.get('contratos');
    const contrato = contratos.find(c => c.id === contratoId);
    if (!contrato || contrato.status !== 'Ativo') return;

    const qtdTotal = contrato.quantidadeContratada || 0;
    if (qtdTotal <= 0) return;

    const allRcs = DB.get('rcs');
    const qtdUsada = allRcs.filter(r => r.contratoId === contratoId && r.status !== 'Cancelada').reduce((s, r) => s + (parseFloat(r.quantidade) || 0), 0);
    const pctUsed = (qtdUsada / qtdTotal) * 100;

    if (pctUsed >= 100) {
        const idx = contratos.findIndex(c => c.id === contratoId);
        if (idx >= 0) {
            contratos[idx].status = 'Esgotado';
            DB.set('contratos', contratos);
            toast(`Contrato ${contrato.numero} atingiu 100% — Status alterado para Esgotado!`, 'warning');
        }
    }
}


// ========================================================================
// HISTÓRICO DE E-MAILS ENVIADOS
// ========================================================================
function registrarEmailEnviado(rcId, destinatario, assunto) {
    const data = DB.get('rcs');
    const idx = data.findIndex(r => r.id === rcId);
    if (idx < 0) return;
    if (!data[idx].emailsEnviados) data[idx].emailsEnviados = [];
    data[idx].emailsEnviados.push({
        data: new Date().toISOString(),
        destinatario: destinatario,
        assunto: assunto
    });
    DB.set('rcs', data);
}

function viewEmailsEnviados(rcId) {
    const rc = DB.get('rcs').find(r => r.id === rcId);
    if (!rc) return;
    const emails = rc.emailsEnviados || [];

    const emailRows = emails.length > 0
        ? emails.map(em => `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
            <div>
                <div style="font-size:13px"><strong>Para:</strong> ${escHtml(em.destinatario)}</div>
                <div style="font-size:12px;color:var(--text-secondary)">${escHtml(em.assunto)}</div>
            </div>
            <span style="font-size:11px;color:var(--text-muted);white-space:nowrap">${new Date(em.data).toLocaleString('pt-BR')}</span>
        </div>`).join('')
        : '<p style="color:var(--text-muted);font-size:13px;text-align:center;padding:20px 0">Nenhum e-mail enviado para esta RC</p>';

    openModal('E-mails Enviados — ' + rc.numero, `
        <div style="margin-bottom:16px">${emailRows}</div>
        <div class="form-actions">
            <button class="btn btn-secondary" onclick="closeModal()">Fechar</button>
        </div>
    `);
}


// ========================================================================
// PROMPT DE BACKUP AO FECHAR
// ========================================================================
let backupPromptEnabled = true;

function setupBeforeUnload() {
    window.addEventListener('beforeunload', function(e) {
        if (!backupPromptEnabled) return;
        const hasData = ['materiais', 'fornecedores', 'contratos', 'rcs', 'entregas', 'pendencias'].some(key => DB.get(key).length > 0);
        if (hasData) {
            e.preventDefault();
            e.returnValue = 'Você tem dados não salvos. Deseja fazer backup antes de sair?';
            return e.returnValue;
        }
    });
}


// ========================================================================
// INIT
// ========================================================================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    renderCurrentTab();
    setupBeforeUnload();

    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
        const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT';
        const isSearchOpen = $('#searchOverlay').classList.contains('active');
        const isModalOpen = $('#modalOverlay').classList.contains('active');

        // Escape: close search or modal
        if (e.key === 'Escape') {
            if (isSearchOpen) { closeGlobalSearch(); return; }
            if (isModalOpen) { closeModal(); return; }
        }

        // Ctrl+K: Global search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            if (isSearchOpen) closeGlobalSearch();
            else openGlobalSearch();
            return;
        }

        // Ctrl+T: Toggle theme
        if ((e.ctrlKey || e.metaKey) && e.key === 't') {
            e.preventDefault();
            toggleTheme();
            return;
        }

        // Don't handle other shortcuts when typing in inputs or when modal/search is open
        if (isInput || isModalOpen || isSearchOpen) return;

        // Ctrl+N: New record
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            const newFns = {
                materiais: () => editMaterial(),
                fornecedores: () => editFornecedor(),
                contratos: () => editContrato(),
                rcs: () => editRC(),
                entregas: () => editEntrega(),
                pendencias: () => editPendencia()
            };
            if (newFns[currentTab]) newFns[currentTab]();
            return;
        }

        // Ctrl+P: Print/Report
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            if (currentTab === 'rcs') printRelatorioRCs();
            else if (currentTab === 'entregas') printProgramacao();
            else if (currentTab === 'pendencias') printRelatorioPendencias();
            return;
        }

        // ?: Show shortcuts help
        if (e.key === '?') {
            showShortcutsHelp();
            return;
        }

        // 1-7: Navigate tabs
        const tabMap = { '1': 'dashboard', '2': 'materiais', '3': 'fornecedores', '4': 'contratos', '5': 'rcs', '6': 'entregas', '7': 'pendencias', '8': 'email' };
        if (tabMap[e.key]) {
            navigate(tabMap[e.key]);
        }
    });
});
