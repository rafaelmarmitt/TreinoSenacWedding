require('dotenv').config();
const express = require('express'), cors = require('cors'), mysql = require('mysql2/promise');
const app = express();

app.use(cors(), express.json());

const dbConfig = { 
    host: process.env.DB_HOST || 'localhost', 
    user: process.env.DB_USER || 'root', 
    password: process.env.DB_PASS || '', 
    database: process.env.DB_NAME || 'db_convidados' };

// Obter todos os convidados e os seus respetivos acompanhantes
app.get('/convidados', async (req, res) => {
    try {
        const conn = await mysql.createConnection(dbConfig);
        const termo = req.query.busca ? `%${req.query.busca}%` : null;

        const query = termo
            ? 'SELECT c.*, EXISTS(SELECT 1 FROM db_checkins.checkins ch WHERE ch.id_convidado = c.id_convidado) AS ja_entrou FROM convidados c WHERE c.nome LIKE ? OR c.sobrenome LIKE ? OR c.cpf LIKE ? ORDER BY c.nome ASC'
            : 'SELECT c.*, EXISTS(SELECT 1 FROM db_checkins.checkins ch WHERE ch.id_convidado = c.id_convidado) AS ja_entrou FROM convidados c ORDER BY c.nome ASC';

        const [convidados] = await conn.execute(query, termo ? [termo, termo, termo] : []);
        const convidadosCompletos = [];

        for (let c of convidados) {
            const [acompanhantes] = await conn.execute('SELECT nome, sobrenome FROM acompanhantes WHERE fk_convidado = ?', [c.id_convidado]);
            convidadosCompletos.push({ ...c, acompanhantes });
        }

        await conn.end();
        return res.json(convidadosCompletos);
    } catch (error) {
        console.error('Erro ao listar convidados:', error);
        return res.status(500).json({ erro: 'Erro ao obter dados.' });
    }
});

// Registar novo convidado e seus acompanhantes
app.post('/convidados', async (req, res) => {
    const { nome, sobrenome, cpf, telefone, email, numero_mesa, acompanhantes } = req.body;
    let conn;
    try {
        conn = await mysql.createConnection(dbConfig);
        await conn.beginTransaction();
        const [{ insertId }] = await conn.execute('INSERT INTO convidados (nome, sobrenome, cpf, telefone, email, numero_mesa) VALUES (?, ?, ?, ?, ?, ?)', [nome, sobrenome, cpf || null, telefone || null, email || null, numero_mesa]);

        if (acompanhantes?.length) for (let a of acompanhantes) await conn.execute('INSERT INTO acompanhantes (nome, sobrenome, fk_convidado) VALUES (?, ?, ?)', [a.nome, a.sobrenome, insertId]);

        await conn.commit();
        return res.status(201).json({ mensagem: 'Convidado registado!', id: insertId });
    } catch (error) {
        if (conn) await conn.rollback();
        return res.status(500).json({ erro: 'Erro ao registar convidado.' });
    } finally {
        if (conn) await conn.end();
    }
});

// Rota de Edição
app.put('/convidados/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, sobrenome, cpf, telefone, email, numero_mesa, acompanhantes } = req.body;
    let conn;
    try {
        conn = await mysql.createConnection(dbConfig);
        await conn.beginTransaction();

        await conn.execute('UPDATE convidados SET nome=?, sobrenome=?, cpf=?, telefone=?, email=?, numero_mesa=? WHERE id_convidado=?', [nome, sobrenome, cpf || null, telefone || null, email || null, numero_mesa, id]);
        await conn.execute('DELETE FROM acompanhantes WHERE fk_convidado = ?', [id]);

        if (acompanhantes?.length) for (let a of acompanhantes) await conn.execute('INSERT INTO acompanhantes (nome, sobrenome, fk_convidado) VALUES (?, ?, ?)', [a.nome, a.sobrenome, id]);

        await conn.commit();
        return res.json({ mensagem: 'Convidado atualizado com sucesso!' });
    } catch (error) {
        if (conn) await conn.rollback();
        console.error('Erro ao editar:', error);
        return res.status(500).json({ erro: 'Erro ao atualizar convidado.' });
    } finally {
        if (conn) await conn.end();
    }
});

// Rota de Exclusão
app.delete('/convidados/:id', async (req, res) => {
    const { id } = req.params;
    let conn;
    try {
        conn = await mysql.createConnection(dbConfig);
        await conn.beginTransaction();

        await conn.execute('DELETE FROM acompanhantes WHERE fk_convidado = ?', [id]);
        await conn.execute('DELETE FROM convidados WHERE id_convidado = ?', [id]);

        await conn.commit();
        return res.json({ mensagem: 'Convidado removido com sucesso!' });
    } catch (error) {
        if (conn) await conn.rollback();
        console.error('Erro ao excluir:', error);
        return res.status(500).json({ erro: 'Erro ao excluir convidado.' });
    } finally {
        if (conn) await conn.end();
    }
});

app.listen(process.env.PORT || 3002, () => console.log(`[Convidados] Servidor a correr na porta ${process.env.PORT || 3002}`));