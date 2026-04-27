export function PhoneHeader({ title }: { title: string }) {
  return (
    <div className="px-4 pt-12 pb-3 bg-white border-b border-line">
      <div className="text-brand font-bold text-base">{title}</div>
    </div>
  );
}
