const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const cpfCnpjValidator = require('cpf-cnpj-validator');

const LoanSchema = new Schema({
  personType: { 
    type: String,
    required: true
  },
  document: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        if(this.personType === 'PF') {
          return cpfCnpjValidator.cpf.isValid(v);
        } else if(this.personType === 'PJ') {
          return cpfCnpjValidator.cnpj.isValid(v);
        }
        return false;
      },
      message: props => `${props.value} é um documento inválido!`
    }
  },
  name: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 100
  },
  documentNumber: {
    type: String,
    required: true
  },
  activeDebt: {
    type: Number,
    required: true
  },
  loanValue: {
    type: Number,
    required: true,
    validate: {
      validator: function(v) {
        return (v <= 50000 && v <= this.activeDebt / 2);
      },
      message: props => 'Empréstimo negado!'
    }
  }
});

module.exports = mongoose.model('Loan', LoanSchema);
