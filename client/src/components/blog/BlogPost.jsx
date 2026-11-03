import { useNavigate } from 'react-router-dom';

const BlogPost = ({ html }) => {
  const navigate = useNavigate();

  const handleClick = (e) => {
    const target = e.target.closest('a');
    if (!target) return;

    const href = target.getAttribute('href');
    if (target.classList.contains('blog-link-internal') || (href && href.startsWith('/'))) {
      e.preventDefault();
      navigate(href);
      // Scroll to top of the page on internal navigation
      window.scrollTo(0, 0);
    }
  };

  return (
    <article
      className="blog-content rounded-2xl border border-slate-200 bg-white px-5 py-8 shadow-sm sm:px-8"
      dangerouslySetInnerHTML={{ __html: html }}
      onClick={handleClick}
    />
  );
};

export default BlogPost;
