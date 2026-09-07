import ReactMarkdown from "react-markdown";

export default function NotesView({ content }: { content: string }) {
  return (
    <div className="prose prose-neutral dark:prose-invert prose-sm max-w-none prose-headings:font-bold prose-h1:text-foreground prose-h2:text-brand-blue-dark dark:prose-h2:text-brand-blue prose-h3:text-brand-pink-dark dark:prose-h3:text-brand-pink prose-strong:text-foreground prose-li:marker:text-brand-blue">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
