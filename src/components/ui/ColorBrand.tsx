const brandColors = [
  { name: 'Primary', hex: '#5eead4', tailwind: 'bg-teal-300' },
  { name: 'Dark', hex: '#001312', tailwind: 'bg-dark' },
  { name: 'Light', hex: '#f5f5f5', tailwind: 'bg-light' },
];

const colorPalette = [
  { name: 'teal-50', hex: '#f0fdfa' },
  { name: 'teal-100', hex: '#ccfbf1' },
  { name: 'teal-200', hex: '#99f6e4' },
  { name: 'teal-300', hex: '#5eead4' },
  { name: 'teal-400', hex: '#2dd4bf' },
  { name: 'teal-500', hex: '#14b8a6' },
  { name: 'teal-600', hex: '#0d9488' },
  { name: 'teal-700', hex: '#0f766e' },
  { name: 'teal-800', hex: '#115e59' },
  { name: 'teal-900', hex: '#134e4a' },
  { name: 'teal-950', hex: '#042f2e' },
];

const ColorBrand = () => {
  return (
    <section id="color" className="space-y-10 py-10 md:space-y-16 md:py-20">
      <div>
        <h2 className="mb-6 text-base font-medium">Brand Colors</h2>
        <div className="flex flex-wrap gap-4 md:gap-8">
          {brandColors.map(({ name, hex, tailwind }) => (
            <div key={name} className="flex flex-col items-center">
              <div
                className={`size-24 rounded-b-full border shadow dark:border-light/30 md:size-32 ${tailwind}`}
              ></div>
              <span className="mt-2 text-sm font-semibold">{name}</span>
              <span className="text-xs opacity-70">{hex}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="mb-6 text-base font-medium">Teal Palette</h3>
        <div className="flex flex-wrap gap-3 md:gap-2">
          {colorPalette.map(({ name, hex }) => (
            <div key={name} className="flex flex-col items-center">
              <div
                className={`size-[4.5rem] rounded-b-full shadow md:size-16`}
                style={{ backgroundColor: hex }}
              ></div>
              <span className="mt-1 text-xs font-medium">{name}</span>
              <span className="text-xxs opacity-70">{hex}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-muted-foreground text-xs">
        NOTE: Notice the gentle curve at the bottom of each color—this playful
        shape is inspired by the signature smile in the Commuto logo, adding a
        friendly touch to our palette and gives tribute to our Commuto Smiley.
      </p>
    </section>
  );
};

export default ColorBrand;
