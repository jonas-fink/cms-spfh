import { Avatar, Button, Card, StatusPill, FilterBtn } from '../shared';
import { formatDate, formatDuration } from '../../utils/format';
import { Icon } from '../shared';
import type { Appointment, FKMap, ApptFilter } from '../../types';

interface TabTermineProps {
    appointments: Appointment[];
    filter: ApptFilter;
    onFilterChange: (f: ApptFilter) => void;
    fkMap: FKMap;
    onNewAppointment?: () => void;
    onEditAppointment?: (appt: Appointment) => void;
    onDeleteAppointment?: (appt: Appointment) => void;
    readOnly?: boolean;
}

const FILTER_LABELS: Record<ApptFilter, string> = {
    alle: 'Alle',
    geplant: 'Geplant',
    durchgeführt: 'Durchgeführt',
    ausgefallen: 'Ausgefallen',
};

export function TabTermine({
    appointments,
    filter,
    onFilterChange,
    fkMap,
    onNewAppointment,
    onEditAppointment,
    onDeleteAppointment,
    readOnly = false,
}: TabTermineProps) {
    const filtered =
        filter === 'alle'
            ? appointments
            : appointments.filter((a) => a.status === filter);
    const sorted = [...filtered].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return (
        <div>
            <div className="flex items-center gap-2 mb-3.5">
                {(Object.keys(FILTER_LABELS) as ApptFilter[]).map((f) => (
                    <FilterBtn
                        key={f}
                        label={FILTER_LABELS[f]}
                        active={filter === f}
                        onClick={() => onFilterChange(f)}
                    />
                ))}
                <div className="flex-1" />
                {!readOnly && onNewAppointment && (
                    <Button
                        variant="primary"
                        size="sm"
                        icon="plus"
                        onClick={onNewAppointment}
                    >
                        Neuer Termin
                    </Button>
                )}
            </div>

            <Card>
                <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[560px]">
                    <thead>
                        <tr>
                            {[
                                'Datum',
                                'Typ',
                                'Dauer',
                                'Status',
                                'Bericht',
                                'Erstellt von',
                                '',
                            ].map((h) => (
                                <th
                                    key={h}
                                    className="px-4 py-2.5 text-left text-[11px] font-medium text-muted uppercase tracking-[0.04em] border-b border-border whitespace-nowrap"
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="px-4 py-10 text-center text-[13px] text-muted"
                                >
                                    Keine Termine gefunden
                                </td>
                            </tr>
                        ) : (
                            sorted.map((appt, i) => {
                                const fk = fkMap[appt.createdBy];
                                return (
                                    <tr
                                        key={appt.id}
                                        className={
                                            i > 0
                                                ? 'border-t border-border'
                                                : ''
                                        }
                                    >
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-[13px] font-medium text-text">
                                                {formatDate(appt.date, {
                                                    relative: true,
                                                })}
                                            </div>
                                            <div className="text-[11.5px] text-muted">
                                                {formatDate(appt.date)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-[13px] text-text">
                                            {appt.type}
                                        </td>
                                        <td className="px-4 py-3 text-[13px] text-text whitespace-nowrap tabular-nums">
                                            {formatDuration(
                                                appt.durationHours,
                                                appt.durationMinutes,
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusPill
                                                status={appt.status}
                                                size="sm"
                                            />
                                        </td>
                                        <td className="px-4 py-3 max-w-65">
                                            <p className="text-[12.5px] text-muted leading-normal m-0 line-clamp-2">
                                                {appt.report || '—'}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3">
                                            {fk && (
                                                <div className="flex items-center gap-1.5">
                                                    <Avatar
                                                        name={fk.name}
                                                        size={22}
                                                        color={fk.color}
                                                    />
                                                    <span className="text-[12.5px] text-muted">
                                                        {
                                                            fk.name.split(
                                                                ' ',
                                                            )[0][0]
                                                        }
                                                        .{' '}
                                                        {fk.name.split(' ')[1]}
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-3 py-3">
                                            {!readOnly && (
                                                <div className="flex gap-0.5">
                                                    <button
                                                        type="button"
                                                        title="Bearbeiten"
                                                        onClick={() =>
                                                            onEditAppointment?.(
                                                                appt,
                                                            )
                                                        }
                                                        className="bg-transparent border-none cursor-pointer text-muted p-1.5 rounded-md hover:bg-surface-hover transition-colors duration-100"
                                                    >
                                                        <Icon
                                                            name="edit"
                                                            size={14}
                                                            stroke={1.75}
                                                        />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        title="Löschen"
                                                        onClick={() =>
                                                            onDeleteAppointment?.(
                                                                appt,
                                                            )
                                                        }
                                                        className="bg-transparent border-none cursor-pointer text-muted p-1.5 rounded-md hover:bg-surface-hover transition-colors duration-100"
                                                    >
                                                        <Icon
                                                            name="trash"
                                                            size={14}
                                                            stroke={1.75}
                                                        />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
                </div>
            </Card>
        </div>
    );
}
