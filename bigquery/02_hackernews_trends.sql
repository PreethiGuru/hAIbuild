-- Ranks AI/ML topics by recent Hacker News story volume and score,
-- relative to the dataset's own latest record.

DECLARE latest_ts TIMESTAMP DEFAULT (
  SELECT MAX(timestamp) FROM `bigquery-public-data.hacker_news.full`
);

WITH matched AS (
  SELECT
    timestamp,
    score,
    -- Extraction alone isn't enough: "agent"/"agents"/"agentic" and
    -- "gpt"/"gpt-5"/"gpt-" (a bare trailing hyphen from titles like
    -- "GPT-OSS", where \d* matches zero digits) are the same underlying
    -- topic but distinct literal substrings, which fragments the ranking
    -- and produces junk rows. Canonicalize before grouping.
    CASE
      WHEN REGEXP_CONTAINS(LOWER(title), r'agent\w*') THEN 'agents'
      WHEN REGEXP_CONTAINS(LOWER(title), r'gpt-?\w*') THEN 'gpt'
      WHEN REGEXP_CONTAINS(LOWER(title), r'vector database') THEN 'vector-database'
      WHEN REGEXP_CONTAINS(LOWER(title), r'fine-?tun\w*') THEN 'fine-tuning'
      WHEN REGEXP_CONTAINS(LOWER(title), r'prompt engineering') THEN 'prompt-engineering'
      WHEN REGEXP_CONTAINS(LOWER(title), r'machine learning') THEN 'machine-learning'
      WHEN REGEXP_CONTAINS(LOWER(title), r'artificial intelligence') THEN 'artificial-intelligence'
      WHEN REGEXP_CONTAINS(LOWER(title), r'deep learning') THEN 'deep-learning'
      WHEN REGEXP_CONTAINS(LOWER(title), r'neural network') THEN 'neural-network'
      ELSE REGEXP_EXTRACT(
        LOWER(title),
        r'(rag|llm|langchain|llama|transformer|embedding|diffusion|openai|huggingface)'
      )
    END AS topic
  FROM `bigquery-public-data.hacker_news.full`
  WHERE type = 'story'
    AND title IS NOT NULL
    AND timestamp >= TIMESTAMP_SUB(latest_ts, INTERVAL 360 DAY)
    AND REGEXP_CONTAINS(
      LOWER(title),
      r'(rag|llm|langchain|llama|transformer|embedding|vector database|fine-?tun\w*|prompt engineering|diffusion|gpt-?\w*|openai|huggingface|agent\w*|machine learning|artificial intelligence|deep learning|neural network)'
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
