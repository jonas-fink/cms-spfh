import { Button, Card, GoalCheck, SectionHeader } from '../shared';
import { Icon } from '../shared';
import { formatDate } from '../../utils/format';
import type { HilfePlan } from '../../types';

interface TabHilfePlanProps {
    hilfeplan: HilfePlan | null;
    onGoalsChange: (goals: HilfePlan['goals']) => void;
}

export function TabHilfePlan({ hilfeplan, onGoalsChange }: TabHilfePlanProps) {
    const goals = hilfeplan?.goals ?? [];

    const reached = goals.filter((g) => g.status === 'erreicht').length;
    const progress =
        goals.length > 0 ? Math.round((reached / goals.length) * 100) : 0;

    if (!hilfeplan) {
        return (
            <Card>
                <div className="p-12 flex flex-col items-center gap-3 text-center">
                    <div className="w-12 h-12 rounded-xl bg-accent/8 flex items-center justify-center">
                        <Icon
                            name="target"
                            size={22}
                            stroke={1.5}
                            color="var(--accent)"
                        />
                    </div>
                    <p className="text-[13px] text-muted m-0">
                        Noch kein Hilfeplan vorhanden.
                    </p>
                    <Button variant="accent" size="md" icon="plus">
                        Hilfeplan erstellen
                    </Button>
                </div>
            </Card>
        );
    }

    const updateStatus = (
        idx: number,
        status: 'offen' | 'in Bearbeitung' | 'erreicht',
    ) => {
        onGoalsChange(goals.map((g, i) => (i === idx ? { ...g, status } : g)));
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
            {/* Links */}
            <div className="flex flex-col gap-4">
                <Card>
                    <div className="px-5 pt-4 pb-3">
                        <SectionHeader
                            title="Inhalt"
                            sub={`Version ${hilfeplan.version}`}
                            action="Bearbeiten"
                            onAction={() => {}}
                        />
                    </div>
                    <p className="px-5 pb-5 text-[13px] text-text leading-[1.7] whitespace-pre-wrap m-0">
                        {hilfeplan.content}
                    </p>
                </Card>

                <Card>
                    <div className="px-5 pt-4 pb-3">
                        <SectionHeader
                            title="Ziele"
                            sub={`${reached} von ${goals.length} erreicht`}
                            action="Ziel hinzufügen"
                            onAction={() => {}}
                        />
                    </div>
                    <div className="px-5 pb-4">
                        {goals.map((g, i) => (
                            <GoalCheck
                                key={i}
                                goal={g.goal}
                                status={g.status}
                                onStatusChange={(s) => updateStatus(i, s)}
                            />
                        ))}
                    </div>
                </Card>
            </div>

            {/* Rechts */}
            <div className="flex flex-col gap-3.5">
                <Card>
                    <div className="px-5 py-4">
                        <div className="text-[11px] font-medium text-muted uppercase tracking-[0.04em] mb-2.5">
                            Fortschritt
                        </div>
                        <div className="text-[28px] font-semibold text-text tracking-[-0.02em] tabular-nums mb-0.5">
                            {progress}%
                        </div>
                        <div className="text-xs text-muted mb-3.5">
                            {reached} von {goals.length} Zielen erreicht
                        </div>
                        <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
                            {/* width ist dynamischer Prozentwert → inline */}
                            <div
                                className={`h-full rounded-full transition-[width] duration-500 ${
                                    progress >= 100
                                        ? 'bg-[#10b981]'
                                        : 'bg-accent'
                                }`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="px-5 pt-4 pb-3">
                        <SectionHeader title="Versionen" />
                    </div>
                    <div className="px-5 pb-4 flex flex-col gap-2">
                        {Array.from({ length: hilfeplan.version }, (_, i) => {
                            const v = hilfeplan.version - i;
                            const isCurrent = v === hilfeplan.version;
                            return (
                                <div
                                    key={v}
                                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[7px] border ${
                                        isCurrent
                                            ? 'bg-accent/6 border-accent/20'
                                            : 'bg-transparent border-transparent'
                                    }`}
                                >
                                    <div
                                        className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-semibold ${
                                            isCurrent
                                                ? 'bg-accent text-white'
                                                : 'bg-surface-hover text-muted'
                                        }`}
                                    >
                                        v{v}
                                    </div>
                                    <div>
                                        <div
                                            className={`text-[12.5px] font-medium ${isCurrent ? 'text-text' : 'text-muted'}`}
                                        >
                                            Version {v}{' '}
                                            {isCurrent && '(aktuell)'}
                                        </div>
                                        <div className="text-[11px] text-muted">
                                            {isCurrent
                                                ? formatDate(
                                                      hilfeplan.updatedAt,
                                                      { dateOnly: true },
                                                  )
                                                : '—'}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>
        </div>
    );
}
