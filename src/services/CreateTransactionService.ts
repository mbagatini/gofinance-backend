import { getRepository, getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface RequestDTO {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: RequestDTO): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    if (type !== 'income' && type !== 'outcome') {
      throw new AppError("Transaction's type must be income or outcome");
    }

    if (type === 'outcome') {
      const { total } = await transactionsRepository.getBalance();

      if (total < value) {
        throw new AppError(
          "You don't have enough balance to finish transaction",
        );
      }
    }

    const categoryRepository = getRepository(Category);

    let categoryObject = await categoryRepository.findOne({
      where: {
        title: category,
      },
    });

    // Se a categoria não existir, cria uma nova
    if (!categoryObject) {
      categoryObject = categoryRepository.create({
        title: category,
      });

      await categoryRepository.save(categoryObject);
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category: categoryObject,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
