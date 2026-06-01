import { SectionHeader, Icon } from '../shared';
import type { OpenTask } from '../../types';

interface OpenTasksRailProps {
    tasks: OpenTask[];
    onTaskClick?: (clientId: string) => void;
}

const OpenTasksRail = ({ tasks, onTaskClick }: OpenTasksRailProps) => (
    <section>
        <SectionHeader title="Offene Aufgaben" />

        <div className="bg-surface border border-border rounded-lg mt-4">
            {tasks.length === 0 ? (
                <div className="p-4">
                    <p className="text-[13px] text-muted">
                        Keine offenen Aufgaben.
                    </p>
                </div>
            ) : (
                <ul className="flex flex-col max-h-90 overflow-y-auto">
                    {tasks.map((task, idx) => (
                        <li
                            key={`${task.clientId}-${idx}`}
                            className="flex items-start gap-2 px-4 py-2.5 border-b border-border last:border-b-0"
                        >
                            <span
                                className="mt-0.5"
                                style={{ color: 'var(--border-strong)' }}
                            >
                                <Icon name="check" size={13} />
                            </span>
                            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                <p className="text-[13px] text-text leading-snug">
                                    {task.goal}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => onTaskClick?.(task.clientId)}
                                    className="text-[11px] text-muted text-left hover:text-text transition-colors truncate"
                                >
                                    {task.clientName}
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    </section>
);

export default OpenTasksRail;
