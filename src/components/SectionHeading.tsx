export default function SectionHeading({
  kicker,
  title,
  sub,
  id,
}: {
  kicker: string;
  title: React.ReactNode;
  sub?: string;
  id?: string;
}) {
  return (
    <div id={id} className="mb-10 scroll-mt-28 sm:mb-14">
      <p className="mb-3 flex items-center gap-2 font-mono text-[12px] font-semibold tracking-[0.22em] text-acid uppercase">
        <span className="inline-block h-px w-7 bg-acid/60" />
        {kicker}
      </p>
      <h2 className="max-w-3xl text-3xl font-bold tracking-tight text-balance sm:text-[42px] sm:leading-[1.08]">
        {title}
      </h2>
      {sub && <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-zinc-400">{sub}</p>}
    </div>
  );
}
