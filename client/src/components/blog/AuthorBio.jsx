import { Linkedin, Twitter } from 'lucide-react';

const AuthorBio = ({ author }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <img
        src={author.avatar}
        alt={`${author.name} avatar`}
        loading="lazy"
        className="h-20 w-20 rounded-full border border-slate-200 object-cover"
      />
      <div className="flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Written by</p>
        <h3 className="mt-1 text-2xl font-bold text-slate-900">{author.name}</h3>
        <p className="mt-2 text-slate-600">{author.bio}</p>
      </div>
      <div className="flex items-center gap-2">
        {author.social?.linkedin ? (
          <a
            href={`https://linkedin.com/in/${author.social.linkedin}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            <Linkedin className="h-4 w-4" />
            LinkedIn
          </a>
        ) : null}
        {author.social?.twitter ? (
          <a
            href={`https://x.com/${author.social.twitter}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            <Twitter className="h-4 w-4" />
            Twitter
          </a>
        ) : null}
      </div>
    </div>
  </section>
);

export default AuthorBio;
