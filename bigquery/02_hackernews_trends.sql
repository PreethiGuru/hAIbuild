-- Ranks AI/ML topics by recent Hacker News story volume and score,
-- relative to the dataset's own latest record.

DECLARE latest_ts TIMESTAMP DEFAULT (
  SELECT MAX(timestamp) FROM `bigquery-public-data.hacker_news.full`
);

WITH matched AS (
  SELECT
    timestamp,
    score,
    REGEXP_EXTRACT(
      LOWER(title),
      r'(rag|llm|langchain|llama|transformer|embedding|vector database|fine-?tun\w*|prompt engineering|diffusion|gpt-?\d*|openai|huggingface|agent\w*|machine learning|artificial intelligence|deep learning|neural network)'
    ) AS topic
  FROM `bigquery-public-data.hacker_news.full`
  WHERE type = 'story'
    AND title IS NOT NULL
    AND timestamp >= TIMESTAMP_SUB(latest_ts, INTERVAL 360 DAY)
    AND REGEXP_CONTAINS(
      LOWER(title),
      r'(rag|llm|langchain|llama|transformer|embedding|vector database|fine-?tun\w*|prompt engineering|diffusion|gpt-?\d*|openai|huggingface|agent\w*|machine learning|artificial intelligence|deep learning|neural network)'
    )
),
recent AS (
  SELECT topic, COUNT(*) AS recent_mentions, SUM(score) AS recent_score
  FROM matched
  WHERE timestamp >= TIMESTAMP_SUB(latest_ts, INTERVAL 180 DAY)
  GROUP BY topic
),
baseline AS (
  SELECT topic, COUNT(*) AS baseline_mentions
  FROM matched
  WHERE timestamp < TIMESTAMP_SUB(latest_ts, INTERVAL 180 DAY)
  GROUP BY topic
)
SELECT
  r.topic,
  r.recent_mentions,
  r.recent_score,
  COALESCE(b.baseline_mentions, 0) AS baseline_mentions,
  ROUND(SAFE_DIVIDE(r.recent_mentions, NULLIF(b.baseline_mentions, 0)), 2) AS growth_ratio
FROM recent r
LEFT JOIN baseline b USING (topic)
ORDER BY r.recent_mentions DESC
LIMIT 20;
