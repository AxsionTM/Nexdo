"use client";

import { useEffect, useMemo, useState, type DragEvent } from "react";
import { useTasksStore } from "@/stores/tasks";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const START_HOUR = 7;
const END_HOUR = 22;
const HOUR_HEIGHT = 72;
const DAY_MINUTES = (END_HOUR - START_HOUR) * 60;

function startOfDay(d: Date) {
  const x = new Date(d); x.setHours(0, 0, 0, 0); return x;
}
function dayLabel(d: Date) {
  const today = startOfDay(new Date()), target = startOfDay(d);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  const weekday = d.toLocaleDateString("ru-RU", { weekday: "short" });
  const day = d.getDate();
  if (diff === 0) return { title: "Сегодня", sub: `${day}, ${weekday}` };
  if (diff === 1) return { title: "Завтра", sub: `${day}, ${weekday}` };
  if (diff === -1) return { title: "Вчера", sub: `${day}, ${weekday}` };
  return { title: d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" }), sub: weekday };
}
function minuteOfDay(d: Date) { return d.getHours() * 60 + d.getMinutes(); }
function overlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

export function AgendaView() {
  const { tasks, todayTasks, overdueTasks, setSelectedTask, completeTask, selectedTaskId, fetchTasks, fetchToday, fetchOverdue, updateTask } = useTasksStore();
  const [dayOffset, setDayOffset] = useState(0);
  const [dragOverMinute, setDragOverMinute] = useState<number | null>(null);

  useEffect(() => {
    fetchTasks({ includeCompleted: "false" }); fetchToday(); fetchOverdue();
  }, [fetchTasks, fetchToday, fetchOverdue]);

  const day = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() + dayOffset); return startOfDay(d);
  }, [dayOffset]);
  const label = dayLabel(day);

  const dayTasks = useMemo(() => {
    const all = [...tasks, ...todayTasks, ...overdueTasks], seen = new Set<string>(), list: any[] = [];
    const dayStart = new Date(day), dayEnd = new Date(day); dayEnd.setHours(23,59,59,999);
    for (const t of all) {
      if (seen.has(t.id) || t.status === "COMPLETED" || t.parentId) continue;
      const start = t.startDate ? new Date(t.startDate) : null, due = t.dueDate ? new Date(t.dueDate) : null;
      if (!start && !due) continue;
      const overlaps = (start ? start <= dayEnd : true) && (due ? due >= dayStart : true);
      if (overlaps) { seen.add(t.id); list.push(t); }
    }
    return list;
  }, [tasks, todayTasks, overdueTasks, day]);

  const allDay = dayTasks.filter(t => t.isAllDay !== false && !t.startDate);
  const timed = dayTasks.filter(t => !(t.isAllDay !== false && !t.startDate));

  const dropAtMinute = async (e: DragEvent, minute: number) => {
    e.preventDefault(); setDragOverMinute(null);
    const taskId = e.dataTransfer.getData("text/task-id"); if (!taskId) return;
    const start = new Date(day); start.setHours(Math.floor(minute/60), minute%60, 0, 0);
    const end = new Date(start); end.setMinutes(end.getMinutes() + 60);
    await updateTask(taskId, { startDate: start.toISOString(), dueDate: end.toISOString(), isAllDay: false });
  };
  const dropAllDay = async (e: DragEvent) => {
    e.preventDefault(); const taskId=e.dataTransfer.getData("text/task-id"); if(!taskId)return;
    const d=new Date(day); d.setHours(12,0,0,0);
    await updateTask(taskId,{dueDate:d.toISOString(),isAllDay:true,startDate:null});
  };
  const onDragStart=(e:DragEvent,id:string)=>{e.dataTransfer.setData("text/task-id",id);e.dataTransfer.effectAllowed="move";};

  const gridTop = START_HOUR * 60;
  return <div className="flex-1 flex flex-col min-h-0">
    <header className="px-4 py-3 border-b flex items-center justify-between gap-3">
      <div><h1 className="text-lg font-semibold flex items-center gap-2"><CalIcon className="h-5 w-5 text-primary"/>{label.title}</h1><p className="text-xs text-muted-foreground capitalize">{label.sub}</p></div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={()=>setDayOffset(o=>o-1)}><ChevronLeft className="h-4 w-4"/></Button>
        <Button variant="outline" size="sm" className="h-8 px-3" onClick={()=>setDayOffset(0)}>Сегодня</Button>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={()=>setDayOffset(o=>o+1)}><ChevronRight className="h-4 w-4"/></Button>
      </div>
    </header>
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-3 border-b min-h-[64px]" onDragOver={e=>e.preventDefault()} onDrop={dropAllDay}>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">Весь день · перетащите задачу сюда или на время</p>
        <div className="space-y-1.5">{allDay.map(t=><AgendaCard key={t.id} task={t} selected={selectedTaskId===t.id} onSelect={()=>setSelectedTask(t.id)} onComplete={()=>completeTask(t.id)} onDragStart={onDragStart}/>)}</div>
      </div>
      <div className="relative px-2 py-2" style={{height:(END_HOUR-START_HOUR)*HOUR_HEIGHT+16}}>
        <div className="absolute left-2 right-2 top-2" style={{height:(END_HOUR-START_HOUR)*HOUR_HEIGHT}}>
          {Array.from({length:END_HOUR-START_HOUR},(_,i)=>{
            const hour=START_HOUR+i, top=i*HOUR_HEIGHT;
            return <div key={hour} className={cn("absolute left-0 right-0 border-t border-border/60",dragOverMinute!==null && dragOverMinute>=hour*60 && dragOverMinute<(hour+1)*60 && "bg-primary/10")} style={{top}} onDragOver={e=>{e.preventDefault();setDragOverMinute(hour*60)}} onDrop={e=>dropAtMinute(e,hour*60)}>
              <div className="absolute left-0 -top-2 w-12 text-right pr-2"><span className="text-[11px] text-muted-foreground tabular-nums">{String(hour).padStart(2,"0")}:00</span></div>
            </div>;
          })}
          <div className="absolute left-14 right-0 top-0" style={{height:DAY_MINUTES/60*HOUR_HEIGHT}}>
            {timed.map(t=><TimedAgendaCard key={t.id} task={t} day={day} selected={selectedTaskId===t.id} onSelect={()=>setSelectedTask(t.id)} onComplete={()=>completeTask(t.id)} onDragStart={onDragStart}/>)}
          </div>
        </div>
      </div>
      {dayTasks.length===0 && <div className="flex flex-col items-center justify-center py-16 text-muted-foreground"><CalIcon className="h-8 w-8 mb-2 opacity-40"/><p className="text-sm">Нет задач на этот день</p><p className="text-xs mt-1">Назначьте срок задаче, чтобы увидеть её здесь</p></div>}
    </div>
  </div>;
}

function TimedAgendaCard({task,day,selected,onSelect,onComplete,onDragStart}:{task:any;day:Date;selected:boolean;onSelect:()=>void;onComplete:()=>void;onDragStart:(e:DragEvent,id:string)=>void}) {
  const start=task.startDate?new Date(task.startDate):task.dueDate?new Date(task.dueDate):new Date(day);
  const end=task.dueDate?new Date(task.dueDate):new Date(start.getTime()+3600000);
  const dayStart=new Date(day); dayStart.setHours(0,0,0,0);
  const dayEnd=new Date(day); dayEnd.setHours(23,59,59,999);
  const visibleStart=new Date(Math.max(start.getTime(),dayStart.getTime()));
  const visibleEnd=new Date(Math.min(end.getTime(),dayEnd.getTime()));
  const from=Math.max(START_HOUR*60,minuteOfDay(visibleStart));
  const to=Math.min(END_HOUR*60,minuteOfDay(visibleEnd));
  const duration=Math.max(30,to-from);
  const top=((from-START_HOUR*60)/60)*HOUR_HEIGHT;
  const height=Math.max(42,(duration/60)*HOUR_HEIGHT-4);
  const time=`${start.toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit"})} – ${end.toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit"})}`;
  return <div draggable onDragStart={e=>onDragStart(e,task.id)} onClick={onSelect} className={cn("absolute left-1 right-2 rounded-lg border bg-card overflow-hidden cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md",selected&&"ring-2 ring-primary/40")} style={{top,height}}>
    <div className="h-full flex"><div className="w-1 shrink-0" style={{backgroundColor:task.project?.color||"#4A90D9"}}/><div className="flex-1 px-3 py-2 min-w-0"><p className="text-[11px] font-medium text-muted-foreground mb-0.5">{time}</p><div className="flex items-center gap-2"><div onClick={e=>{e.stopPropagation();onComplete()}}><Checkbox checked={task.status==="COMPLETED"} priority={task.priority}/></div><p className="text-sm font-medium truncate">{task.title}</p></div>{task.project&&<p className="text-[11px] text-muted-foreground mt-0.5 truncate pl-6">{task.project.name}</p>}</div></div>
  </div>;
}
function AgendaCard({task,selected,onSelect,onComplete,onDragStart}:{task:any;selected:boolean;onSelect:()=>void;onComplete:()=>void;onDragStart:(e:DragEvent,id:string)=>void}) {
 return <div draggable onDragStart={e=>onDragStart(e,task.id)} onClick={onSelect} className={cn("group flex items-stretch rounded-lg border bg-card overflow-hidden cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md",selected&&"ring-2 ring-primary/40")}><div className="w-1 shrink-0" style={{backgroundColor:task.project?.color||"#4A90D9"}}/><div className="flex-1 px-3 py-2 min-w-0"><div className="flex items-center gap-2"><div onClick={e=>{e.stopPropagation();onComplete()}}><Checkbox checked={task.status==="COMPLETED"} priority={task.priority}/></div><p className="text-sm font-medium truncate">{task.title}</p></div></div></div>;
}
