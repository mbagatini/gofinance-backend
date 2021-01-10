import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';

interface RequestDTO {
  title: string;
  type: 'income' | 'outcome';
  value: number;
}

class CreateTransactionService {
  private transactionsRepository: TransactionsRepository;

  constructor(transactionsRepository: TransactionsRepository) {
    this.transactionsRepository = transactionsRepository;
  }

  public execute({ title, value, type }: RequestDTO): Transaction {
    if (!(type === 'income' || type === 'outcome')) {
      throw Error("Transaction's type must be income or outcome");
    }

    if (type === 'outcome') {
      const balance = this.transactionsRepository.getBalance();
      if (balance.total < value) {
        throw Error("You don't have enough balance to finish transaction");
      }
    }

    const transaction = this.transactionsRepository.create({
      title,
      value,
      type,
    });

    return transaction;
  }
}

export default CreateTransactionService;
