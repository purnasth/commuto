import { useParams } from 'react-router-dom';

import Error404 from './Error404';
import LogoBar from '../components/ui/LogoBar';
import CareOurEarth from '../components/ui/CareOurEarth';

import { legalPages } from '../constants/data';

const LegalPage = () => {
  const { pageId } = useParams();
  const page = legalPages.find((p) => p.id === pageId);

  if (!page) {
    return <Error404 />;
  }

  return (
    <>
      <main className="flex items-center justify-center px-0">
        <div className="container flex size-full max-w-4xl flex-col items-center justify-center gap-4 text-center">
          <CareOurEarth />
          <h1 className="mt-4 text-2xl font-bold capitalize leading-snug text-teal-500 md:text-4xl md:leading-snug lg:text-5xl lg:leading-snug">
            {page.title}
          </h1>
          <p className="max-w-2xl font-body text-xs sm:text-sm md:text-sm">
            {page.intro}
          </p>
        </div>
      </main>
      <LogoBar />
      <main>
        <div className="container max-w-4xl space-y-10">
          {page.sections.map((section, idx) => (
            <section className="space-y-4" key={section.id || idx}>
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <p className="text-sm">{section.description}</p>
              {section.list && section.list.length > 0 && (
                <ul className="ml-6 list-disc space-y-1 text-sm">
                  {section.list.map((item, itemIndex) => (
                    <li key={itemIndex}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </main>
    </>
  );
};

export default LegalPage;
