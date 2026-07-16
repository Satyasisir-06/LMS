import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Camera, AlertTriangle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./button";

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export function QRScanner({ isOpen, onClose, onScan }: QRScannerProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const qrCodeInstanceRef = useRef<Html5Qrcode | null>(null);
  const scannerId = "athenaeum-qr-scanner-element";

  // Get cameras on mount when modal opens
  useEffect(() => {
    if (!isOpen) return;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          const mappedDevices = devices.map((d) => ({ id: d.id, label: d.label }));
          setCameras(mappedDevices);
          setSelectedCameraId(mappedDevices[0].id);
        } else {
          setErrorMsg("No cameras found. Please check permissions or upload an image.");
        }
      })
      .catch((err) => {
        console.error("Camera listing error", err);
        setErrorMsg("Failed to list cameras. Check permissions.");
      });

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  // Start scanner when camera selection is available or changed
  useEffect(() => {
    if (!isOpen || !selectedCameraId) return;

    startScanner(selectedCameraId);

    return () => {
      stopScanner();
    };
  }, [isOpen, selectedCameraId]);

  const startScanner = async (cameraId: string) => {
    try {
      setErrorMsg(null);
      await stopScanner();

      const html5QrCode = new Html5Qrcode(scannerId);
      qrCodeInstanceRef.current = html5QrCode;

      setIsScanning(true);
      await html5QrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          onScan(decodedText);
          stopScanner();
          onClose();
        },
        (errorMessage) => {
          // Verbose logging of scanning frames; ignored for quiet scanning
        }
      );
    } catch (err: any) {
      console.error("Failed to start QR scanner:", err);
      setErrorMsg(err.message || "Failed to initialize camera.");
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (qrCodeInstanceRef.current && qrCodeInstanceRef.current.isScanning) {
      try {
        await qrCodeInstanceRef.current.stop();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    qrCodeInstanceRef.current = null;
    setIsScanning(false);
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCameraId(e.target.value);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setErrorMsg(null);
      const html5QrCode = new Html5Qrcode(scannerId);
      const decodedText = await html5QrCode.scanFile(file, true);
      onScan(decodedText);
      onClose();
    } catch (err) {
      console.error("File scanning error:", err);
      setErrorMsg("Could not find a valid QR Code or barcode in this image.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              stopScanner().then(onClose);
            }}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-parchment-100 dark:bg-ink-950 p-6 shadow-premium border border-gold-400/30 flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-gold-400/10 pb-4">
              <h3 className="font-serif text-lg font-bold text-ink-800 dark:text-ivory flex items-center gap-2">
                <Camera className="size-5 text-gold-500" />
                Scan QR or Barcode
              </h3>
              <button
                onClick={() => {
                  stopScanner().then(onClose);
                }}
                className="rounded-lg p-1 text-mist hover:bg-gold-400/10 hover:text-ink-800 dark:hover:text-ivory"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mt-4 flex gap-2 items-start p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Camera Select */}
            {cameras.length > 1 && (
              <div className="mt-4 flex items-center gap-2">
                <RefreshCw className="size-4 text-mist shrink-0" />
                <select
                  value={selectedCameraId}
                  onChange={handleCameraChange}
                  className="w-full h-9 bg-transparent border border-gold-400/20 rounded-lg text-xs text-ink-800 dark:text-ivory focus:outline-none px-2"
                >
                  {cameras.map((c, i) => (
                    <option key={c.id} value={c.id} className="bg-parchment dark:bg-ink-900">
                      Camera {i + 1}: {c.label || "Generic Camera"}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Scanner Area */}
            <div className="mt-6 aspect-square w-full relative bg-ink-950 border border-gold-400/20 rounded-xl overflow-hidden flex items-center justify-center">
              {/* HTML5 QR Code target element */}
              <div id={scannerId} className="w-full h-full object-cover [&_video]:w-full [&_video]:h-full [&_video]:object-cover" />

              {/* Scanning visual overlay */}
              {isScanning && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  <div className="w-64 h-64 border-2 border-gold-400/50 rounded-lg relative overflow-hidden">
                    {/* Corner accents */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-gold-400" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-gold-400" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-gold-400" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-gold-400" />

                    {/* Animated laser line */}
                    <motion.div
                      animate={{
                        top: ["0%", "100%", "0%"]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                      className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-gold-400 to-transparent shadow-[0_0_8px_rgba(203,168,104,0.8)]"
                    />
                  </div>
                  <span className="mt-4 text-[10px] text-gold-400/80 uppercase tracking-widest bg-ink-950/80 px-2 py-0.5 rounded border border-gold-400/10">
                    Align QR / Barcode
                  </span>
                </div>
              )}
            </div>

            {/* File Upload Alternative */}
            <div className="mt-6 flex flex-col items-center border-t border-gold-400/10 pt-4 gap-2">
              <span className="text-xs text-mist">No camera? Upload a snapshot instead:</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="text-xs text-mist file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gold-400/10 file:text-gold-600 dark:file:text-gold-300 hover:file:bg-gold-400/20"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-gold-400/10 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  stopScanner().then(onClose);
                }}
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
