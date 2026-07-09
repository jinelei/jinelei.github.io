import { useMemo } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import type { DailyCount } from '../types'

interface Props {
  data: DailyCount[]
  year: number
  month: number
  selectedDate: string
  onPrevMonth: () => void
  onNextMonth: () => void
  onSelectDate: (date: string) => void
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function heatDot(count: number): string {
  if (count === 0) return ''
  if (count <= 2) return 'bg-green-500'
  if (count <= 5) return 'bg-lime-500'
  if (count <= 10) return 'bg-yellow-500'
  return 'bg-red-500'
}

export default function CalendarHeatmap({ data, year, month, selectedDate, onPrevMonth, onNextMonth, onSelectDate }: Props) {
  const countMap = useMemo(() => {
    const m = new Map<string, number>()
    for (const d of data) m.set(d.date, d.count)
    return m
  }, [data])

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const cells: { day: number; dateStr: string; count: number; isCurrentMonth: boolean }[] = []
    for (let i = 0; i < firstDay.getDay(); i++) {
      cells.push({ day: 0, dateStr: '', count: 0, isCurrentMonth: false })
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`
      cells.push({ day: d, dateStr, count: countMap.get(dateStr) || 0, isCurrentMonth: true })
    }
    while (cells.length % 7 !== 0) {
      cells.push({ day: 0, dateStr: '', count: 0, isCurrentMonth: false })
    }
    return cells
  }, [year, month, countMap])

  const todayStr = (() => {
    const t = new Date()
    return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`
  })()

  return (
    <div className="glass rounded-xl p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          <button onClick={onPrevMonth} className="p-0.5 rounded text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all cursor-pointer">
            <FiChevronLeft size={13} />
          </button>
          <span className="text-xs text-gray-400 w-20 text-center tabular-nums select-none">{year} 年 {month + 1} 月</span>
          <button onClick={onNextMonth} className="p-0.5 rounded text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all cursor-pointer">
            <FiChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 mb-0.5">
        {WEEKDAYS.map(w => (
          <div key={w} className="text-center text-[9px] text-gray-600 leading-none py-0.5">{w}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-0">
        {days.map((cell, i) => {
          if (!cell.isCurrentMonth) return <div key={i} />

          const isSelected = selectedDate === cell.dateStr
          const isToday = todayStr === cell.dateStr
          const dot = heatDot(cell.count)

          return (
            <button
              key={i}
              onClick={() => onSelectDate(cell.dateStr)}
              className={`
                relative flex flex-col items-center justify-center h-7 sm:h-8 text-xs
                transition-all duration-150 cursor-pointer select-none rounded
                ${isSelected
                  ? 'bg-accent-500/15 text-accent-400 font-semibold'
                  : isToday
                    ? 'text-gray-200 font-medium'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
                }
                ${isToday && !isSelected ? 'ring-1 ring-accent-500/40' : ''}
              `}
            >
              {cell.day}
              {(cell.count > 0 || isToday) && (
                <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${dot || 'bg-gray-500'}`} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
