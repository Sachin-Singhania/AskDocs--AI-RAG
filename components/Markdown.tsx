"use client"

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function MarkdownViewer({ content }: { content: string }) {
  return (
    <div className="prose prose-lg max-w-none dark:prose-invert prose-pre:my-2 prose-p:my-2 prose-code:my-0 ">
      <ReactMarkdown
        components={{
          code({inline, className, children, ...props}: {inline?: boolean, className?: string, children?: React.ReactNode, [key: string]: any}) {
            const match = /language-(\w+)/.exec(className || '')
            return !inline && match ? (
              <SyntaxHighlighter
                style={oneDark}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            )
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
