import commutoLogo from '../../assets/logo/commuto.svg';
import commutoLogoAlt from '../../assets/logo/commuto-alt.svg';
import commutoIcon from '../../assets/logo/commuto-icon.svg';
import commutoIconAlt from '../../assets/logo/commuto-icon-alt.svg';
import { useState } from 'react';

const LogoBrand = () => {
  const [toggleLogo, setToggleLogo] = useState(true);
  const [toggleIcon, setToggleIcon] = useState(true);

  return (
    <section id="logo" className="space-y-10 pb-10 md:space-y-16 md:pb-20">
      <div className="space-y-5 md:space-y-10">
        <p className="text-sm">
          The logo is thoughtfully designed by{' '}
          <a
            href="https://purnashrestha.com.np"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-teal-600 hover:underline"
          >
            Purna Shrestha
          </a>{' '}
          on December 2024. It embodies a modern and minimalist aesthetic,
          reflecting the core values and identity of our brand. Consistent
          application of the logo across all platforms and materials is
          essential to ensure strong and cohesive brand recognition.
        </p>
        <div
          className={`relative flex h-56 w-full items-center justify-center rounded-tr-[2rem] md:h-64 lg:h-96 ${toggleLogo ? 'bg-light' : 'bg-dark'} transition-all duration-100`}
        >
          <button
            type="button"
            aria-label="Toggle Logo"
            className={`absolute right-3.5 top-3.5 size-10 rounded-full bg-dark ${!toggleLogo ? 'bg-light' : 'bg-dark'}`}
            onClick={() => setToggleLogo((prev) => !prev)}
            aria-pressed={toggleLogo}
          ></button>
          <img
            src={toggleLogo ? commutoLogoAlt : commutoLogo}
            alt={toggleLogo ? 'Commuto Logo Alt' : 'Commuto Logo'}
            className="h-auto max-w-full scale-75 md:scale-100"
          />
        </div>
      </div>
      <div className="space-y-10">
        <p className="text-sm">
          Commuto Smiley is used as the app icon for mobile and desktop
          applications. It is designed to be simple, recognizable, and
          versatile, ensuring that it stands out in various contexts while
          maintaining brand consistency.
        </p>
        <div
          className={`relative flex h-56 w-full items-center justify-center rounded-tr-[2rem] bg-[radial-gradient(circle,_#2dd4bf_10%,_transparent_10%),_radial-gradient(circle,_#ffffff00_0%,_transparent_10%)] bg-[length:15px_15px] bg-[position:0_0,10px_10px] px-0 py-0 md:md:h-64 lg:h-96 ${toggleIcon ? 'bg-light' : 'bg-teal-900'} transition-all duration-100`}
        >
          <button
            type="button"
            aria-label="Toggle Icon"
            className={`absolute right-3.5 top-3.5 size-10 rounded-full bg-dark ${!toggleIcon ? 'bg-light' : 'bg-dark'}`}
            onClick={() => setToggleIcon((prev) => !prev)}
            aria-pressed={toggleIcon}
          ></button>
          <img
            src={toggleIcon ? commutoIconAlt : commutoIcon}
            alt={toggleIcon ? 'Commuto Icon Alt' : 'Commuto Icon'}
            className={`size-auto scale-75 rounded-3xl object-contain md:scale-100 ${toggleIcon ? 'shadow-lg' : 'shadow-none'}`}
          />
        </div>
      </div>
      <p className="text-muted-foreground text-xs">
        NOTE: Only the two official logo variations shown above—one for light
        backgrounds and one for dark—are permitted for use. No other logo
        versions or color modifications are allowed, ensuring our brand remains
        consistent and recognizable.
      </p>
    </section>
  );
};

export default LogoBrand;
