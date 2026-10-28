import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SmoothScroll from "@/components/SmoothScroll";
import WorldCanvas from "@/components/three/WorldCanvas";
import { site } from "@/data/site";

const body = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap" });

export const metadata = {
  title: `${site.name} | Full Stack Web Developer`,
  description:
    "Full Stack Web Developer building fast React / Next.js front ends, Laravel and Node.js back ends, booking systems and e-commerce for clients worldwide.",
};

export const viewport = { themeColor: "#05030f" };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <SmoothScroll />
        <WorldCanvas />
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
