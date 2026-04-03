// Verificação de sessão ativa
document.addEventListener("DOMContentLoaded", () => {
    const user = getUser();
    if (user) window.location.href = user.perfil === 'Admin' ? 'admin/dashboard.html' : 'recepcao/checkin.html';
});

// Processamento do Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorDiv = document.getElementById('login-error');
    const showError = (msg) => (errorDiv.innerText = msg, errorDiv.classList.remove('d-none'));

    try {
        const res = await fetch(`${API_USUARIOS}/login`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                email: document.getElementById('email').value,
                senha: document.getElementById('senha').value
                })
            });
        const data = await res.json();

        if (!res.ok) return showError(data.erro || 'Erro ao efetuar login.');

        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.usuario));
        window.location.href = data.usuario.perfil === 'Admin' ? 'admin/dashboard.html' : 'recepcao/checkin.html';
    } catch (error) {
        showError('Falha na comunicação com o servidor (Porta 3001).');
    }
});