import csvParse from 'csv-parse';
import fs from 'fs';
import { getRepository, getCustomRepository, In } from 'typeorm';

import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface TransactionCSV {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const readerReadStream = fs.createReadStream(filePath);

    const configParser = csvParse({
      from_line: 2,
    });

    const transactions: TransactionCSV[] = [];
    const categories: string[] = [];

    const parseCSV = readerReadStream.pipe(configParser);

    // Lê o arquivo csv e popula os arrays
    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) => {
        return cell.trim();
      });

      if (!title || !value || !type || !category) return;

      transactions.push({ title, value, type, category });
      categories.push(category);
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    /**
     * Trata as categorias
     */

    const categoryRepository = getRepository(Category);

    const existingCategories = await categoryRepository.find({
      where: {
        title: In(categories),
      },
    });

    const titleCategories = categories
      .filter(
        title => !existingCategories.some(category => category.title === title),
      )
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoryRepository.create(
      titleCategories.map(category => ({
        title: category,
      })),
    );

    await categoryRepository.save(newCategories);

    /**
     * Trata as transações
     */
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const allCategories = [...newCategories, ...existingCategories];

    const newTransactions = transactionsRepository.create(
      transactions.map(({ title, value, type, category }) => ({
        title,
        value,
        type,
        category: allCategories.find(c => c.title === category),
      })),
    );

    await transactionsRepository.save(newTransactions);

    await fs.promises.unlink(filePath);

    return newTransactions;
  }
}

export default ImportTransactionsService;
