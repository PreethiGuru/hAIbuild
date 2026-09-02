export interface MatrixCategory {
  name: string;
  terms: string[];
}

// 4 categories x 4 terms = a clean 4x4 grid with no leftovers.
export const MATRIX_CATEGORIES: MatrixCategory[] = [
  { name: 'Optimizers', terms: ['SGD', 'Adam', 'RMSprop', 'Momentum'] },
  { name: 'Activation Functions', terms: ['ReLU', 'Sigmoid', 'Tanh', 'Softmax'] },
  { name: 'Loss Functions', terms: ['Cross-Entropy', 'MSE', 'Hinge Loss', 'KL Divergence'] },
  { name: 'Regularization', terms: ['L1', 'L2', 'Dropout', 'Weight Decay'] },
];
