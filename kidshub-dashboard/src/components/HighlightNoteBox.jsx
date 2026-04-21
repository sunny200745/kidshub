export default function HighlightNoteBox({ note }) {
  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 p-3 rounded mt-3">
      <strong>Special Instruction:</strong>
      <p>{note}</p>
    </div>
  );
}