export default function WikiFooter() {
  return (
    <footer className="border-t border-border mt-8 py-4 px-4 text-xs text-muted-foreground">
      <div className="max-w-[1400px] mx-auto">
        <p className="mb-2">
          Thoshan's Wiki — a personal knowledge base about projects, systems, and learning.
          Content is the intellectual property of Lingadevaru H P.
        </p>
        <div className="flex flex-wrap gap-3">
          <a href="/wiki/about" className="hover:underline">About</a>
          <a href="https://github.com/lingadevaru-hp" target="_blank" rel="noreferrer" className="hover:underline">GitHub</a>
          <a href="https://linkedin.com/in/lingadevaruhp" target="_blank" rel="noreferrer" className="hover:underline">LinkedIn</a>
          <a href="https://huggingface.co/lingadevaruhp" target="_blank" rel="noreferrer" className="hover:underline">Hugging Face</a>
        </div>
      </div>
    </footer>
  );
}
