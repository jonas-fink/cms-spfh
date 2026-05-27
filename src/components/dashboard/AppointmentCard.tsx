import { formatDate, formatTime, isSameDay } from '../../utils/format';
import type { UpcomingAppt } from '../../hooks/useDashboardData';

interface AppointmentCardProps {
    appt: UpcomingAppt;
}

const AppointmentCard = ({ appt }: AppointmentCardProps) => {
    const apptDate = new Date(appt.date);
    const isToday = isSameDay(apptDate, new Date());

    return (
        <div className="bg-surface border border-border rounded-lg p-3.5">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[13px] font-medium text-text leading-snug truncate">
                        {appt.clientFamilyName}
                    </p>
                    <p className="text-[11.5px] text-muted mt-0.5">
                        {appt.type}
                    </p>
                </div>
                <div className="text-right shrink-0">
                    <p
                        className="text-[12px] font-medium tabular-nums"
                        style={{
                            color: isToday ? 'var(--accent)' : 'var(--text)',
                        }}
                    >
                        {isToday
                            ? 'Heute'
                            : formatDate(appt.date, { relative: true })}
                    </p>
                    <p className="text-[11.5px] text-muted">
                        {formatTime(appt.date)}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AppointmentCard;
