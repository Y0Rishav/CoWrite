import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'

export default function MarkdownPreview({ content }) {
  return (
    <div className="prose prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-white mb-4" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-xl font-bold text-white mb-3 mt-4" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-lg font-bold text-white mb-2 mt-3" {...props} />,
          p: ({ node, ...props }) => <p className="text-gray-300 mb-3 leading-relaxed" {...props} />,
          a: ({ node, ...props }) => <a className="text-blue-400 hover:text-blue-300 underline" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc list-inside text-gray-300 mb-3 ml-4" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal list-inside text-gray-300 mb-3 ml-4" {...props} />,
          li: ({ node, ...props }) => <li className="mb-2" {...props} />,
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-3 text-gray-400 italic bg-dark-700 rounded-r" {...props} />
          ),
          code: ({ node, inline, ...props }) =>
            inline ? (
              <code className="bg-dark-700 px-2 py-1 rounded text-sm font-mono text-red-300" {...props} />
            ) : (
              <code className="block bg-dark-700 p-4 rounded-lg my-3 text-gray-300 font-mono text-sm overflow-x-auto" {...props} />
            ),
          pre: ({ node, ...props }) => <pre className="overflow-x-auto" {...props} />,
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-3">
              <table className="border-collapse border border-dark-600 text-gray-300" {...props} />
            </div>
          ),
          th: ({ node, ...props }) => <th className="border border-dark-600 px-4 py-2 bg-dark-700" {...props} />,
          td: ({ node, ...props }) => <td className="border border-dark-600 px-4 py-2" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-bold text-white" {...props} />,
          em: ({ node, ...props }) => <em className="italic text-gray-300" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
