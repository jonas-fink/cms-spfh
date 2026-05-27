import { SectionHeader } from '../shared';
import WeeklyChart from './WeeklyChart';

interface WeeklyChartSectionProps {
    minutesPerDay: number[];
    weekDays: Date[];
    totalMinutes: number;
    kw: number;
}

const WeeklyChartSection = (props: WeeklyChartSectionProps) => (
    <section>
        <SectionHeader
            title="Stunden diese Woche"
            sub="durchgeführte Termine"
        />
        <div className="mt-4">
            <WeeklyChart {...props} />
        </div>
    </section>
);

export default WeeklyChartSection;
