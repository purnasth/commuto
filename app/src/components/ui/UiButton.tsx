interface UiButtonProps {
  label: string;
  onClickFunction: () => void;
  className?: string;
}

const UiButton = ({ label, onClickFunction, className }: UiButtonProps) => {
  return (
    <>
      <button
        type="button"
        className={`transition-150 w-full rounded-full border px-6 py-3 text-sm font-medium ${
          className
            ? className
            : 'border-teal-300 bg-teal-300 text-dark hover:bg-teal-400'
        }`}
        onClick={onClickFunction}
        aria-label={label}
      >
        {label}
      </button>
    </>
  );
};

export default UiButton;
