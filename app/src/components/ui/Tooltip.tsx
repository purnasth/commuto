import React, { ReactNode } from 'react';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  return (
    <span className="group relative cursor-pointer">
      {children}
      <span className="pointer-events-none absolute left-1/2 z-50 -mt-14 w-max -translate-x-1/2 scale-0 rounded-xl bg-dark px-3 py-2 text-xs text-light opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100 group-focus:scale-100 group-focus:opacity-100 dark:bg-light dark:text-dark md:-mt-10">
        {content}
        <span className="absolute left-1/2 top-full size-0 -translate-x-1/2 border-x-[6px] border-t-[6px] border-x-transparent border-t-dark dark:border-t-light" />
      </span>
    </span>
  );
};

export default Tooltip;
