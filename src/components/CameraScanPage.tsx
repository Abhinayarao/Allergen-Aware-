import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Camera, Image as ImageIcon, Hash, X, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';

interface CameraScanPageProps {
  onCapture: (file: File) => void;
  onUpload: (file: File) => void;
  onBarcode: (barcode: string) => void;
  onVoice?: (payload: { text?: string; audio_base64?: string }) => void;
  onBack: () => void;
  isLoading: boolean;
}

export function CameraScanPage({ onCapture, onUpload, onBarcode, onVoice, onBack, isLoading }: CameraScanPageProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showBarcodeSheet, setShowBarcodeSheet] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [showVoiceSheet, setShowVoiceSheet] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    // Stop existing stream before starting new one
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    setIsCameraReady(false);
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsCameraReady(true);
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please ensure camera permissions are granted.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsScanning(true);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        setTimeout(() => {
          onCapture(file);
          setIsScanning(false);
        }, 500);
      }
    }, 'image/jpeg', 0.9);
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  const handleBarcodeSubmit = () => {
    if (barcodeInput.trim()) {
      onBarcode(barcodeInput.trim());
      setShowBarcodeSheet(false);
      setBarcodeInput('');
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleVoiceSubmit = async () => {
    if (!onVoice) return;
    let audio_base64: string | undefined = undefined;
    if (voiceFile) {
      audio_base64 = await fileToBase64(voiceFile);
    }
    onVoice({ text: voiceText || undefined, audio_base64 });
    setShowVoiceSheet(false);
    setVoiceText('');
    setVoiceFile(null);
  };

  const toggleCamera = () => {
    setFacingMode(prevMode => prevMode === 'environment' ? 'user' : 'environment');
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Navigation */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onBack}
            className="p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-white">Scan</h1>
          <button
            onClick={toggleCamera}
            className="p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors"
            title="Flip camera"
          >
            <RefreshCw className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Camera Preview */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Camera not ready overlay */}
      {!isCameraReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white">Loading camera...</p>
          </div>
        </div>
      )}

      {/* Scanning Animation Overlay */}
      {isScanning && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white text-lg">Analyzing your image...</p>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-30">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white text-lg">Analyzing your image...</p>
            <p className="text-gray-300 text-sm mt-2">This may take a moment</p>
          </div>
        </div>
      )}

      {/* Focus Area Overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Dark overlay with transparent center */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 md:w-96 md:h-96">
            <div className="w-full h-full bg-transparent" />
          </div>
        </div>

        {/* Scanning frame */}
        <div className="relative w-72 h-72 md:w-96 md:h-96">
          {/* Corner borders */}
          <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-3xl shadow-glow-white" />
          <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-3xl shadow-glow-white" />
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-3xl shadow-glow-white" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-3xl shadow-glow-white" />
          
          {/* Animated scanning line */}
          <div className="scanning-line" />
        </div>
      </div>

      {/* Instruction Text */}
      <div className="absolute bottom-32 left-0 right-0 text-center pointer-events-none z-10">
        <div className="bg-black/60 backdrop-blur-sm inline-block px-6 py-3 rounded-full">
          <p className="text-white">Point camera at food or barcode</p>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent pb-8 pt-6">
        <div className="flex items-center justify-around px-8">
          {/* Gallery Button */}
          <button
            onClick={handleGalleryClick}
            className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-white/10 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <ImageIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xs">Gallery</span>
          </button>

          {/* Capture Button */}
          <button
            onClick={captureImage}
            disabled={!isCameraReady || isLoading}
            className="relative group disabled:opacity-50"
          >
            <div className="w-20 h-20 rounded-full bg-white/20 border-4 border-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform backdrop-blur-sm">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                <Camera className="w-8 h-8 text-black" />
              </div>
            </div>
          </button>

          {/* Manual Barcode Button */}
          <button
            onClick={() => setShowBarcodeSheet(true)}
            className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-white/10 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <Hash className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xs">Barcode</span>
          </button>

          {/* Voice Button */}
          <button
            onClick={() => setShowVoiceSheet(true)}
            className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-white/10 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <span className="text-white text-lg">🎤</span>
            </div>
            <span className="text-white text-xs">Voice</span>
          </button>
        </div>
      </div>

      {/* Manual Barcode Entry Sheet */}
      <Sheet open={showBarcodeSheet} onOpenChange={setShowBarcodeSheet}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader className="mb-6">
            <SheetTitle>Enter Barcode Manually</SheetTitle>
          </SheetHeader>

          <div className="space-y-4 pb-4">
            <div>
              <label className="block text-gray-700 mb-2">Barcode Number</label>
              <Input
                type="tel"
                placeholder="e.g., 012345678905"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value.replace(/\D/g, ''))}
                onKeyPress={(e) => e.key === 'Enter' && handleBarcodeSubmit()}
                className="text-lg h-14"
                autoFocus
              />
              <p className="text-sm text-gray-500 mt-2">
                Find the barcode number on your product packaging
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowBarcodeSheet(false)}
                className="flex-1 h-12"
              >
                Cancel
              </Button>
              <Button
                onClick={handleBarcodeSubmit}
                disabled={!barcodeInput.trim() || isLoading}
                className="flex-1 h-12 bg-green-500 hover:bg-green-600"
              >
                Search
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Voice Input Sheet */}
      <Sheet open={showVoiceSheet} onOpenChange={setShowVoiceSheet}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader className="mb-6">
            <SheetTitle>Voice or Text Description</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 pb-4">
            <div>
              <label className="block text-gray-700 mb-2">Describe the food (optional)</label>
              <Input
                value={voiceText}
                onChange={(e) => setVoiceText(e.target.value)}
                placeholder="e.g., chicken sandwich with mayo"
                className="h-12"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Upload audio (optional)</label>
              <input type="file" accept="audio/*" onChange={(e) => setVoiceFile(e.target.files?.[0] || null)} />
              <p className="text-sm text-gray-500 mt-2">We will transcribe and analyze for allergens</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowVoiceSheet(false)} className="flex-1 h-12">Cancel</Button>
              <Button onClick={handleVoiceSubmit} disabled={isLoading || (!voiceText && !voiceFile)} className="flex-1 h-12 bg-green-500 hover:bg-green-600">Analyze</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
