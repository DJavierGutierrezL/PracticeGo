
import React from 'react';

interface StreakCalendarProps {
    activities: Record<string, { count: number; points: number }>;
    streak: number;
    lastPracticed: string | null;
}

export const StreakCalendar: React.FC<StreakCalendarProps> = ({ activities, streak, lastPracticed }) => {
    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Create an array of the last 30 days
    const calendarDays = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(today.getDate() - i);
        return date;
    }).reverse();

    // Determine current streak days
    const streakDays = new Set<string>();
    if (lastPracticed) {
        const lastDate = new Date(lastPracticed);
        const isTodayPracticed = today.toISOString().split('T')[0] === lastDate.toISOString().split('T')[0];
        if (isTodayPracticed || streak > 0) {
            const currentStreak = isTodayPracticed ? streak : streak;
            for (let i = 0; i < currentStreak; i++) {
                const date = new Date(lastDate);
                date.setDate(lastDate.getDate() - i);
                streakDays.add(date.toISOString().split('T')[0]);
            }
        }
    }


    const getDayStatus = (date: Date): { status: 'practiced' | 'missed' | 'milestone' | 'future'; points: number } => {
        const dateStr = date.toISOString().split('T')[0];
        const isFuture = date > today;
        
        if (isFuture) return { status: 'future', points: 0 };

        const activity = activities[dateStr];
        const isPracticed = !!activity;
        const isStreakDay = streakDays.has(dateStr);

        if (isPracticed) {
            const currentStreakOnThisDay = Array.from(streakDays).filter(d => new Date(d) <= date).length;
            if (currentStreakOnThisDay === 7 || currentStreakOnThisDay === 14 || currentStreakOnThisDay === 30) {
                return { status: 'milestone', points: activity.points };
            }
            return { status: 'practiced', points: activity.points };
        }
        
        return { status: 'missed', points: 0 };
    };

    const statusStyles = {
        practiced: { icon: '✅', bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-800 dark:text-green-300' },
        missed: { icon: '🔴', bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-800 dark:text-red-300' },
        milestone: { icon: '⭐', bg: 'bg-yellow-100 dark:bg-yellow-400/20', text: 'text-yellow-800 dark:text-yellow-300' },
        future: { icon: '', bg: 'bg-gray-50 dark:bg-gray-800/50', text: 'text-gray-400' },
    };

    return (
         <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4">Calendario de Rachas (Últimos 30 Días)</h3>
            <div className="grid grid-cols-7 gap-1">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                    <div key={day} className="text-center font-bold text-xs text-gray-400 dark:text-gray-500">{day}</div>
                ))}
                {/* Placeholder for first day of week */}
                {Array.from({ length: (calendarDays[0].getDay() + 6) % 7 }).map((_, i) => (
                    <div key={`empty-${i}`}></div>
                ))}

                {calendarDays.map(date => {
                    const { status, points } = getDayStatus(date);
                    const styles = statusStyles[status];
                    const isTodayFlag = date.toISOString().split('T')[0] === today.toISOString().split('T')[0];
                    return (
                        <div key={date.toISOString()} className="relative group">
                             <div className={`w-full aspect-square flex flex-col items-center justify-center rounded-lg ${styles.bg} ${isTodayFlag ? 'ring-2 ring-primary-500' : ''}`}>
                                <span className="text-2xl">{styles.icon}</span>
                                <span className={`text-xs font-bold ${styles.text}`}>{date.getDate()}</span>
                            </div>
                            {status === 'practiced' || status === 'milestone' ? (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                    {points} puntos
                                </div>
                            ) : null}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
