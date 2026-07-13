import { useState } from 'react';
import { Button, Modal } from '../shared';
import { api } from '../../utils/api';

interface Props {
    requestId: string;
    onClose: () => void;
    onDenied: () => void | Promise<void>;
}

export default function VacationDenyModal({
    requestId,
    onClose,
    onDenied,
}: Props) {
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function deny() {
        if (!reason.trim()) {
            setError('Begründung erforderlich');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await api.post(`/vacation-requests/${requestId}/deny`, {
                reason: reason.trim(),
            });
            await onDenied();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <Modal open onClose={onClose} title="Antrag ablehnen" width={440}>
            <div className="flex flex-col gap-3.5">
                <label className="flex flex-col gap-1">
                    <span className="text-[11.5px] text-muted font-medium">
                        Begründung (Pflichtfeld)
                    </span>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={4}
                        autoFocus
                        className="px-2.5 py-2 rounded-md bg-bg border border-border text-[13px] text-text resize-y"
                    />
                </label>
                {error && (
                    <p className="text-[12.5px] text-red-600 m-0">{error}</p>
                )}
                <div className="flex justify-end gap-2 pt-1">
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        Abbrechen
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={deny}
                        disabled={saving}
                    >
                        {saving ? 'Lehnt ab…' : 'Ablehnen'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
