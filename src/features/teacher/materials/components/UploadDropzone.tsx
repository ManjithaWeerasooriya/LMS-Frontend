'use client';

import { useCallback, useRef, useState } from 'react';

import { PrimaryButton } from '@/components/PrimaryButton';

type UploadDropzoneProps = {
  courseId: string;
  onUpload: (file: File, title?: string) => Promise<void>;
};

export function UploadDropzone({ courseId, onUpload }: UploadDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelection = (file: File | null) => {
    setSelectedFile(file);
    setError(null);
  };

  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0] ?? null;
    handleFileSelection(file);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    handleFileSelection(file);
  };

  const resetForm = () => {
    setSelectedFile(null);
    setTitle('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please choose a file to upload.');
      return;
    }

    if (!courseId) {
      setError('Please select a course.');
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      await onUpload(selectedFile, title.trim() || undefined);
      resetForm();
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : 'Failed to upload material.';
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 shadow-sm">
      <div
        className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-slate-50'
        }`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <p className="text-sm font-semibold text-slate-900">Drag & drop materials here</p>
        <p className="mt-1 text-xs text-slate-500">PDF, video, or assignment files supported.</p>
        <button
          type="button"
          onClick={handleBrowseClick}
          className="mt-4 rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-white"
        >
          Browse files
        </button>
        {selectedFile ? (
          <p className="mt-3 text-sm font-semibold text-blue-700">{selectedFile.name}</p>
        ) : null}
      </div>

      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />

      <div className="mt-4 space-y-3">
        <label className="block text-sm font-semibold text-slate-700">
          Title (optional)
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="e.g., Week 3 Reading Pack"
          />
        </label>
      </div>

      {error ? (
        <p className="mt-3 text-sm text-rose-600">{error}</p>
      ) : null}

      <div className="mt-4">
        <PrimaryButton type="button" loading={isUploading} disabled={isUploading || !courseId} onClick={handleUpload}>
          Upload Material
        </PrimaryButton>
      </div>
    </section>
  );
}
