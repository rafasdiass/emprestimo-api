const Joi = require('@hapi/joi');
const cpfCnpjValidator = require('cpf-cnpj-validator');
const Loan = require('./Loan');
const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const app = express();

// Conexão ao MongoDB
mongoose.connect('mongodb://localhost:27017/emprestimo', { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Erro de conexão:'));
db.once('open', function() {
  console.log("Conectado ao MongoDB!");
});

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.send('Hello World!');
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});

// Definir o esquema de validação usando Joi
const loanSchema = Joi.object({
    personType: Joi.string().valid('PF', 'PJ').required(),
    document: Joi.string().custom((value, helper) => {
      if (helper.state.ancestors[0].personType === 'PF') {
        if (!cpfCnpjValidator.cpf.isValid(value)) {
          return helper.message('CPF inválido');
        }
      } else if (helper.state.ancestors[0].personType === 'PJ') {
        if (!cpfCnpjValidator.cnpj.isValid(value)) {
          return helper.message('CNPJ inválido');
        }
      }
      return true;
    }, 'Validação de documento').required(),
    name: Joi.string().min(3).max(100).required(),
    documentNumber: Joi.string().required(),
    activeDebt: Joi.number().required(),
    loanValue: Joi.number().max(50000).custom((value, helper) => {
      if (value > helper.state.ancestors[0].activeDebt / 2) {
        return helper.message('O valor do empréstimo não pode ser maior que a metade da dívida ativa');
      }
      return true;
    }, 'Validação de valor de empréstimo').required()
});

app.post('/loan', async (req, res) => {
  const { error } = loanSchema.validate(req.body);
  
  if (error) return res.status(400).send(error.details[0].message);

  const loan = new Loan(req.body);

  // Aqui, adicionaremos a lógica para verificar se o empréstimo é válido de acordo com as regras que você forneceu.
  
  try {
      await loan.save();
      res.send('Empréstimo aprovado');
  } catch (err) {
      res.status(400).send(err);
  }
});
