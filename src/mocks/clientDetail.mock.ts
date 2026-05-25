import type {
    Client,
    Appointment,
    HilfePlan,
    ClientDoc,
    VerlaufEntry,
    FKMap,
} from '../types';

export const MOCK_FK_MAP: FKMap = {
    fk1: { name: 'Anna Berger', color: '#6366f1' },
    fk2: { name: 'Max Koch', color: '#0ea5e9' },
};

export const MOCK_CLIENT: Client = {
    id: 'c1',
    familyName: 'Berger',
    caseNumber: 'JA-2024-0312',
    address: 'Hauptstraße 12, 60311 Frankfurt am Main',
    jugendamtContact: 'Fr. Schneider',
    assignedFachkraefte: ['fk1', 'fk2'],
    weeklyHoursQuota: 6.0,
    minutesThisWeek: 285,
    status: 'aktiv',
    startDate: '2024-03-15',
    children: [
        { name: 'Lena', age: 8 },
        { name: 'Tim', age: 5 },
    ],
    nextAppt: { date: '2026-05-27T15:30:00', type: 'Hausbesuch' },
};

export const MOCK_APPOINTMENTS: Appointment[] = [
    {
        id: 'a1',
        clientId: 'c1',
        createdBy: 'fk1',
        type: 'Hausbesuch',
        status: 'durchgeführt',
        date: '2026-05-20T14:00:00',
        durationHours: 1,
        durationMinutes: 30,
        report: 'Besuch verlief positiv. Familie zeigte gute Fortschritte bei der Tagesstrukturierung.',
    },
    {
        id: 'a2',
        clientId: 'c1',
        createdBy: 'fk1',
        type: 'Telefongespräch',
        status: 'durchgeführt',
        date: '2026-05-18T10:00:00',
        durationHours: 0,
        durationMinutes: 30,
        report: 'Kurzes Gespräch bezüglich Schulprobleme von Lena.',
    },
    {
        id: 'a3',
        clientId: 'c1',
        createdBy: 'fk2',
        type: 'Beratungsgespräch',
        status: 'geplant',
        date: '2026-05-27T15:30:00',
        durationHours: 1,
        durationMinutes: 0,
        report: '',
    },
    {
        id: 'a4',
        clientId: 'c1',
        createdBy: 'fk1',
        type: 'Hausbesuch',
        status: 'ausgefallen',
        date: '2026-05-13T11:00:00',
        durationHours: 1,
        durationMinutes: 30,
        report: 'Familie war nicht zu Hause.',
    },
];

export const MOCK_DOCS: ClientDoc[] = [
    {
        id: 'd1',
        clientId: 'c1',
        uploadedBy: 'fk1',
        fileName: 'Hilfeplan_Berger_v2.pdf',
        fileType: 'pdf',
        size: '1.2 MB',
        uploadedAt: '2026-04-10T09:00:00',
        description: 'Aktueller Hilfeplan vom Jugendamt',
    },
    {
        id: 'd2',
        clientId: 'c1',
        uploadedBy: 'fk1',
        fileName: 'Einverstaendnis_Berger.docx',
        fileType: 'docx',
        size: '340 KB',
        uploadedAt: '2026-03-20T14:30:00',
        description: 'Einverständniserklärung zur Datenweitergabe',
    },
    {
        id: 'd3',
        clientId: 'c1',
        uploadedBy: 'fk2',
        fileName: 'Bericht_Q1_2026.pdf',
        fileType: 'pdf',
        size: '2.8 MB',
        uploadedAt: '2026-04-01T11:00:00',
    },
];

export const MOCK_HILFEPLAN: HilfePlan = {
    id: 'hp1',
    clientId: 'c1',
    version: 2,
    updatedAt: '2026-04-10T09:00:00',
    createdBy: 'fk1',
    content: `Die Familie Berger befindet sich seit März 2024 in sozialpädagogischer Familienhilfe. Die Betreuung konzentriert sich auf die Stärkung der Erziehungskompetenz und die Verbesserung der häuslichen Strukturen.\n\nHauptbereiche:\n- Alltagsstruktur und Tagesplanung\n- Schulische Förderung von Lena (Klasse 2, Grundschule Nord)\n- Elterliche Kompetenzen im Umgang mit Konflikten\n- Aufbau sozialer Netzwerke`,
    goals: [
        {
            goal: 'Stabile Tagesstruktur etablieren (Aufstehen, Mahlzeiten, Schlafzeiten)',
            status: 'erreicht',
        },
        {
            goal: 'Regelmäßiger Schulbesuch von Lena sicherstellen',
            status: 'in Bearbeitung',
        },
        {
            goal: 'Elterngespräche zur Konfliktlösung durchführen',
            status: 'in Bearbeitung',
        },
        { goal: 'Kontakt zu Nachbarschaftshilfe aufnehmen', status: 'offen' },
        {
            goal: 'Haushaltsführung und Finanzplanung stabilisieren',
            status: 'erreicht',
        },
    ],
};

export const MOCK_VERLAUF: VerlaufEntry[] = [
    {
        id: 'v1',
        date: '2026-05-20T14:00:00',
        type: 'termin',
        title: 'Hausbesuch durchgeführt',
        sub: '1:30h · A. Berger',
    },
    {
        id: 'v2',
        date: '2026-05-18T10:00:00',
        type: 'termin',
        title: 'Telefongespräch',
        sub: '30 min · A. Berger',
    },
    {
        id: 'v3',
        date: '2026-05-13T11:00:00',
        type: 'termin',
        title: 'Hausbesuch ausgefallen',
        sub: 'A. Berger',
    },
    {
        id: 'v4',
        date: '2026-04-10T09:00:00',
        type: 'hilfeplan',
        title: 'Hilfeplan aktualisiert (Version 2)',
        sub: 'Neues Ziel hinzugefügt',
    },
    {
        id: 'v5',
        date: '2026-04-01T11:00:00',
        type: 'dokument',
        title: 'Dokument hochgeladen',
        sub: 'Bericht_Q1_2026.pdf',
    },
    {
        id: 'v6',
        date: '2026-03-20T14:30:00',
        type: 'dokument',
        title: 'Dokument hochgeladen',
        sub: 'Einverstaendnis_Berger.docx',
    },
    {
        id: 'v7',
        date: '2024-03-15T00:00:00',
        type: 'notiz',
        title: 'Betreuung begonnen',
        sub: 'Erstgespräch mit Familie',
    },
];
