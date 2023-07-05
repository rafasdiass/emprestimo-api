const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema({
    personType: { type: String, required: true },
    document: { type: String, required: true },
    name: { type: String, required: true, minlength: 3, maxlength: 100 },
    documentNumber: { type: String, required: true },
    activeDebt: { type: Number, required: true },
    loanValue: { type: Number, required: true },
});

module.exports = mongoose.model('Loan', LoanSchema);
