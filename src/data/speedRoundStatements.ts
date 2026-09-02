export interface SpeedRoundStatement {
  id: string;
  statement: string;
  isTrue: boolean;
  explanation: string;
}

export const SPEED_ROUND_STATEMENTS: SpeedRoundStatement[] = [
  {
    id: 'sr-1',
    statement: 'L2 regularization can shrink weights exactly to zero.',
    isTrue: false,
    explanation: "That's L1. L2 shrinks weights toward zero smoothly but almost never exactly to zero.",
  },
  {
    id: 'sr-2',
    statement: 'Batch normalization helps stabilize training by normalizing layer inputs.',
    isTrue: true,
    explanation: 'It reduces internal covariate shift, which lets you train with higher learning rates.',
  },
  {
    id: 'sr-3',
    statement: 'A higher learning rate always leads to faster convergence.',
    isTrue: false,
    explanation: 'Too high a rate causes the loss to oscillate or diverge instead of converging.',
  },
  {
    id: 'sr-4',
    statement: 'Dropout is only applied during training, not at inference time.',
    isTrue: true,
    explanation: 'At inference, all units are used, typically with activations scaled to match training-time expectations.',
  },
  {
    id: 'sr-5',
    statement: 'RAG retrieves relevant context before generating a response.',
    isTrue: true,
    explanation: 'That retrieval step is the entire point -- it grounds generation in fetched documents instead of just model memory.',
  },
  {
    id: 'sr-6',
    statement: 'Increasing model size always reduces overfitting.',
    isTrue: false,
    explanation: 'Bigger models have more capacity to memorize noise -- without enough data or regularization, they overfit more.',
  },
  {
    id: 'sr-7',
    statement: 'Softmax converts logits into a probability distribution that sums to 1.',
    isTrue: true,
    explanation: "That's exactly what it's for: exponentiate and normalize.",
  },
  {
    id: 'sr-8',
    statement: 'Gradient descent is guaranteed to find the global minimum for non-convex loss functions.',
    isTrue: false,
    explanation: 'It can get stuck in local minima or saddle points -- most deep learning loss surfaces are non-convex.',
  },
  {
    id: 'sr-9',
    statement: 'Transformers process tokens sequentially, one at a time, like RNNs.',
    isTrue: false,
    explanation: 'Self-attention lets transformers process all tokens in parallel, which is a big part of why they train faster than RNNs.',
  },
  {
    id: 'sr-10',
    statement: 'Precision measures the fraction of predicted positives that are actually positive.',
    isTrue: true,
    explanation: 'Precision = TP / (TP + FP). Recall is the one about catching all the actual positives.',
  },
  {
    id: 'sr-11',
    statement: 'A vector database stores embeddings and supports similarity search.',
    isTrue: true,
    explanation: "That's the core use case -- nearest-neighbor search over high-dimensional embeddings, usually via ANN indexes.",
  },
  {
    id: 'sr-12',
    statement: 'Fine-tuning always requires more data than prompt engineering.',
    isTrue: false,
    explanation: 'Techniques like LoRA can fine-tune effectively on small datasets; prompt engineering can also need substantial curated examples.',
  },
  {
    id: 'sr-13',
    statement: 'Convolutional layers share weights across spatial locations.',
    isTrue: true,
    explanation: 'The same filter slides across the whole input -- that weight sharing is what makes CNNs parameter-efficient.',
  },
  {
    id: 'sr-14',
    statement: 'The vanishing gradient problem is unique to convolutional networks.',
    isTrue: false,
    explanation: "It shows up broadly in deep and recurrent networks -- it's about depth and repeated multiplication, not convolutions specifically.",
  },
  {
    id: 'sr-15',
    statement: 'Cross-entropy loss is commonly used for classification tasks.',
    isTrue: true,
    explanation: 'It directly penalizes confident wrong predictions, which pairs naturally with softmax outputs.',
  },
  {
    id: 'sr-16',
    statement: 'An agent framework lets an LLM decide which tools to call to complete a task.',
    isTrue: true,
    explanation: "That's the core agentic loop: the model reasons about which tool/function to invoke next, not just generating text.",
  },
  {
    id: 'sr-17',
    statement: 'K-means clustering requires labeled data to train.',
    isTrue: false,
    explanation: "K-means is unsupervised -- it groups points by distance alone, no labels needed.",
  },
  {
    id: 'sr-18',
    statement: 'Temperature in LLM sampling controls output randomness.',
    isTrue: true,
    explanation: 'Higher temperature flattens the probability distribution, making less-likely tokens more likely to get picked.',
  },
];
