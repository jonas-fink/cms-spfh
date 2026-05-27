import { SectionHeader, Icon } from '../shared';

const OpenTasksRail = () => (
    <section>
        <SectionHeader title="Offene Aufgaben" />

        <div className="bg-surface border border-border rounded-lg p-4 mt-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 py-1">
                <span style={{ color: 'var(--border-strong)' }}>
                    <Icon name="check" size={13} />
                </span>
                <p className="text-[13px] text-muted italic">
                    Aufgaben werden aus Hilfeplänen geladen…
                </p>
            </div>
        </div>
    </section>
);

export default OpenTasksRail;
