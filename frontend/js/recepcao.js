let currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
    currentUser = getUser();
    // Proteção de rota (Admin ou Cerimonialista podem aceder)
    if (!currentUser) {
        window.location.href = '../index.html';
        return;
    }

    configurarNavbar('../index.html');
    
    if(currentUser.perfil === 'Admin') {
        document.getElementById('admin-actions').classList.remove('d-none');
    }

    buscarConvidados('');
});

async function buscarConvidados(termo) {
    try {
        const url = termo ? `${API_CONVIDADOS}/convidados?busca=${encodeURIComponent(termo)}` : `${API_CONVIDADOS}/convidados`;
        const response = await fetch(url);
        const convidados = await response.json();
        
        const tbody = document.getElementById('tabela-recepcao');
        tbody.innerHTML = '';

        if(convidados.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">Nenhum convidado encontrado.</td></tr>`;
            return;
        }
        
        convidados.forEach(c => {
            tbody.innerHTML += `
                <tr>
                    <td class="fw-bold">${c.nome} ${c.sobrenome}</td>
                    <td>${c.cpf || 'N/A'}</td>
                    <td><span class="badge bg-secondary fs-6">Mesa ${c.numero_mesa}</span></td>
                    <td class="text-center">
                        <button class="btn btn-success btn-sm" onclick="efetuarCheckin(${c.id_convidado}, this)">
                            <i class="bi bi-check2-circle"></i> Confirmar Entrada
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (error) { console.error("Erro na busca:", error); }
}

async function efetuarCheckin(id_convidado, btnElement) {
    if(!currentUser) return;

    btnElement.disabled = true;
    btnElement.innerHTML = "A processar...";

    try {
        const response = await fetch(`${API_CHECKINS}/checkin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_usuario: currentUser.id, id_convidado: id_convidado })
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
            btnElement.innerHTML = "Confirmar Entrada";
        }
    } catch (error) {
        alert("Erro de comunicação com o servidor.");
        btnElement.disabled = false;
        btnElement.innerHTML = "Confirmar Entrada";
    }
}
