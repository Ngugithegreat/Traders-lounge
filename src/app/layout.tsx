import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Traders Lounge — Trade Smarter on Deriv',
  description: 'Professional trading bots, live charts, and automated strategies for Deriv synthetic indices.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
        <script src="https://app.abepayy.com/widget/abepay-inline.js" />
        <script dangerouslySetInnerHTML={{ __html: `
          (function tryInit(n) {
            if (window.AbePay) {
              window.AbePay.init({ ref: 'partner1', mountId: 'abepay-nav', powered: true });
            } else if (n < 30) {
              setTimeout(function() { tryInit(n + 1); }, 200);
            }
          })(0);
        `}} />
      </body>
    </html>
  );
}
