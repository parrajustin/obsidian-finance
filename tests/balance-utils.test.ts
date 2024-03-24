import {
  DailyAccountBalanceChangeMap,
  findChildAccounts,
  makeBalanceData,
  makeDailyAccountBalanceChangeMap,
  makeDailyBalanceMap,
  makeDeltaData,
  removeDuplicateAccounts,
} from '../src/balance-utils';
import { EnhancedTransaction, FileBlock } from '../src/parser';
import * as moment from 'moment';

window.moment = moment;

const emptyBlock: FileBlock = {
  firstLine: -1,
  lastLine: -1,
  block: '',
};

describe('removeDuplicateAccounts()', () => {
  test('When there is only one account with one layer', () => {
    const input = ['Liabilities'];
    const result = removeDuplicateAccounts(input);
    expect(result).toEqual(input);
  });
  test('When there is only one account with multiple layers', () => {
    const input = ['Liabilities:Credit:Chase'];
    const result = removeDuplicateAccounts(input);
    expect(result).toEqual(input);
  });
  test('When there are two unrelated accounts', () => {
    const input = ['Liabilities:Credit:Chase', 'Expenses:Food'];
    const result = removeDuplicateAccounts(input);
    expect(result).toEqual(input);
  });
  test('When there are two accounts that overlap', () => {
    const input = ['Liabilities:Credit:Chase', 'Liabilities:Loans'];
    const result = removeDuplicateAccounts(input);
    expect(result).toEqual(input);
  });
  test('When there are two are parent accounts to keep', () => {
    const input = [
      'Liabilities:Credit:Chase',
      'Liabilities:Loans',
      'Liabilities',
    ];
    const expected = [
      'Liabilities',
      'Liabilities:Credit:Chase',
      'Liabilities:Loans',
    ];
    const result = removeDuplicateAccounts(input);
    expect(result).toEqual(expected);
  });
  test('When there are two are parent accounts to keep in a different order', () => {
    const input = [
      'Liabilities',
      'Liabilities:Credit:Chase',
      'Liabilities:Loans',
    ];
    const result = removeDuplicateAccounts(input);
    expect(result).toEqual(input);
  });
  test('When there are parent accounts to remove', () => {
    const input = [
      'Liabilities',
      'Liabilities:Credit:Chase',
      'Liabilities:Credit',
      'Liabilities:Loans',
    ];
    const expected = [
      'Liabilities',
      'Liabilities:Credit:Chase',
      'Liabilities:Loans',
    ];
    const result = removeDuplicateAccounts(input);
    expect(result).toEqual(expected);
  });
  test('When there are multiple parents to remove', () => {
    const input = [
      'Liabilities',
      'Liabilities:Credit:Chase',
      'Liabilities:Credit',
      'Liabilities:Loans:House',
      'Liabilities:Loans',
    ];
    const expected = [
      'Liabilities',
      'Liabilities:Credit:Chase',
      'Liabilities:Loans:House',
    ];
    const result = removeDuplicateAccounts(input);
    expect(result).toEqual(expected);
  });
});

describe('Balance maps', () => {
  const tx4: EnhancedTransaction = {
    type: 'tx',
    blockLine: 0,
    block: emptyBlock,
    value: {
      date: '2021-12-16',
      payee: 'Costco',
      expenselines: [
        {
          account: 'e:Spending Money',
          dealiasedAccount: 'Expenses:Spending Money',
          amount: 100,
          currency: '$',
          reconcile: '',
        },
        {
          account: 'c:Citi',
          dealiasedAccount: 'Credit:Citi',
          reconcile: '',
          amount: -100,
        },
      ],
    },
  };
  const tx5: EnhancedTransaction = {
    type: 'tx',
    blockLine: 0,
    block: emptyBlock,
    value: {
      date: '2021-12-15',
      payee: "Trader Joe's",
      expenselines: [
        {
          account: 'e:Food:Grocery',
          dealiasedAccount: 'Expenses:Food:Grocery',
          amount: 120,
          currency: '$',
          reconcile: '',
        },
        {
          account: 'c:Citi',
          dealiasedAccount: 'Credit:Citi',
          amount: -120,
          reconcile: '',
        },
      ],
    },
  };
  const tx6: EnhancedTransaction = {
    type: 'tx',
    blockLine: 0,
    block: emptyBlock,
    value: {
      date: '2021-12-10',
      payee: 'PCC',
      expenselines: [
        {
          account: 'e:Food:Grocery',
          dealiasedAccount: 'Expenses:Food:Grocery',
          amount: 20,
          currency: '$',
          reconcile: '',
        },
        {
          account: 'c:Citi',
          dealiasedAccount: 'Credit:Citi',
          reconcile: '',
          amount: -20,
        },
      ],
    },
  };

  const expectedDailyAccountBalanceChangeMap: DailyAccountBalanceChangeMap =
    new Map([
      [
        '2021-12-10',
        new Map([
          ['Expenses:Food:Grocery', 20],
          ['Credit:Citi', -20],
        ]),
      ],
      [
        '2021-12-15',
        new Map([
          ['Expenses:Food:Grocery', 120],
          ['Credit:Citi', -120],
        ]),
      ],
      [
        '2021-12-16',
        new Map([
          ['Expenses:Spending Money', 100],
          ['Credit:Citi', -100],
        ]),
      ],
    ]);

  describe('makeDailyAccountBalanceChangeMap()', () => {
    test('simple test', () => {
      const input = [tx4, tx5, tx6];
      const result = makeDailyAccountBalanceChangeMap(input);
      expect(result).toEqual(expectedDailyAccountBalanceChangeMap);
    });
  });

  describe('makeDailyBalanceMap()', () => {
    test('simple test', () => {
      const accounts = [
        'Credit:Citi',
        'Expenses:Spending Money',
        'Expenses:Food:Grocery',
      ];
      const result = makeDailyBalanceMap(
        accounts,
        expectedDailyAccountBalanceChangeMap,
        window.moment('2021-12-08'),
        window.moment('2021-12-20'),
      );
      const expected = new Map([
        [
          '2021-12-08',
          new Map([
            ['Credit:Citi', 0],
            ['Expenses:Spending Money', 0],
            ['Expenses:Food:Grocery', 0],
          ]),
        ],
        [
          '2021-12-09',
          new Map([
            ['Credit:Citi', 0],
            ['Expenses:Spending Money', 0],
            ['Expenses:Food:Grocery', 0],
          ]),
        ],
        [
          '2021-12-10',
          new Map([
            ['Credit:Citi', -20],
            ['Expenses:Spending Money', 0],
            ['Expenses:Food:Grocery', 20],
          ]),
        ],
        [
          '2021-12-11',
          new Map([
            ['Credit:Citi', -20],
            ['Expenses:Spending Money', 0],
            ['Expenses:Food:Grocery', 20],
          ]),
        ],
        [
          '2021-12-12',
          new Map([
            ['Credit:Citi', -20],
            ['Expenses:Spending Money', 0],
            ['Expenses:Food:Grocery', 20],
          ]),
        ],
        [
          '2021-12-13',
          new Map([
            ['Credit:Citi', -20],
            ['Expenses:Spending Money', 0],
            ['Expenses:Food:Grocery', 20],
          ]),
        ],
        [
          '2021-12-14',
          new Map([
            ['Credit:Citi', -20],
            ['Expenses:Spending Money', 0],
            ['Expenses:Food:Grocery', 20],
          ]),
        ],
        [
          '2021-12-15',
          new Map([
            ['Credit:Citi', -140],
            ['Expenses:Spending Money', 0],
            ['Expenses:Food:Grocery', 140],
          ]),
        ],
        [
          '2021-12-16',
          new Map([
            ['Credit:Citi', -240],
            ['Expenses:Spending Money', 100],
            ['Expenses:Food:Grocery', 140],
          ]),
        ],
        [
          '2021-12-17',
          new Map([
            ['Credit:Citi', -240],
            ['Expenses:Spending Money', 100],
            ['Expenses:Food:Grocery', 140],
          ]),
        ],
        [
          '2021-12-18',
          new Map([
            ['Credit:Citi', -240],
            ['Expenses:Spending Money', 100],
            ['Expenses:Food:Grocery', 140],
          ]),
        ],
        [
          '2021-12-19',
          new Map([
            ['Credit:Citi', -240],
            ['Expenses:Spending Money', 100],
            ['Expenses:Food:Grocery', 140],
          ]),
        ],
        [
          '2021-12-20',
          new Map([
            ['Credit:Citi', -240],
            ['Expenses:Spending Money', 100],
            ['Expenses:Food:Grocery', 140],
          ]),
        ],
      ]);
      expect(result).toEqual(expected);
    });
  });
});

describe('make account visualization data', () => {
  const allAccounts = [
    'Expenses:Food',
    'Expenses:Food:Grocery',
    'Expenses:Spending Money',
    'Credit:Citi',
  ];
  const buckets = ['2021-12-14', '2021-12-15', '2021-12-16', '2021-12-17'];
  const balanceMap: Map<string, Map<string, number>> = new Map([
    [
      '2021-12-14',
      new Map([
        ['Credit:Citi', -20],
        ['Expenses:Spending Money', 0],
        ['Expenses:Food:Grocery', 20],
      ]),
    ],
    [
      '2021-12-15',
      new Map([
        ['Credit:Citi', -20],
        ['Expenses:Spending Money', 0],
        ['Expenses:Food:Grocery', 20],
      ]),
    ],
    [
      '2021-12-16',
      new Map([
        ['Credit:Citi', -150],
        ['Expenses:Spending Money', 0],
        ['Expenses:Food:Grocery', 140],
        ['Expenses:Food', 10],
      ]),
    ],
    [
      '2021-12-17',
      new Map([
        ['Credit:Citi', -250],
        ['Expenses:Spending Money', 100],
        ['Expenses:Food:Grocery', 140],
        ['Expenses:Food', 10],
      ]),
    ],
  ]);

  describe('makeBalanceData()', () => {
    test('When there is no child account', () => {
      const result = makeBalanceData(
        balanceMap,
        buckets,
        'Expenses:Food:Grocery',
        allAccounts,
      );
      expect(result).toEqual([
        { x: '2021-12-14', y: 20 },
        { x: '2021-12-15', y: 20 },
        { x: '2021-12-16', y: 140 },
        { x: '2021-12-17', y: 140 },
      ]);
    });

    test('When there is a child account', () => {
      const result = makeBalanceData(
        balanceMap,
        buckets,
        'Expenses:Food',
        allAccounts,
      );
      expect(result).toEqual([
        { x: '2021-12-14', y: 20 },
        { x: '2021-12-15', y: 20 },
        { x: '2021-12-16', y: 150 },
        { x: '2021-12-17', y: 150 },
      ]);
    });
  });
  describe('makeDeltaData()', () => {
    test('When there is no child account', () => {
      const result = makeDeltaData(
        balanceMap,
        '2021-12-13',
        buckets,
        'Expenses:Food:Grocery',
        allAccounts,
      );
      expect(result).toEqual([
        { x: '2021-12-14', y: 20 },
        { x: '2021-12-15', y: 0 },
        { x: '2021-12-16', y: 120 },
        { x: '2021-12-17', y: 0 },
      ]);
    });

    test('When there is a child account', () => {
      const result = makeDeltaData(
        balanceMap,
        '2021-12-13',
        buckets,
        'Expenses:Food',
        allAccounts,
      );
      expect(result).toEqual([
        { x: '2021-12-14', y: 20 },
        { x: '2021-12-15', y: 0 },
        { x: '2021-12-16', y: 130 },
        { x: '2021-12-17', y: 0 },
      ]);
    });
  });
});

describe('findChildAccounts', () => {
  test('when an account should match', () => {
    const accounts = [
      'Expenses:Food',
      'Expenses:Food:Grocery',
      'Expenses:Food:Restaurants',
    ];
    const results = findChildAccounts('Expenses:Food', accounts);
    expect(results).toEqual([
      'Expenses:Food:Grocery',
      'Expenses:Food:Restaurants',
    ]);
  });

  test('does not match incorrectly', () => {
    const accounts = [
      'Expenses:Fo',
      'Expenses:Food',
      'Expenses:Food:Grocery',
      'Expenses:Food:Restaurants',
    ];
    const results = findChildAccounts('Expenses:Fo', accounts);
    expect(results).toEqual([]);
  });
});
