import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'

export default function MarkdownPreview({ content }) {
  return (
    <div className="prose prose-sm max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          h1: ({ node, ...props }) => <h1 className="font-sketch text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600 mb-4" {...props} />,
          h2: ({ node, ...props }) => <h2 className="font-sketch text-2xl font-bold text-orange-600 mb-3 mt-4" {...props} />,
          h3: ({ node, ...props }) => <h3 className="font-sketch text-xl font-bold text-orange-600 mb-2 mt-3" {...props} />,
          p: ({ node, ...props }) => <p className="font-handlee text-gray-800 mb-3 leading-relaxed" {...props} />,
          a: ({ node, ...props }) => <a className="text-orange-600 hover:text-red-600 underline font-handlee" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc list-inside font-handlee text-gray-800 mb-3 ml-4" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal list-inside font-handlee text-gray-800 mb-3 ml-4" {...props} />,
          li: ({ node, ...props }) => <li className="mb-2 font-handlee" {...props} />,
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-dashed border-orange-400 pl-4 py-2 my-3 font-handlee text-gray-700 italic bg-gradient-to-r from-yellow-100 to-orange-100 rounded-r" {...props} />
          ),
          code: ({ node, inline, ...props }) =>
            inline ? (
              <code className="bg-yellow-100 px-2 py-1 rounded text-sm font-mono text-orange-700 border border-orange-300" {...props} />
            ) : (
              <code className="block bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-lg my-3 font-mono text-sm overflow-x-auto text-gray-800 border-2 border-dashed border-orange-300" {...props} />
            ),
          pre: ({ node, ...props }) => <pre className="overflow-x-auto" {...props} />,
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-3">
              <table className="border-collapse border-2 border-dashed border-orange-300 font-handlee text-gray-800" {...props} />
            </div>
          ),
          th: ({ node, ...props }) => <th className="border border-orange-300 px-4 py-2 bg-gradient-to-r from-amber-200 to-yellow-200 font-sketch font-bold" {...props} />,
          td: ({ node, ...props }) => <td className="border border-orange-300 px-4 py-2" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-bold text-orange-700" {...props} />,
          em: ({ node, ...props }) => <em className="italic text-gray-800" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
