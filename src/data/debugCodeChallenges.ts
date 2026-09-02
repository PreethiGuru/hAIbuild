export interface DebugCodeChallenge {
  id: string;
  title: string;
  lines: string[];
  buggyLineIndex: number; // 0-based
  explanation: string;
  fix: string;
}

export const DEBUG_CODE_CHALLENGES: DebugCodeChallenge[] = [
  {
    id: 'dbg-1',
    title: 'Retrieval Top-K',
    lines: [
      'def retrieve_context(query, index, top_k=5):',
      '    query_embedding = embed(query)',
      '    results = index.search(query_embedding, top_k=top_k)',
      '    return results[1:]',
    ],
    buggyLineIndex: 3,
    explanation:
      'Slicing with [1:] drops the single most relevant match -- the one the index ranked first -- instead of returning all top_k results.',
    fix: '    return results',
  },
  {
    id: 'dbg-2',
    title: 'Agent Step Loop',
    lines: [
      'def run_agent(query, max_steps=5):',
      '    step = 0',
      '    while step < max_steps:',
      '        response = llm.generate(query)',
      '        if response.tool_call:',
      '            query = call_tool(response.tool_call)',
      '        step -= 1',
      '    return query',
    ],
    buggyLineIndex: 6,
    explanation:
      'Decrementing step means it never reaches max_steps -- the loop runs forever (or until step underflows) instead of terminating after max_steps iterations.',
    fix: '        step += 1',
  },
  {
    id: 'dbg-3',
    title: 'Embedding Cache',
    lines: [
      'cache = {}',
      'def get_embedding(text):',
      '    if text in cache:',
      '        return cache[text]',
      '    embedding = model.encode(text)',
      '    return embedding',
    ],
    buggyLineIndex: 5,
    explanation:
      "The computed embedding is returned but never stored in cache, so the cache stays empty forever and every call re-runs the model.",
    fix: '    cache[text] = embedding\n    return embedding',
  },
  {
    id: 'dbg-4',
    title: 'Document Chunking',
    lines: [
      'def chunk_document(text, chunk_size=500, overlap=50):',
      '    chunks = []',
      '    start = 0',
      '    while start < len(text):',
      '        chunks.append(text[start:start + chunk_size])',
      '        start += chunk_size + overlap',
      '    return chunks',
    ],
    buggyLineIndex: 5,
    explanation:
      'Adding the overlap advances start past the end of the previous chunk, so text between chunks gets skipped entirely -- overlap should pull start back, not push it further forward.',
    fix: '        start += chunk_size - overlap',
  },
  {
    id: 'dbg-5',
    title: 'Prompt Template',
    lines: [
      'def build_prompt(context, question):',
      '    template = "Context: {context}\\n\\nQuestion: {question}\\nAnswer:"',
      '    return template.format(context=question, question=context)',
    ],
    buggyLineIndex: 2,
    explanation:
      'The context and question arguments are swapped in the format() call -- the model would see the question labeled as "Context" and the retrieved context labeled as "Question".',
    fix: '    return template.format(context=context, question=question)',
  },
  {
    id: 'dbg-6',
    title: 'Similarity Filter',
    lines: [
      'def filter_relevant(results, threshold=0.7):',
      '    return [r for r in results if r.score < threshold]',
    ],
    buggyLineIndex: 1,
    explanation:
      'For cosine similarity, a higher score means more relevant. Filtering for score < threshold keeps the least relevant results and throws away the good matches.',
    fix: '    return [r for r in results if r.score > threshold]',
  },
  {
    id: 'dbg-7',
    title: 'LLM Retry Logic',
    lines: [
      'def call_llm_with_retry(prompt, max_retries=3):',
      '    for attempt in range(max_retries):',
      '        try:',
      '            return llm.generate(prompt)',
      '        except RateLimitError:',
      '            continue',
      '    raise Exception("Failed after retries")',
    ],
    buggyLineIndex: 5,
    explanation:
      "Retrying immediately with no delay just hits the same rate limit again. This needs a backoff (e.g. time.sleep with exponential growth) before the next attempt.",
    fix: '            time.sleep(2 ** attempt)',
  },
  {
    id: 'dbg-8',
    title: 'Stream Accumulation',
    lines: [
      'def stream_response(chunks):',
      '    full_text = ""',
      '    for chunk in chunks:',
      '        full_text = chunk',
      '    return full_text',
    ],
    buggyLineIndex: 3,
    explanation:
      'Assigning instead of appending means every chunk overwrites the last -- the function ends up returning only the final chunk, not the full streamed response.',
    fix: '        full_text += chunk',
  },
];
