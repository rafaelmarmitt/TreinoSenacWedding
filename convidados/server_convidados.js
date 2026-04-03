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

        // CORREÇÃO: Consulta cruza informações com o banco de check-ins para saber se já entrou
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

        // Busca os convidados principais com o status de check-in embutido
        const [convidados] = await connection.execute(query, params);

        // Garantir conversão absoluta para objeto JavaScript puro e adicionar acompanhantes
        const convidadosCompletos = [];

        for (let convidado of convidados) {
            const [acompanhantes] = await connection.execute(
                'SELECT nome, sobrenome FROM acompanhantes WHERE fk_convidado = ?',
                [convidado.id_convidado]
            );

            // Converte o objeto "trancado" do MySQL para um objeto JavaScript normal
            const convidadoObj = Object.assign({}, convidado);
            convidadoObj.acompanhantes = acompanhantes;

            convidadosCompletos.push(convidadoObj);
        }

        await connection.end();

        // Enviamos o novo array completo para o front-end
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

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`[Convidados] Servidor a correr na porta ${PORT}`);
});