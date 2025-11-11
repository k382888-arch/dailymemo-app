import React, { useEffect, useMemo, useRef, useState } from 'react'

// ---- 데이터 타입 ----
// Difficulty: '쉬움' | '보통' | '어려움'

// ---- 유틸 함수 ----
const pad2 = (n) => String(n).padStart(2, '0')
const fmt = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
const todayStr = () => fmt(new Date())

const newId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

const STORAGE_KEY = 'dailyMemoTasks.v1'

const diffStyle = (d) => {
  switch (d) {
    case '쉬움':
      return 'bg-green-50 text-green-700 ring-1 ring-green-200'
    case '보통':
      return 'bg-amber-50 text-amber-800 ring-1 ring-amber-200'
    case '어려움':
      return 'bg-red-50 text-red-700 ring-1 ring-red-200'
    default:
      return 'bg-gray-50 text-gray-700 ring-1 ring-gray-200'
  }
}

export default function App() {
  const [tasks, setTasks] = useState([])
  const [selectedDate, setSelectedDate] = useState(todayStr())

  const [title, setTitle] = useState('')
  const [timeHHMM, setTimeHHMM] = useState('09:00')
  const [difficulty, setDifficulty] = useState('보통')

  const titleRef = useRef(null)

  // Load
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setTasks(parsed)
      } catch {}
    }
  }, [])

  // Save
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  // Midnight rollover watcher
  useEffect(() => {
    let lastDay = todayStr()
    const id = setInterval(() => {
      const nowDay = todayStr()
      if (nowDay !== lastDay) {
        lastDay = nowDay
        rolloverToToday()
        setSelectedDate(nowDay)
      }
    }, 30 * 1000)
    return () => clearInterval(id)
  }, [tasks])

  const rolloverToToday = () => {
    const today = todayStr()
    setTasks(prev => {
      const next = prev.map(t => {
        if (!t.done && t.dueDate < today) {
          return { ...t, dueDate: today, rolledOverToday: true }
        }
        return { ...t, rolledOverToday: t.dueDate === today && t.rolledOverToday }
      })
      return next
    })
  }

  useEffect(() => {
    rolloverToToday()
  }, [])

  const viewTasks = useMemo(() => {
    const onDate = tasks.filter(t => t.dueDate === selectedDate)
    const [done, notDone] = partition(onDate, t => t.done)
    const rolled = notDone.filter(t => t.rolledOverToday && t.dueDate === todayStr())
    const normal = notDone.filter(t => !t.rolledOverToday || t.dueDate !== todayStr())

    const byTime = (a, b) => (a.timeHHMM || '').localeCompare(b.timeHHMM || '')
    rolled.sort(byTime)
    normal.sort(byTime)
    done.sort(byTime)

    return [...rolled, ...normal, ...done]
  }, [tasks, selectedDate])

  const addTask = () => {
    const t = title.trim()
    if (!t) return
    const id = newId()
    const newTask = {
      id,
      title: t,
      timeHHMM,
      difficulty,
      done: FalseToBool(false),
      dueDate: selectedDate,
      rolledOverToday: false,
    }
    setTasks(prev => [...prev, newTask])
    setTitle('')
    setTimeout(() => titleRef.current?.focus(), 0)
  }

  const toggleDone = (id) => setTasks(prev => prev.map(t => (t.id === id ? { ...t, done: !t.done, rolledOverToday: false } : t)))
  const removeTask = (id) => setTasks(prev => prev.filter(t => t.id !== id))

  const moveTaskToAnotherDay = (id, dayStr) =>
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, dueDate: dayStr, rolledOverToday: false } : t)))

  const duplicateTaskToTomorrow = (id) =>
    setTasks(prev => {
      const src = prev.find(t => t.id === id)
      if (!src) return prev
      const tomorrow = fmt(addDays(new Date(src.dueDate), 1))
      return [
        ...prev,
        { ...src, id: newId(), dueDate: tomorrow, done: false, rolledOverToday: false }
      ]
    })

  const clearCompletedOnDate = () =>
    setTasks(prev => prev.filter(t => !(t.dueDate === selectedDate && t.done)))

  const rolloverNow = () => rolloverToToday()

  const gotoToday = () => setSelectedDate(todayStr())
  const goto = (offset) => {
    const d = addDays(new Date(selectedDate), offset)
    setSelectedDate(fmt(d))
  }

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `daily-memo-${todayStr()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importJSON = (file) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        if (Array.isArray(parsed)) setTasks(parsed)
      } catch (e) {
        alert('불러오기에 실패했습니다. JSON 파일을 확인하세요.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-3">
          <div className="text-xl font-bold">일일 메모지</div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={gotoToday} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">오늘</button>
            <button onClick={() => goto(-1)} className="rounded-lg border px-2 py-1.5 text-sm">◀</button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border px-3 py-1.5 text-sm"
            />
            <button onClick={() => goto(1)} className="rounded-lg border px-2 py-1.5 text-sm">▶</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">스케줄 · {selectedDate}</h2>
            <div className="flex gap-2">
              <button onClick={rolloverNow} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">수동 이월</button>
              <button onClick={clearCompletedOnDate} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">완료 정리</button>
            </div>
          </div>

          {viewTasks.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-gray-500">해당 날짜의 작업이 없습니다. 우측에서 작업을 추가하세요.</div>
          ) : (
            <ul className="space-y-2">
              {viewTasks.map((t) => (
                <li key={t.id} className={`group rounded-xl border p-3 ${t.done ? 'opacity-60' : ''}`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={t.done}
                      onChange={() => toggleDone(t.id)}
                      className="mt-1 size-4"
                      aria-label="완료 토글"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {t.rolledOverToday && t.dueDate === todayStr() && !t.done && (
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 ring-1 ring-blue-200">이월</span>
                        )}
                        <span className="text-sm text-gray-500 tabular-nums">{t.timeHHMM}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs ${diffStyle(t.difficulty)}`}>{t.difficulty}</span>
                        <span className={`font-medium ${t.done ? 'line-through text-gray-500' : ''}`}>{t.title}</span>
                      </div>

                      <div className="mt-2 hidden gap-2 text-xs text-gray-500 sm:flex">
                        <button onClick={() => duplicateTaskToTomorrow(t.id)} className="rounded-md border px-2 py-1 hover:bg-gray-50">내일 복제</button>
                        <button onClick={() => moveTaskToAnotherDay(t.id, fmt(addDays(new Date(t.dueDate), -1)))} className="rounded-md border px-2 py-1 hover:bg-gray-50">어제로 이동</button>
                        <button onClick={() => moveTaskToAnotherDay(t.id, fmt(addDays(new Date(t.dueDate), 1)))} className="rounded-md border px-2 py-1 hover:bg-gray-50">내일로 이동</button>
                        <button onClick={() => removeTask(t.id)} className="rounded-md border px-2 py-1 text-red-700 hover:bg-red-50">삭제</button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">작업 추가</h2>

          <div className="mb-3 grid grid-cols-2 gap-2">
            <label className="col-span-2 text-sm text-gray-600">제목</label>
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
              placeholder="예: 10시 회의, 블로그 초안, 구매 발주"
              className="col-span-2 rounded-lg border px-3 py-2"
            />

            <div className="col-span-1">
              <label className="text-sm text-gray-600">시간</label>
              <input
                type="time"
                value={timeHHMM}
                onChange={(e) => setTimeHHMM(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              />
            </div>

            <div className="col-span-1">
              <label className="text-sm text-gray-600">난이도</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              >
                <option>쉬움</option>
                <option>보통</option>
                <option>어려움</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="text-sm text-gray-600">날짜</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              />
            </div>
          </div>

          <button onClick={addTask} className="w-full rounded-lg border bg-gray-900 px-3 py-2 text-white hover:bg-gray-800">추가</button>

          <div className="mt-6 border-t pt-4">
            <h3 className="mb-2 text-sm font-semibold">백업</h3>
            <div className="flex items-center gap-2">
              <button onClick={exportJSON} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">내보내기</button>
              <label className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 cursor-pointer">
                불러오기
                <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files && importJSON(e.target.files[0])} />
              </label>
            </div>
          </div>

          <div className="mt-6 border-t pt-4 text-xs text-gray-500 leading-relaxed">
            · 미완료 작업은 하루가 바뀌면 자동으로 오늘 상단에 이월됩니다.<br />
            · 이월된 작업은 "이월" 배지가 표시됩니다.<br />
            · 완료된 작업은 흐리게 표시되며, "완료 정리"로 숨길 수 있습니다.
          </div>
        </aside>
      </main>

      <footer className="mx-auto max-w-5xl px-4 pb-10 text-xs text-gray-500">
        <div className="mt-4">로컬 저장소에만 저장됩니다.</div>
      </footer>
    </div>
  )
}

// Helpers
function addDays(d, n) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}
function partition(arr, pred) {
  const yes = []
  const no = []
  for (const x of arr) (pred(x) ? yes : no).push(x)
  return [yes, no]
}
function FalseToBool(v){ return !!v }
