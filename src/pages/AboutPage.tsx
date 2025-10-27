// src/pages/AboutPage.tsx
import { Link } from "react-router-dom";

export default function AboutPage() {
    return (
        <div className="max-w-3xl mx-auto flex flex-col gap-8 py-12">
            <header>
                <h1 className="text-4xl font-display text-limecore mb-4">
                    Om LimePoint
                </h1>
                <p className="text-steelgrey text-lg">
                    En modern webbapp för padelturneringar av typen{" "}
                    <span className="text-courtwhite font-semibold">Americano</span>.
                </p>
            </header>

            <section className="text-courtwhite leading-relaxed space-y-4">
                <p>
                    LimePoint är ett personligt projekt skapat för att göra det enklare
                    att hantera Americano-turneringar – utan Excelblad, appar eller
                    krångliga registreringar. Fokus ligger på ett snabbt flöde,
                    tydlig design och en smidig användarupplevelse.
                </p>

                <p>
                    Appen är utvecklad med moderna webbramverk som React, Tailwind och
                    Supabase, och distribueras via Vercel. Den är byggd med samma princip
                    som styr många framgångsrika prototyper:{" "}
                    <em>“Build fast, learn faster.”</em>
                </p>

                <p>
                    Kodbasen är medvetet pragmatisk — vibe-kodad, snabb att utveckla och
                    lätt att ändra. Det är inte enterprise-arkitektur, men den fungerar,
                    och det är poängen.
                </p>
            </section>

            <section className="bg-nightcourt border border-steelgrey/30 rounded-2xl p-6">
                <h2 className="text-2xl font-display text-limecore mb-3">
                    Teknik & infrastruktur
                </h2>
                <ul className="list-disc pl-6 text-steellight space-y-1">
                    <li>Byggd med <strong>React</strong> och <strong>Vite</strong></li>
                    <li>Styling med <strong>Tailwind CSS</strong></li>
                    <li>Data & API via <strong>Supabase (PostgreSQL)</strong></li>
                    <li>Drift & CI/CD via <strong>Vercel</strong></li>
                    <li>Typning med <strong>TypeScript</strong> (non-strict)</li>
                </ul>
            </section>

            <section>
                <h2 className="text-2xl font-display text-limecore mb-3">GitHub</h2>
                <p className="text-steelgrey mb-4">
                    Projektet är öppet för insyn och finns tillgängligt på GitHub.
                </p>
                <a
                    href="https://github.com/emorlin/limepoint"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-limecore text-nightcourt font-semibold px-5 py-2 rounded-xl hover:bg-limedark transition"
                >
                    Besök projektet på GitHub →
                </a>
            </section>

            <footer className="pt-8 border-t border-steelgrey/30 text-steelgrey text-sm">
                <p>
                    © 2025 LimePoint — utvecklat av{" "}
                    <span className="text-courtwhite font-medium">Erik Morlin</span>.
                </p>
            </footer>
        </div>
    );
}
