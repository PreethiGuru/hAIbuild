-- Run this first. Public BigQuery dataset snapshots aren't always continuously
-- updated, so before trusting "recent" trend numbers, check how recent
-- "recent" actually is for each source.
SELECT
  'stackoverflow.posts_questions' AS dataset,
  MAX(creation_date) AS latest_record
FROM `bigquery-public-data.stackoverflow.posts_questions`

UNION ALL

SELECT
  'hacker_news.full' AS dataset,
  MAX(timestamp) AS latest_record
FROM `bigquery-public-data.hacker_news.full`;
