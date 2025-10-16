import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="min-h-screen flex flex-col bg-nightcourt text-courtwhite font-sans">
            {/* HEADER */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-steelgrey/30">
                <div className="flex items-center gap-3">
                    <img
                        src="/logo-simple.png"
                        alt="Omslag saknas"
                        className="w-auto h-16"
                    />
                    <div className="flex flex-col gap-0">
                        <span className="text-limecore font-display text-2xl leading-none font-bold block">LimePoint</span>
                        <span className="text-aquaserve text-sm tracking-wide block">Americano made simple</span>
                    </div>
                </div>

                {/* Hamburger menu (mobile) */}
                <button
                    className="text-courtwhite md:hidden"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle menu">
                    {menuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>

                {/* Desktop navigation */}
                <nav className="hidden md:flex gap-8 font-medium">
                    <a
                        href="#"
                        className="hover:text-limecore transition">
                        Start
                    </a>
                    <a
                        href="#"
                        className="hover:text-limecore transition">
                        Turneringar
                    </a>
                    <a
                        href="#"
                        className="hover:text-limecore transition">
                        Gemenskap
                    </a>
                    <a
                        href="#"
                        className="hover:text-limecore transition">
                        Profil
                    </a>
                </nav>
            </header>

            {/* MOBILE MENU OVERLAY */}
            {menuOpen && (
                <div className="fixed inset-0 z-40 bg-nightcourt/95 backdrop-blur-sm flex flex-col items-center justify-center space-y-8 text-2xl font-semibold md:hidden">
                    <a
                        href="#"
                        className="hover:text-limecore transition"
                        onClick={() => setMenuOpen(false)}>
                        Start
                    </a>
                    <a
                        href="#"
                        className="hover:text-limecore transition"
                        onClick={() => setMenuOpen(false)}>
                        Turneringar
                    </a>
                    <a
                        href="#"
                        className="hover:text-limecore transition"
                        onClick={() => setMenuOpen(false)}>
                        Gemenskap
                    </a>
                    <a
                        href="#"
                        className="hover:text-limecore transition"
                        onClick={() => setMenuOpen(false)}>
                        Profil
                    </a>
                </div>
            )}

            {/* MAIN CONTENT */}
            <main className="flex-1 p-6 md:p-10">{children}</main>

            {/* FOOTER */}
            <footer className="border-t border-steelgrey/30 text-sm py-4 px-6 flex justify-between items-center text-steelgrey">
                <span>LimePoint © {new Date().getFullYear()}</span>
                <span>By Erik 🍋</span>
            </footer>
        </div>
    );
}
