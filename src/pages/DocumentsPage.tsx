import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, Icon, SectionHeader } from '../components/shared';
import { api } from '../utils/api';
import { formatDate, formatFileSize } from '../utils/format';

interface ApiClientLite {
    _id: string;
    id?: string;
    familyName: string;
}

interface ApiClientDocument {
    id: string;
    fileName: string;
    fileType: 'pdf' | 'docx';
    fileSizeBytes: number;
    description?: string;
    uploadedBy: string;
    createdAt: string;
    downloadUrl: string;
}

interface DocRow extends ApiClientDocument {
    clientId: string;
    clientFamilyName: string;
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

export default function DocumentsPage() {
    const navigate = useNavigate();
    const [docs, setDocs] = useState<DocRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [fileFilter, setFileFilter] = useState<FileFilter>('alle');
    const [clientFilter, setClientFilter] = useState<string>('alle');

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                setLoading(true);
                setError(null);
                const clients = await api.get<ApiClientLite[]>('/clients');
                if (cancelled) return;

                const results = await Promise.all(
                    clients.map(async (c) => {
                        const cid = c.id ?? c._id;
                        try {
                            const list = await api.get<ApiClientDocument[]>(
                                `/clients/${cid}/documents`,
                            );
                            return list.map<DocRow>((d) => ({
                                ...d,
                                clientId: cid,
                                clientFamilyName: c.familyName,
                            }));
                        } catch {
                            return [] as DocRow[];
                        }
                    }),
                );
                if (cancelled) return;

                const flat = results
                    .flat()
                    .sort(
                        (a, b) =>
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime(),
                    );
                setDocs(flat);
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

    const clientOptions = useMemo(() => {
        const m = new Map<string, string>();
        for (const d of docs) m.set(d.clientId, d.clientFamilyName);
        return Array.from(m.entries()).sort((a, b) =>
            a[1].localeCompare(b[1], 'de'),
        );
    }, [docs]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return docs.filter((d) => {
            if (fileFilter !== 'alle' && d.fileType !== fileFilter)
                return false;
            if (clientFilter !== 'alle' && d.clientId !== clientFilter)
                return false;
            if (q) {
                const hay = [
                    d.fileName,
                    d.description ?? '',
                    d.clientFamilyName,
                ]
                    .join(' ')
                    .toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [docs, search, fileFilter, clientFilter]);

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
    const COLS = '1.8fr 1.4fr 80px 110px 90px';

    return (
        <div>
            <div className="mb-5">
                <h1 className="text-[24px] font-semibold text-text tracking-[-0.02em]">
                    Dokumente
                </h1>
                <p className="text-[13px] text-muted mt-0.5">
                    Alle Dokumente deiner Klienten · {docs.length} gesamt
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
                            Familie {name}
                        </option>
                    ))}
                </select>
                <div className="flex-1 min-w-40" />
                <input
                    type="search"
                    placeholder="Datei, Beschreibung suchen…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 px-3 rounded-md bg-bg border border-border text-[12.5px] text-text outline-none focus:border-accent md:w-70 w-full"
                />
            </div>

            <Card>
                <div className="px-4 py-3 border-b border-border">
                    <SectionHeader
                        title="Übersicht"
                        sub={`${filtered.length} angezeigt`}
                    />
                </div>

                <div className="overflow-x-auto">
                    <div className="min-w-180">
                        <div
                            className="grid gap-4 px-4 py-2.5 border-b border-border"
                            style={{ gridTemplateColumns: COLS }}
                        >
                            {(
                                [
                                    'Datei',
                                    'Klient',
                                    'Typ',
                                    'Hochgeladen',
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
                                            name={
                                                d.fileType === 'pdf'
                                                    ? 'pdf'
                                                    : 'file'
                                            }
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
                                        navigate(`/clients/${d.clientId}`)
                                    }
                                >
                                    Familie {d.clientFamilyName}
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
                    </div>
                </div>
            </Card>
        </div>
    );
}
