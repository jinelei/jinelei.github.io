import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiChevronLeft, FiChevronRight, FiCalendar, FiX, FiMapPin, FiClock, FiSettings } from 'react-icons/fi'
import type { CalendarEvent } from '../types'

interface CalendarViewProps {
  events: CalendarEvent[]
  loading: boolean
  error: string | null
  onSettings: () => void
}

const DAY_NAMES = ['日', '一', '二', '三', '四', '五', '六']

function getMonthGrid(year: number, month: number): (number | null)[][] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDayOfWeek = firstDay.getDay()
  const daysInMonth = lastDay.getDate()

  const weeks: (number | null)[][] = []
  let week: (number | null)[] = []

  for (let i = 0; i < startDayOfWeek; i++) {
    week.push(null)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    week.push(day)
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  }

  if (week.length > 0) {
    while (week.length < 7) {
      week.push(null)
    }
    weeks.push(week)
  }

  return weeks
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

function getEventsForDay(events: CalendarEvent[], year: number, month: number, day: number): CalendarEvent[] {
  return events.filter(e => {
    const start = new Date(e.start)
    const end = new Date(e.end)
    const dayStart = new Date(year, month, day)
    const dayEnd = new Date(year, month, day + 1)
    return start < dayEnd && end > dayStart
  })
}

const eventColors = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-red-500',
  'bg-indigo-500',
]

function getEventColor(uid: string): string {
  let hash = 0
  for (let i = 0; i < uid.length; i++) {
    hash = uid.charCodeAt(i) + ((hash << 5) - hash)
  }
  return eventColors[Math.abs(hash) % eventColors.length]
}

function EventDetails({ event, onClose }: { event: CalendarEvent; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass rounded-xl p-5 max-w-sm w-full border border-white/10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-3 h-3 rounded-full shrink-0 ${getEventColor(event.uid)}`} />
            <h3 className="text-sm font-semibold text-gray-200 truncate">{event.summary || '无标题'}</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors p-0.5 shrink-0 ml-2">
            <FiX size={16} />
          </button>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex items-center gap-2 text-gray-400">
            <FiClock size={13} className="shrink-0" />
            <span>
              {event.allDay ? (
                `全天 - ${formatDate(event.start)}`
              ) : (
                `${formatDate(event.start)} ${formatTime(event.start)}${event.start.slice(0, 10) !== event.end.slice(0, 10) ? ` - ${formatDate(event.end)} ` : ' - '}${formatTime(event.end)}`
              )}
            </span>
          </div>

          {event.location && (
            <div className="flex items-start gap-2 text-gray-400">
              <FiMapPin size={13} className="shrink-0 mt-0.5" />
              <span>{event.location}</span>
            </div>
          )}

          {event.description && (
            <div className="pt-2 border-t border-white/5">
              <p className="text-gray-400 whitespace-pre-wrap leading-relaxed">{event.description}</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function CalendarView({ events, loading, error, onSettings }: CalendarViewProps) {
  const today = useMemo(() => new Date(), [])
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  const grid = useMemo(() => getMonthGrid(currentYear, currentMonth), [currentYear, currentMonth])
  const monthLabel = `${currentYear}年${currentMonth + 1}月`

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(y => y - 1)
      setCurrentMonth(11)
    } else {
      setCurrentMonth(m => m - 1)
    }
  }

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear(y => y + 1)
      setCurrentMonth(0)
    } else {
      setCurrentMonth(m => m + 1)
    }
  }

  const goToToday = () => {
    setCurrentYear(today.getFullYear())
    setCurrentMonth(today.getMonth())
  }

  return (
    <div className="glass rounded-xl border border-white/5 overflow-hidden">
      <div className="flex items-center justify-between px-3 sm:px-5 py-3 border-b border-white/5">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={goToToday}
            className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-colors font-medium shrink-0"
          >
            今天
          </button>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={goToPrevMonth}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-white/5 transition-colors"
            >
              <FiChevronLeft size={16} />
            </button>
            <button
              onClick={goToNextMonth}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-white/5 transition-colors"
            >
              <FiChevronRight size={16} />
            </button>
          </div>
          <h2 className="text-sm font-semibold text-gray-200 truncate">{monthLabel}</h2>
        </div>
        <button
          onClick={onSettings}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-white/5 transition-colors shrink-0"
          title="日历设置"
        >
          <FiSettings size={15} />
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <div className="w-6 h-6 border-2 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-500 mt-2">加载事件中...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center">
          <FiCalendar size={28} className="mx-auto text-rose-400/60" />
          <p className="text-xs text-gray-500 mt-2">{error}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7">
            {DAY_NAMES.map(name => (
              <div key={name} className="text-center py-2 text-[11px] font-medium text-gray-500 border-b border-white/5">
                {name}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {grid.flat().map((day, idx) => {
              if (day === null) {
                return <div key={`e-${idx}`} className="min-h-[70px] sm:min-h-[100px] border-b border-r border-white/5 last:border-r-0" />
              }

              const dayEvents = getEventsForDay(events, currentYear, currentMonth, day)
              const isToday = today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === day

              return (
                <div
                  key={day}
                  className="min-h-[70px] sm:min-h-[100px] border-b border-r border-white/5 last:border-r-0 p-0.5 sm:p-1 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center justify-center sm:justify-start mb-0.5">
                    <span className={`text-[11px] sm:text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full ${
                      isToday ? 'bg-accent-500 text-white' : 'text-gray-400'
                    }`}>
                      {day}
                    </span>
                  </div>
                  <div className="hidden sm:block space-y-[1.5px]">
                    {dayEvents.slice(0, 3).map(event => (
                      <div
                        key={event.uid}
                        className={`${getEventColor(event.uid)} bg-opacity-80 rounded-[3px] px-1 py-[1px] truncate cursor-pointer hover:opacity-80 transition-opacity`}
                        onClick={() => setSelectedEvent(event)}
                        title={event.summary || '无标题'}
                      >
                        <span className="text-[10px] leading-none text-white font-medium">
                          {event.allDay ? '' : `${formatTime(event.start)} `}
                          {event.summary || '无标题'}
                        </span>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[10px] text-gray-500 px-1">+{dayEvents.length - 3} 更多</div>
                    )}
                  </div>
                  <div className="sm:hidden flex flex-wrap gap-[2px] px-0.5 mt-0.5">
                    {dayEvents.slice(0, 4).map(event => (
                      <div
                        key={event.uid}
                        className={`w-1.5 h-1.5 rounded-full ${getEventColor(event.uid)}`}
                        onClick={() => setSelectedEvent(event)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      <AnimatePresence>
        {selectedEvent && (
          <EventDetails event={selectedEvent} onClose={() => setSelectedEvent(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
