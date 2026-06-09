import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Avatar, Card, Icon, SectionHeader } from '../components/shared';
import { api } from '../utils/api';
import { formatDate, formatFileSize } from '../utils/format';

interface ApiAdminDocument {
    id: string;
    fileName: string;
    fileType: 'pdf' | 'docx';
    fileSizeBytes: number;
    description?: string;
    client: {
        _id: string;
        familyName: string;
        caseNumber?: string;
    } | null;
    uploadedBy: {
        _id: string;
        firstName: string;
        lastName: string;
    } | null;
    createdAt: string;
    downloadUrl: string;
}

type FileFilter = 'alle' | 'pdf' | 'docx';

function FilterTab({
    label,
    active,
    onClick,
    count,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
    count?: number;
}) {
    return (
        <button
            onClick={onClick}
            className={[
                'px-3 h-8 text-[12.5px] rounded-md border transition-colors duration-100',
                active
                    ? 'bg-accent/10 border-accent/30 text-accent font-medium'
                    : 'bg-bg border-border text-muted hover:text-text',
            ].join(' ')}
        >
            {label}
            {count !== undefined && (
                <span className="ml-1.5 tabular-nums">{count}</span>
            )}
        </button>
    );
}

export default function AdminDocumentsPage() {
    const navigate = useNavigate();
    const [docs, setDocs] = useState<ApiAdminDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [fileFilter, setFileFilter] = useState<FileFilter>('alle');
    const [fkFilter, setFkFilter] = useState<string>('alle');
    const [clientFilter, setClientFilter] = useState<string>('alle');

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                setLoading(true);
                setError(null);
                const data = await api.get<ApiAdminDocument[]>('/documents');
                if (!cancelled) setDocs(data);
            } catch (err) {
                if (!cancelled)
                    setError((err as Error).message ?? 'Fehler beim Laden');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => {
            cancelled = true;
        };
    }, []);

    const { fkOptions, clientOptions } = useMemo(() => {
        const fkMap = new Map<string, string>();
        const cMap = new Map<string, string>();
        for (const d of docs) {
            if (d.uploadedBy) {
                fkMap.set(
                    d.uploadedBy._id,
                    `${d.uploadedBy.firstName} ${d.uploadedBy.lastName}`,
                );
            }
            if (d.client) {
                cMap.set(d.client._id, `Familie ${d.client.familyName}`);
            }
        }
        return {
            fkOptions: Array.from(fkMap.entries()).sort((a, b) =>
                a[1].localeCompare(b[1], 'de'),
            ),
            clientOptions: Array.from(cMap.entries()).sort((a, b) =>
                a[1].localeCompare(b[1], 'de'),
            ),
        };
    }, [docs]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return docs.filter((d) => {
            if (fileFilter !== 'alle' && d.fileType !== fileFilter) return false;
            if (fkFilter !== 'alle' && d.uploadedBy?._id !== fkFilter)
                return false;
            if (clientFilter !== 'alle' && d.client?._id !== clientFilter)
                return false;
            if (q) {
                const hay = [
                    d.fileName,
                    d.description ?? '',
                    d.client?.familyName ?? '',
                    d.client?.caseNumber ?? '',
                    d.uploadedBy
                        ? `${d.uploadedBy.firstName} ${d.uploadedBy.lastName}`
                        : '',
                ]
                    .join(' ')
                    .toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [docs, search, fileFilter, fkFilter, clientFilter]);

    if (error) {
        return (
            <div className="flex items-center justify-center h-[50vh] text-[13px] text-red-600">
                {error}
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh] text-[13px] text-muted">
                Lade Dokumente…
            </div>
        );
    }

    const pdfCount = docs.filter((d) => d.fileType === 'pdf').length;
    const docxCount = docs.filter((d) => d.fileType === 'docx').length;

    const COLS = '1.6fr 1.4fr 1.2fr 80px 110px 90px';

    return (
        <div>
            <div className="mb-5">
                <h1 className="text-[24px] font-semibold text-text tracking-[-0.02em]">
                    Dokumente
                </h1>
                <p className="text-[13px] text-muted mt-0.5">
                    {docs.length} gesamt · {filtered.length} angezeigt
                </p>
            </div>

            <div className="flex items-center gap-2 mb-4 flex-wrap">
                <FilterTab
                    label="Alle"
                    active={fileFilter === 'alle'}
                    onClick={() => setFileFilter('alle')}
                    count={docs.length}
                />
                <FilterTab
                    label="PDF"
                    active={fileFilter === 'pdf'}
                    onClick={() => setFileFilter('pdf')}
                    count={pdfCount}
                />
                <FilterTab
                    label="DOCX"
                    active={fileFilter === 'docx'}
                    onClick={() => setFileFilter('docx')}
                    count={docxCount}
                />
                <select
                    value={clientFilter}
                    onChange={(e) => setClientFilter(e.target.value)}
                    className="h-8 px-2 rounded-md bg-bg border border-border text-[12.5px] text-text outline-none focus:border-accent"
                >
                    <option value="alle">Alle Klienten</option>
                    {clientOptions.map(([id, name]) => (
                        <option key={id} value={id}>
                            {name}
                        </option>
                    ))}
                </select>
                <select
                    value={fkFilter}
                    onChange={(e) => setFkFilter(e.target.value)}
                    className="h-8 px-2 rounded-md bg-bg border border-border text-[12.5px] text-text outline-none focus:border-accent"
                >
                    <option value="alle">Alle Fachkräfte</option>
                    {fkOptions.map(([id, name]) => (
                        <option key={id} value={id}>
                            {name}
                        </option>
                    ))}
                </select>
                <div className="flex-1 min-w-40" />
                <input
                    type="search"
                    placeholder="Datei, Beschreibung suchen…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 px-3 rounded-md bg-bg border border-border text-[12.5px] text-text outline-none focus:border-accent w-70"
                />
            </div>

            <Card>
                <div className="px-4 py-3 border-b border-border">
                    <SectionHeader
                        title="Alle Dokumente"
                        sub={`${filtered.length} angezeigt`}
                    />
                </div>

                <div
                    className="grid gap-4 px-4 py-2.5 border-b border-border"
                    style={{ gridTemplateColumns: COLS }}
                >
                    {(
                        [
                            'Datei',
                            'Klient',
                            'Hochgeladen von',
                            'Typ',
                            'Datum',
                            'Größe',
                        ] as const
                    ).map((h) => (
                        <span
                            key={h}
                            className="text-[11px] font-medium text-muted uppercase tracking-widest"
                        >
                            {h}
                        </span>
                    ))}
                </div>

                {filtered.length === 0 && (
                    <div className="px-4 py-10 text-center text-[13px] text-muted">
                        Keine Dokumente gefunden.
                    </div>
                )}

                {filtered.map((d, i) => (
                    <div
                        key={d.id}
                        className={[
                            'grid gap-4 px-4 py-3 items-center',
                            i < filtered.length - 1
                                ? 'border-b border-border'
                                : '',
                        ]
                            .filter(Boolean)
                            .join(' ')}
                        style={{ gridTemplateColumns: COLS }}
                    >
                        <a
                            href={d.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2.5 min-w-0 no-underline group"
                            title={d.description || d.fileName}
                        >
                            <div
                                className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                                style={{
                                    background:
                                        d.fileType === 'pdf'
                                            ? 'rgba(220,38,38,0.08)'
                                            : 'rgba(37,99,235,0.08)',
                                    color:
                                        d.fileType === 'pdf'
                                            ? '#dc2626'
                                            : '#2563eb',
                                }}
                            >
                                <Icon
                                    name={d.fileType === 'pdf' ? 'pdf' : 'file'}
                                    size={14}
                                />
                            </div>
                            <div className="min-w-0">
                                <div className="text-[13px] font-medium text-text truncate group-hover:text-accent">
                                    {d.fileName}
                                </div>
                                {d.description && (
                                    <div className="text-[11.5px] text-muted truncate">
                                        {d.description}
                                    </div>
                                )}
                            </div>
                        </a>

                        <div
                            className="text-[13px] text-text truncate cursor-pointer hover:text-accent"
                            onClick={() =>
                                d.client &&
                                navigate(`/admin/clients/${d.client._id}`)
                            }
                            title={d.client?.caseNumber}
                        >
                            {d.client
                                ? `Familie ${d.client.familyName}`
                                : '—'}
                        </div>

                        <div className="flex items-center gap-2 min-w-0">
                            {d.uploadedBy ? (
                                <>
                                    <Avatar
                                        name={`${d.uploadedBy.firstName} ${d.uploadedBy.lastName}`}
                                        size={22}
                                    />
                                    <span className="text-[12.5px] text-muted truncate">
                                        {d.uploadedBy.firstName}{' '}
                                        {d.uploadedBy.lastName}
                                    </span>
                                </>
                            ) : (
                                <span className="text-[12.5px] text-muted">
                                    —
                                </span>
                            )}
                        </div>

                        <span className="text-[11.5px] font-medium uppercase text-muted tabular-nums">
                            {d.fileType}
                        </span>

                        <span className="text-[12.5px] text-muted tabular-nums">
                            {formatDate(d.createdAt)}
                        </span>

                        <span className="text-[12.5px] text-muted tabular-nums">
                            {formatFileSize(d.fileSizeBytes)}
                        </span>
                    </div>
                ))}
            </Card>
        </div>
    );
}
