require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();

app.use(cors());
app.use(express.json());

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
};

// Obter todos os convidados (com busca opcional)
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

        const [rows] = await connection.execute(query, params);
        await connection.end();
        res.json(rows);
    } catch (error) {
        console.error('Erro ao listar convidados:', error);
        res.status(500).json({ erro: 'Erro ao obter dados.' });
    }
});

// Registar novo convidado
app.post('/convidados', async (req, res) => {
    const { nome, sobrenome, cpf, telefone, email, numero_mesa } = req.body;
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute(
            'INSERT INTO convidados (nome, sobrenome, cpf, telefone, email, numero_mesa) VALUES (?, ?, ?, ?, ?, ?)',
            [nome, sobrenome, cpf, telefone, email, numero_mesa]
        );
        await connection.end();
        res.status(201).json({ mensagem: 'Convidado registado com sucesso!', id: result.insertId });
    } catch (error) {
        console.error('Erro ao registar convidado:', error);
        res.status(500).json({ erro: 'Erro ao registar convidado. Verifique os dados.' });
    }
});

// (Opcional) Obter os acompanhantes de um convidado
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

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`[Convidados] Servidor a correr na porta ${PORT}`);
});