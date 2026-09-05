import React from 'react';

/**
 * Renders the light Markdown that Gemini returns in prose answers -- bold,
 * inline code, bullet and numbered lists -- plus the `$O(1)$` LaTeX it reaches
 * for when asked about complexity. Left as plain text these render literally,
 * so a hint arrives reading "**hash map**" and "$O(1)$".
 *
 * Deliberately hand-rolled rather than react-markdown + KaTeX: the model
 * produces a handful of inline constructs in short paragraphs, and the client
 * bundle is already near a megabyte. This is not a general Markdown parser and
 * does not try to be -- anything it does not recognise falls through as text,
 * which is the right failure for model output.
 */

// Alternation order matters: ** must be tried before * so bold is not read as
// two italics. Underscore italics are omitted on purpose -- they collide with
// snake_case identifiers, which appear constantly in these answers.
//
// The single-asterisk italic is fenced by lookarounds so it cannot span a
// multiplication: in "a 2*3 grid and a lone * star" the first asterisk is
// preceded by a word character and the second is followed by a space, so
// neither opens a span. Missing an occasional italic is far cheaper than
// swallowing a whole sentence into one.
const INLINE_PATTERN =
  /`([^`]+)`|\*\*(.+?)\*\*|\$\$?([^$\n]+?)\$\$?|(?<![\w*])\*(?!\s)([^*\n]+?)(?<!\s)\*(?![\w*])/g;

const MAX_INLINE_DEPTH = 3;

function renderInline(text: string, keyPrefix: string, depth = 0): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // A fresh regex per call: this function recurses into bold and italic spans,
  // and a shared lastIndex would be clobbered by the inner pass.
  const pattern = new RegExp(INLINE_PATTERN.source, 'g');
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const key = `${keyPrefix}-${match.index}`;
    const [, code, bold, math, italic] = match;

    if (code !== undefined || math !== undefined) {
      // Math is shown as code: "O(1)" reads correctly in a monospace span, and
      // typesetting it properly would mean shipping a whole formula renderer.
      nodes.push(
        <code
          key={key}
          className="px-1 py-0.5 rounded bg-surfaceHigh border border-borderFaint text-textPrimary font-mono text-[0.92em]"
        >
          {code ?? math}
        </code>
      );
    } else if (bold !== undefined) {
      // Recurse: "**`Node`**" is common, and without this the backticks show.
      nodes.push(
        <strong key={key} className="font-semibold text-textPrimary">
          {depth < MAX_INLINE_DEPTH ? renderInline(bold, key, depth + 1) : bold}
        </strong>
      );
    } else if (italic !== undefined) {
      nodes.push(
        <em key={key}>{depth < MAX_INLINE_DEPTH ? renderInline(italic, key, depth + 1) : italic}</em>
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

const BULLET = /^\s*[-*+]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;
const HEADING = /^\s*#{1,6}\s+(.*)$/;

interface Block {
  type: 'p' | 'ul' | 'ol' | 'h';
  lines: string[];
}

function toBlocks(raw: string): Block[] {
  const blocks: Block[] = [];

  for (const line of raw.replace(/\r\n/g, '\n').split('\n')) {
    if (!line.trim()) {
      // A blank line ends the current block rather than starting an empty one.
      if (blocks.length && blocks[blocks.length - 1].lines.length) {
        blocks.push({ type: 'p', lines: [] });
      }
      continue;
    }

    const heading = HEADING.exec(line);
    const bullet = BULLET.exec(line);
    const numbered = NUMBERED.exec(line);
    const type: Block['type'] = heading ? 'h' : bullet ? 'ul' : numbered ? 'ol' : 'p';
    const content = (heading?.[1] ?? bullet?.[1] ?? numbered?.[1] ?? line).trim();

    const current = blocks[blocks.length - 1];
    // Consecutive list items of the same kind join one list; wrapped prose
    // joins the paragraph above it.
    if (current && current.type === type && current.lines.length && type !== 'h') {
      current.lines.push(content);
    } else {
      blocks.push({ type, lines: [content] });
    }
  }

  return blocks.filter((b) => b.lines.length > 0);
}

interface FormattedTextProps {
  children: string;
  className?: string;
}

export const FormattedText: React.FC<FormattedTextProps> = ({ children, className = '' }) => {
  const blocks = toBlocks(children ?? '');

  return (
    <div className={`space-y-2 ${className}`}>
      {blocks.map((block, i) => {
        if (block.type === 'ul' || block.type === 'ol') {
          const List = block.type === 'ul' ? 'ul' : 'ol';
          return (
            <List
              key={i}
              className={`space-y-1 pl-4 ${
                block.type === 'ul' ? 'list-disc' : 'list-decimal'
              } marker:text-textMuted`}
            >
              {block.lines.map((line, j) => (
                <li key={j}>{renderInline(line, `${i}-${j}`)}</li>
              ))}
            </List>
          );
        }

        if (block.type === 'h') {
          return (
            <p key={i} className="font-bold text-textPrimary">
              {renderInline(block.lines[0], String(i))}
            </p>
          );
        }

        return <p key={i}>{renderInline(block.lines.join(' '), String(i))}</p>;
      })}
    </div>
  );
};
