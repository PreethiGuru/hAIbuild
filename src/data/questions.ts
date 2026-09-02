import { DsaQuestion, MlConceptQuestion, MlInterviewQaQuestion } from '../types';

export const DSA_QUESTIONS: DsaQuestion[] = [
  {
    id: 'dsa-1',
    title: 'Two Sum',
    difficulty: 'easy',
    topics: ['Arrays', 'Hash Table'],
    storyIntro: 'An AI feature store needs to quickly locate pairs of feature embeddings whose sum matches a target activation threshold.',
    problemStatement: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution.',
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.'
    ],
    approaches: [
      {
        name: 'Brute Force',
        intuition: 'Loop through every pair of elements and check if their sum equals the target.',
        timeComplexity: 'O(N²)',
        spaceComplexity: 'O(1)',
        diagramSpec: {
          nodes: [
            { id: '1', label: 'i=0 (2)' },
            { id: '2', label: 'j=1 (7)' },
            { id: '3', label: '2 + 7 = 9 ✓' }
          ],
          edges: [
            { from: '1', to: '2', label: 'Compare' },
            { from: '2', to: '3', label: 'Target Found' }
          ]
        }
      },
      {
        name: 'One-Pass Hash Map (Optimal)',
        intuition: 'As we iterate through the array, check if target - nums[i] exists in our hash map. If not, store nums[i] with its index.',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(N)',
        diagramSpec: {
          nodes: [
            { id: '1', label: 'nums[i]: 7' },
            { id: '2', label: 'Map lookup: 9 - 7 = 2' },
            { id: '3', label: 'Found key 2 at index 0!' }
          ],
          edges: [
            { from: '1', to: '2', label: 'Compute complement' },
            { from: '2', to: '3', label: 'Match in Map' }
          ]
        }
      }
    ]
  },
  {
    id: 'dsa-2',
    title: 'Valid Parentheses',
    difficulty: 'easy',
    topics: ['Stack', 'String'],
    storyIntro: 'Validating nested bracket syntax in a custom neural network architecture description graph parsed from YAML.',
    problemStatement: 'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid. Open brackets must be closed by the same type of brackets in the correct order.',
    constraints: [
      '1 <= s.length <= 10^4',
      's consists of parentheses only: ()[]{}'
    ],
    approaches: [
      {
        name: 'Stack Push & Pop',
        intuition: 'Push opening brackets onto a stack. When encountering a closing bracket, check if it matches the top of the stack.',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(N)',
        diagramSpec: {
          nodes: [
            { id: '1', label: 'Push "("' },
            { id: '2', label: 'Push "["' },
            { id: '3', label: 'Pop "]" -> Matches!' }
          ],
          edges: [
            { from: '1', to: '2', label: 'Stack: [(, []' },
            { from: '2', to: '3', label: 'See "]"' }
          ]
        }
      }
    ]
  },
  {
    id: 'dsa-3',
    title: 'Maximum Subarray (Kadane’s Algorithm)',
    difficulty: 'medium',
    topics: ['Arrays', 'Dynamic Programming'],
    storyIntro: 'Finding the contiguous time window with maximum cumulative rewards in a reinforcement learning log trajectory.',
    problemStatement: 'Given an integer array nums, find the subarray with the largest sum, and return its sum.',
    constraints: [
      '1 <= nums.length <= 10^5',
      '-10^4 <= nums[i] <= 10^4'
    ],
    approaches: [
      {
        name: 'Kadane Algorithm',
        intuition: 'At each position, decide whether to add current element to existing sum or start a fresh subarray at current element.',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(1)',
        diagramSpec: {
          nodes: [
            { id: '1', label: 'currentSum = max(num, currentSum + num)' },
            { id: '2', label: 'maxSoFar = max(maxSoFar, currentSum)' }
          ],
          edges: [
            { from: '1', to: '2', label: 'Update overall max' }
          ]
        }
      }
    ]
  },
  {
    id: 'dsa-4',
    title: 'Merge Intervals',
    difficulty: 'medium',
    topics: ['Sorting', 'Arrays'],
    storyIntro: 'Consolidating overlapping attention span time windows across parallel transformer heads.',
    problemStatement: 'Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals.',
    constraints: [
      '1 <= intervals.length <= 10^4',
      'intervals[i].length == 2',
      '0 <= starti <= endi <= 10^4'
    ],
    approaches: [
      {
        name: 'Sort + Greedy Merge',
        intuition: 'Sort intervals by start time. Iterate through and if current interval overlaps with last merged interval, extend end time.',
        timeComplexity: 'O(N log N)',
        spaceComplexity: 'O(N)',
        diagramSpec: {
          nodes: [
            { id: '1', label: 'Sort by start' },
            { id: '2', label: '[1,3] & [2,6] -> Overlap!' },
            { id: '3', label: 'Merged: [1,6]' }
          ],
          edges: [
            { from: '1', to: '2', label: 'Iterate' },
            { from: '2', to: '3', label: 'max(3, 6) = 6' }
          ]
        }
      }
    ]
  },
  {
    id: 'dsa-5',
    title: 'LRU Cache',
    difficulty: 'hard',
    topics: ['Hash Table', 'Doubly Linked List', 'Design'],
    storyIntro: 'Designing an in-memory embedding cache for an LLM inference server to keep hot keys instantly available.',
    problemStatement: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache with O(1) get and put time complexity.',
    constraints: [
      '1 <= capacity <= 3000',
      '0 <= key <= 10^4',
      'At most 2 * 10^5 calls to get and put'
    ],
    approaches: [
      {
        name: 'HashMap + Doubly Linked List',
        intuition: 'HashMap provides O(1) lookup to nodes. Doubly Linked List enables O(1) removal and moving node to Head (Most Recently Used).',
        timeComplexity: 'O(1) for get and put',
        spaceComplexity: 'O(Capacity)',
        diagramSpec: {
          nodes: [
            { id: '1', label: 'HEAD (MRU)' },
            { id: '2', label: 'Node (Key, Value)' },
            { id: '3', label: 'TAIL (LRU)' }
          ],
          edges: [
            { from: '1', to: '2', label: 'next / prev' },
            { from: '2', to: '3', label: 'next / prev' }
          ]
        }
      }
    ]
  },
  {
    id: 'dsa-6',
    title: 'Binary Search',
    difficulty: 'easy',
    topics: ['Binary Search', 'Arrays'],
    storyIntro: 'Searching for a confidence score cutoff threshold in a sorted list of model predictions.',
    problemStatement: 'Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums in O(log n) time.',
    constraints: [
      '1 <= nums.length <= 10^4',
      'nums is sorted in ascending order'
    ],
    approaches: [
      {
        name: 'Two Pointers (Left & Right)',
        intuition: 'Maintain left and right boundaries. Calculate mid = left + (right - left) / 2 and shrink search space by half each turn.',
        timeComplexity: 'O(log N)',
        spaceComplexity: 'O(1)',
        diagramSpec: {
          nodes: [
            { id: '1', label: 'Left: 0, Right: N-1' },
            { id: '2', label: 'Mid = (L+R)/2' },
            { id: '3', label: 'Target > Mid? L = Mid + 1' }
          ],
          edges: [
            { from: '1', to: '2', label: 'Compute mid' },
            { from: '2', to: '3', label: 'Branch left/right' }
          ]
        }
      }
    ]
  },
  {
    id: 'dsa-7',
    title: 'Climbing Stairs',
    difficulty: 'easy',
    topics: ['Dynamic Programming', 'Math'],
    storyIntro: 'Calculating token generation paths in a step-by-step decoding beam tree.',
    problemStatement: 'You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
    constraints: [
      '1 <= n <= 45'
    ],
    approaches: [
      {
        name: 'Fibonacci DP State',
        intuition: 'ways(n) = ways(n-1) + ways(n-2). We only need two variables to keep track of previous two steps.',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(1)',
        diagramSpec: {
          nodes: [
            { id: '1', label: 'prev2 = 1, prev1 = 2' },
            { id: '2', label: 'curr = prev1 + prev2' },
            { id: '3', label: 'Shift variables forward' }
          ],
          edges: [
            { from: '1', to: '2', label: 'Loop step i' },
            { from: '2', to: '3', label: 'Next iteration' }
          ]
        }
      }
    ]
  }
];

export const ML_CONCEPTS: MlConceptQuestion[] = [
  {
    id: 'mlc-1',
    title: 'Gradient Descent',
    intuitionSummary: 'Iteratively stepping down a foggy hill by feeling the steepest downward slope under your feet.',
    analogy: 'Imagine standing on a misty mountain with zero visibility. To reach the valley floor (minimum loss), you take small steps in whichever direction feels steepest downhill.',
    deepDive: 'Gradient Descent updates model weights w by subtracting learning rate η times the gradient of the loss function L: w_new = w_old - η * ∇L(w). In Stochastic Gradient Descent (SGD), gradients are computed per mini-batch to improve convergence speed and escape local minima.',
    commonMisconceptions: [
      'Gradient Descent always guarantees finding the global minimum (False: non-convex loss surfaces can trap it in local minima or saddle points).',
      'Larger learning rates always mean faster convergence (False: too large can cause exploding weights or oscillation).'
    ]
  },
  {
    id: 'mlc-2',
    title: 'Overfitting vs Underfitting',
    intuitionSummary: 'Memorizing exam answers verbatim vs failing to learn basic textbook concepts.',
    analogy: 'Underfitting is like a student who skims the chapter and fails basic questions. Overfitting is like a student who memorizes exact practice test questions and fails when worded slightly differently.',
    deepDive: 'Underfitting occurs when high bias prevents the model from capturing training data patterns. Overfitting happens when high variance causes the model to fit random noise. Solutions include regularization (L1/L2), dropout, early stopping, and data augmentation.',
    commonMisconceptions: [
      'A 100% training accuracy means your model is perfect (False: it usually signifies severe overfitting).',
      'Adding more parameters always improves test performance (False: increased capacity without regularization leads to overfitting).'
    ]
  },
  {
    id: 'mlc-3',
    title: 'Attention Mechanism (Self-Attention)',
    intuitionSummary: 'Focusing your eyes on key relevant words in a sentence while skimming the rest.',
    analogy: 'When reading "The animal didn\'t cross the street because it was too tired", your mind dynamically links "it" back to "animal" rather than "street". Self-attention calculates this word-to-word affinity.',
    deepDive: 'Attention converts input representations into Queries (Q), Keys (K), and Values (V). Attention weights are calculated via Softmax(Q Kᵀ / √d_k) * V. Scaling by √d_k prevents vanishing gradients during softmax at high dimensions.',
    commonMisconceptions: [
      'Self-attention processes tokens sequentially like an RNN (False: all tokens are processed in parallel, which is why positional embeddings are required).',
      'Attention requires recurrence to function (False: Transformers discard recurrence entirely).'
    ]
  },
  {
    id: 'mlc-4',
    title: 'Batch Normalization',
    intuitionSummary: 'Standardizing test scores across different classrooms so grades can be directly compared.',
    analogy: 'If teachers grade at wildly different harshness levels, comparing raw scores is misleading. Batch Normalization standardizes intermediate neural network activations across each mini-batch.',
    deepDive: 'Batch Norm calculates batch mean μ and variance σ², normalizes x̂ = (x - μ) / √(σ² + ε), then applies trainable scale γ and shift β: y = γx̂ + β. This reduces internal covariate shift and allows higher learning rates.',
    commonMisconceptions: [
      'Batch Normalization behaves identically during training and inference (False: during inference, running population statistics are used instead of mini-batch statistics).',
      'Batch Norm works well with mini-batch size 1 (False: small batch sizes lead to noisy mean/variance estimations).'
    ]
  },
  {
    id: 'mlc-5',
    title: 'Dropout Regularization',
    intuitionSummary: 'Randomly benching star players during team practice so every player learns to take responsibility.',
    analogy: 'If a soccer team relies exclusively on one star player, they crumble if that player is absent. By randomly sitting out players during training, every player builds independent skills.',
    deepDive: 'Dropout randomly zeroes out a fraction p of neuron activations during each forward pass. At test time, dropout is disabled and activations are scaled by (1 - p) to preserve expected output magnitude.',
    commonMisconceptions: [
      'Dropout is active during inference/test time (False: all neurons are active during inference).',
      'Dropout increases training speed (False: it slows training convergence slightly but dramatically improves test generalization).'
    ]
  },
  {
    id: 'mlc-6',
    title: 'Word & Token Embeddings',
    intuitionSummary: 'Mapping words onto a high-dimensional concept map where similar meanings cluster together.',
    analogy: 'In a 3D space of [Royal, Gender, Age], "King" and "Queen" sit close together on Royal and Age, but opposite on Gender. King - Man + Woman ≈ Queen.',
    deepDive: 'Embeddings convert discrete categorical tokens into continuous dense vectors Rᵈ. Learned lookup matrices map vocabulary indices to vectors optimized via objective functions like Word2Vec (Skip-Gram/CBOW) or transformer pretraining.',
    commonMisconceptions: [
      'Cosine similarity is the only valid metric for embeddings (False: Euclidean distance and dot products are also widely used depending on normalization).',
      'Embeddings store factual knowledge directly in string form (False: knowledge is encoded in distributed vector directions).'
    ]
  },
  {
    id: 'mlc-7',
    title: 'Cross-Entropy Loss',
    intuitionSummary: 'Penalizing a weather forecaster severely for being confidently wrong.',
    analogy: 'If a forecaster says 99% chance of sunshine and it snows, they get penalized far worse than if they said 51% chance.',
    deepDive: 'Cross-entropy measures dissimilarity between target distribution p and predicted probability distribution q: L = - Σ p(x) log q(x). For classification with Softmax, it produces steep gradients when predictions diverge from targets.',
    commonMisconceptions: [
      'Cross-Entropy Loss can be negative (False: probabilities are between 0 and 1, so -log(q) is strictly non-negative).',
      'MSE works just as well as Cross-Entropy for multi-class classification (False: MSE suffers from vanishing gradients when paired with Sigmoid/Softmax).'
    ]
  }
];

export const ML_INTERVIEW_QUESTIONS: MlInterviewQaQuestion[] = [
  {
    id: 'mlqa-1',
    question: 'Why do deep neural networks suffer from the vanishing gradient problem, and how do modern architectures mitigate it?',
    difficulty: 'mid',
    shortAnswer: 'Vanishing gradients happen when backpropagating gradients through many layers using saturating activations (like Sigmoid or Tanh) multiplies small decimal derivatives, causing early layers to update at near-zero rates.',
    fullExplanation: 'In deep feedforward networks, backpropagation applies the chain rule. Derivatives of activation functions like Sigmoid max out at 0.25. Multiplying many factors < 1 across 50+ layers leads to exponential decay (0.25^50 ≈ 0). Solutions include ReLU/LeakyReLU (derivative = 1 for positive inputs), Residual Connections (ResNet skip connections providing uninterrupted gradient highways ∇(x + f(x)) = 1 + ∇f(x)), Batch Normalization, and Xavier/He parameter initialization.',
    whyItMattersInInterviews: 'A foundational question assessing your understanding of deep learning optimization, backpropagation mechanics, and architectural breakthroughs like ResNets.',
    battleFormat: {
      prompt: 'Which technique directly provides a gradient highway ∇(x + f(x)) = 1 + ∇f(x) to prevent vanishing gradients?',
      options: [
        'Residual / Skip Connections',
        'L1 Lasso Regularization',
        'Increasing Dropout Rate to 0.9',
        'Gradient Clipping'
      ],
      correctOptionIndex: 0
    }
  },
  {
    id: 'mlqa-2',
    question: 'What is the key difference between L1 (Lasso) and L2 (Ridge) regularization regarding feature selection?',
    difficulty: 'junior',
    shortAnswer: 'L1 regularization adds absolute weight magnitudes |w| to the loss, driving non-essential feature weights strictly to zero (sparse solutions), while L2 adds squared weights w² which shrinks weights toward zero without setting them exactly to zero.',
    fullExplanation: 'L1 loss penalty is proportional to |w|, having a constant derivative (±λ). In parameter space, L1 contours are diamond-shaped with sharp corners along feature axes, making optimal loss intersections hit exact zeroes. L2 loss penalty is proportional to w², producing smooth circular contours where weights shrink continuously. Thus L1 serves as built-in feature selection.',
    whyItMattersInInterviews: 'Tests math intuition regarding loss function geometry and model compression / feature selection strategies.',
    battleFormat: {
      prompt: 'Why does L1 regularization create sparse weight matrices (setting unused feature weights to exact zero)?',
      options: [
        'L1 contours have sharp corners along coordinate axes where loss minimums intersect',
        'L1 multiplies weights by random zero matrices',
        'L2 regularization is mathematically impossible to compute',
        'L1 uses logarithmic gradient decay'
      ],
      correctOptionIndex: 0
    }
  },
  {
    id: 'mlqa-3',
    question: 'Explain the Bias-Variance Tradeoff and how ensemble methods address both sides.',
    difficulty: 'mid',
    shortAnswer: 'Bias is error from overly simplistic assumptions (underfitting); Variance is error from sensitivity to small training fluctuations (overfitting). Bagging (e.g. Random Forests) reduces Variance; Boosting (e.g. XGBoost) primarily reduces Bias.',
    fullExplanation: 'Total Expected Error = Bias² + Variance + Irreducible Noise. High bias models (e.g. linear regression) underfit. High variance models (e.g. deep unpruned decision trees) overfit. Bagging trains multiple high-variance trees independently on bootstrap samples and averages predictions to reduce variance. Boosting sequentially trains weak high-bias learners on residual errors to reduce bias.',
    whyItMattersInInterviews: 'Evaluates your ability to diagnose model errors and choose appropriate ensemble architectures in production.',
    battleFormat: {
      prompt: 'Which ensemble technique primarily aims to reduce VARIANCE by averaging independent bootstrap-trained models?',
      options: [
        'Bagging (Bootstrap Aggregating)',
        'Gradient Boosting',
        'AdaBoost',
        'Stochastic Gradient Descent'
      ],
      correctOptionIndex: 0
    }
  },
  {
    id: 'mlqa-4',
    question: 'How does the Softmax function convert arbitrary model logits into a probability distribution?',
    difficulty: 'junior',
    shortAnswer: 'Softmax exponentiates each raw output logit e^(z_i) and divides by the sum of exponentiated logits Σ e^(z_j), ensuring outputs are positive and sum to 1.0.',
    fullExplanation: 'Softmax(z)_i = exp(z_i) / Σ_j exp(z_j). Exponentiation ensures strictly positive values while turning linear difference in logits into multiplicative probability ratios. To prevent numerical overflow when computing exp(z_i) with large logits, practical implementations subtract max(z) from all logits: Softmax(z - max(z)).',
    whyItMattersInInterviews: 'Probes fundamental mathematical concepts used in multi-class classification, LLM decoding, and attention weights.',
    battleFormat: {
      prompt: 'What numerical stability trick is universally applied when computing Softmax in deep learning frameworks?',
      options: [
        'Subtracting max(z) from logits before exponentiating',
        'Dividing logits by 1,000,000',
        'Replacing negative logits with 0',
        'Converting logits into 8-bit integers'
      ],
      correctOptionIndex: 0
    }
  },
  {
    id: 'mlqa-5',
    question: 'When should you choose Precision over Recall as your primary evaluation metric?',
    difficulty: 'junior',
    shortAnswer: 'Optimize for Precision when False Positives are extremely costly (e.g., spam filtering, content moderation). Optimize for Recall when False Negatives are dangerous (e.g., medical diagnosis, fraud detection).',
    fullExplanation: 'Precision = TP / (TP + FP) measures how many predicted positives were actually positive. Recall = TP / (TP + FN) measures how many actual positives were caught. In spam filtering, marking a critical email as spam (False Positive) is unacceptable, so Precision is prioritized. In cancer detection, missing a sick patient (False Negative) is fatal, so Recall is prioritized.',
    whyItMattersInInterviews: 'Key product ML skill: aligning business objectives and cost matrix with statistical metrics.',
    battleFormat: {
      prompt: 'In an automated spam filter, why is HIGH PRECISION prioritized over high recall?',
      options: [
        'False Positives (important emails sent to spam) are very harmful to users',
        'False Negatives are impossible to compute',
        'Spam detection does not support recall metrics',
        'Precision requires less computational power'
      ],
      correctOptionIndex: 0
    }
  },
  {
    id: 'mlqa-6',
    question: 'What is Retrieval-Augmented Generation (RAG) and why is it preferred over fine-tuning for dynamic knowledge?',
    difficulty: 'senior',
    shortAnswer: 'RAG retrieves relevant domain document chunks from an external vector index based on user queries and injects them into the LLM prompt context, eliminating hallucinations and enabling real-time knowledge updates without costly model retraining.',
    fullExplanation: 'RAG decouples parametric knowledge (weights) from non-parametric knowledge (vector database). 1) Query embedding is matched via vector search (e.g., Cosine similarity). 2) Top-k relevant text chunks are formatted as context. 3) LLM generates a grounded answer with citations. Fine-tuning is better for style/format adaptation, while RAG is far superior for factual accuracy, access control, and rapidly changing enterprise data.',
    whyItMattersInInterviews: 'High-frequency GenAI interview topic covering modern LLM system design, vector search, and context management.',
    battleFormat: {
      prompt: 'What is the primary advantage of RAG over model fine-tuning for updating enterprise knowledge bases?',
      options: [
        'Real-time information updates without expensive GPU retraining',
        'RAG completely replaces the need for an LLM model',
        'Fine-tuning requires 100x more disk space',
        'RAG operates with 0ms latency'
      ],
      correctOptionIndex: 0
    }
  },
  {
    id: 'mlqa-7',
    question: 'What is the distinction between Generative vs Discriminative ML models?',
    difficulty: 'mid',
    shortAnswer: 'Discriminative models learn the conditional boundary P(Y|X) to predict labels given features. Generative models learn the joint probability distribution P(X,Y) or P(X) to model how data is generated and can sample new data points.',
    fullExplanation: 'Discriminative models (e.g. Logistic Regression, SVM, ResNet) draw decision boundaries separating classes. Generative models (e.g. Naive Bayes, GANs, Diffusion models, VAEs, Autoregressive Transformers) learn the underlying distribution of the input features. Generative models can synthesize realistic samples (images, text, audio) by sampling from P(X).',
    whyItMattersInInterviews: 'Core probability modeling question testing foundational machine learning classification vs generation theory.',
    battleFormat: {
      prompt: 'Which probability distribution do DISCRIMINATIVE models directly estimate?',
      options: [
        'P(Y | X) — Conditional probability of label given features',
        'P(X) — Marginal probability of input features',
        'P(X, Y) — Joint probability of features and labels',
        'P(X | Y) — Likelihood of features given class'
      ],
      correctOptionIndex: 0
    }
  },
  {
    id: 'mlqa-8',
    question: 'How does Reinforcement Learning from Human Feedback (RLHF) align Large Language Models?',
    difficulty: 'senior',
    shortAnswer: 'RLHF uses human preference comparisons to train a Reward Model, then optimizes the policy (LLM) via PPO (Proximal Policy Optimization) with a KL-divergence penalty to ensure helpful, honest, and harmless responses.',
    fullExplanation: 'Steps: 1) Supervised Fine-Tuning (SFT) on instruction datasets. 2) Collect human rankings on candidate model outputs to train a Reward Model r(x,y). 3) Optimize LLM weights using PPO to maximize reward. A KL penalty term D_KL(π_RL || π_SFT) is added to the objective to prevent "reward hacking" (the model finding degenerate outputs that score high rewards but produce gibberish).',
    whyItMattersInInterviews: 'Demonstrates cutting-edge understanding of LLM alignment pipelines used in ChatGPT and Gemini.',
    battleFormat: {
      prompt: 'In RLHF, what purpose does the KL-divergence penalty term serve during PPO training?',
      options: [
        'Prevents policy collapse and reward hacking by keeping the model near its SFT baseline',
        'Speeds up GPU training matrix multiplication by 10x',
        'Translates English prompts into Spanish automatically',
        'Eliminates the need for a Reward Model'
      ],
      correctOptionIndex: 0
    }
  },
  {
    id: 'mlqa-9',
    question: 'Explain the F1 Score and why simple Accuracy is misleading for imbalanced datasets.',
    difficulty: 'junior',
    shortAnswer: 'Accuracy measures total correct predictions (TP+TN)/Total. On a dataset with 99% negative cases, a model that predicts 100% negative gets 99% accuracy while detecting 0 positive cases. F1 score is the harmonic mean of Precision and Recall.',
    fullExplanation: 'F1 = 2 * (Precision * Recall) / (Precision + Recall). Harmonic mean punishes extreme imbalances between Precision and Recall. If either Precision or Recall is zero, F1 drops to zero. For highly imbalanced data (e.g. 1 in 10,000 credit card fraud), F1 score or PR-AUC provides a truthful representation of true model utility.',
    whyItMattersInInterviews: 'Standard sanity check for candidate understanding of performance evaluation in real-world messy datasets.',
    battleFormat: {
      prompt: 'Why is the HARMONIC mean used for F1 Score instead of simple arithmetic average?',
      options: [
        'Harmonic mean severely penalizes extreme imbalance when either Precision or Recall is low',
        'Arithmetic mean cannot be calculated for fractions',
        'Harmonic mean guarantees a score above 90%',
        'It converts negative numbers to positive'
      ],
      correctOptionIndex: 0
    }
  },
  {
    id: 'mlqa-10',
    question: 'What is Transfer Learning and why is fine-tuning lower layers often skipped or frozen?',
    difficulty: 'mid',
    shortAnswer: 'Transfer learning reuses pretrained model weights on a target task. Early layers capture low-level, domain-agnostic features (edges, textures, grammar tokens) so they are kept frozen, while later layers are fine-tuned for task-specific representations.',
    fullExplanation: 'In Vision (CNNs/ViTs), early layers act as Gabor filters detecting edges/curves regardless of whether the domain is medical x-rays or dogs. In NLP, early layers learn syntax and morphology. Freezing lower layers reduces trainable parameters, speeds up training, and prevents catastrophic forgetting when adapting to smaller target datasets.',
    whyItMattersInInterviews: 'Crucial practical engineering knowledge for efficiently fine-tuning vision models and LLMs with limited compute.',
    battleFormat: {
      prompt: 'Why do developers typically FREEZE lower/earlier layers when fine-tuning pretrained neural networks?',
      options: [
        'Lower layers capture universal, domain-agnostic features like edges or basic syntax',
        'Lower layers do not contain any weights',
        'Freezing prevents the GPU from overheating',
        'Lower layers are written in C++ and cannot be edited'
      ],
      correctOptionIndex: 0
    }
  }
];

export function getDailyQuestionsForDate(dateStr: string) {
  // Generate consistent deterministic integer from date string (YYYY-MM-DD)
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);

  const dsaIndex = positiveHash % DSA_QUESTIONS.length;
  const mlConceptIndex = (positiveHash + 1) % ML_CONCEPTS.length;
  const mlQaIndex = (positiveHash + 2) % ML_INTERVIEW_QUESTIONS.length;

  return {
    dsa: DSA_QUESTIONS[dsaIndex],
    mlConcept: ML_CONCEPTS[mlConceptIndex],
    mlQa: ML_INTERVIEW_QUESTIONS[mlQaIndex]
  };
}

export function getRandomBattleQuestion(): MlInterviewQaQuestion {
  const index = Math.floor(Math.random() * ML_INTERVIEW_QUESTIONS.length);
  return ML_INTERVIEW_QUESTIONS[index];
}

export function getBattleQuestionById(id: string): MlInterviewQaQuestion | undefined {
  return ML_INTERVIEW_QUESTIONS.find((q) => q.id === id);
}
