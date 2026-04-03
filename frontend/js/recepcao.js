let currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
    currentUser = getUser();
    if (!currentUser) {
        window.location.href = '../index.html';
        return;
    }

    configurarNavbar('../index.html');

    if (currentUser.perfil === 'Admin') {
        const adminActions = document.getElementById('admin-actions');
        if (adminActions) adminActions.classList.remove('d-none');
    }

    buscarConvidados('');
});

async function buscarConvidados(termo) {
    try {
        const url = termo ? `${API_CONVIDADOS}/convidados?busca=${encodeURIComponent(termo)}` : `${API_CONVIDADOS}/convidados`;
        const response = await fetch(url);
        const convidados = await response.json();

        const tbody = document.getElementById('tabela-recepcao');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (convidados.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Nenhum convidado encontrado.</td></tr>`;
            return;
        }

        convidados.forEach(c => {
            const numAcompanhantes = Array.isArray(c.acompanhantes) ? c.acompanhantes.length : 0;

            // Estilo do badge baseado em ter ou não acompanhantes
            const badgeClass = numAcompanhantes > 0 ? 'bg-info text-dark' : 'bg-light text-secondary border';

            // Texto para o Tooltip (ao passar o mouse)
            const nomesTooltip = numAcompanhantes > 0
                ? c.acompanhantes.map(a => `${a.nome} ${a.sobrenome}`).join(', ')
                : 'Nenhum acompanhante';

            const jaEntrou = c.ja_entrou === 1;
            const btnClass = jaEntrou ? 'btn-secondary' : 'btn-success';
            const btnText = jaEntrou ? 'Entrada Registada' : '<i class="bi bi-check2-circle"></i> Confirmar Entrada';
            const btnDisabled = jaEntrou ? 'disabled' : '';

            tbody.innerHTML += `
                <tr>
                    <td class="fw-bold">${c.nome} ${c.sobrenome}</td>
                    <td>${c.cpf || 'N/A'}</td>
                    <td><span class="badge bg-secondary fs-6">Mesa ${c.numero_mesa}</span></td>
                    <td class="text-center">
                        <span class="badge ${badgeClass} fs-6" title="${nomesTooltip}" style="cursor: help; padding: 8px 12px;">
                            <i class="bi bi-people-fill"></i> ${numAcompanhantes}
                        </span>
                    </td>
                    <td class="text-center">
                        <button class="btn ${btnClass} btn-sm" onclick="efetuarCheckin(${c.id_convidado}, this)" ${btnDisabled}>
                            ${btnText}
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Erro na busca:", error);
    }
}

async function efetuarCheckin(id_convidado, btnElement) {
    if (!currentUser) return;

    btnElement.disabled = true;
    const originalContent = btnElement.innerHTML;
    btnElement.innerHTML = "A processar...";

    try {
        const response = await fetch(`${API_CHECKINS}/checkin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_usuario: currentUser.id_usuario || currentUser.id, id_convidado: id_convidado })
        });

        const result = await response.json();

        if (response.ok) {
            btnElement.classList.replace('btn-success', 'btn-secondary');
            btnElement.innerHTML = "Entrada Registada";
        } else if (response.status === 409) {
            btnElement.classList.replace('btn-success', 'btn-warning');
            btnElement.innerHTML = "Já efetuou check-in";
        } else {
            alert(result.erro || "Erro ao realizar check-in");
            btnElement.disabled = false;
            btnElement.innerHTML = originalContent;
        }
    } catch (error) {
        alert("Erro de comunicação com o servidor.");
        btnElement.disabled = false;
        btnElement.innerHTML = originalContent;
    }
}