let graficoInstance = null, convidadosCache = [];

// Inicializa a página e valida acessos
document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    if (!user || user.perfil !== 'Admin') return window.location.href = '../index.html';

    if (typeof configurarNavbar === 'function') configurarNavbar('../index.html');
    carregarGraficoEstatisticas();
    carregarConvidadosAdmin();

    document.getElementById('form-novo-convidado')?.addEventListener('submit', cadastrarConvidado);

    document.getElementById('modalNovoConvidado')?.addEventListener('hidden.bs.modal', () => {
        document.getElementById('form-novo-convidado').reset();
        document.getElementById('cad-id').value = '';
        document.getElementById('acompanhantes-container').innerHTML = '';
        document.getElementById('cadastro-msg').className = 'd-none';
        document.getElementById('modalNovoConvidadoLabel').innerText = "Cadastrar Novo Convidado";
        document.getElementById('btn-salvar-convidado').innerText = "Salvar Convidado";
    });

    document.getElementById('busca-dashboard')?.addEventListener('input', e => {
        const t = e.target.value.toLowerCase();
        document.querySelectorAll('#tabela-convidados-admin tr').forEach(r => r.style.display = r.innerText.toLowerCase().includes(t) ? '' : 'none');
    });
});

// Carrega KPIs e o Gráfico de Rosca
async function carregarGraficoEstatisticas() {
    try {
        // CORREÇÃO: Calcula os presentes com base na lista real, ignorando check-ins "órfãos"
        const convidados = await fetch(`${API_CONVIDADOS}/convidados`).then(r => r.json());

        const t = convidados.length;
        const p = convidados.filter(c => c.ja_entrou === 1 || c.ja_entrou === true).length;
        const a = Math.max(t - p, 0);

        document.getElementById('kpi-total').innerText = t;
        document.getElementById('kpi-presentes').innerText = p;
        document.getElementById('kpi-ausentes').innerText = a;
        document.getElementById('kpi-taxa').innerText = `${t > 0 ? Math.round((p / t) * 100) : 0}%`;

        const ctx = document.getElementById('graficoOcupacao')?.getContext('2d');
        if (!ctx) return;
        if (graficoInstance) graficoInstance.destroy();

        graficoInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Presentes', 'Ausentes'],
                datasets: [{
                    data: [p, a],
                    backgroundColor: ['#198754', '#dc3545'], borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    } catch (error) { console.error("Erro nas estatísticas:", error); }
}

// Renderiza a tabela de convidados no painel Admin
async function carregarConvidadosAdmin() {
    try {
        convidadosCache = await fetch(`${API_CONVIDADOS}/convidados`).then(r => r.json());
        const tbody = document.getElementById('tabela-convidados-admin');
        if (!tbody) return;

        tbody.innerHTML = convidadosCache.map(c => `
            <tr>
                <td><strong>${c.nome} ${c.sobrenome}</strong>${c.acompanhantes?.length ? `<br><small class="text-muted"><i class="bi bi-people-fill"></i> ${c.acompanhantes.map(a => `${a.nome} ${a.sobrenome}`).join(', ')}</small>` : ''}</td>
                <td class="text-nowrap">${c.cpf || 'N/A'}</td>
                <td class="text-nowrap">${c.telefone || 'N/A'}</td>
                <td><span class="badge bg-secondary">Mesa ${c.numero_mesa}</span></td>
                <td class="text-center text-nowrap">
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="abrirEdicao(${c.id_convidado})" title="Editar"><i class="bi bi-pencil-square"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="abrirExclusao(${c.id_convidado}, '${c.nome} ${c.sobrenome}')" title="Excluir"><i class="bi bi-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (error) { console.error("Erro ao carregar convidados:", error); }
}

// Adiciona campos dinâmicos de acompanhantes
window.adicionarCampoAcompanhante = (dados = null) => {
    document.getElementById('acompanhantes-container').insertAdjacentHTML('beforeend', `
        <div class="row mb-2 acompanhante-item align-items-center">
            <div class="col-md-5"><input type="text" class="form-control form-control-sm acomp-nome" placeholder="Nome" required value="${dados?.nome || ''}"></div>
            <div class="col-md-5"><input type="text" class="form-control form-control-sm acomp-sobrenome" placeholder="Sobrenome" required value="${dados?.sobrenome || ''}"></div>
            <div class="col-md-2 text-end"><button type="button" class="btn btn-sm btn-outline-danger" onclick="this.closest('.acompanhante-item').remove()" title="Remover"><i class="bi bi-trash"></i></button></div>
        </div>
    `);
};

// Prepara o modal para edição
window.abrirEdicao = (id) => {
    const c = convidadosCache.find(x => x.id_convidado === id);
    if (!c) return;

    ['id', 'nome', 'sobrenome', 'cpf', 'telefone', 'email', 'mesa'].forEach(k => {
        const propDb = k === 'mesa' ? 'numero_mesa' : (k === 'id' ? 'id_convidado' : k);
        document.getElementById(`cad-${k}`).value = c[propDb] || '';
    });

    document.getElementById('acompanhantes-container').innerHTML = '';
    c.acompanhantes?.forEach(adicionarCampoAcompanhante);

    document.getElementById('modalNovoConvidadoLabel').innerText = "Editar Convidado";
    document.getElementById('btn-salvar-convidado').innerText = "Atualizar Convidado";
    new bootstrap.Modal(document.getElementById('modalNovoConvidado')).show();
};

// Abre confirmação de exclusão
window.abrirExclusao = (id, nomeCompleto) => {
    document.getElementById('id-excluir').value = id;
    document.getElementById('nome-excluir').innerText = nomeCompleto;
    new bootstrap.Modal(document.getElementById('modalExcluirConvidado')).show();
};

// Executa a exclusão no servidor
window.excluirConvidado = async () => {
    try {
        const res = await fetch(`${API_CONVIDADOS}/convidados/${document.getElementById('id-excluir').value}`, { method: 'DELETE' });
        if (!res.ok) return alert("Erro ao excluir o convidado.");
        carregarConvidadosAdmin(); carregarGraficoEstatisticas();
        bootstrap.Modal.getInstance(document.getElementById('modalExcluirConvidado'))?.hide();
    } catch (error) { console.error("Erro ao excluir:", error); }
};

// Cadastro ou Edição (POST ou PUT)
async function cadastrarConvidado(e) {
    e.preventDefault();
    const msgDiv = document.getElementById('cadastro-msg'), idEdicao = document.getElementById('cad-id').value;
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
        const res = await fetch(`${API_CONVIDADOS}/convidados${idEdicao ? `/${idEdicao}` : ''}`, {
            method: idEdicao ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        if (!res.ok) return showError((await res.json()).erro || 'Erro ao processar a requisição.');
        carregarConvidadosAdmin(); carregarGraficoEstatisticas();
        bootstrap.Modal.getInstance(document.getElementById('modalNovoConvidado'))?.hide();
    } catch (error) { showError('Falha de comunicação com o servidor.'); }
}

// Geração de PDF do relatório
window.gerarPDF = () => {
    if (!convidadosCache.length) return alert("Sem dados para exportar.");
    const doc = new window.jspdf.jsPDF(), t = convidadosCache.length, p = convidadosCache.filter(c => c.ja_entrou).length;

    doc.setFontSize(20).setTextColor(214, 51, 132).text("Relatório de Convidados - Wedding Pass", 14, 20);
    doc.setFontSize(10).setTextColor(100).text(`Data do Relatório: ${new Date().toLocaleString('pt-PT')}`, 14, 28);

    doc.setDrawColor(200).setFillColor(245, 245, 245).roundedRect(14, 35, 182, 25, 3, 3, 'FD');
    doc.setFontSize(11).setTextColor(0).text(`Total: ${t}`, 20, 42).text(`Compareceram: ${p}`, 20, 48).text(`Ausentes: ${t - p}`, 20, 54);
    doc.setFontSize(14).setTextColor(25, 135, 84).text(`${t > 0 ? ((p / t) * 100).toFixed(1) : 0}% de Presença`, 140, 50);

    doc.autoTable({
        head: [["Convidado (e Acompanhantes)", "Mesa", "Status"]],
        body: convidadosCache.map(c => [`${c.nome} ${c.sobrenome}${c.acompanhantes?.length ? '\n' + c.acompanhantes.map(a => `- ${a.nome} ${a.sobrenome}`).join('\n') : ''}`, `Mesa ${c.numero_mesa}`, c.ja_entrou ? "PRESENTE" : "AUSENTE"]),
        startY: 65, theme: 'grid', headStyles: {
            fillColor: [214, 51, 132],
            halign: 'center'
        },
        columnStyles: {
            0: { cellWidth: 100 },
            1: { halign: 'center' },
            2: {
                halign: 'center',
                fontStyle: 'bold'
            }
        },
        didParseCell: (d) => {
            if (d.section === 'body' && d.column.index === 2)
                d.cell.styles.textColor = d.cell.raw === "PRESENTE" ? [25, 135, 84] : [220, 53, 69];
        },
        styles: { fontSize: 9, cellPadding: 3 }
    });

    for (let i = 1, total = doc.internal.getNumberOfPages(); i <= total; i++) {
        doc.setPage(i).setFontSize(8).setTextColor(150).text(`Página ${i} de ${total} - Wedding Pass`, 14, doc.internal.pageSize.height - 10);
    }
    doc.save(`WeddingPass_Relatorio_${Date.now()}.pdf`);
};