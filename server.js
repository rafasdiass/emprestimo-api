const Loan = require('./Loan');
const express = require('express');
const mongoose = require('mongoose');
const { Validator } = require('cpf-cnpj-validator');

const cpfValidator = Validator.CPF;
const cnpjValidator = Validator.CNPJ;

const app = express();

// Conexão ao MongoDB
mongoose.connect('mongodb://localhost:27017/emprestimo', { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Erro de conexão:'));
db.once('open', function() {
  console.log("Conectado ao MongoDB!");
});

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World!');
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});

app.post('/loan', async (req, res) => {
  const loan = new Loan({
      personType: req.body.personType,
      document: req.body.document,
      name: req.body.name,
      documentNumber: req.body.documentNumber,
      activeDebt: req.body.activeDebt,
      loanValue: req.body.loanValue,
  });

  // Verificamos as regras
  if(loan.loanValue > 50000) {
      return res.status(400).send('Empréstimo negado: valor solicitado maior que R$50000');
  }

  if(loan.loanValue > loan.activeDebt / 2) {
      return res.status(400).send('Empréstimo negado: valor solicitado maior que a metade da dívida ativa');
  }

  if(loan.personType === 'PF') {
      // Verifica se é um CPF válido
      if (!cpfValidator.isValid(loan.document)) {
          return res.status(400).send('CPF inválido.');
      }
  } else if(loan.personType === 'PJ') {
      // Verifica se é um CNPJ válido
      if (!cnpjValidator.isValid(loan.document)) {
          return res.status(400).send('CNPJ inválido.');
      }
  } else {
      return res.status(400).send('Tipo de pessoa inválido. Deve ser PF ou PJ.');
  }

  try {
      await loan.save();
      res.send('Empréstimo aprovado');
  } catch (err) {
      res.status(400).send(err);
  }
});
