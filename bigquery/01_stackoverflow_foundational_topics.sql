-- The Stack Overflow public dataset stopped updating in Sept 2022 (see
-- 00_check_freshness.sql) -- before the RAG/agents/vector-database wave --
-- so it can't be used as a "what's trending now" signal.
--
-- Repurposed instead as a foundational-topic signal for the Concept
-- feature: total historical question volume is a reasonable proxy for
-- which core ML ideas people consistently get stuck on and ask about,
-- which doesn't need to be recent to be useful.

SELECT
  tag,
  COUNT(*) AS question_count,
  SUM(view_count) AS total_views
FROM `bigquery-public-data.stackoverflow.posts_questions`,
     UNNEST(SPLIT(tags, '|')) AS tag
WHERE tag IN (
  'machine-learning', 'deep-learning', 'neural-network', 'tensorflow',
  'keras', 'pytorch', 'scikit-learn', 'nlp', 'computer-vision',
  'reinforcement-learning', 'gradient-descent', 'overfitting',
  'convolutional-neural-network', 'recurrent-neural-network',
  'random-forest', 'svm', 'k-means', 'regularization'
)
GROUP BY tag
ORDER BY question_count DESC
LIMIT 20;
