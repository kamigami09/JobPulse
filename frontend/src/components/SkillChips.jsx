export default function SkillChips({ skills = [], max = 3 }) {
  const visible = skills.slice(0, max)
  const overflow = skills.length - max

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((skill) => (
        <span
          key={skill}
          className="inline-flex items-center rounded-md bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-300 ring-1 ring-inset ring-zinc-700/50"
        >
          {skill}
        </span>
      ))}
      {overflow > 0 && (
        <span className="inline-flex items-center rounded-md bg-zinc-800/50 px-1.5 py-0.5 text-xs text-zinc-500">
          +{overflow}
        </span>
      )}
    </div>
  )
}
