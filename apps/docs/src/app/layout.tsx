import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { Inter } from 'next/font/google';
import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { BookOpen, Terminal, Briefcase } from 'lucide-react';

const inter = Inter({
  subsets: ['latin'],
});

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen" suppressHydrationWarning>
        <RootProvider>
          <DocsLayout 
            tree={source.getPageTree()} 
            {...baseOptions()}
            sidebar={{
              tabs: [
                {
                  title: 'Workflow Template',
                  url: '/workflow-template',
                  icon: <BookOpen className="size-4" />,
                  description: 'AI Agent Template for workflow automation',
                },
                {
                  title: 'Standard Agent',
                  url: '/standard-agent',
                  icon: <Terminal className="size-4" />,
                  description: 'Basic autonomous agent features',
                },
                {
                  title: 'Professional Agent',
                  url: '/pro-agent',
                  icon: <Briefcase className="size-4" />,
                  description: 'Advanced multi-agent coordination',
                },
              ],
            }}
          >
            {children}
          </DocsLayout>
        </RootProvider>
      </body>
    </html>
  );
}
