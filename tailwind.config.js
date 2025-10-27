/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                limecore: "#AEE637", // 🍋 Energi, primär accent
                limedark: "#76B51E", // 🌿 Hover/kontrast
                nightcourt: "#0E1A2A", // 🌌 Basfärg / bakgrund
                courtwhite: "#F7F8F9", // ⚪ Ljus bakgrund / kort
                aquaserve: "#5CE1E6", // 🌊 Sekundär accent
                steelgrey: "#b3b3b3", // ⚙️ Neutral text / ikonfärg
            },
            fontFamily: {
                sans: ["Inter", "sans-serif"],
                display: ["Outfit", "sans-serif"],
            },
        },
    },
    plugins: [],
};
