import { useEffect, useState } from 'react';

import FontBrand from '../components/ui/FontBrand';
import LogoBrand from '../components/ui/LogoBrand';
import ColorBrand from '../components/ui/ColorBrand';

interface BrandLink {
  id: number;
  title: string;
  link: string;
}

const brandLinks = [
  {
    id: 1,
    title: 'Logo',
    link: 'logo',
  },
  {
    id: 2,
    title: 'Font',
    link: 'font',
  },
  {
    id: 3,
    title: 'Color',
    link: 'color',
  },
];

const Brand = () => {
  const [activeSection, setActiveSection] = useState('logo');

  useEffect(() => {
    const GAP = 100;
    let timeoutId: number | null = null;

    const handleScroll = () => {
      if (timeoutId === null) {
        timeoutId = window.setTimeout(() => {
          const sectionIds = brandLinks.map((l) => l.link);
          let found = brandLinks[0].link;
          for (const id of sectionIds) {
            const el = document.getElementById(id);
            if (el) {
              const rect = el.getBoundingClientRect();
              if (rect.top <= GAP) {
                found = id;
              }
            }
          }
          setActiveSection(found);
          timeoutId = null;
        }, 100);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      const GAP = 90; // px gap from top
      const y = el.getBoundingClientRect().top + window.scrollY - GAP;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <main>
      <div className="lg:container xl:w-4/5">
        <div className="xl:grid xl:grid-cols-5">
          <div className="sticky top-4 z-50 mx-auto w-fit rounded-full bg-light px-1.5 py-2 dark:bg-dark md:px-3 md:py-4 lg:bg-transparent xl:top-20 xl:col-span-1 xl:h-fit xl:rounded-none xl:p-0">
            <h1 className="mb-8 hidden text-base font-medium xl:block">
              Brand Guidelines
            </h1>
            <ul className="flex items-center justify-center gap-2 xl:flex-col xl:items-start xl:gap-5">
              {brandLinks.map((link: BrandLink) => (
                <li key={link.id} className="group w-fit">
                  <a
                    href={`#${link.link}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleClick(link.link);
                    }}
                    className={`sticky-navlink ${activeSection === link.link ? 'bg-teal-700 text-light dark:bg-teal-500 dark:text-dark' : 'bg-teal-100/80 text-teal-600 dark:bg-teal-100/20 dark:text-teal-400'}`}
                  >
                    {link.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="col-span-4 mt-10 divide-y-8 xl:mt-0">
            <LogoBrand />
            <FontBrand />
            <ColorBrand />
          </div>
        </div>
      </div>
    </main>
  );
};

export default Brand;
