import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, XCircle } from 'lucide-react';

interface QRScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QRScannerDialog = ({ open, onOpenChange }: QRScannerDialogProps) => {
  const navigate = useNavigate();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!open) {
      stopScanner();
      return;
    }

    const timeout = setTimeout(() => {
      startScanner();
    }, 300);

    return () => {
      clearTimeout(timeout);
      stopScanner();
    };
  }, [open]);

  const startScanner = async () => {
    setError(null);
    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          handleScanResult(decodedText);
        },
        () => {}
      );
      setScanning(true);
    } catch (err) {
      console.error('QR Scanner error:', err);
      setError('Tidak dapat mengakses kamera. Pastikan izin kamera sudah diberikan.');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        // ignore cleanup errors
      }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleScanResult = (decodedText: string) => {
    try {
      const url = new URL(decodedText);
      // Accept any URL that has /menu?table= pattern
      if (url.pathname.includes('/menu') && url.searchParams.has('table')) {
        const tableNum = url.searchParams.get('table');
        stopScanner();
        onOpenChange(false);
        navigate(`/menu?table=${tableNum}`);
        return;
      }
    } catch {
      // Not a URL, ignore
    }
    setError('QR Code tidak valid. Silakan scan QR code meja restoran.');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Scan QR Meja
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div
            id="qr-reader"
            className="w-full rounded-lg overflow-hidden bg-muted min-h-[280px]"
          />

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <p className="text-sm text-muted-foreground text-center">
            Arahkan kamera ke QR code di meja restoran
          </p>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRScannerDialog;
