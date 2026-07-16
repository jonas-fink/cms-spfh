import { useNavigate } from 'react-router';
import { Icon } from '../components/shared';
import {
    DashboardGreeting,
    KPIStrip,
    ClientsGrid,
    WeeklyChart,
    UpcomingAppointmentsRail,
    OpenTasksRail,
} from '../components/dashboard';
import { SectionHeader } from '../components/shared';
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { formatDuration } from '../utils/format';

export default function FKDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const {
        clients,
        upcomingAppts,
        openTasks,
        minutesPerDay,
        weekDays,
        kw,
        kpis,
        weekCounts,
        loading,
        error,
    } = useDashboardData();

    if (loading) {
        return (
            <div className="px-8 pt-7 pb-16 max-w-7xl mx-auto">
                <div className="flex items-center gap-3 text-muted text-[13px]">
                    <Icon name="clock" size={14} />
                    Lade Dashboard…
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="px-8 pt-7 pb-16 max-w-7xl mx-auto">
                <div
                    className="flex items-center gap-2 text-[13px]"
                    style={{ color: '#dc2626' }}
                >
                    <Icon name="alert" size={14} />
                    {error}
                </div>
            </div>
        );
    }

    const totalH = Math.floor(kpis.minutesThisWeek / 60);
    const totalM = kpis.minutesThisWeek % 60;
    const stundenValue =
        kpis.minutesThisWeek > 0 ? formatDuration(totalH, totalM) : '0h';

    return (
        <div className="max-w-7xl mx-auto">
            <div
                className="grid gap-6 grid-cols-1 lg:grid-cols-[1fr_320px] items-start"
            >
                <div className="flex flex-col gap-7">
                    <DashboardGreeting
                        firstName={user?.firstName}
                        today={new Date()}
                        kw={kw}
                    />

                    <KPIStrip
                        activeClients={kpis.activeClients}
                        totalClients={clients.length}
                        stundenValue={stundenValue}
                        weekCounts={weekCounts}
                        openGoals={kpis.openGoals}
                    />

                    <ClientsGrid
                        clients={clients}
                        activeCount={kpis.activeClients}
                        onClientClick={(id) => navigate(`/clients/${id}`)}
                        onShowAll={() => navigate('/clients')}
                    />

                    <section>
                        <SectionHeader title="Stunden diese Woche" sub="durchgeführte Termine" />
                        <div className="mt-4">
                            <WeeklyChart minutesPerDay={minutesPerDay} weekDays={weekDays} totalMinutes={kpis.minutesThisWeek} kw={kw} />
                        </div>
                    </section>
                </div>

                <div className="flex flex-col gap-6">
                    <UpcomingAppointmentsRail
                        appts={upcomingAppts}
                        onShowAll={() => navigate('/calendar')}
                    />
                    <OpenTasksRail
                        tasks={openTasks}
                        onTaskClick={(id) => navigate(`/clients/${id}`)}
                    />
                </div>
            </div>
        </div>
    );
}
