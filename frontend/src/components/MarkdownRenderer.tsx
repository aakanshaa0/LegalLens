import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content || content.trim().length === 0) {
    return <div className={className}>No content available</div>;
  }

  // Simple markdown parser for basic formatting
  const parseMarkdown = (text: string): JSX.Element[] => {
    try {
      const lines = text.split('\n');
      const elements: JSX.Element[] = [];
      let currentList: string[] = [];
      let listKey = 0;

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${listKey++}`} className="list-disc pl-5 space-y-1 mb-3 text-card-foreground/90">
            {currentList.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {parseInlineMarkdown(item)}
              </li>
            ))}
          </ul>
        );
        currentList = [];
      }
    };

    const parseInlineMarkdown = (text: string): React.ReactNode => {
      if (!text) return '';
      
      // Handle bold text **text** and quotes
      const parts = text.split(/(\*\*[^*]+\*\*|"[^"]*")/);
      
      return parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={idx} className="font-semibold text-card-foreground">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('"') && part.endsWith('"')) {
          return <span key={idx} className="italic text-card-foreground/80 bg-muted/50 px-1 rounded">{part}</span>;
        }
        return part;
      });
    };

    lines.forEach((line, idx) => {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        flushList();
        return;
      }

      // Handle bullet points
      if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
        currentList.push(trimmedLine.substring(2));
        return;
      }

      // Handle numbered lists
      if (/^\d+\.\s/.test(trimmedLine)) {
        currentList.push(trimmedLine.replace(/^\d+\.\s/, ''));
        return;
      }

      // Flush any pending list before adding paragraph
      flushList();

      // Handle headers
      if (trimmedLine.startsWith('### ')) {
        elements.push(
          <h3 key={idx} className="text-lg font-semibold text-card-foreground mb-2 mt-4">
            {parseInlineMarkdown(trimmedLine.substring(4))}
          </h3>
        );
        return;
      }

      if (trimmedLine.startsWith('## ')) {
        elements.push(
          <h2 key={idx} className="text-xl font-semibold text-card-foreground mb-2 mt-4">
            {parseInlineMarkdown(trimmedLine.substring(3))}
          </h2>
        );
        return;
      }

      if (trimmedLine.startsWith('# ')) {
        elements.push(
          <h1 key={idx} className="text-2xl font-bold text-card-foreground mb-3 mt-4">
            {parseInlineMarkdown(trimmedLine.substring(2))}
          </h1>
        );
        return;
      }

      // Regular paragraph
      elements.push(
        <p key={idx} className="text-card-foreground leading-relaxed mb-3">
          {parseInlineMarkdown(trimmedLine)}
        </p>
      );
    });

      // Flush any remaining list
      flushList();

      return elements;
    } catch (error) {
      console.error('Error parsing markdown:', error);
      // Fallback to simple text rendering
      return [
        <div key="fallback" className="text-card-foreground leading-relaxed whitespace-pre-wrap">
          {text}
        </div>
      ];
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {parseMarkdown(content)}
    </div>
  );
};