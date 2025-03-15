'use client';

import { useState } from 'react';
import { FaTwitter, FaFacebook, FaLink } from 'react-icons/fa';

interface ShareButtonsProps {
  url: string;
  title: string;
}

export default function ShareButtons({ url, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  
  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };
  
  return (
    <div className="flex space-x-3">
      <button 
        onClick={handleCopyToClipboard}
        className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors flex items-center justify-center"
        aria-label="Copy link to clipboard"
        title="Copy link to clipboard"
      >
        <FaLink className="w-4 h-4" />
        <span className="ml-1">{copied ? 'Copied!' : 'Copy'}</span>
      </button>
      
      <a 
        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 bg-[#1DA1F2] text-white rounded-full hover:bg-[#0c85d0] transition-colors flex items-center justify-center"
        aria-label="Share on Twitter"
        title="Share on Twitter"
      >
        <FaTwitter className="w-4 h-4" />
        <span className="ml-1">Tweet</span>
      </a>
      
      <a 
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 bg-[#4267B2] text-white rounded-full hover:bg-[#365899] transition-colors flex items-center justify-center"
        aria-label="Share on Facebook"
        title="Share on Facebook"
      >
        <FaFacebook className="w-4 h-4" />
        <span className="ml-1">Share</span>
      </a>
    </div>
  );
} 