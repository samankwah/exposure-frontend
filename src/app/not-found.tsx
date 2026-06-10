import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found-page" aria-labelledby="not-found-title">
      <section className="not-found-panel">
        <p className="section-kicker">CLeNE Observatory</p>
        <h1 id="not-found-title">Page not found</h1>
        <p>The page you are looking for is unavailable or has moved.</p>
        <Link href="/" className="home-cta primary">
          Return home
        </Link>
      </section>
    </main>
  );
}
