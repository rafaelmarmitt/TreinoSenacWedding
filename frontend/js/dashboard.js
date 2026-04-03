let graficoInstance = null;
let convidadosCache = [];

document.addEventListener("DOMContentLoaded", () => {
    // Busca o usuário do sessionStorage (padronizado com o login)
    const userData = sessionStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : null;

    if (!user || user.perfil !== 'Admin') {
        window.location.href = '../index.html';
        return;
    }

    // Inicializa componentes da página
    if (typeof configurarNavbar === 'function') configurarNavbar('../index.html');

    carregarGraficoEstatisticas();
    carregarConvidadosAdmin();

    // Evento de submissão do formulário
    const formConvidado = document.getElementById('form-novo-convidado');
    if (formConvidado) {
        formConvidado.addEventListener('submit', cadastrarConvidado);
    }

    // Resetar o modal ao fechar
    const modalElement = document.getElementById('modalNovoConvidado');
    if (modalElement) {
        modalElement.addEventListener('hidden.bs.modal', function () {
            formConvidado.reset();
            document.getElementById('cad-id').value = '';
            document.getElementById('acompanhantes-container').innerHTML = '';
            document.getElementById('cadastro-msg').className = 'd-none';
            document.getElementById('modalNovoConvidadoLabel').innerText = "Cadastrar Novo Convidado";
            document.getElementById('btn-salvar-convidado').innerText = "Salvar Convidado";
        });
    }
});

/**
 * Carrega estatísticas para os KPIs e Gráfico
 */
async function carregarGraficoEstatisticas() {
    try {
        const responseStats = await fetch(`${API_CHECKINS}/estatisticas`);
        const stats = await responseStats.json();

        const responseConv = await fetch(`${API_CONVIDADOS}/convidados`);
        const convidados = await responseConv.json();

        const totalEsperado = convidados.length;
        const presentes = stats.presentes || 0;
        const ausentes = totalEsperado - presentes > 0 ? totalEsperado - presentes : 0;
        const taxa = totalEsperado > 0 ? Math.round((presentes / totalEsperado) * 100) : 0;

        document.getElementById('kpi-total').innerText = totalEsperado;
        document.getElementById('kpi-presentes').innerText = presentes;
        document.getElementById('kpi-ausentes').innerText = ausentes;
        document.getElementById('kpi-taxa').innerText = `${taxa}%`;

        const canvas = document.getElementById('graficoOcupacao');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (graficoInstance) graficoInstance.destroy();

        graficoInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Presentes', 'Ausentes'],
                datasets: [{
                    data: [presentes, ausentes],
                    backgroundColor: ['#198754', '#dc3545'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
    }
}

/**
 * Renderiza a tabela de convidados
 */
async function carregarConvidadosAdmin() {
    try {
        const response = await fetch(`${API_CONVIDADOS}/convidados`);
        if (!response.ok) throw new Error("Erro na rede");

        convidadosCache = await response.json();
        const tbody = document.getElementById('tabela-convidados-admin');
        if (!tbody) return;
        tbody.innerHTML = '';

        convidadosCache.forEach(c => {
            // MOSTRAR ACOMPANHANTES ABAIXO DO NOME (COMO NO VÍDEO)
            let textoAcompanhantes = '';
            if (c.acompanhantes && c.acompanhantes.length > 0) {
                const nomes = c.acompanhantes.map(a => `${a.nome} ${a.sobrenome}`).join(', ');
                textoAcompanhantes = `<br><small class="text-muted"><i class="bi bi-people-fill"></i> ${nomes}</small>`;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${c.nome} ${c.sobrenome}</strong>${textoAcompanhantes}</td>
                <td class="text-nowrap">${c.cpf || 'N/A'}</td>
                <td class="text-nowrap">${c.telefone || 'N/A'}</td>
                <td><span class="badge bg-secondary">Mesa ${c.numero_mesa}</span></td>
                <td class="text-center text-nowrap">
                    <button class="btn btn-sm btn-outline-primary me-1 btn-edit" title="Editar">
                        <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-delete" title="Excluir">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;

            // Atribuição manual de eventos para evitar problemas com JSON no HTML
            tr.querySelector('.btn-edit').onclick = () => abrirEdicao(c);
            tr.querySelector('.btn-delete').onclick = () => abrirExclusao(c.id_convidado, `${c.nome} ${c.sobrenome}`);

            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Erro ao carregar convidados:", error);
    }
}

/**
 * Adiciona campos dinâmicos de acompanhantes
 */
window.adicionarCampoAcompanhante = function (dados = null) {
    const container = document.getElementById('acompanhantes-container');
    const div = document.createElement('div');
    div.className = 'row mb-2 acompanhante-item align-items-center';
    div.innerHTML = `
        <div class="col-md-5">
            <input type="text" class="form-control form-control-sm acomp-nome" placeholder="Nome" required value="${dados ? dados.nome : ''}">
        </div>
        <div class="col-md-5">
            <input type="text" class="form-control form-control-sm acomp-sobrenome" placeholder="Apelido" required value="${dados ? dados.sobrenome : ''}">
        </div>
        <div class="col-md-2 text-end">
            <button type="button" class="btn btn-sm btn-outline-danger" onclick="this.parentElement.parentElement.remove()" title="Remover">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `;
    container.appendChild(div);
};

/**
 * Prepara o modal para edição de um convidado existente
 */
window.abrirEdicao = function (convidado) {
    document.getElementById('cad-id').value = convidado.id_convidado;
    document.getElementById('cad-nome').value = convidado.nome;
    document.getElementById('cad-sobrenome').value = convidado.sobrenome;
    document.getElementById('cad-cpf').value = convidado.cpf || '';
    document.getElementById('cad-telefone').value = convidado.telefone || '';
    document.getElementById('cad-email').value = convidado.email || '';
    document.getElementById('cad-mesa').value = convidado.numero_mesa;

    const container = document.getElementById('acompanhantes-container');
    container.innerHTML = '';
    if (convidado.acompanhantes && Array.isArray(convidado.acompanhantes)) {
        convidado.acompanhantes.forEach(a => adicionarCampoAcompanhante(a));
    }

    document.getElementById('modalNovoConvidadoLabel').innerText = "Editar Convidado";
    document.getElementById('btn-salvar-convidado').innerText = "Atualizar Convidado";

    const modal = new bootstrap.Modal(document.getElementById('modalNovoConvidado'));
    modal.show();
};

/**
 * Abre confirmação de exclusão
 */
window.abrirExclusao = function (id, nomeCompleto) {
    document.getElementById('id-excluir').value = id;
    document.getElementById('nome-excluir').innerText = nomeCompleto;
    const modal = new bootstrap.Modal(document.getElementById('modalExcluirConvidado'));
    modal.show();
};

/**
 * Executa a exclusão no servidor
 */
window.excluirConvidado = async function () {
    const id = document.getElementById('id-excluir').value;
    try {
        const response = await fetch(`${API_CONVIDADOS}/convidados/${id}`, { method: 'DELETE' });
        if (response.ok) {
            carregarConvidadosAdmin();
            carregarGraficoEstatisticas();
            const modalEl = document.getElementById('modalExcluirConvidado');
            const modalBus = bootstrap.Modal.getInstance(modalEl);
            if (modalBus) modalBus.hide();
        } else {
            alert("Erro ao excluir o convidado.");
        }
    } catch (error) {
        console.error("Erro ao excluir:", error);
    }
};

/**
 * Cadastro ou Edição (POST ou PUT)
 */
async function cadastrarConvidado(e) {
    e.preventDefault();
    const msgDiv = document.getElementById('cadastro-msg');
    msgDiv.className = 'd-none text-center mt-2';

    const idEdicao = document.getElementById('cad-id').value;
    const metodo = idEdicao ? 'PUT' : 'POST';
    const url = idEdicao ? `${API_CONVIDADOS}/convidados/${idEdicao}` : `${API_CONVIDADOS}/convidados`;

    const acompanhantes = Array.from(document.querySelectorAll('.acompanhante-item')).map(el => ({
        nome: el.querySelector('.acomp-nome').value,
        sobrenome: el.querySelector('.acomp-sobrenome').value
    }));

    const dados = {
        nome: document.getElementById('cad-nome').value,
        sobrenome: document.getElementById('cad-sobrenome').value,
        cpf: document.getElementById('cad-cpf').value,
        telefone: document.getElementById('cad-telefone').value,
        email: document.getElementById('cad-email').value,
        numero_mesa: document.getElementById('cad-mesa').value,
        acompanhantes: acompanhantes
    };

    try {
        const response = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (response.ok) {
            carregarConvidadosAdmin();
            carregarGraficoEstatisticas();
            const modalEl = document.getElementById('modalNovoConvidado');
            const modalBus = bootstrap.Modal.getInstance(modalEl);
            if (modalBus) modalBus.hide();
        } else {
            const result = await response.json();
            msgDiv.innerText = result.erro || 'Erro ao processar a requisição.';
            msgDiv.className = 'text-danger text-center mt-2 d-block';
        }
    } catch (error) {
        msgDiv.innerText = 'Falha de comunicação com o servidor.';
        msgDiv.className = 'text-danger text-center mt-2 d-block';
    }
}

/**
 * Filtro de busca na tabela
 */
const inputBusca = document.getElementById('busca-dashboard');
if (inputBusca) {
    inputBusca.addEventListener('input', function (e) {
        const termo = e.target.value.toLowerCase();
        document.querySelectorAll('#tabela-convidados-admin tr').forEach(linha => {
            linha.style.display = linha.innerText.toLowerCase().includes(termo) ? '' : 'none';
        });
    });
}

/**
 * GERAÇÃO DE PDF MELHORADA
 * Inclui: Status colorido, Acompanhantes e Resumo de Presença
 */
window.gerarPDF = function () {
    if (convidadosCache.length === 0) {
        alert("Sem dados para exportar.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Cálculos para o resumo
    const total = convidadosCache.length;
    const presentes = convidadosCache.filter(c => c.ja_entrou).length;
    const ausentes = total - presentes;
    const perc = total > 0 ? ((presentes / total) * 100).toFixed(1) : 0;

    // Título e Estilo Inicial
    doc.setFontSize(20);
    doc.setTextColor(214, 51, 132); // Cor Wedding Pass
    doc.text("Relatório de Convidados - Wedding Pass", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Data do Relatório: ${new Date().toLocaleString('pt-BR')}`, 14, 28);

    // Bloco de Resumo Executivo
    doc.setDrawColor(200);
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(14, 35, 182, 25, 3, 3, 'FD');

    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(`Total de Convidados: ${total}`, 20, 42);
    doc.text(`Compareceram: ${presentes}`, 20, 48);
    doc.text(`Ausentes: ${ausentes}`, 20, 54);

    doc.setFontSize(14);
    doc.setTextColor(25, 135, 84); // Verde
    doc.text(`${perc}% de Presença`, 140, 50);

    // Configuração da Tabela
    const tableColumn = ["Convidado (e Acompanhantes)", "Mesa", "Status"];
    const tableRows = convidadosCache.map(c => {
        // Formata nome + acompanhantes para a célula
        let nomeCelula = `${c.nome} ${c.sobrenome}`;
        if (c.acompanhantes && c.acompanhantes.length > 0) {
            const nomesAcomp = c.acompanhantes.map(a => `- ${a.nome} ${a.sobrenome}`).join('\n');
            nomeCelula += `\n${nomesAcomp}`;
        }

        return [
            nomeCelula,
            `Mesa ${c.numero_mesa}`,
            c.ja_entrou ? "PRESENTE" : "AUSENTE"
        ];
    });

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 65,
        theme: 'grid',
        headStyles: { fillColor: [214, 51, 132], halign: 'center' },
        columnStyles: {
            0: { cellWidth: 100 },
            1: { halign: 'center' },
            2: { halign: 'center', fontStyle: 'bold' }
        },
        // Lógica para colorir a célula de Status (Verde/Vermelho)
        didParseCell: function (data) {
            if (data.section === 'body' && data.column.index === 2) {
                if (data.cell.raw === "PRESENTE") {
                    data.cell.styles.textColor = [25, 135, 84];
                } else {
                    data.cell.styles.textColor = [220, 53, 69];
                }
            }
        },
        styles: { fontSize: 9, cellPadding: 3 }
    });

    // Rodapé
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount} - Wedding Pass Sistema de Gestão`, 14, doc.internal.pageSize.height - 10);
    }

    doc.save(`WeddingPass_Relatorio_Evento_${new Date().getTime()}.pdf`);
};