'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

const CodeBlock = ({ inline, className, children, ...props }: any) => {
  const [copied, setCopied] = useState(false)
  const match = /language-(\w+)/.exec(className || '')
  const language = match ? match[1] : 'text'
  const codeString = String(children).replace(/\n$/, '')

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (inline) {
    return (
      <code className="bg-white/10 text-pink-300 px-1.5 py-0.5 rounded text-[13px] font-mono" {...props}>
        {children}
      </code>
    )
  }

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-white/10 bg-[#0a0a0a]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#121212] border-b border-white/10">
        <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[10px] font-bold text-white/50 hover:text-white transition-colors"
        >
          {copied ? <><Check size={12} className="text-green-400" /> Tersalin</> : <><Copy size={12} /> Copy</>}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed font-mono text-green-300">
        <code {...props}>{children}</code>
      </pre>
    </div>
  )
}

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose-custom">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: CodeBlock,
          
          h1: ({ children }) => <h1 className="text-xl font-black text-white mt-6 mb-3 pb-2 border-b border-white/10">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold text-white mt-5 mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-bold text-white/90 mt-4 mb-2">{children}</h3>,
          
          p: ({ children }) => <p className="text-[14px] leading-relaxed text-white/85 mb-3">{children}</p>,
          
          strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
          em: ({ children }) => <em className="italic text-white/90">{children}</em>,
          
          ul: ({ children }) => <ul className="list-disc list-outside pl-5 my-3 space-y-1.5 text-white/85 text-[14px]">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-outside pl-5 my-3 space-y-1.5 text-white/85 text-[14px]">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-white/30 pl-4 my-4 italic text-white/60 text-sm">
              {children}
            </blockquote>
          ),
          
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline underline-offset-2 font-semibold">
              {children}
            </a>
          ),
          
          hr: () => <hr className="my-6 border-white/10" />,
          
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-lg border border-white/10">
              <table className="w-full text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-white/5 border-b border-white/10">{children}</thead>,
          th: ({ children }) => <th className="px-4 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">{children}</th>,
          td: ({ children }) => <td className="px-4 py-2 text-white/80 border-b border-white/5">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
