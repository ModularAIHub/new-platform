import React, { useRef, useState, useEffect } from "react";

const FadeInSection = ({ children, className = "" }) => {
  const ref = useRef();
  const [isVisible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={
        `${className} transition-opacity duration-1000 ease-out ` +
        (isVisible ? "animate-fadein-up opacity-100" : "opacity-0 translate-y-8")
      }
    >
      {children}
    </div>
  );
};

export default FadeInSection;
