const Joi = require('@hapi/joi');
const Loan = require('./Loan');
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

app.get('/', (req, res) => {
    res.send('Hello World!');
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});


const loanSchema = Joi.object({
    personType: Joi.string().valid('PF', 'PJ').required(),
    document: Joi.string().required(),
    name: Joi.string().min(3).max(100).required(),
    documentNumber: Joi.string().required(),
    activeDebt: Joi.number().required(),
    loanValue: Joi.number().max(50000).required()
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

  try {
    await loan.save();
    res.send('Empréstimo aprovado');
  } catch (err) {
    res.status(400).send(err.message);
  }
});
