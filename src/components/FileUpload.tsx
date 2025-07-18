import React, { useCallback } from 'react';
import { Upload, File, X } from 'lucide-react';
import * as mammoth from 'mammoth';

interface FileUploadProps {
  id: string;
  onFileUpload: (content: string, fileName:string) => void;
  uploadedFile: { name: string; size: number } | null;
  onRemoveFile: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  id,
  onFileUpload,
  uploadedFile,
  onRemoveFile,
}) => {
  const handleFileUpload = useCallback((file: File) => {
    if (file.name.endsWith('.docx')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        mammoth.extractRawText({ arrayBuffer })
          .then((result: { value: string }) => {
            onFileUpload(result.value, file.name);
          })
          .catch((error: Error) => {
            console.error('Error reading .docx file:', error);
            alert('Failed to read .docx file. Please ensure it is a valid file.');
          });
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onFileUpload(content, file.name);
      };
      reader.readAsText(file);
    }
  }, [onFileUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const acceptedFile = files.find(file => file.name.endsWith('.txt') || file.name.endsWith('.docx'));
    if (acceptedFile) {
      handleFileUpload(acceptedFile);
    }
  }, [handleFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors duration-200 group"
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" />
        <div className="mt-4">
          <label htmlFor={id} className="cursor-pointer">
            <span className="text-lg font-medium text-gray-600 group-hover:text-blue-600 transition-colors duration-200">
              Drop your .txt or .docx file here or click to upload
            </span>
            <input
              id={id}
              type="file"
              accept=".txt,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
          <p className="text-sm text-gray-500 mt-2">
            Supports .txt and .docx files up to 10MB
          </p>
        </div>
      </div>

      {uploadedFile && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <File className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900">{uploadedFile.name}</p>
              <p className="text-xs text-blue-600">{formatFileSize(uploadedFile.size)}</p>
            </div>
          </div>
          <button
            onClick={onRemoveFile}
            className="p-1 hover:bg-blue-100 rounded-full transition-colors duration-200"
          >
            <X className="h-4 w-4 text-blue-600" />
          </button>
        </div>
      )}
    </div>
  );
};