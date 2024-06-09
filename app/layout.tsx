import './globals.css';

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning style={{height: '100vh'}}>
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      {children}
    </html>
  );
}

export const runtime = 'edge';
