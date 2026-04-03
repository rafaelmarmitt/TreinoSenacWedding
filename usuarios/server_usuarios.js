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
        let query = 'SELECT * FROM convidados ORDER BY nome ASC';
        let params = [];

        if (busca) {
            query = 'SELECT * FROM convidados WHERE nome LIKE ? OR sobrenome LIKE ? OR cpf LIKE ? ORDER BY nome ASC';
            const termoBusca = `%${busca}%`;
            params = [termoBusca, termoBusca, termoBusca];
        }

        // Busca os convidados principais
        const [convidados] = await connection.execute(query, params);

        // NOVO: Busca os acompanhantes para cada convidado e anexa ao resultado
        for (let convidado of convidados) {
            const [acompanhantes] = await connection.execute(
                'SELECT nome, sobrenome FROM acompanhantes WHERE fk_convidado = ?',
                [convidado.id_convidado]
            );
            convidado.acompanhantes = acompanhantes; // Cria a lista de acompanhantes dentro do objeto
        }

        await connection.end();
        res.json(convidados);
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

        // Inicia uma transação (salva tudo ou cancela tudo em caso de erro)
        await connection.beginTransaction();

        // 1. Insere o Convidado Principal
        const [result] = await connection.execute(
            'INSERT INTO convidados (nome, sobrenome, cpf, telefone, email, numero_mesa) VALUES (?, ?, ?, ?, ?, ?)',
            [nome, sobrenome, cpf || null, telefone || null, email || null, numero_mesa]
        );
        const idConvidado = result.insertId;

        // 2. Insere os Acompanhantes (se existirem na requisição)
        if (acompanhantes && acompanhantes.length > 0) {
            console.log(`[Convidados] A guardar ${acompanhantes.length} acompanhante(s) para ${nome} ${sobrenome}...`);
            for (let acomp of acompanhantes) {
                await connection.execute(
                    'INSERT INTO acompanhantes (nome, sobrenome, fk_convidado) VALUES (?, ?, ?)',
                    [acomp.nome, acomp.sobrenome, idConvidado]
                );
            }
        }

        // Confirma a transação no banco de dados
        await connection.commit();

        console.log(`[Convidados] Sucesso! Convidado ${idConvidado} registado.`);
        res.status(201).json({ mensagem: 'Convidado e acompanhantes registados com sucesso!', id: idConvidado });
    } catch (error) {
        if (connection) await connection.rollback(); // Desfaz alterações em caso de erro
        console.error('Erro detalhado ao registar convidado:', error);
        res.status(500).json({ erro: 'Erro ao registar convidado. Verifique os dados (ex: CPF duplicado).', detalhe: error.message });
    } finally {
        if (connection) await connection.end(); // Fecha a conexão
    }
});

// Obter os acompanhantes de um convidado específico (Rota Auxiliar)
app.get('/convidados/:id/acompanhantes', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            'SELECT * FROM acompanhantes WHERE fk_convidado = ?',
            [req.params.id]
        );
        await connection.end();
        res.json(rows);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao obter acompanhantes.' });
    }
});

// Excluir Convidado (DELETE)
app.delete('/convidados/:id', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute('DELETE FROM convidados WHERE id_convidado = ?', [req.params.id]);
        await connection.end();
        res.json({ mensagem: 'Convidado excluído com sucesso!' });
    } catch (error) {
        console.error('Erro ao excluir:', error);
        res.status(500).json({ erro: 'Erro ao excluir convidado.' });
    }
});

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

// ... (as outras rotas GET, POST e DELETE permanecem iguais ao que você enviou)