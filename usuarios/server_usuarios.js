require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

app.use(cors());
app.use(express.json());

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'db_usuarios'
};

// ==========================================
// FUNÇÃO PROFISSIONAL DE AUTO-SEEDING
// Garante que os utilizadores existem e o hash é 100% válido
// ==========================================
async function inicializarBancoDeDados() {
<<<<<<< HEAD
    try {
        const connection = await mysql.createConnection(dbConfig);

        // Verifica se já existem utilizadores na tabela
        const [rows] = await connection.execute('SELECT COUNT(*) as total FROM usuarios');

        if (rows[0].total === 0) {
            console.log('[Auto-Seed] Tabela vazia detetada. A criar utilizadores padrão...');

            // O próprio Node.js gera o hash perfeito para esta máquina
            const hashPadrao = await bcrypt.hash('123456', 10);

            const query = `
                INSERT INTO usuarios (nome, cpf, email, senha, perfil) VALUES
                ('Administrador Geral', '111.111.111-11', 'admin@weddingpass.com', ?, 'Admin'),
                ('Maria Cerimonialista', '222.222.222-22', 'maria@weddingpass.com', ?, 'Cerimonialista')
            `;

            await connection.execute(query, [hashPadrao, hashPadrao]);
            console.log('[Auto-Seed] Utilizadores criados com sucesso! (Senha: 123456)');
        }

        await connection.end();
    } catch (error) {
        console.error('[Auto-Seed] Erro ao verificar banco de dados:', error.message);
    }
}

// Endpoint de Login
app.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ erro: 'Email e senha são obrigatórios.' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
        await connection.end();

        if (rows.length === 0) {
            return res.status(401).json({ erro: 'Credenciais inválidas.' });
        }

        const usuario = rows[0];

        // Verifica o hash da senha
        const senhaValida = await bcrypt.compare(senha, usuario.senha);

        if (!senhaValida) {
            return res.status(401).json({ erro: 'Credenciais inválidas.' });
        }

        // Gera o Token JWT
        const token = jwt.sign(
            { id_usuario: usuario.id_usuario, perfil: usuario.perfil, nome: usuario.nome },
            process.env.JWT_SECRET || 'Chav3S3cr3t4W3dd1ngP4ss2026!',
            { expiresIn: '8h' }
        );

        res.json({
            mensagem: 'Login efetuado com sucesso!',
            token,
            usuario: {
                id: usuario.id_usuario,
                nome: usuario.nome,
                perfil: usuario.perfil
            }
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ erro: 'Erro interno no servidor.' });
    }
});


// Inicia o servidor apenas APÓS verificar a base de dados
const PORT = process.env.PORT || 3001;

<<<<<<< HEAD
// Obter todos os convidados e os seus respetivos acompanhantes
app.get('/convidados', async (req, res) => {
    const { busca } = req.query;
=======
>>>>>>> parent of 8eb613d (commit das atualizações de QOL do sistema, ainda precisa ajustar a parte de edição e exclusão do sistema)
    try {
        const connection = await mysql.createConnection(dbConfig);

        // Verifica se já existem utilizadores na tabela
        const [rows] = await connection.execute('SELECT COUNT(*) as total FROM usuarios');

        if (rows[0].total === 0) {
            console.log('[Auto-Seed] Tabela vazia detetada. A criar utilizadores padrão...');

            // O próprio Node.js gera o hash perfeito para esta máquina
            const hashPadrao = await bcrypt.hash('123456', 10);

            const query = `
                INSERT INTO usuarios (nome, cpf, email, senha, perfil) VALUES
                ('Administrador Geral', '111.111.111-11', 'admin@weddingpass.com', ?, 'Admin'),
                ('Maria Cerimonialista', '222.222.222-22', 'maria@weddingpass.com', ?, 'Cerimonialista')
            `;

            await connection.execute(query, [hashPadrao, hashPadrao]);
            console.log('[Auto-Seed] Utilizadores criados com sucesso! (Senha: 123456)');
        }

        await connection.end();
    } catch (error) {
        console.error('[Auto-Seed] Erro ao verificar banco de dados:', error.message);
    }
}

// Endpoint de Login
app.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ erro: 'Email e senha são obrigatórios.' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
        await connection.end();

        if (rows.length === 0) {
            return res.status(401).json({ erro: 'Credenciais inválidas.' });
        }

        const usuario = rows[0];

        // Verifica o hash da senha
        const senhaValida = await bcrypt.compare(senha, usuario.senha);

        if (!senhaValida) {
            return res.status(401).json({ erro: 'Credenciais inválidas.' });
        }

        // Gera o Token JWT
        const token = jwt.sign(
            { id_usuario: usuario.id_usuario, perfil: usuario.perfil, nome: usuario.nome },
            process.env.JWT_SECRET || 'Chav3S3cr3t4W3dd1ngP4ss2026!',
            { expiresIn: '8h' }
        );

        res.json({
            mensagem: 'Login efetuado com sucesso!',
            token,
            usuario: {
                id: usuario.id_usuario,
                nome: usuario.nome,
                perfil: usuario.perfil
            }
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ erro: 'Erro interno no servidor.' });
    }
});


// Inicia o servidor apenas APÓS verificar a base de dados
const PORT = process.env.PORT || 3001;

<<<<<<< HEAD
/// ... (mantenha os requires e configurações do dbConfig iniciais)

// EDITAR CONVIDADO E SEUS ACOMPANHANTES (PUT)
app.put('/convidados/:id', async (req, res) => {
    const { nome, sobrenome, cpf, telefone, email, numero_mesa, acompanhantes } = req.body;
    const idConvidado = req.params.id;
    let connection;

    try {
        connection = await mysql.createConnection(dbConfig);
        await connection.beginTransaction();

        // 1. Atualiza dados do convidado principal
        await connection.execute(
            'UPDATE convidados SET nome=?, sobrenome=?, cpf=?, telefone=?, email=?, numero_mesa=? WHERE id_convidado=?',
            [nome, sobrenome, cpf || null, telefone || null, email || null, numero_mesa, idConvidado]
        );

        // 2. Sincroniza acompanhantes: a forma mais simples e segura é remover os antigos e inserir os novos
        await connection.execute('DELETE FROM acompanhantes WHERE fk_convidado = ?', [idConvidado]);

        if (acompanhantes && acompanhantes.length > 0) {
            for (let acomp of acompanhantes) {
                await connection.execute(
                    'INSERT INTO acompanhantes (nome, sobrenome, fk_convidado) VALUES (?, ?, ?)',
                    [acomp.nome, acomp.sobrenome, idConvidado]
                );
            }
        }

        await connection.commit();
        res.json({ mensagem: 'Convidado e acompanhantes atualizados com sucesso!' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Erro ao editar:', error);
        res.status(500).json({ erro: 'Erro ao editar convidado.', detalhe: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`[Convidados] Servidor a correr na porta ${PORT}`);
=======
=======
>>>>>>> parent of 8eb613d (commit das atualizações de QOL do sistema, ainda precisa ajustar a parte de edição e exclusão do sistema)
inicializarBancoDeDados().then(() => {
    app.listen(PORT, () => {
        console.log(`[Usuários] Servidor a correr na porta ${PORT}`);
    });
<<<<<<< HEAD
>>>>>>> parent of 8eb613d (commit das atualizações de QOL do sistema, ainda precisa ajustar a parte de edição e exclusão do sistema)
=======
>>>>>>> parent of 8eb613d (commit das atualizações de QOL do sistema, ainda precisa ajustar a parte de edição e exclusão do sistema)
});