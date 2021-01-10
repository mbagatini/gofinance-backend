import Transaction from '../models/Transaction';

interface TransactionDTO {
  title: string;
  type: 'income' | 'outcome';
  value: number;
}

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

class TransactionsRepository {
  private transactions: Transaction[];

  constructor() {
    this.transactions = [];
  }

  public all(): Transaction[] {
    return this.transactions;
  }

  public getBalance(): Balance {
    const income = this.transactions.reduce(
      (sum: number, current: Transaction) => {
        if (current.type === 'income') return sum + current.value;
        return sum;
      },
      0,
    );

    const outcome = this.transactions.reduce(
      (sum: number, current: Transaction) => {
        if (current.type === 'outcome') return sum + current.value;
        return sum;
      },
      0,
    );

    const balance = {
      income,
      outcome,
      total: income - outcome,
    };

    return balance;
  }

  public create({ title, value, type }: TransactionDTO): Transaction {
    const transaction = new Transaction({ title, value, type });

    this.transactions.push(transaction);

    return transaction;
  }
}

export default TransactionsRepository;
