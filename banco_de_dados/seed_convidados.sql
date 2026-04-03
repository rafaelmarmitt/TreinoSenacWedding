-- Criação do banco de dados de Convidados
CREATE DATABASE IF NOT EXISTS db_convidados;
USE db_convidados;

-- Tabela de Convidados
CREATE TABLE IF NOT EXISTS convidados (
    id_convidado INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    sobrenome VARCHAR(50) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    telefone VARCHAR(20),
    email VARCHAR(100),
    numero_mesa INT
);

-- Tabela de Acompanhantes
CREATE TABLE IF NOT EXISTS acompanhantes (
    id_acompanhante INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    sobrenome VARCHAR(50) NOT NULL,
    fk_convidado INT NOT NULL,
    FOREIGN KEY (fk_convidado) REFERENCES convidados(id_convidado) ON DELETE CASCADE
);

-- Inserindo 30 convidados variados
INSERT INTO convidados (nome, sobrenome, cpf, telefone, email, numero_mesa) VALUES
('Carlos', 'Silva', '001.000.000-01', '(11) 91111-1111', 'carlos.silva@email.com', 1),
('Ana', 'Souza', '002.000.000-02', '(11) 92222-2222', 'ana.souza@email.com', 1),
('Bruno', 'Costa', '003.000.000-03', '(11) 93333-3333', 'bruno.costa@email.com', 2),
('Fernanda', 'Lima', '004.000.000-04', '(11) 94444-4444', 'fernanda.lima@email.com', 2),
('Roberto', 'Alves', '005.000.000-05', '(11) 95555-5555', 'roberto.alves@email.com', 3),
('Juliana', 'Martins', '006.000.000-06', '(11) 96666-6666', 'juliana.martins@email.com', 3),
('Lucas', 'Ferreira', '007.000.000-07', '(11) 97777-7777', 'lucas.ferreira@email.com', 4),
('Camila', 'Gomes', '008.000.000-08', '(11) 98888-8888', 'camila.gomes@email.com', 4),
('Eduardo', 'Ribeiro', '009.000.000-09', '(11) 99999-9999', 'eduardo.ribeiro@email.com', 5),
('Mariana', 'Carvalho', '010.000.000-10', '(11) 90000-0000', 'mariana.carvalho@email.com', 5),
('Tiago', 'Mendes', '011.000.000-11', '(11) 91111-2222', 'tiago.mendes@email.com', 6),
('Patricia', 'Rocha', '012.000.000-12', '(11) 92222-3333', 'patricia.rocha@email.com', 6),
('Diego', 'Freitas', '013.000.000-13', '(11) 93333-4444', 'diego.freitas@email.com', 7),
('Beatriz', 'Barbosa', '014.000.000-14', '(11) 94444-5555', 'beatriz.barbosa@email.com', 7),
('Felipe', 'Dias', '015.000.000-15', '(11) 95555-6666', 'felipe.dias@email.com', 8),
('Leticia', 'Castro', '016.000.000-16', '(11) 96666-7777', 'leticia.castro@email.com', 8),
('Marcos', 'Oliveira', '017.000.000-17', '(11) 97777-8888', 'marcos.oliveira@email.com', 9),
('Renata', 'Nunes', '018.000.000-18', '(11) 98888-9999', 'renata.nunes@email.com', 9),
('Rafael', 'Pinto', '019.000.000-19', '(11) 99999-0000', 'rafael.pinto@email.com', 10),
('Amanda', 'Melo', '020.000.000-20', '(11) 91234-5678', 'amanda.melo@email.com', 10),
('Igor', 'Monteiro', '021.000.000-21', '(11) 98765-4321', 'igor.monteiro@email.com', 11),
('Vanessa', 'Correia', '022.000.000-22', '(11) 92345-6789', 'vanessa.correia@email.com', 11),
('André', 'Cardoso', '023.000.000-23', '(11) 93456-7890', 'andre.cardoso@email.com', 12),
('Priscila', 'Teixeira', '024.000.000-24', '(11) 94567-8901', 'priscila.teixeira@email.com', 12),
('Gustavo', 'Cavalcanti', '025.000.000-25', '(11) 95678-9012', 'gustavo.cavalcanti@email.com', 13),
('Carolina', 'Farias', '026.000.000-26', '(11) 96789-0123', 'carolina.farias@email.com', 13),
('Rodrigo', 'Moraes', '027.000.000-27', '(11) 97890-1234', 'rodrigo.moraes@email.com', 14),
('Laura', 'Peixoto', '028.000.000-28', '(11) 98901-2345', 'laura.peixoto@email.com', 14),
('Victor', 'Borges', '029.000.000-29', '(11) 99012-3456', 'victor.borges@email.com', 15),
('Aline', 'Machado', '030.000.000-30', '(11) 90123-4567', 'aline.machado@email.com', 15);

-- Inserindo alguns acompanhantes vinculados aos convidados
INSERT INTO acompanhantes (nome, sobrenome, fk_convidado) VALUES
('João', 'Silva Junior', 1),
('Clara', 'Souza Lima', 2),
('Pedro', 'Alves Neto', 5),
('Sofia', 'Mendes', 11);