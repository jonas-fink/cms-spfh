// Frontend- Typen (Single Source of Truth für Pages/ Components)

export type AppointmentType =
    | 'Hausbesuch'
    | 'Krisenintervention'
    | 'Telefongespräch'
    | 'Beratungsgespräch'
    | 'Sonstiges';

export type ClientStatus = 'aktiv' | 'pausiert' | 'abgeschlossen';

export type AppointmentStatus = 'geplant' | 'durchgeführt' | 'ausgefallen';

export type GoalStatus = 'offen' | 'in Bearbeitung' | 'erreicht';

// Entitäten

export interface Client {
    id: string;
    familyName: string;
    caseNumber: string;
    address?: string;
    phone?: string;
    jugendamtContact?: string;
    assignedFachkraefte: string[];
    weeklyHoursQuota: number;
    minutesThisWeek: number;
    status: ClientStatus;
    startDate: string;
    children: { name: string; age: number }[];
    nextAppt?: { date: string; type: AppointmentType } | null;
}

export interface Appointment {
    id: string;
    clientId: string;
    createdBy: string;
    type: AppointmentType;
    status: AppointmentStatus;
    date: string;
    durationHours: number;
    durationMinutes: 0 | 15 | 30 | 45;
    report: string;
}

export interface Document {
    id: string;
    clientId: string;
    uploadedBy: string;
    fileName: string;
    fileType: 'pdf' | 'docx';
    fileSizeBytes: number;
    s3Key: string;
    description?: string;
    uploadedAt: string;
}

export interface HilfePlan {
    id: string;
    clientId: string;
    version: number;
    updatedAt: string;
    createdBy: string;
    content: string;
    goals: {
        goal: string;
        status: GoalStatus;
    }[];
}

export interface OpenTask {
    clientId: string;
    clientName: string;
    goal: string;
}

export interface Fachkraft {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'fachkraft' | 'admin';
    maxClients?: number;
    weeklyTargetMinutes?: number;
    vacationDaysPerYear?: number;
    overtimeMinutes?: number;
}

// Backend-Shapes (populated Responses)

export interface PopulatedUser {
    _id: string;
    id?: string;
    firstName: string;
    lastName: string;
    email?: string;
}

// Auth-Context User

export interface AuthUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'fachkraft' | 'admin';
    maxClients?: number;
    weeklyTargetMinutes?: number;
    vacationDaysPerYear?: number;
    overtimeMinutes?: number;
}

// API Response Wrapper
export interface ApiResponse<T> {
    data: T;
}

// API-Shapes (populated, mehrfach genutzt)

export interface ApiClient {
    _id: string;
    id?: string;
    familyName: string;
    caseNumber: string;
    assignedFachkraefte: PopulatedUser[];
    weeklyHoursQuota: number;
    status: ClientStatus;
    startDate: string;
    children: { name: string; age: number }[];
}

export interface ApiClientHours {
    totalMinutes: number;
    quotaMinutes: number;
    progressPercent: number;
}

export interface ApiWorkloadEntry {
    fachkraft: { id: string; name: string; email: string };
    clientCount: number;
    maxClients: number;
    quotaMinutes: number;
    workedMinutes: number;
    performedMinutes: number;
    cancelledCreditedCount: number;
    cancelledCreditMinutes: number;
    utilizationPercent: number;
    appointmentsThisWeek: number;
    overdueReports: number;
}

// Client Details

export type FKMap = Record<string, { name: string; color: string }>;

export type ActiveTab =
    | 'uebersicht'
    | 'termine'
    | 'dokumente'
    | 'hilfeplan'
    | 'verlauf'
    | 'verwaltung';

export type ApptFilter = 'alle' | 'geplant' | 'durchgeführt' | 'ausgefallen';

export interface ClientDoc {
    id: string;
    clientId: string;
    uploadedBy: string;
    fileName: string;
    fileType: 'pdf' | 'docx';
    size: string;
    uploadedAt: string;
    description?: string;
    downloadUrl?: string;
}

export interface VerlaufEntry {
    id: string;
    date: string;
    type: 'termin' | 'dokument' | 'hilfeplan' | 'notiz';
    title: string;
    sub?: string;
}
