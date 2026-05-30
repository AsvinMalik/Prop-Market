import { useEffect, useState } from 'react';
import { FileText, ScanSearch, Upload, X } from 'lucide-react';
import { VerificationStatus } from '../contexts/AuthContext';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import Button from './ui/Button';
import Card from './ui/Card';
import VerificationBadge from './ui/VerificationBadge';

interface DocumentVerificationModalProps {
  open: boolean;
  onClose: () => void;
  identityStatus: VerificationStatus;
  propertyStatus: VerificationStatus;
  onUpdate: (identityStatus: VerificationStatus, propertyStatus: VerificationStatus) => void;
}

const statusToBadgeVariant = (status: VerificationStatus) => {
  if (status === 'verified') {
    return 'verified-property';
  }

  if (status === 'pending') {
    return 'pending';
  }

  if (status === 'ai_checked') {
    return 'ai-checked';
  }

  return 'unverified';
};

const DocumentVerificationModal = ({
  open,
  onClose,
  identityStatus,
  propertyStatus,
  onUpdate,
}: DocumentVerificationModalProps) => {
  const [identityFileName, setIdentityFileName] = useState('');
  const [propertyFileName, setPropertyFileName] = useState('');

  useEffect(() => {
    if (!open) {
      setIdentityFileName('');
      setPropertyFileName('');
    }
  }, [open]);

  useBodyScrollLock(open);

  if (!open) {
    return null;
  }

  const handleAiCheck = () => {
    onUpdate('pending', 'ai_checked');
  };

  return (
    <div className="animate-fade-in fixed inset-0 z-[70] overflow-y-auto overscroll-contain p-4">
      <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-md" onClick={onClose} />

      <div className="flex min-h-full items-start justify-center md:items-center">
        <Card className="animate-scale-in relative my-auto w-full max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto p-0">
          <div className="hero-gradient px-8 pb-16 pt-8 text-white">
          <button
            onClick={onClose}
            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="max-w-lg space-y-3">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15">
              <ScanSearch className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Verification Center</h2>
              <p className="mt-2 text-sm leading-6 text-blue-50">
                Upload identity and property documents for AI checks and platform
                verification review.
              </p>
            </div>
          </div>
        </div>

          <div className="-mt-10 space-y-6 px-6 pb-6 sm:px-8 sm:pb-8">
            <Card className="p-6 sm:p-7">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="rounded-[28px] border-2 border-dashed border-slate-300 bg-slate-50 p-6 transition-colors hover:border-blue-400 hover:bg-blue-50">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white text-slate-600 shadow-soft">
                  <Upload className="h-7 w-7" />
                </div>
                <div className="mt-5">
                  <div className="text-lg font-bold text-slate-950">Upload Aadhaar / ID</div>
                  <p className="mt-2 text-sm text-slate-500">
                    {identityFileName || 'PDF, JPG, PNG accepted'}
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  onChange={(event) =>
                    setIdentityFileName(event.target.files?.[0]?.name || '')
                  }
                />
              </label>

              <label className="rounded-[28px] border-2 border-dashed border-slate-300 bg-slate-50 p-6 transition-colors hover:border-blue-400 hover:bg-blue-50">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white text-slate-600 shadow-soft">
                  <FileText className="h-7 w-7" />
                </div>
                <div className="mt-5">
                  <div className="text-lg font-bold text-slate-950">
                    Upload Property Document
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {propertyFileName || 'Sale deed, tax receipt, or ownership proof'}
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  onChange={(event) =>
                    setPropertyFileName(event.target.files?.[0]?.name || '')
                  }
                />
              </label>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-700">Identity Status</div>
                <VerificationBadge
                  variant={statusToBadgeVariant(identityStatus)}
                  className="mt-3"
                />
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-700">Property Status</div>
                <VerificationBadge
                  variant={statusToBadgeVariant(propertyStatus)}
                  className="mt-3"
                />
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-700">Pipeline</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <VerificationBadge variant="ai-checked" />
                  <VerificationBadge variant="pending" />
                  <VerificationBadge variant="verified-property">Verified</VerificationBadge>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={handleAiCheck}>Run AI Check</Button>
            </div>
            </Card>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DocumentVerificationModal;
