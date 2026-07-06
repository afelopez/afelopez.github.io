const Stars = ({ count }: { count: number }) => {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          className={`text-2xl leading-none ${i < count ? 'text-yellow-400' : 'text-gray-200 dark:text-gray-700'}`}
        >
          ★
        </span>
      ))}
    </div>
  );
};

export default Stars;
