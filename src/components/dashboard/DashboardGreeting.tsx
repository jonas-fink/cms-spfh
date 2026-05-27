import { formatDate, getGreeting } from '../../utils/format';

interface DashboardGreetingProps {
    firstName?: string;
    today: Date;
    kw: number;
}

const DashboardGreeting = ({
    firstName,
    today,
    kw,
}: DashboardGreetingProps) => (
    <div>
        <h1 className="text-[24px] font-semibold text-text tracking-[-0.02em]">
            {getGreeting()}, <span>{firstName}</span>
        </h1>
        <p className="text-[13px] text-muted mt-1">
            {formatDate(today.toISOString(), { full: true })} · KW {kw}
        </p>
    </div>
);

export default DashboardGreeting;
