import { ArrowLeftRight, Youtube } from 'lucide-react'
import { useStore } from '../store'

export function TabBar() {
  const view = useStore((s) => s.view)
  const setView = useStore((s) => s.setView)

  return (
    <header className="sticky top-0 z-10 bg-bg-primary/95 backdrop-blur border-b border-border">
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-base font-semibold flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <ArrowLeftRight size={16} />
          </span>
          Converter
        </h1>
      </div>
      <nav className="flex border-t border-border">
        <TabButton
          active={view === 'convert'}
          onClick={() => setView('convert')}
          icon={<ArrowLeftRight size={16} />}
          label="Convert"
        />
        <TabButton
          active={view === 'youtube'}
          onClick={() => setView('youtube')}
          icon={<Youtube size={16} />}
          label="YouTube"
        />
      </nav>
    </header>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
        active
          ? 'text-accent border-accent'
          : 'text-gray-400 border-transparent hover:text-gray-200'
      }`}
    >
      {icon} {label}
    </button>
  )
}
