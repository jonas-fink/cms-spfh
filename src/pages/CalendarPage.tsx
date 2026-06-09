import { Card, Icon } from '../components/shared';

export default function CalendarPage() {
    return (
        <div>
            <div className="mb-5">
                <h1 className="text-[24px] font-semibold text-text tracking-[-0.02em]">
                    Einsatzplaner
                </h1>
                <p className="text-[13px] text-muted mt-0.5">
                    Mein Kalender · Team · Klient
                </p>
            </div>

            <Card>
                <div className="px-6 py-16 flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                        <Icon name="calendar" size={22} />
                    </div>
                    <div>
                        <h2 className="text-[15px] font-semibold text-text">
                            Kalender folgt in Phase 7
                        </h2>
                        <p className="text-[13px] text-muted mt-1 max-w-md">
                            Hier entstehen die Sichten „Mein Kalender", „Team"
                            und „Klient" mit Tandem-Einladungen und
                            Termin-Benachrichtigungen.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
