import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import {
    ClientDetailHeader,
    TabUebersicht,
    TabVerlauf,
} from '../components/client';
import { TabTermine } from '../components/appointment';
import { TabDokumente } from '../components/document';
import { TabHilfePlan } from '../components/hilfeplan';
import {
    MOCK_CLIENT,
    MOCK_APPOINTMENTS,
    MOCK_DOCS,
    MOCK_HILFEPLAN,
    MOCK_VERLAUF,
    MOCK_FK_MAP,
} from '../mocks/clientDetail.mock';
import type {
    Client,
    Appointment,
    HilfePlan,
    ClientDoc,
    FKMap,
    ActiveTab,
    ApptFilter,
} from '../types';

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

    useEffect(() => {
        if (!id) return;
        // TODO: echte API-Calls via Promise.all:
        // const [c, a, d, h, fk] = await Promise.all([
        //   api.get(`/clients/${id}`),
        //   api.get(`/clients/${id}/appointments`),
        //   api.get(`/clients/${id}/documents`),
        //   api.get(`/clients/${id}/hilfeplan`),
        //   api.get('/users'),
        // ])
        setClient(MOCK_CLIENT);
        setAppointments(MOCK_APPOINTMENTS);
        setDocuments(MOCK_DOCS);
        setHilfeplan(MOCK_HILFEPLAN);
        setFkMap(MOCK_FK_MAP);
        setLoading(false);
    }, [id]);

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
            />

            <div className="px-8 pt-6 pb-16 max-w-[1280px] mx-auto">
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
                    />
                )}
                {activeTab === 'dokumente' && (
                    <TabDokumente documents={documents} />
                )}
                {activeTab === 'hilfeplan' && (
                    <TabHilfePlan hilfeplan={hilfeplan} />
                )}
                {activeTab === 'verlauf' && (
                    <TabVerlauf verlauf={MOCK_VERLAUF} />
                )}
            </div>
        </div>
    );
}
