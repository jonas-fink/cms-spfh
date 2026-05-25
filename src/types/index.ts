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

export interface Fachkraft {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'fachkraft' | 'admin';
}

// Auth-Context User

export interface AuthUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'fachkraft' | 'admin';
}

// API Response Wrapper
export interface ApiResponse<T> {
    data: T;
}
