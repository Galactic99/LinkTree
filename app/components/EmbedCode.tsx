'use client';

import { useState } from 'react';

interface EmbedCodeProps {
  url: string;
  title: string;
}

export default function EmbedCode({ url, title }: EmbedCodeProps) {
  const [copied, setCopied] = useState(false);

  const iframeCode = `<iframe
  src="${url}"
  title="${title}"
  width="100%"
  height="600"
  style="border: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);"
></iframe>`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(iframeCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy embed code:', err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <pre className="p-4 bg-gray-800 rounded-lg overflow-x-auto text-sm text-gray-300">
          <code>{iframeCode}</code>
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <p className="text-sm text-gray-400">
        Copy and paste this code to embed your Linktree on any website.
      </p>
    </div>
  );
} 