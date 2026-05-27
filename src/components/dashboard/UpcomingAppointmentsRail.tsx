import { SectionHeader } from '../shared';
import AppointmentCard from './AppointmentCard';
import type { UpcomingAppt } from '../../hooks/useDashboardData';

interface UpcomingAppointmentsRailProps {
    appts: UpcomingAppt[];
    onShowAll: () => void;
}

const UpcomingAppointmentsRail = ({
    appts,
    onShowAll,
}: UpcomingAppointmentsRailProps) => (
    <section>
        <SectionHeader
            title="Anstehende Termine"
            action={appts.length > 0 ? 'Alle Termine' : undefined}
            onAction={onShowAll}
        />

        <div className="flex flex-col gap-2.5 mt-4">
            {appts.length === 0 ? (
                <div className="bg-surface border border-border rounded-lg p-4">
                    <p className="text-[13px] text-muted">
                        Keine anstehenden Termine.
                    </p>
                </div>
            ) : (
                appts.map((appt) => (
                    <AppointmentCard key={appt.id} appt={appt} />
                ))
            )}
        </div>
    </section>
);

export default UpcomingAppointmentsRail;
