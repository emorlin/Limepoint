import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { NavLink } from "react-router-dom";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const [menuOpen, setMenuOpen] = useState(false);

    // Stäng menyn med Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setMenuOpen(false);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const baseLink = "transition hover:text-limecore";
    const activeLink = "text-limecore font-semibold";

    return (
        <div className="min-h-screen flex flex-col bg-nightcourt text-courtwhite font-sans">
            {/* HEADER */}
            <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-steelgrey/30">
                <NavLink
                    to="/"
                    className="flex items-center gap-3 hover:text-limecore transition"
                >
                    <img src="/logo-simple.png" alt="LimePoint logotyp" className="w-auto h-16" />
                    <div className="flex flex-col gap-0">
                        <span className="text-limecore font-display text-2xl leading-none font-bold block">
                            LimePoint
                        </span>
                        <span className="text-aquaserve text-sm tracking-wide block">
                            Americano made simple
                        </span>
                    </div>
                </NavLink>

                {/* Hamburger (mobil) */}
                <button
                    className="text-courtwhite md:hidden"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle menu"
                >
                    {menuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>

                {/* Desktop-navigation */}
                <nav className="hidden md:flex gap-8 font-medium">
                    <NavLink to="/" className={({ isActive }) => (isActive ? activeLink : baseLink)}>
                        Start
                    </NavLink>
                    <NavLink to="/tournaments" className={({ isActive }) => (isActive ? activeLink : baseLink)}>
                        Turneringar
                    </NavLink>
                    <NavLink to="/communities" className={({ isActive }) => (isActive ? activeLink : baseLink)}>
                        Gemenskaper
                    </NavLink>
                    <NavLink to="/about" className={({ isActive }) => (isActive ? activeLink : baseLink)}>
                        Om
                    </NavLink>
                </nav>
            </header>

            {/* MOBILMENY OVERLAY */}
            {menuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-nightcourt/95 backdrop-blur-sm flex flex-col items-center justify-center space-y-8 text-2xl font-semibold md:hidden"
                    role="dialog"
                    aria-modal="true"
                >
                    {/* Stäng-knapp uppe i hörnet */}
                    <button
                        className="absolute top-6 right-6 text-courtwhite hover:text-limecore transition"
                        onClick={() => setMenuOpen(false)}
                        aria-label="Stäng meny"
                    >
                        <X size={36} />
                    </button>

                    <NavLink
                        to="/"
                        onClick={() => setMenuOpen(false)}
                        className={({ isActive }) => (isActive ? activeLink : baseLink)}
                    >
                        Start
                    </NavLink>
                    <NavLink
                        to="/tournaments"
                        onClick={() => setMenuOpen(false)}
                        className={({ isActive }) => (isActive ? activeLink : baseLink)}
                    >
                        Turneringar
                    </NavLink>
                    <NavLink
                        to="/communities"
                        onClick={() => setMenuOpen(false)}
                        className={({ isActive }) => (isActive ? activeLink : baseLink)}
                    >
                        Gemenskaper
                    </NavLink>
                    <NavLink
                        to="/about"
                        onClick={() => setMenuOpen(false)}
                        className={({ isActive }) => (isActive ? activeLink : baseLink)}
                    >
                        Om
                    </NavLink>
                </div>
            )}

            {/* MAIN */}
            <main className="flex-1 p-4 md:p-10">{children}</main>

            {/* FOOTER */}
            <footer className="border-t border-steelgrey/30 text-sm py-4 px-6 flex justify-between items-center text-steelgrey">
                <span>LimePoint © {new Date().getFullYear()}</span>
                <span>Av <a className="text-white underline" href="https://www.linkedin.com/in/erikmorlin/">Erik</a></span>
            </footer>
        </div>
    );
}
