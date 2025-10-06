import React, { useState } from 'react';
import { TbCirclePlus } from 'react-icons/tb';

import { FaqItemProps } from '../interfaces/types';

const Faq: React.FC<{ contents: FaqItemProps[] }> = ({ contents }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-teal-950/10 p-6 shadow-md dark:border-teal-50/40 dark:bg-teal-950/30 sm:p-8 md:p-10 lg:p-12">
      <div className="pointer-events-none absolute left-0 -z-10 size-96 -translate-x-1/2 rounded-full bg-teal-300 opacity-40 blur-[100px]" />
      <div className="pointer-events-none absolute right-0 top-1/4 -z-10 size-[36rem] translate-x-1/2 rounded-full bg-teal-300 opacity-80 blur-[200px]" />
      <div className="space-y-4 sm:space-y-6 md:space-y-6">
        {contents.map((faq: FaqItemProps, index: number) => (
          <div
            key={index}
            className={`${
              index !== contents.length - 1
                ? 'border-b border-teal-950/30 dark:border-teal-50/40'
                : ''
            }`}
          >
            <div
              aria-hidden="true"
              onClick={() => toggleFAQ(index)}
              className="flex w-full items-center justify-between pb-4 text-left focus:outline-none"
            >
              <h3 className="text-base font-semibold sm:text-lg md:text-xl">
                {faq.question}
              </h3>
              <TbCirclePlus
                className={`text-xl text-teal-950 transition-transform dark:text-teal-400 sm:text-2xl ${
                  openIndex === index ? 'rotate-45' : 'rotate-0'
                }`}
              />
            </div>
            <div
              className={`transition-max-height overflow-hidden overflow-y-auto duration-500 ${
                openIndex === index ? 'max-h-40' : 'max-h-0'
              }`}
            >
              <p className="rounded-md pb-6 text-sm text-gray-600 dark:text-light/70 sm:text-base">
                {faq.answer}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Faq;
