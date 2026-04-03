document.addEventListener("DOMContentLoaded", () => {
    // Redireciona se já estiver com sessão iniciada
    const user = getUser();
    if (user) {
        if (user.perfil === 'Admin') window.location.href = 'admin/dashboard.html';
        else window.location.href = 'recepcao/checkin.html';
    }
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const errorDiv = document.getElementById('login-error');

    try {
        const response = await fetch(`${API_USUARIOS}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        const data = await response.json();

        if (response.ok) {
            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('user', JSON.stringify(data.usuario));
            
            if (data.usuario.perfil === 'Admin') {
                window.location.href = 'admin/dashboard.html';
            } else {
                window.location.href = 'recepcao/checkin.html';
            }
        } else {
            errorDiv.innerText = data.erro || 'Erro ao efetuar login.';
            errorDiv.classList.remove('d-none');
        }
    } catch (error) {
        errorDiv.innerText = 'Falha na comunicação com o servidor (Porta 3001).';
        errorDiv.classList.remove('d-none');
    }
});