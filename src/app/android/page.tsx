import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Luxara for Android" };

export default function AndroidPage() {
  return <main className="android-download-page">
    <header className="checkout-header"><Link href="/" className="brand">LUXARA<span className="brand-dot">✦</span></Link><span>FOR ANDROID</span></header>
    <div className="android-download-content">
      <span className="eyebrow">LUXARA ON YOUR PHONE</span>
      <h1>Your beautiful things, <em>wherever you go.</em></h1>
      <p>Explore the collection and check your bag from your Android phone. Sign in with the same Google account you use on the website, and your bag stays in sync.</p>
      <a className="button button-dark" href="/luxara.apk" download>Download Luxara APK <span>↓</span></a>
      <div className="android-install-steps">
        <h2>Install in three steps</h2>
        <ol><li>Download the APK on your Android phone.</li><li>Open the download and allow installation from your browser if Android asks.</li><li>Open Luxara and sign in with your Google account.</li></ol>
      </div>
      <Link className="underlined-link" href="/collection">Explore the collection →</Link>
    </div>
  </main>;
}
