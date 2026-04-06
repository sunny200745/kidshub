export default function ChildCard({ child, onClick }) {
  return (
    <div onClick={onClick} className="bg-white p-4 rounded-2xl shadow mb-3 cursor-pointer">
      <h2 className="text-lg font-semibold">{child.name}</h2>
      <p className="text-sm text-gray-500">{child.classroom}</p>
      <div className="mt-2 text-xs text-pink-600">
        {child.tags.join(", ")}
      </div>
    </div>
  );
}