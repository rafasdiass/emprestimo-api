const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Loan = require('./Loan');
const Joi = require('@hapi/joi');
const cpfCnpjValidator = require('cpf-cnpj-validator');

const app = express();

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
  
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const loan = new Loan(req.body);

try {
  await loan.save();
  console.log('Empréstimo criado:', loan);  
  res.status(200).json({ message: 'Empréstimo aprovado', loanId: loan._id });
} catch (err) {
  res.status(500).json({ message: 'Erro interno do servidor', error: err.message });
}
});

app.get('/loan-status', async (req, res) => {
  const name = req.query.name;
  const documentNumber = req.query.documentNumber;

  try {
    const loan = await Loan.findOne({ name, documentNumber });

    res.setHeader('Content-Type', 'application/json'); // Define explicitamente o 'Content-Type'

    if (!loan) {
      return res.status(404).json({ status: 'Empréstimo não encontrado', loanId: null });
    }

    if (loan.loanValue <= loan.activeDebt / 2 && loan.loanValue <= 50000) {
      return res.status(200).json({ status: 'Empréstimo aprovado', loanId: loan._id });
    } else {
      return res.status(200).json({ status: 'Empréstimo negado', loanId: loan._id });
    }
  } catch (error) {
    return res.status(500).json({ status: 'Erro interno do servidor', loanId: null, error: error.message });
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
