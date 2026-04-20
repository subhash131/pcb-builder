import { ReactElement } from "react";
import Link from 'next/link';

export default function Page(): ReactElement {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-4xl font-bold">PCB Builder</h1>
      <Link 
        href="/editor" 
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Go to Editor
      </Link>
    </div>
  );
}
