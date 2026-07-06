const Stars = ({ count }: { count: number }) => {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          className={`text-2xl leading-none ${i < count ? 'text-yellow-400' : 'text-gray-400 dark:text-gray-600'}`}
        >
          ★
        </span>
      ))}
    </div>
  );
};

export default Stars;
