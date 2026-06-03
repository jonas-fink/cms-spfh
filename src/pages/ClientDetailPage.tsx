import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router';
import {
    ClientDetailHeader,
    TabUebersicht,
    TabVerlauf,
} from '../components/client';
import { TabTermine, AppointmentForm } from '../components/appointment';
import { TabDokumente } from '../components/document';
import type { TabDokumenteHandle } from '../components/document/TabDokumente';
import { TabHilfePlan } from '../components/hilfeplan';
import { Modal } from '../components/shared';
import { api } from '../utils/api';
import {
    getCurrentWeekDays,
    formatDate,
    formatFileSize,
} from '../utils/format';
import { pickFkColor } from '../utils/colors';
import { userId } from '../utils/user';
import type {
    Client,
    Appointment,
    HilfePlan,
    ClientDoc,
    FKMap,
    ActiveTab,
    ApptFilter,
    VerlaufEntry,
    PopulatedUser,
} from '../types';

interface ApiClient extends Omit<
    Client,
    'assignedFachkraefte' | 'minutesThisWeek' | 'nextAppt'
> {
    _id: string;
    phone?: string;
    assignedFachkraefte: PopulatedUser[];
}

interface ApiAppointment extends Omit<
    Appointment,
    'createdBy' | 'clientId' | 'id'
> {
    _id: string;
    id?: string;
    clientId: string;
    createdBy: PopulatedUser | string;
}

interface ApiDocument {
    id?: string;
    _id?: string;
    fileName: string;
    fileType: 'pdf' | 'docx';
    fileSizeBytes: number;
    description?: string;
    uploadedBy: string;
    createdAt: string;
    downloadUrl?: string;
}

export default function ClientDetailPage() {
    const { id } = useParams<{ id: string }>();

    const [client, setClient] = useState<Client | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [documents, setDocuments] = useState<ClientDoc[]>([]);
    const [hilfeplan, setHilfeplan] = useState<HilfePlan | null>(null);
    const [fkMap, setFkMap] = useState<FKMap>({});
    const [activeTab, setActiveTab] = useState<ActiveTab>('uebersicht');
    const [apptFilter, setApptFilter] = useState<ApptFilter>('alle');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [apptModalOpen, setApptModalOpen] = useState(false);
    const docsRef = useRef<TabDokumenteHandle>(null);

    async function fetchDocs(clientId: string): Promise<ClientDoc[]> {
        const docsRes = await api
            .get<ApiDocument[]>(`/clients/${clientId}/documents`)
            .catch(() => [] as ApiDocument[]);
        return docsRes.map((d) => ({
            id: (d.id ?? d._id)!,
            clientId,
            uploadedBy: d.uploadedBy,
            fileName: d.fileName,
            fileType: d.fileType,
            size: formatFileSize(d.fileSizeBytes),
            uploadedAt: d.createdAt,
            description: d.description,
            downloadUrl: d.downloadUrl,
        }));
    }

    async function reloadDocs() {
        if (!id) return;
        const docs = await fetchDocs(id);
        setDocuments(docs);
    }

    async function reloadAppts() {
        if (!id) return;
        const apiAppointments = await api.get<ApiAppointment[]>(
            `/clients/${id}/appointments`,
        );

        // FKMap evtl. um neue Creators erweitern
        setFkMap((prev) => {
            const next = { ...prev };
            let colorIdx = Object.keys(next).length;
            for (const a of apiAppointments) {
                if (typeof a.createdBy !== 'string') {
                    const uid = a.createdBy.id ?? a.createdBy._id;
                    if (!next[uid]) {
                        next[uid] = {
                            name: `${a.createdBy.firstName} ${a.createdBy.lastName}`,
                            color: pickFkColor(colorIdx++),
                        };
                    }
                }
            }
            return next;
        });

        const normalizedAppts: Appointment[] = apiAppointments.map((a) => ({
            id: a.id ?? a._id,
            clientId: a.clientId,
            createdBy: userId(a.createdBy),
            type: a.type,
            status: a.status,
            date: a.date,
            durationHours: a.durationHours,
            durationMinutes: a.durationMinutes,
            report: a.report,
        }));
        setAppointments(normalizedAppts);

        const weekKeys = new Set(
            getCurrentWeekDays().map((d) => d.toISOString().slice(0, 10)),
        );
        const minutesThisWeek = normalizedAppts
            .filter(
                (a) =>
                    a.status === 'durchgeführt' &&
                    weekKeys.has(a.date.slice(0, 10)),
            )
            .reduce(
                (sum, a) => sum + a.durationHours * 60 + a.durationMinutes,
                0,
            );
        const now = new Date();
        const upcoming = normalizedAppts
            .filter((a) => a.status === 'geplant' && new Date(a.date) >= now)
            .sort(
                (a, b) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime(),
            );
        const nextAppt = upcoming[0]
            ? { date: upcoming[0].date, type: upcoming[0].type }
            : null;

        setClient((c) =>
            c ? { ...c, minutesThisWeek, nextAppt } : c,
        );
    }

    function handleCall() {
        if (client?.phone) window.location.href = `tel:${client.phone}`;
    }

    function handleUpload() {
        setActiveTab('dokumente');
        setTimeout(() => docsRef.current?.openPicker(), 0);
    }

    function handleNewAppointment() {
        setApptModalOpen(true);
    }

    async function handleApptSaved() {
        setApptModalOpen(false);
        await reloadAppts();
    }

    useEffect(() => {
        if (!id) return;
        let cancelled = false;

        async function load(clientId: string) {
            try {
                setLoading(true);
                setError(null);

                const [clientRes, apptRes, normalizedDocs, hilfeplanRes] =
                    await Promise.all([
                        api.get<ApiClient>(`/clients/${clientId}`),
                        api.get<ApiAppointment[]>(
                            `/clients/${clientId}/appointments`,
                        ),
                        fetchDocs(clientId),
                        api
                            .get<HilfePlan>(`/clients/${clientId}/hilfeplan`)
                            .catch(() => null),
                    ]);

                if (cancelled) return;

                const apiClient = clientRes;
                const apiAppointments = apptRes;

                // FKMap aus assignedFachkraefte + Appointment-Creators bauen
                const map: FKMap = {};
                let colorIdx = 0;
                for (const u of apiClient.assignedFachkraefte) {
                    const uid = u.id ?? u._id;
                    if (!map[uid]) {
                        map[uid] = {
                            name: `${u.firstName} ${u.lastName}`,
                            color: pickFkColor(colorIdx++),
                        };
                    }
                }
                for (const a of apiAppointments) {
                    if (typeof a.createdBy !== 'string') {
                        const uid = a.createdBy.id ?? a.createdBy._id;
                        if (!map[uid]) {
                            map[uid] = {
                                name: `${a.createdBy.firstName} ${a.createdBy.lastName}`,
                                color: pickFkColor(colorIdx++),
                            };
                        }
                    }
                }

                // Appointments normalisieren (createdBy → string)
                const normalizedAppts: Appointment[] = apiAppointments.map(
                    (a) => ({
                        id: a.id ?? a._id,
                        clientId: a.clientId,
                        createdBy: userId(a.createdBy),
                        type: a.type,
                        status: a.status,
                        date: a.date,
                        durationHours: a.durationHours,
                        durationMinutes: a.durationMinutes,
                        report: a.report,
                    }),
                );

                // minutesThisWeek + nextAppt aus Appointments ableiten
                const weekKeys = new Set(
                    getCurrentWeekDays().map((d) =>
                        d.toISOString().slice(0, 10),
                    ),
                );
                const minutesThisWeek = normalizedAppts
                    .filter(
                        (a) =>
                            a.status === 'durchgeführt' &&
                            weekKeys.has(a.date.slice(0, 10)),
                    )
                    .reduce(
                        (sum, a) =>
                            sum + a.durationHours * 60 + a.durationMinutes,
                        0,
                    );

                const now = new Date();
                const upcoming = normalizedAppts
                    .filter(
                        (a) =>
                            a.status === 'geplant' && new Date(a.date) >= now,
                    )
                    .sort(
                        (a, b) =>
                            new Date(a.date).getTime() -
                            new Date(b.date).getTime(),
                    );
                const nextAppt = upcoming[0]
                    ? { date: upcoming[0].date, type: upcoming[0].type }
                    : null;

                const normalizedClient: Client = {
                    id: apiClient.id ?? apiClient._id,
                    familyName: apiClient.familyName,
                    caseNumber: apiClient.caseNumber,
                    address: apiClient.address,
                    phone: apiClient.phone,
                    jugendamtContact: apiClient.jugendamtContact,
                    assignedFachkraefte: apiClient.assignedFachkraefte.map(
                        (u) => u.id ?? u._id,
                    ),
                    weeklyHoursQuota: apiClient.weeklyHoursQuota,
                    minutesThisWeek,
                    status: apiClient.status,
                    startDate: apiClient.startDate,
                    children: apiClient.children,
                    nextAppt,
                };

                setClient(normalizedClient);
                setAppointments(normalizedAppts);
                setDocuments(normalizedDocs);
                setHilfeplan(hilfeplanRes);
                setFkMap(map);
            } catch (err: unknown) {
                if (!cancelled)
                    setError(
                        (err as Error).message ??
                            'Fehler beim Laden des Klienten',
                    );
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load(id);
        return () => {
            cancelled = true;
        };
    }, [id]);

    // Verlauf aus echten Daten ableiten (Termine + Dokumente + HilfePlan)
    const verlauf = useMemo<VerlaufEntry[]>(() => {
        const entries: VerlaufEntry[] = [];

        for (const a of appointments) {
            const fkName = fkMap[a.createdBy]?.name.split(' ')[0] ?? '';
            const durLabel =
                a.durationHours > 0
                    ? `${a.durationHours}:${String(a.durationMinutes).padStart(2, '0')}h`
                    : `${a.durationMinutes} min`;
            const title =
                a.status === 'durchgeführt'
                    ? `${a.type} durchgeführt`
                    : a.status === 'ausgefallen'
                      ? `${a.type} ausgefallen`
                      : `${a.type} geplant`;
            entries.push({
                id: `appt-${a.id}`,
                date: a.date,
                type: 'termin',
                title,
                sub: [durLabel, fkName].filter(Boolean).join(' · '),
            });
        }

        for (const d of documents) {
            entries.push({
                id: `doc-${d.id}`,
                date: d.uploadedAt,
                type: 'dokument',
                title: 'Dokument hochgeladen',
                sub: d.fileName,
            });
        }

        if (hilfeplan) {
            entries.push({
                id: `hp-${hilfeplan.id}`,
                date: hilfeplan.updatedAt,
                type: 'hilfeplan',
                title: `Hilfeplan aktualisiert (Version ${hilfeplan.version})`,
            });
        }

        if (client?.startDate) {
            entries.push({
                id: 'start',
                date: client.startDate,
                type: 'notiz',
                title: 'Betreuung begonnen',
                sub: `Start ${formatDate(client.startDate, { dateOnly: true })}`,
            });
        }

        return entries.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
    }, [appointments, documents, hilfeplan, client, fkMap]);

    if (error) {
        return (
            <div className="flex items-center justify-center h-[50vh] text-[13px] text-red-600">
                {error}
            </div>
        );
    }

    if (loading || !client) {
        return (
            <div className="flex items-center justify-center h-[50vh] text-[13px] text-muted">
                Lade Klient…
            </div>
        );
    }

    const tabs: { key: ActiveTab; label: string; count?: number }[] = [
        { key: 'uebersicht', label: 'Übersicht' },
        { key: 'termine', label: 'Termine', count: appointments.length },
        { key: 'dokumente', label: 'Dokumente', count: documents.length },
        {
            key: 'hilfeplan',
            label: 'HilfePlan',
            count: hilfeplan?.goals.length,
        },
        { key: 'verlauf', label: 'Verlauf' },
    ];

    return (
        <div>
            <ClientDetailHeader
                client={client}
                fkMap={fkMap}
                activeTab={activeTab}
                tabs={tabs}
                onTabChange={setActiveTab}
                onCall={handleCall}
                onUpload={handleUpload}
                onNewAppointment={handleNewAppointment}
            />

            <div className="px-8 pt-6 pb-16 max-w-7xl mx-auto">
                {activeTab === 'uebersicht' && (
                    <TabUebersicht
                        client={client}
                        appointments={appointments}
                        hilfeplan={hilfeplan}
                        fkMap={fkMap}
                    />
                )}
                {activeTab === 'termine' && (
                    <TabTermine
                        appointments={appointments}
                        filter={apptFilter}
                        onFilterChange={setApptFilter}
                        fkMap={fkMap}
                        onNewAppointment={handleNewAppointment}
                    />
                )}
                {activeTab === 'dokumente' && (
                    <TabDokumente
                        ref={docsRef}
                        clientId={client.id}
                        documents={documents}
                        onChange={reloadDocs}
                    />
                )}
                {activeTab === 'hilfeplan' && (
                    <TabHilfePlan hilfeplan={hilfeplan} />
                )}
                {activeTab === 'verlauf' && <TabVerlauf verlauf={verlauf} />}
            </div>

            <Modal
                open={apptModalOpen}
                onClose={() => setApptModalOpen(false)}
                title="Neuer Termin"
            >
                <AppointmentForm
                    clientId={client.id}
                    mode="create"
                    onSuccess={handleApptSaved}
                    onCancel={() => setApptModalOpen(false)}
                />
            </Modal>
        </div>
    );
}
