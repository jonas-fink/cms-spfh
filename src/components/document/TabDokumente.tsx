import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Icon, Card, SectionHeader } from '../shared';
import { formatDate } from '../../utils/format';
import { api } from '../../utils/api';
import type { ClientDoc } from '../../types';

interface TabDokumenteProps {
    clientId: string;
    documents: ClientDoc[];
    onChange: () => void | Promise<void>;
    readOnly?: boolean;
}

const MAX_BYTES = 10 * 1024 * 1024;

const CONTENT_TYPES: Record<'pdf' | 'docx', string> = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

function getFileType(file: File): 'pdf' | 'docx' | null {
    const name = file.name.toLowerCase();
    if (name.endsWith('.pdf')) return 'pdf';
    if (name.endsWith('.docx')) return 'docx';
    return null;
}

interface UploadState {
    fileName: string;
    status: 'uploading' | 'error';
    message?: string;
}

export interface TabDokumenteHandle {
    openPicker: () => void;
}

export const TabDokumente = forwardRef<TabDokumenteHandle, TabDokumenteProps>(
    function TabDokumente({ clientId, documents, onChange, readOnly = false }, ref) {
    const [isDragging, setIsDragging] = useState(false);
    const [uploads, setUploads] = useState<UploadState[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
        openPicker: () => inputRef.current?.click(),
    }));

    async function uploadOne(file: File) {
        const fileType = getFileType(file);
        if (!fileType) {
            setUploads((u) => [
                ...u,
                {
                    fileName: file.name,
                    status: 'error',
                    message: 'Nur PDF oder DOCX erlaubt',
                },
            ]);
            return;
        }
        if (file.size > MAX_BYTES) {
            setUploads((u) => [
                ...u,
                {
                    fileName: file.name,
                    status: 'error',
                    message: 'Max. 10 MB',
                },
            ]);
            return;
        }

        setUploads((u) => [...u, { fileName: file.name, status: 'uploading' }]);

        try {
            const { presignedUrl, documentId } = await api.post<{
                presignedUrl: string;
                documentId: string;
            }>('/documents/upload-url', {
                clientId,
                fileName: file.name,
                fileType,
                fileSizeBytes: file.size,
            });

            const putRes = await fetch(presignedUrl, {
                method: 'PUT',
                headers: { 'Content-Type': CONTENT_TYPES[fileType] },
                body: file,
            });
            if (!putRes.ok)
                throw new Error(`S3-Upload fehlgeschlagen (${putRes.status})`);

            await api.patch(`/documents/${documentId}/confirm`);

            setUploads((u) => u.filter((x) => x.fileName !== file.name));
            await onChange();
        } catch (err) {
            setUploads((u) =>
                u.map((x) =>
                    x.fileName === file.name
                        ? {
                              ...x,
                              status: 'error',
                              message: (err as Error).message,
                          }
                        : x,
                ),
            );
        }
    }

    async function handleFiles(files: FileList | null) {
        if (!files || files.length === 0) return;
        await Promise.all(Array.from(files).map(uploadOne));
    }

    async function handleDelete(docId: string) {
        if (!confirm('Dokument wirklich löschen?')) return;
        try {
            await api.delete(`/documents/${docId}`);
            await onChange();
        } catch (err) {
            alert((err as Error).message);
        }
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Upload-Zone */}
            {!readOnly && (
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    void handleFiles(e.dataTransfer.files);
                }}
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-[10px] p-7 text-center cursor-pointer transition-all duration-150 ${
                    isDragging
                        ? 'border-accent bg-accent/4'
                        : 'border-border-strong bg-surface'
                }`}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf,.docx"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                        void handleFiles(e.target.files);
                        e.target.value = '';
                    }}
                />
                <div className="w-10 h-10 rounded-[10px] bg-accent/8 flex items-center justify-center mx-auto mb-3">
                    <Icon
                        name="upload"
                        size={18}
                        stroke={1.75}
                        color="var(--accent)"
                    />
                </div>
                <p className="text-[13.5px] font-medium text-text mb-1">
                    {isDragging
                        ? 'Loslassen zum Hochladen'
                        : 'Datei hierher ziehen oder klicken'}
                </p>
                <p className="text-xs text-muted">PDF oder DOCX · max. 10 MB</p>
            </div>
            )}

            {/* Upload-Status */}
            {uploads.length > 0 && (
                <Card>
                    {uploads.map((u, i) => (
                        <div
                            key={`${u.fileName}-${i}`}
                            className={`px-5 py-2.5 flex items-center gap-3 text-[12.5px] ${i > 0 ? 'border-t border-border' : ''}`}
                        >
                            <span className="flex-1 truncate text-text">
                                {u.fileName}
                            </span>
                            {u.status === 'uploading' ? (
                                <span className="text-muted">Lädt hoch…</span>
                            ) : (
                                <>
                                    <span className="text-red-600">
                                        {u.message ?? 'Fehler'}
                                    </span>
                                    <button
                                        className="text-muted hover:text-text"
                                        onClick={() =>
                                            setUploads((s) =>
                                                s.filter((_, j) => j !== i),
                                            )
                                        }
                                    >
                                        <Icon
                                            name="x"
                                            size={14}
                                            stroke={1.75}
                                        />
                                    </button>
                                </>
                            )}
                        </div>
                    ))}
                </Card>
            )}

            {/* Datei-Liste */}
            <Card>
                <div className="px-5 py-3 border-b border-border">
                    <SectionHeader title={`Dokumente (${documents.length})`} />
                </div>
                {documents.length === 0 ? (
                    <p className="px-5 py-8 text-center text-[13px] text-muted m-0">
                        Noch keine Dokumente hochgeladen.
                    </p>
                ) : (
                    documents.map((doc, i) => (
                        <div
                            key={doc.id}
                            className={`px-5 py-3 flex items-center gap-3.5 ${i > 0 ? 'border-t border-border' : ''}`}
                        >
                            <div
                                className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                                    doc.fileType === 'pdf'
                                        ? 'bg-red-500/8'
                                        : 'bg-accent/8'
                                }`}
                            >
                                <Icon
                                    name={
                                        doc.fileType === 'pdf' ? 'pdf' : 'file'
                                    }
                                    size={16}
                                    stroke={1.75}
                                    color={
                                        doc.fileType === 'pdf'
                                            ? '#dc2626'
                                            : '#6366f1'
                                    }
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[13px] font-medium text-text mb-0.5">
                                    {doc.fileName}
                                </div>
                                <div className="text-[11.5px] text-muted">
                                    {doc.size} ·{' '}
                                    {formatDate(doc.uploadedAt, {
                                        dateOnly: true,
                                    })}
                                    {doc.description
                                        ? ` · ${doc.description}`
                                        : ''}
                                </div>
                            </div>
                            <div className="flex gap-0.5 shrink-0">
                                <a
                                    href={doc.downloadUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-disabled={!doc.downloadUrl}
                                    onClick={(e) => {
                                        if (!doc.downloadUrl)
                                            e.preventDefault();
                                    }}
                                    className={`bg-transparent border-none cursor-pointer text-muted p-1.5 rounded-md hover:bg-surface-hover transition-colors duration-100 ${!doc.downloadUrl ? 'opacity-40 pointer-events-none' : ''}`}
                                >
                                    <Icon
                                        name="download"
                                        size={15}
                                        stroke={1.75}
                                    />
                                </a>
                                {!readOnly && (
                                    <button
                                        onClick={() => handleDelete(doc.id)}
                                        className="bg-transparent border-none cursor-pointer text-muted p-1.5 rounded-md hover:bg-surface-hover transition-colors duration-100"
                                    >
                                        <Icon
                                            name="trash"
                                            size={15}
                                            stroke={1.75}
                                        />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </Card>
        </div>
    );
});
