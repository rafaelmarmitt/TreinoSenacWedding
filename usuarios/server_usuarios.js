require('dotenv').config();
const express = require('express'), 
cors = require('cors'), 
mysql = require('mysql2/promise'), 
bcrypt = require('bcrypt'), 
jwt = require('jsonwebtoken');

const app = express();

app.use(cors(), express.json());

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'db_usuarios'
};

// Função profissional de auto-seeding
async function inicializarBancoDeDados() {
    try {
        const conn = await mysql.createConnection(dbConfig);
        const [[{ total }]] = await conn.execute('SELECT COUNT(*) as total FROM usuarios');

        if (total === 0) {
            console.log('[Auto-Seed] Tabela vazia detectada. A criar utilizadores padrão...');
            const hash = await bcrypt.hash('123456', 10);
            await conn.execute('INSERT INTO usuarios (nome, cpf, email, senha, perfil) VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)', ['Administrador Geral', '111.111.111-11', 'admin@weddingpass.com', hash, 'Admin', 'Maria Cerimonialista', '222.222.222-22', 'maria@weddingpass.com', hash, 'Cerimonialista']);
            console.log('[Auto-Seed] Utilizadores criados com sucesso! (Senha: 123456)');
        }
        await conn.end();
    } catch (error) {
        console.error('[Auto-Seed] Erro ao verificar banco de dados:', error.message);
    }
}

// Endpoint de Login
app.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ erro: 'Email e senha são obrigatórios.' });

    try {
        const conn = await mysql.createConnection(dbConfig);
        const [[usuario]] = await conn.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
        await conn.end();

        if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) return res.status(401).json({ erro: 'Credenciais inválidas.' });

        const token = jwt.sign({
            id_usuario: usuario.id_usuario,
            perfil: usuario.perfil,
            nome: usuario.nome
        },
            process.env.JWT_SECRET || 'senhaSecreta',
            { expiresIn: '8h' });
        return res.json({
            mensagem: 'Login efetuado com sucesso!',
            token, usuario: { 
                id: usuario.id_usuario, 
                nome: usuario.nome, 
                perfil: usuario.perfil }
        });
    } catch (error) {
        console.error('Erro no login:', error);
        return res.status(500).json({ erro: 'Erro interno no servidor.' });
    }
});

inicializarBancoDeDados().then(() => 
    app.listen(process.env.PORT || 3001, () =>
    console.log(`[Usuários] Servidor a correr na porta ${process.env.PORT || 3001}`)
));