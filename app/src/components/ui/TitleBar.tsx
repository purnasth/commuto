type AllowedColors =
  | 'gray'
  | 'red'
  | 'blue'
  | 'green'
  | 'teal'
  | 'amber'
  | 'sky';

interface TitleBarProps {
  content: string;
  position: string;
  color?: AllowedColors;
}

const colorClassMap: Record<AllowedColors, string> = {
  gray: 'border-gray-600/30 bg-gray-100 text-gray-900/70 dark:text-gray-800',
  red: 'border-red-600/30 bg-red-100 text-red-900/70 dark:text-red-800',
  blue: 'border-blue-600/30 bg-blue-100 text-blue-900/70 dark:text-blue-800',
  green:
    'border-green-600/30 bg-green-100 text-green-900/70 dark:text-green-800',
  teal: 'border-teal-600/30 bg-teal-100 text-teal-900/70 dark:text-teal-800',
  amber:
    'border-amber-600/30 bg-amber-100 text-amber-900/70 dark:text-amber-800',
  sky: 'border-sky-600/30 bg-sky-100 text-sky-900/70 dark:text-sky-800',
};

const TitleBar = ({ content, position, color = 'gray' }: TitleBarProps) => {
  const colorClasses = colorClassMap[color];
  return (
    <p
      className={`absolute ${position} rounded-full border px-2.5 text-xxs shadow backdrop-blur-sm ${colorClasses}`}
    >
      {content}
    </p>
  );
};

export default TitleBar;
