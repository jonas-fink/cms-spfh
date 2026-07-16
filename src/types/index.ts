// Frontend- Typen (Single Source of Truth für Pages/ Components)

export type AppointmentType =
    | 'Hausbesuch'
    | 'Krisenintervention'
    | 'Telefongespräch'
    | 'Beratung'
    | 'Sonstiges';

export type ClientStatus = 'aktiv' | 'pausiert' | 'abgeschlossen';

export type AppointmentStatus = 'geplant' | 'durchgeführt' | 'ausgefallen';

export type GoalStatus = 'offen' | 'in Bearbeitung' | 'erreicht';

// Entitäten

export interface Client {
    id: string;
    familyName: string;
    firstName?: string;
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
    firstName?: string;
    caseNumber: string;
    address?: string;
    phone?: string;
    jugendamtContact?: string;
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

export interface LibraryDoc {
    id: string;
    fileName: string;
    fileType: 'pdf' | 'docx';
    fileSizeBytes: number;
    description?: string;
    category: string;
    subfolder?: string;
    uploadedBy: { _id: string; firstName: string; lastName: string };
    createdAt: string;
    downloadUrl: string;
}

export type NotificationType =
    | 'tandem_invite'
    | 'calendar_event_added'
    | 'calendar_event_updated'
    | 'vacation_pending'
    | 'vacation_approved'
    | 'vacation_denied'
    | 'sick_leave'
    | 'shift_overlap';

export interface Notification {
    _id: string;
    id?: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    payload?: Record<string, unknown>;
    read: boolean;
    readAt?: string;
    createdAt: string;
}

export type CalendarEventType =
    | 'team_meeting'
    | 'koordination'
    | 'sonstiges'
    | 'urlaub'
    | 'krank';

export type CalendarEventStatus = 'geplant' | 'durchgeführt' | 'abgesagt';
export type CalendarEventVisibility = 'team' | 'private';
export type CalendarParticipantResponse = 'pending' | 'accepted' | 'declined';

export interface ApiCalendarParticipant {
    userId: PopulatedUser | string;
    response: CalendarParticipantResponse;
    respondedAt?: string;
}

export interface ApiCalendarEvent {
    _id: string;
    id?: string;
    createdBy: PopulatedUser | string;
    title: string;
    description?: string;
    type: CalendarEventType;
    date: string;
    endDate?: string;
    durationMinutes?: number;
    participants: ApiCalendarParticipant[];
    status: CalendarEventStatus;
    visibility: CalendarEventVisibility;
    relatedClientId?:
        | { _id: string; familyName: string; caseNumber?: string }
        | string;
    createdAt: string;
    updatedAt: string;
}

// Cross-client Termin-Shape für den Einsatzplaner (GET /appointments)
export interface ApiCalendarAppointment {
    _id: string;
    clientId: { _id: string; familyName: string; caseNumber?: string } | string;
    createdBy: PopulatedUser | string;
    participants: PopulatedUser[];
    type: AppointmentType;
    status: AppointmentStatus;
    date: string;
    durationHours: number;
    durationMinutes: 0 | 15 | 30 | 45;
    report: string;
}

// Einheitliches Item für WeekView/EventCard: interner Event oder Klienten-Termin
export type CalendarItem =
    | { kind: 'event'; event: ApiCalendarEvent }
    | { kind: 'appointment'; appt: ApiCalendarAppointment };

// Phase 8 – Arbeitszeiterfassung

export interface ApiWorkBreak {
    start: string;
    end?: string;
    durationMinutes?: number;
}

export interface ApiWorkSession {
    _id: string;
    id?: string;
    userId: string;
    date: string;
    clockIn: string;
    clockOut?: string;
    breaks: ApiWorkBreak[];
    totalMinutes?: number;
    manuallyEdited: boolean;
    notes?: string;
}

export interface ApiClockStatus {
    user: { id: string; name: string };
    active: boolean;
    onBreak: boolean;
    since: string | null;
    todayMinutes: number;
    weekMinutes: number;
    overtimeMinutes: number;
}

export interface ApiOvertime {
    weekMinutes: number;
    weeklyTargetMinutes: number;
    overtimeMinutes: number;
}

// Phase 9 – Urlaub + Krankmeldung

export type VacationType = 'urlaub' | 'ueberstundenabbau';
export type VacationStatus = 'pending' | 'approved' | 'denied';

export interface ApiVacationRequest {
    _id: string;
    id?: string;
    userId: PopulatedUser | string;
    type: VacationType;
    startDate: string;
    endDate: string;
    workingDays: number;
    status: VacationStatus;
    requestNote?: string;
    createdAt: string;
}

export interface ApiSickLeave {
    _id: string;
    id?: string;
    userId: PopulatedUser | string;
    startDate: string;
    endDate?: string;
    note?: string;
    reportedAt: string;
}

export interface ApiVacationBalance {
    vacationDaysPerYear: number;
    usedDays: number;
    remainingDays: number;
    overtimeMinutes: number;
}

export interface VerlaufEntry {
    id: string;
    date: string;
    type: 'termin' | 'dokument' | 'hilfeplan' | 'notiz';
    title: string;
    sub?: string;
}
