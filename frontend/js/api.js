// Configurações das Portas dos Microsserviços
const API_USUARIOS = 'http://localhost:3001';
const API_CONVIDADOS = 'http://localhost:3002';
const API_CHECKINS = 'http://localhost:3003';

// Função utilitária para obter o utilizador atual
function getUser() {
    const userData = sessionStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
}

// Função de Logout (com caminho relativo dependendo de onde é chamada)
function logout(redirectPath = '../index.html') {
    sessionStorage.clear();
    window.location.href = redirectPath;
}

// Função para exibir os dados do utilizador na navbar
function configurarNavbar(redirectLogout) {
    const user = getUser();
    if(user) {
        document.getElementById('user-info').innerText = `Olá, ${user.nome} (${user.perfil})`;
        document.getElementById('btn-logout').onclick = () => logout(redirectLogout);
    }
}