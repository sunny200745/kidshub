export default function QuickLogBar() {
  const log = (type) => alert(type + " logged");

  return (
    <div className="flex justify-between mt-4">
      {["Meal", "Nap", "Diaper", "Mood", "Activity"].map(t => (
        <button
          key={t}
          onClick={() => log(t)}
          className="bg-pink-600 text-white px-3 py-2 rounded-xl text-sm"
        >
          {t}
        </button>
      ))}
    </div>
  );
}