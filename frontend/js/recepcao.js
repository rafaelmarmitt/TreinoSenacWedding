let currentUser = null;

// Inicialização da página
document.addEventListener("DOMContentLoaded", () => {
    if (!(currentUser = getUser())) return window.location.href = '../index.html';

    configurarNavbar('../index.html');

    const adminActions = document.getElementById('admin-actions');
    if (adminActions) adminActions.classList.toggle('d-none', currentUser.perfil !== 'Admin');

    buscarConvidados('');

    // Eventos do Modal de Cadastro
    document.getElementById('form-novo-convidado')?.addEventListener('submit', cadastrarConvidado);
    document.getElementById('modalNovoConvidado')?.addEventListener('hidden.bs.modal', () => {
        document.getElementById('form-novo-convidado').reset();
        document.getElementById('acompanhantes-container').innerHTML = '';
        document.getElementById('cadastro-msg').className = 'd-none';
    });
});

// Busca e listagem de convidados
async function buscarConvidados(termo) {
    try {
        const res = await fetch(`${API_CONVIDADOS}/convidados${termo ? `?busca=${encodeURIComponent(termo)}` : ''}`);
        const convidados = await res.json();
        const tbody = document.getElementById('tabela-recepcao');
        if (!tbody) return;

        if (!convidados.length) return tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">Nenhum convidado encontrado.</td></tr>`;

        tbody.innerHTML = convidados.map(c => {
            const num = c.acompanhantes?.length || 0;
            const entrou = c.ja_entrou === 1 || c.ja_entrou === true;

            return `
                <tr>
                    <td class="fw-bold">${c.nome} ${c.sobrenome}</td>
                    <td>${c.cpf || 'N/A'}</td>
                    <td><span class="badge bg-secondary fs-6">Mesa ${c.numero_mesa}</span></td>
                    <td class="text-center">
                        <span class="badge ${num > 0 ? 'bg-info text-dark' : 'bg-light text-secondary border'} fs-6" title="${num > 0 ? c.acompanhantes.map(a => `${a.nome} ${a.sobrenome}`).join(', ') : 'Nenhum acompanhante'}" style="cursor: help;">
                            <i class="bi bi-people-fill"></i> ${num}
                        </span>
                    </td>
                    <td class="text-center">
                        <button class="btn ${entrou ? 'btn-secondary' : 'btn-success'} btn-sm" onclick="efetuarCheckin(${c.id_convidado}, this)" ${entrou ? 'disabled' : ''}>
                            ${entrou ? 'Entrada Registrada' : '<i class="bi bi-check2-circle"></i> Confirmar Entrada'}
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error("Erro na busca:", error);
    }
}

// Processamento do Check-in
async function efetuarCheckin(id_convidado, btn) {
    if (!currentUser) return;
    const htmlOrig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = "Processando...";

    try {
        const res = await fetch(`${API_CHECKINS}/checkin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id_usuario: currentUser.id_usuario || currentUser.id, id_convidado }) });

        if (res.ok) return (btn.classList.replace('btn-success', 'btn-secondary'), btn.innerHTML = "Entrada Registrada");
        if (res.status === 409) return (btn.classList.replace('btn-success', 'btn-warning'), btn.innerHTML = "Já efetuou check-in");

        const result = await res.json();
        alert(result.erro || "Erro ao realizar check-in");
    } catch (error) {
        alert("Erro de comunicação com o servidor.");
    }

    btn.disabled = false;
    btn.innerHTML = htmlOrig;
}

// ==========================================
// FUNÇÕES DE CADASTRO (Reaproveitadas do Admin)
// ==========================================

// Adiciona campos dinâmicos de acompanhantes no modal
window.adicionarCampoAcompanhante = () => {
    document.getElementById('acompanhantes-container').insertAdjacentHTML('beforeend', `
        <div class="row mb-2 acompanhante-item align-items-center">
            <div class="col-md-5"><input type="text" class="form-control form-control-sm acomp-nome" placeholder="Nome" required></div>
            <div class="col-md-5"><input type="text" class="form-control form-control-sm acomp-sobrenome" placeholder="Apelido" required></div>
            <div class="col-md-2 text-end"><button type="button" class="btn btn-sm btn-outline-danger" onclick="this.closest('.acompanhante-item').remove()" title="Remover"><i class="bi bi-trash"></i></button></div>
        </div>
    `);
};

// Envia o formulário de novo convidado
async function cadastrarConvidado(e) {
    e.preventDefault();
    const msgDiv = document.getElementById('cadastro-msg');
    const showError = (msg) => (msgDiv.innerText = msg, msgDiv.className = 'text-danger text-center mt-2 d-block');
    msgDiv.className = 'd-none';

    const dados = {
        nome: document.getElementById('cad-nome').value,
        sobrenome: document.getElementById('cad-sobrenome').value,
        cpf: document.getElementById('cad-cpf').value,
        telefone: document.getElementById('cad-telefone').value,
        email: document.getElementById('cad-email').value,
        numero_mesa: document.getElementById('cad-mesa').value,
        acompanhantes: Array.from(document.querySelectorAll('.acompanhante-item')).map(el => ({
            nome: el.querySelector('.acomp-nome').value,
            sobrenome: el.querySelector('.acomp-sobrenome').value
        }))
    };

    try {
        const res = await fetch(`${API_CONVIDADOS}/convidados`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        if (!res.ok) return showError((await res.json()).erro || 'Erro ao criar convidado.');
        buscarConvidados(document.getElementById('busca-recepcao')?.value || '');
        bootstrap.Modal.getInstance(document.getElementById('modalNovoConvidado'))?.hide();
    } catch (error) { showError('Falha de comunicação com o servidor.'); }
}