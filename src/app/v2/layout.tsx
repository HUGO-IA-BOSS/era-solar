import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./styles.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Era Solar · Energía solar inteligente para Chile",
  description:
    "Instala energía solar fotovoltaica y ahorra hasta 100% en tu cuenta de luz. Diseño, instalación en menos de 4 días y monitoreo 24/7. Consultoría gratuita.",
};

export default function V2Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`${inter.variable} ${display.variable}`}>{children}</div>
  );
}
