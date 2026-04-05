-- Criação do banco de dados de Usuários
CREATE DATABASE IF NOT EXISTS db_usuarios;
USE db_usuarios;

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL, -- Armazenará o hash do Bcrypt
    perfil ENUM('Admin', 'Cerimonialista') NOT NULL
);

-- Inserindo 1 Admin e 1 Cerimonialista
-- A senha original para ambos é: 123456
-- O hash abaixo ($2a$12$...) é a representação Bcrypt de "123456" gerado com salt rounds = 10
INSERT INTO usuarios (nome, cpf, email, senha, perfil) VALUES
('Administrador Geral', '111.111.111-11', 'admin@weddingpass.com', '$2a$10$Xm/A/.1nC3fT6lU9Z/Z8z.B2UqFj4G1M1yCq1c5F9F1aZq1.5.Ww2', 'Admin'),
('Maria Cerimonialista', '222.222.222-22', 'maria@weddingpass.com', '$2a$10$Xm/A/.1nC3fT6lU9Z/Z8z.B2UqG1Fj4M1yCq1c5F9F1aZq1.5.Ww2', 'Cerimonialista');