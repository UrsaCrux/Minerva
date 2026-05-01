import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

const components = {
    a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
    table: ({ node, ...props }) => (
        <div className="md_table_wrap">
            <table {...props} />
        </div>
    ),
}

export default function Markdown({ children, className }) {
    return (
        <div className={`md_content${className ? ` ${className}` : ""}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                {children || ""}
            </ReactMarkdown>
        </div>
    )
}

export function stripMarkdown(text) {
    if (!text) return ""
    return text
        .replace(/```[\s\S]*?```/g, "")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
        .replace(/^\s{0,3}#{1,6}\s+/gm, "")
        .replace(/^\s{0,3}>\s?/gm, "")
        .replace(/^\s*[-*+]\s+\[[ xX]\]\s+/gm, "")
        .replace(/^\s*[-*+]\s+/gm, "")
        .replace(/^\s*\d+\.\s+/gm, "")
        .replace(/(\*\*|__)(.*?)\1/g, "$2")
        .replace(/(\*|_)(.*?)\1/g, "$2")
        .replace(/~~(.*?)~~/g, "$1")
        .replace(/^\s*[-*_]{3,}\s*$/gm, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
}
