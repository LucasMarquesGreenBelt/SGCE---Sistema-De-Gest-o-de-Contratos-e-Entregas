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
        entregas: renderEntregas
    };
    const titles = {
        dashboard: 'Dashboard',
        materiais: 'Materiais',
        fornecedores: 'Fornecedores',
        contratos: 'Contratos',
        rcs: 'Requisições de Compra',
        entregas: 'Controle de Entregas'
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

function badge(text, color) {
    return `<span class="badge badge-${color}">${escHtml(text)}</span>`;
}

function contractStatusColor(s) {
    return { 'Ativo': 'green', 'Em Aprovação': 'blue', 'Inativo': 'gray', 'Vencido': 'red', 'Em Renovação': 'orange' }[s] || 'gray';
}

function rcStatusColor(s) {
    return { 'Pendente': 'orange', 'Aprovada': 'blue', 'Em Andamento': 'purple', 'Concluída': 'green', 'Cancelada': 'red' }[s] || 'gray';
}

function entregaStatusColor(s) {
    return { 'Pendente': 'orange', 'Recebida': 'green', 'Parcial': 'blue', 'Devolvida': 'red' }[s] || 'gray';
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
    return `<div class="table-container"><div class="table-responsive"><table class="table">
        <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
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

    const contratosAtivos = contratos.filter(c => c.status === 'Ativo').length;
    const rcsPendentes = rcs.filter(r => r.status === 'Pendente' || r.status === 'Aprovada').length;
    const entregasPendentes = entregas.filter(e => e.status === 'Pendente').length;
    const valorContratos = contratos.filter(c => c.status === 'Ativo').reduce((s, c) => s + (parseFloat(c.valor) || 0), 0);
    const pedidosSemRC = rcs.filter(r => r.semRC).length;

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
            <div class="stat-card">
                <div class="stat-icon green">💰</div>
                <div class="stat-info">
                    <span class="stat-value" style="font-size:20px">${fmt(valorContratos)}</span>
                    <span class="stat-label">Valor Contratos Ativos</span>
                </div>
            </div>
        </div>

        ${pedidosSemRC > 0 ? `<div style="margin-bottom:20px;padding:14px 20px;background:var(--warning-dim);border:1px solid rgba(255,165,2,0.25);border-radius:var(--radius-lg);display:flex;align-items:center;justify-content:space-between;gap:12px">
            <span style="font-size:13px;color:var(--warning)">⚠️ <strong>${pedidosSemRC}</strong> pedido${pedidosSemRC > 1 ? 's' : ''} pendente${pedidosSemRC > 1 ? 's' : ''} de regularização <span style="opacity:0.7">(sem RC)</span></span>
            <a onclick="navigate('rcs')" style="font-size:12px;color:var(--warning);white-space:nowrap;cursor:pointer">Ver pendências →</a>
        </div>` : ''}

        <div class="dashboard-card" style="margin-bottom:20px">
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

        <div class="dashboard-grid">
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

    const rows = data.map(m => `<tr data-search="${escHtml((m.codigoSap + ' ' + m.nome + ' ' + m.unidade).toLowerCase())}">
        <td><strong>${escHtml(m.codigoSap)}</strong></td>
        <td>${escHtml(m.nome)}</td>
        <td>${escHtml(m.unidade)}</td>
        <td>${escHtml(m.grupo || '—')}</td>
        <td>${escHtml(m.composicao || '—')}</td>
        <td class="col-actions">${actionBtns(`editMaterial('${m.id}')`, `deleteMaterial('${m.id}','${escHtml(m.nome)}')`)}</td>
    </tr>`);

    $('#content').innerHTML = `
        <div class="page-header">
            <h2>Materiais</h2>
            <div class="page-actions">
                ${searchHtml}
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

        return `<tr data-search="${escHtml((f.nome + ' ' + f.cnpj + ' ' + f.email + ' ' + f.responsavel).toLowerCase())}">
            <td><strong>${escHtml(f.nome)}</strong></td>
            <td>${escHtml(f.cnpj || '—')}</td>
            <td>${escHtml(f.telefone || '—')}</td>
            <td>${escHtml(f.email || '—')}</td>
            <td>${escHtml(f.responsavel || '—')}</td>
            <td><span style="font-size:12px;color:var(--text-secondary)">${escHtml(matDisplay)}</span></td>
            <td class="col-actions">${actionBtns(`editFornecedor('${f.id}')`, `deleteFornecedor('${f.id}','${escHtml(f.nome)}')`, `viewFornecedor('${f.id}')`)}</td>
        </tr>`;
    });

    $('#content').innerHTML = `
        <div class="page-header">
            <h2>Fornecedores</h2>
            <div class="page-actions">
                ${searchHtml}
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
            <div class="form-group full">
                <label>Contato Adicional</label>
                <input class="form-control" id="fFornContato" value="${escHtml(item.contato || '')}" placeholder="Informações adicionais de contato">
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
    const matNames = (f.materiaisIds || []).map(mid => {
        const m = materiais.find(x => x.id === mid);
        return m ? `${m.codigoSap} - ${m.nome}` : null;
    }).filter(Boolean);

    openModal('Detalhes do Fornecedor', `
        <div class="detail-section">
            <h4>Informações Gerais</h4>
            <div class="detail-grid">
                <div class="detail-item"><span class="label">Nome</span><span class="value">${escHtml(f.nome)}</span></div>
                <div class="detail-item"><span class="label">CNPJ</span><span class="value">${escHtml(f.cnpj || '—')}</span></div>
                <div class="detail-item"><span class="label">Telefone</span><span class="value">${escHtml(f.telefone || '—')}</span></div>
                <div class="detail-item"><span class="label">Email</span><span class="value">${escHtml(f.email || '—')}</span></div>
                <div class="detail-item"><span class="label">Responsável</span><span class="value">${escHtml(f.responsavel || '—')}</span></div>
                <div class="detail-item"><span class="label">Contato</span><span class="value">${escHtml(f.contato || '—')}</span></div>
                <div class="detail-item full"><span class="label">Endereço</span><span class="value">${escHtml(f.endereco || '—')}</span></div>
            </div>
        </div>
        <div class="detail-section">
            <h4>Materiais (${matNames.length})</h4>
            ${matNames.length > 0
                ? `<div class="tag-list">${matNames.map(n => `<span class="tag">${escHtml(n)}</span>`).join('')}</div>`
                : '<p style="color:var(--text-muted);font-size:13px">Nenhum material vinculado</p>'}
        </div>
        <div class="detail-section">
            <h4>Contratos (${contratos.length})</h4>
            ${contratos.length > 0
                ? `<div class="mini-list">${contratos.map(c => `<div class="mini-list-item"><span>${escHtml(c.numero)} — ${escHtml(c.descricao || '')}</span>${badge(c.status, contractStatusColor(c.status))}</div>`).join('')}</div>`
                : '<p style="color:var(--text-muted);font-size:13px">Nenhum contrato vinculado</p>'}
        </div>
        ${f.observacoes ? `<div class="detail-section"><h4>Observações</h4><p style="font-size:13px;color:var(--text-secondary)">${escHtml(f.observacoes)}</p></div>` : ''}
        <div class="form-actions">
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
        const qtdColor = pct > 30 ? 'green' : pct > 0 ? 'orange' : 'red';
        const unidade = mat ? mat.unidade : '';

        return `<tr data-search="${escHtml((c.numero + ' ' + c.descricao + ' ' + (forn ? forn.nome : '') + ' ' + (mat ? mat.nome : '')).toLowerCase())}">
            <td><strong>${escHtml(c.numero)}</strong></td>
            <td>${forn ? escHtml(forn.nome) : '<span style="color:var(--text-muted)">—</span>'}</td>
            <td>${mat ? escHtml(mat.nome) : '<span style="color:var(--text-muted)">—</span>'}</td>
            <td><span class="badge badge-${qtdColor}">${qtdDisp}/${qtdTotal} ${escHtml(unidade)}</span></td>
            <td>${fmt(c.precoUnitario || 0)}</td>
            <td>${fmt(c.valor)}</td>
            <td>${fmtDate(c.dataInicio)} — ${fmtDate(c.dataFim)}</td>
            <td>${badge(c.status, contractStatusColor(c.status))}</td>
            <td class="col-actions">${actionBtns(`editContrato('${c.id}')`, `deleteContrato('${c.id}','${escHtml(c.numero)}')`)}</td>
        </tr>`;
    });

    $('#content').innerHTML = `
        <div class="page-header">
            <h2>Contratos</h2>
            <div class="page-actions">
                ${searchHtml}
                <button class="btn btn-primary" onclick="editContrato()">+ Novo Contrato</button>
            </div>
        </div>
        ${renderTable(['Nº Contrato', 'Fornecedor', 'Material', 'Qtd Disp.', 'Preço Unit.', 'Valor Total', 'Vigência', 'Status', ''], rows, 'Nenhum contrato cadastrado')}
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
                <input class="form-control" id="fConInicio" type="date" value="${item.dataInicio || ''}">
            </div>
            <div class="form-group">
                <label>Data Fim</label>
                <input class="form-control" id="fConFim" type="date" value="${item.dataFim || ''}">
            </div>
            <div class="form-group">
                <label>Status</label>
                <select class="form-control" id="fConStatus">
                    ${['Ativo', 'Em Aprovação', 'Inativo', 'Vencido', 'Em Renovação'].map(s => `<option ${item.status === s ? 'selected' : ''}>${s}</option>`).join('')}
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
        dataInicio: $('#fConInicio').value,
        dataFim: $('#fConFim').value,
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


// ========================================================================
// REQUISIÇÕES DE COMPRA (RCs)
// ========================================================================
function renderRCs() {
    const data = DB.get('rcs');
    const contratos = DB.get('contratos');
    const fornecedores = DB.get('fornecedores');
    const materiais = DB.get('materiais');
    const searchHtml = `<div class="search-box">${searchIcon}<input class="search-input" placeholder="Buscar RC..." oninput="filterTable(this.value)"></div>`;

    const rows = data.map(rc => {
        const contrato = contratos.find(c => c.id === rc.contratoId);
        const forn = contrato ? fornecedores.find(f => f.id === contrato.fornecedorId) : null;
        const mat = materiais.find(m => m.id === rc.materialId);
        const semRcBadge = rc.semRC ? ' <span class="badge badge-orange" style="font-size:9px;padding:2px 6px">SEM RC</span>' : '';

        return `<tr data-search="${escHtml((rc.numero + ' ' + (contrato ? contrato.numero : '') + ' ' + (forn ? forn.nome : '') + ' ' + (mat ? mat.nome : '') + ' ' + (rc.localEntrega || '')).toLowerCase())}">
            <td><strong>${escHtml(rc.numero)}</strong>${semRcBadge}</td>
            <td>${contrato ? escHtml(contrato.numero) : '—'}</td>
            <td>${forn ? escHtml(forn.nome) : '—'}</td>
            <td>${mat ? escHtml(mat.nome) : '—'}</td>
            <td>${rc.quantidade || '—'} ${mat ? mat.unidade : ''}</td>
            <td>${fmt(rc.valorUnitario)}</td>
            <td>${escHtml(rc.localEntrega || '—')}</td>
            <td>${fmtDate(rc.data)}</td>
            <td>${badge(rc.status, rcStatusColor(rc.status))}</td>
            <td class="col-actions"><div class="actions">
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
                <button class="btn btn-primary" onclick="editRC()">+ Nova RC</button>
            </div>
        </div>
        ${renderTable(['Nº RC', 'Contrato', 'Fornecedor', 'Material', 'Qtd', 'Valor Unit.', 'Local Entrega', 'Data', 'Status', ''], rows, 'Nenhuma RC cadastrada')}
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
                <input class="form-control" id="fRcData" type="date" value="${item.data || ''}">
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

    // Show available quantity info
    if (infoEl && contrato.quantidadeContratada) {
        const qtdUsada = allRcs.filter(r => r.contratoId === contratoId && r.status !== 'Cancelada').reduce((s, r) => s + (parseFloat(r.quantidade) || 0), 0);
        const qtdDisp = (contrato.quantidadeContratada || 0) - qtdUsada;
        const mat = materiais.find(m => m.id === contrato.materialId);
        const un = mat ? mat.unidade : '';
        const color = qtdDisp > 0 ? 'var(--neon)' : 'var(--danger)';
        infoEl.innerHTML = `<div style="padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);font-size:12px;margin-top:4px">
            Contrato: <strong>${escHtml(contrato.numero)}</strong> ·
            Qtd Contratada: <strong>${contrato.quantidadeContratada} ${un}</strong> ·
            Preço Unit.: <strong>${fmt(contrato.precoUnitario || 0)}</strong> ·
            <span style="color:${color}">Disponível: <strong>${qtdDisp} ${un}</strong></span>
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
        data: $('#fRcData').value,
        status: $('#fRcStatus').value,
        observacoes: $('#fRcObs').value.trim(),
        dataCriacao: id ? undefined : new Date().toISOString().split('T')[0]
    };

    const data = DB.get('rcs');
    if (id) {
        const idx = data.findIndex(r => r.id === id);
        if (idx >= 0) {
            delete obj.dataCriacao;
            data[idx] = { ...data[idx], ...obj };
        }
    } else {
        obj.id = DB.id();
        data.push(obj);
    }
    DB.set('rcs', data);
    closeModal();
    toast(id ? 'RC atualizada!' : 'RC cadastrada!');
    renderRCs();
}

function deleteRC(id, nome) {
    confirmDelete(nome, `doDeleteRC('${id}')`);
}

function doDeleteRC(id) {
    DB.set('rcs', DB.get('rcs').filter(r => r.id !== id));
    toast('RC excluída!');
    renderRCs();
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
<style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Segoe UI',Arial,sans-serif; background:#fff; color:#1a1a1a; padding:0; font-size:13px; }
    .page { max-width:700px; margin:20px auto; padding:0; }
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
    @media print { body { padding:0; } .page { margin:0; max-width:100%; } }
</style>
</head>
<body>
<div class="page">
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
<script>window.onload=function(){window.print();}<\/script>
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

        return `<tr data-search="${escHtml((e.notaFiscal + ' ' + (rc ? rc.numero : '') + ' ' + (mat ? mat.nome : '') + ' ' + (forn ? forn.nome : '')).toLowerCase())}">
            <td>${rc ? `<strong>${escHtml(rc.numero)}</strong>` : '—'}</td>
            <td>${forn ? escHtml(forn.nome) : '—'}</td>
            <td>${mat ? escHtml(mat.nome) : '—'}</td>
            <td>${e.quantidade || '—'} ${mat ? mat.unidade : ''}</td>
            <td>${escHtml(e.notaFiscal || '—')}</td>
            <td>${fmtDate(e.data)}</td>
            <td>${badge(e.status, entregaStatusColor(e.status))}</td>
            <td class="col-actions">${actionBtns(`editEntrega('${e.id}')`, `deleteEntrega('${e.id}','NF ${escHtml(e.notaFiscal || e.id)}')`)}</td>
        </tr>`;
    });

    $('#content').innerHTML = `
        <div class="page-header">
            <h2>Controle de Entregas</h2>
            <div class="page-actions">
                ${searchHtml}
                <button class="btn btn-primary" onclick="editEntrega()">+ Nova Entrega</button>
            </div>
        </div>
        ${renderTable(['RC', 'Fornecedor', 'Material', 'Qtd Recebida', 'Nota Fiscal', 'Data', 'Status', ''], rows, 'Nenhuma entrega cadastrada')}
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
                <label>Data da Entrega <span class="required">*</span></label>
                <input class="form-control" id="fEntData" type="date" value="${item.data || ''}">
            </div>
            <div class="form-group">
                <label>Status</label>
                <select class="form-control" id="fEntStatus">
                    ${['Pendente', 'Recebida', 'Parcial', 'Devolvida'].map(s => `<option ${item.status === s ? 'selected' : ''}>${s}</option>`).join('')}
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
    const data = $('#fEntData').value;

    if (!rcId || !quantidade || !data) { toast('Preencha RC, quantidade e data', 'error'); return; }

    const obj = {
        rcId,
        quantidade,
        notaFiscal: $('#fEntNF').value.trim(),
        data,
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


// ========================================================================
// BACKUP — EXPORT / IMPORT
// ========================================================================
function exportBackup() {
    const keys = ['materiais', 'fornecedores', 'contratos', 'rcs', 'entregas'];
    const backup = {};
    keys.forEach(key => {
        backup[key] = DB.get(key);
    });
    backup._meta = {
        app: 'SGCE',
        version: '1.0',
        exportDate: new Date().toISOString()
    };

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
            const keys = ['materiais', 'fornecedores', 'contratos', 'rcs', 'entregas'];
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

    const keys = ['materiais', 'fornecedores', 'contratos', 'rcs', 'entregas'];
    keys.forEach(key => {
        if (Array.isArray(backup[key])) {
            DB.set(key, backup[key]);
        }
    });

    delete window._pendingImport;
    closeModal();
    toast('Backup importado com sucesso!');
    renderCurrentTab();
}


// ========================================================================
// INIT
// ========================================================================
document.addEventListener('DOMContentLoaded', () => {
    renderCurrentTab();

    // Keyboard shortcut: Escape closes modal
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeModal();
    });
});
