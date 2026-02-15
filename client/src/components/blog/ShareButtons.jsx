import { Facebook, Link2, Linkedin, Twitter } from 'lucide-react';
import toast from 'react-hot-toast';

const openShareWindow = (url) => {
  window.open(url, '_blank', 'noopener,noreferrer,width=640,height=720');
};

const ShareButtons = ({ title, url }) => {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy link');
    }
  };

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Share now</p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => openShareWindow(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          <Twitter className="h-4 w-4" />
          Twitter
        </button>
        <button
          type="button"
          onClick={() => openShareWindow(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          <Linkedin className="h-4 w-4" />
          LinkedIn
        </button>
        <button
          type="button"
          onClick={() => openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          <Facebook className="h-4 w-4" />
          Facebook
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          <Link2 className="h-4 w-4" />
          Copy Link
        </button>
      </div>
    </div>
  );
};

export default ShareButtons;
