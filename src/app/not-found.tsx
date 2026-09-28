import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <pre className="rounded-xl border border-line bg-code px-5 py-4 text-left font-mono text-sm leading-relaxed">
        <span className="text-kw">throw new</span> <span className="text-fn">NotFoundError</span>(
        <span className="text-str">&quot;404&quot;</span>)
      </pre>
      <h1 className="mt-6 text-2xl font-extrabold">This page isn&apos;t available</h1>
      <p className="mt-2 text-muted">The link may be broken, or the video was removed or made private.</p>
      <Link href="/" className="mt-6 rounded-full bg-accent px-5 py-2.5 font-semibold text-accent-fg hover:bg-accent-hover">
        Go to home
      </Link>
    </div>
  );
}
