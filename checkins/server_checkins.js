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

// Endpoint para realizar o Check-in
app.post('/checkin', async (req, res) => {
    const { id_usuario, id_convidado } = req.body;

    if (!id_usuario || !id_convidado) {
        return res.status(400).json({ erro: 'ID do utilizador e do convidado são obrigatórios.' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        
        // Tenta inserir o check-in. O UNIQUE constraint em id_convidado bloqueará duplicados.
        const [result] = await connection.execute(
            'INSERT INTO checkins (id_usuario, id_convidado) VALUES (?, ?)',
            [id_usuario, id_convidado]
        );
        
        await connection.end();
        res.status(201).json({ mensagem: 'Check-in realizado com sucesso!', id_checkin: result.insertId });

    } catch (error) {
        // Tratar erro de duplicidade (ER_DUP_ENTRY no MySQL)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ erro: 'Este convidado já efetuou o check-in.' });
        }
        console.error('Erro ao fazer check-in:', error);
        res.status(500).json({ erro: 'Erro interno no servidor de check-ins.' });
    }
});

// Endpoint para fornecer dados para o Dashboard (Gráfico de Rosca)
app.get('/estatisticas', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        // Conta o total de check-ins realizados
        const [rows] = await connection.execute('SELECT COUNT(*) AS presentes FROM checkins');
        const presentes = rows[0].presentes;
        
        await connection.end();
        
        // Num projeto real, faríamos um pedido HTTP à porta 3002 para saber o total de convidados.
        // Aqui enviamos apenas os presentes, mas para simplificar, vamos assumir 30 (total do seed).
        const totalEsperado = 30; // Este valor pode vir dinamicamente se cruzar dados.
        const ausentes = totalEsperado - presentes;

        res.json({
            presentes: presentes,
            ausentes: ausentes > 0 ? ausentes : 0,
            totalEsperado: totalEsperado
        });
    } catch (error) {
        console.error('Erro nas estatísticas:', error);
        res.status(500).json({ erro: 'Erro ao carregar estatísticas.' });
    }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    console.log(`[Checkins] Servidor a correr na porta ${PORT}`);
});