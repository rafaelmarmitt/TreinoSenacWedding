require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();

app.use(cors());
app.use(express.json());

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'db_convidados'
};

// Obter todos os convidados e os seus respetivos acompanhantes
app.get('/convidados', async (req, res) => {
    const { busca } = req.query;
    try {
        const connection = await mysql.createConnection(dbConfig);

        let query = `
            SELECT c.*, EXISTS(SELECT 1 FROM db_checkins.checkins ch WHERE ch.id_convidado = c.id_convidado) AS ja_entrou
            FROM convidados c
            ORDER BY c.nome ASC
        `;
        let params = [];

        if (busca) {
            query = `
                SELECT c.*, EXISTS(SELECT 1 FROM db_checkins.checkins ch WHERE ch.id_convidado = c.id_convidado) AS ja_entrou
                FROM convidados c
                WHERE c.nome LIKE ? OR c.sobrenome LIKE ? OR c.cpf LIKE ?
                ORDER BY c.nome ASC
            `;
            const termoBusca = `%${busca}%`;
            params = [termoBusca, termoBusca, termoBusca];
        }

        const [convidados] = await connection.execute(query, params);
        const convidadosCompletos = [];

        for (let convidado of convidados) {
            const [acompanhantes] = await connection.execute(
                'SELECT nome, sobrenome FROM acompanhantes WHERE fk_convidado = ?',
                [convidado.id_convidado]
            );
            const convidadoObj = Object.assign({}, convidado);
            convidadoObj.acompanhantes = acompanhantes;
            convidadosCompletos.push(convidadoObj);
        }

        await connection.end();
        res.json(convidadosCompletos);
    } catch (error) {
        console.error('Erro ao listar convidados:', error);
        res.status(500).json({ erro: 'Erro ao obter dados.' });
    }
});

// Registar novo convidado e seus acompanhantes
app.post('/convidados', async (req, res) => {
    const { nome, sobrenome, cpf, telefone, email, numero_mesa, acompanhantes } = req.body;
    let connection;

    try {
        connection = await mysql.createConnection(dbConfig);
        await connection.beginTransaction();

        const [result] = await connection.execute(
            'INSERT INTO convidados (nome, sobrenome, cpf, telefone, email, numero_mesa) VALUES (?, ?, ?, ?, ?, ?)',
            [nome, sobrenome, cpf || null, telefone || null, email || null, numero_mesa]
        );
        const idConvidado = result.insertId;

        if (acompanhantes && acompanhantes.length > 0) {
            for (let acomp of acompanhantes) {
                await connection.execute(
                    'INSERT INTO acompanhantes (nome, sobrenome, fk_convidado) VALUES (?, ?, ?)',
                    [acomp.nome, acomp.sobrenome, idConvidado]
                );
            }
        }

        await connection.commit();
        res.status(201).json({ mensagem: 'Convidado registado!', id: idConvidado });
    } catch (error) {
        if (connection) await connection.rollback();
        res.status(500).json({ erro: 'Erro ao registar convidado.' });
    } finally {
        if (connection) await connection.end();
    }
});

// ==========================================
// ROTA DE EDIÇÃO (CORRIGIDA)
// ==========================================
app.put('/convidados/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, sobrenome, cpf, telefone, email, numero_mesa, acompanhantes } = req.body;
    let connection;

    try {
        connection = await mysql.createConnection(dbConfig);
        await connection.beginTransaction();

        // 1. Atualiza dados do convidado principal
        await connection.execute(
            'UPDATE convidados SET nome=?, sobrenome=?, cpf=?, telefone=?, email=?, numero_mesa=? WHERE id_convidado=?',
            [nome, sobrenome, cpf || null, telefone || null, email || null, numero_mesa, id]
        );

        // 2. Sincroniza acompanhantes: Remove os antigos e insere os novos
        // (Estratégia mais segura para lidar com edições dinâmicas na tabela)
        await connection.execute('DELETE FROM acompanhantes WHERE fk_convidado = ?', [id]);

        if (acompanhantes && acompanhantes.length > 0) {
            for (let acomp of acompanhantes) {
                await connection.execute(
                    'INSERT INTO acompanhantes (nome, sobrenome, fk_convidado) VALUES (?, ?, ?)',
                    [acomp.nome, acomp.sobrenome, id]
                );
            }
        }

        await connection.commit();
        res.json({ mensagem: 'Convidado atualizado com sucesso!' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Erro ao editar:', error);
        res.status(500).json({ erro: 'Erro ao atualizar convidado.' });
    } finally {
        if (connection) await connection.end();
    }
});

// ==========================================
// ROTA DE EXCLUSÃO (CORRIGIDA)
// ==========================================
app.delete('/convidados/:id', async (req, res) => {
    const { id } = req.params;
    let connection;

    try {
        connection = await mysql.createConnection(dbConfig);
        await connection.beginTransaction();

        // Devido às chaves estrangeiras (FK), devemos remover os acompanhantes primeiro
        // (Ou configurar ON DELETE CASCADE no MySQL)
        await connection.execute('DELETE FROM acompanhantes WHERE fk_convidado = ?', [id]);
        
        // Remove o convidado
        await connection.execute('DELETE FROM convidados WHERE id_convidado = ?', [id]);

        await connection.commit();
        res.json({ mensagem: 'Convidado removido com sucesso!' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Erro ao excluir:', error);
        res.status(500).json({ erro: 'Erro ao excluir convidado.' });
    } finally {
        if (connection) await connection.end();
    }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`[Convidados] Servidor a correr na porta ${PORT}`);
});