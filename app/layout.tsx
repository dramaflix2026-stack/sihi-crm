import "./globals.css";
export const metadata = { title: "SIHI CRM", description: "Gestão de relacionamento SIHI" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="pt-BR"><body>{children}</body></html>; }
