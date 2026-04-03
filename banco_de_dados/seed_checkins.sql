-- Criação do banco de dados de Check-ins
CREATE DATABASE IF NOT EXISTS db_checkins;
USE db_checkins;

-- Tabela de Check-ins
CREATE TABLE IF NOT EXISTS checkins (
    id_checkin INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,    -- Quem fez o check-in (Admin ou Cerimonialista)
    id_convidado INT NOT NULL,  -- O convidado que chegou (Referência lógica para db_convidados)
    data_hora_chegada DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_convidado UNIQUE (id_convidado) -- Regra de negócio: Impede duplicidade de check-in
);

-- Nota: Não inserimos dados aqui para que o sistema comece com 0 check-ins (evento não iniciado).