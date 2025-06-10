import { Link } from 'react-router-dom';
import { footerLinks } from '../../constants/data';

const AgreeInfo = () => {
  return (
    <>
      <p className="mt-3 text-center text-xs leading-normal sm:text-sm">
        By confirming, I agree to the{' '}
        <Link
          to={footerLinks[0].link}
          className="text-dark underline dark:text-teal-300"
        >
          {footerLinks[0].title}
        </Link>{' '}
        and{' '}
        <strong className="font-semibold">
          I understand breaking the rules will result in a ban from the
          platform.
        </strong>
      </p>
    </>
  );
};

export default AgreeInfo;
