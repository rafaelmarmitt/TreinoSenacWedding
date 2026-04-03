let graficoInstance = null;
let convidadosCache = [];

document.addEventListener("DOMContentLoaded", () => {
    const user = getUser();
    if (!user || user.perfil !== 'Admin') {
        window.location.href = '../index.html';
        return;
    }

    configurarNavbar('../index.html');
    carregarGraficoEstatisticas();
    carregarConvidadosAdmin();

    // Evento de submissão do formulário de novo convidado
    document.getElementById('form-novo-convidado').addEventListener('submit', cadastrarConvidado);
});

async function carregarGraficoEstatisticas() {
    try {
        const response = await fetch(`${API_CHECKINS}/estatisticas`);
        const stats = await response.json();

        const ctx = document.getElementById('graficoOcupacao').getContext('2d');
        if (graficoInstance) graficoInstance.destroy();

        graficoInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Presentes', 'Ausentes'],
                datasets: [{
                    data: [stats.presentes, stats.ausentes],
                    backgroundColor: ['#198754', '#dc3545'],
                    borderWidth: 0
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
        });
    } catch (error) { console.error("Erro ao carregar gráfico:", error); }
}

async function carregarConvidadosAdmin() {
    try {
        const response = await fetch(`${API_CONVIDADOS}/convidados`);
        convidadosCache = await response.json();

        const tbody = document.getElementById('tabela-convidados-admin');
        tbody.innerHTML = '';

        convidadosCache.forEach(c => {
            tbody.innerHTML += `
                <tr>
                    <td>${c.nome} ${c.sobrenome}</td>
                    <td>${c.cpf || 'N/A'}</td>
                    <td>${c.telefone || 'N/A'}</td>
                    <td><span class="badge bg-secondary">Mesa ${c.numero_mesa}</span></td>
                </tr>
            `;
        });
    } catch (error) { console.error("Erro ao carregar convidados:", error); }
}

// Nova função para enviar os dados para o microsserviço de convidados
async function cadastrarConvidado(e) {
    e.preventDefault(); // Impede o recarregamento da página

    const msgDiv = document.getElementById('cadastro-msg');
    msgDiv.className = 'd-none text-center mt-2';

    // Recolhe os dados do formulário
    const novoConvidado = {
        nome: document.getElementById('cad-nome').value,
        sobrenome: document.getElementById('cad-sobrenome').value,
        cpf: document.getElementById('cad-cpf').value,
        telefone: document.getElementById('cad-telefone').value,
        email: document.getElementById('cad-email').value,
        numero_mesa: document.getElementById('cad-mesa').value
    };

    try {
        const response = await fetch(`${API_CONVIDADOS}/convidados`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novoConvidado)
        });

        const result = await response.json();

        if (response.ok) {
            // Sucesso! Atualiza a tabela com o novo convidado
            carregarConvidadosAdmin();

            // Limpa o formulário
            document.getElementById('form-novo-convidado').reset();

            // Fecha o Modal do Bootstrap
            const modalElement = document.getElementById('modalNovoConvidado');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            modalInstance.hide();

            // Pequeno feedback opcional
            alert("Convidado cadastrado com sucesso!");
        } else {
            msgDiv.innerText = result.erro || 'Erro ao cadastrar convidado. Verifique os dados (ex: CPF duplicado).';
            msgDiv.className = 'text-danger text-center mt-2';
        }
    } catch (error) {
        msgDiv.innerText = 'Falha de comunicação com o servidor (Porta 3002).';
        msgDiv.className = 'text-danger text-center mt-2';
    }
}

function gerarPDF() {
    if (convidadosCache.length === 0) { alert("Sem dados para exportar."); return; }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Relatório de Convidados - Wedding Pass", 14, 22);
    doc.setFontSize(11);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-PT')}`, 14, 30);

    const tableColumn = ["Nome Completo", "CPF", "Telefone", "Mesa"];
    const tableRows = convidadosCache.map(c => [`${c.nome} ${c.sobrenome}`, c.cpf || "N/A", c.telefone || "N/A", c.numero_mesa.toString()]);

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        theme: 'striped',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [214, 51, 132] }
    });

    doc.save("Lista_Convidados_WeddingPass.pdf");
}
