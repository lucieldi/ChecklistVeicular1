import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, AlertCircle } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (base64Image: string) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    const initCamera = async () => {
      try {
        setError('');
        
        // 1. Get initial stream to trigger permission prompt and get labels
        const initialStream = await navigator.mediaDevices.getUserMedia({ video: true });
        
        // 2. Enumerate devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setCameras(videoDevices);

        // 3. Determine which camera to use
        let targetDeviceId = selectedCameraId;
        if (!targetDeviceId && videoDevices.length > 0) {
          const backCamera = videoDevices.find(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('traseira') ||
            d.label.toLowerCase().includes('environment')
          );
          targetDeviceId = backCamera ? backCamera.deviceId : videoDevices[0].deviceId;
          setSelectedCameraId(targetDeviceId);
        }

        // 4. Stop initial stream before starting the specific one
        initialStream.getTracks().forEach(track => track.stop());

        // 5. Start the selected camera with robust constraints
        const constraints: MediaStreamConstraints = {
          video: {
            deviceId: targetDeviceId ? { ideal: targetDeviceId } : undefined,
            facingMode: targetDeviceId ? undefined : 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        currentStream = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Ensure video plays
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(e => console.error("Error playing video:", e));
          };
        }
      } catch (err: any) {
        console.error("Camera initialization error:", err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Permissão negada. Verifique as configurações de privacidade do seu navegador e do sistema operacional.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError('Nenhuma câmera encontrada neste dispositivo.');
        } else {
          setError('Erro ao acessar a câmera. Certifique-se de que nenhuma outra aba ou aplicativo está usando a câmera.');
        }
      }
    };

    initCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [selectedCameraId]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Image = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(base64Image);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden flex flex-col shadow-2xl">
        <div className="p-4 border-b border-zinc-200 flex justify-between items-center bg-zinc-50">
          <h3 className="font-semibold text-zinc-900 flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Capturar Foto
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-lg transition-colors">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>
        
        <div className="relative bg-black flex-1 min-h-[400px] flex items-center justify-center">
          {error ? (
            <div className="text-white text-center p-6">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <p className="mb-6">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-white text-zinc-900 rounded-xl font-bold hover:bg-zinc-100 transition-colors"
              >
                Recarregar Página
              </button>
            </div>
          ) : (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="max-h-[60vh] max-w-full object-contain"
            />
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="w-full sm:w-auto flex-1 max-w-xs">
            {cameras.length > 0 && (
              <select 
                className="w-full px-4 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 outline-none shadow-sm"
                value={selectedCameraId}
                onChange={(e) => setSelectedCameraId(e.target.value)}
                disabled={!!error}
              >
                {cameras.map((camera, index) => (
                  <option key={camera.deviceId} value={camera.deviceId}>
                    {camera.label || `Câmera ${index + 1}`}
                  </option>
                ))}
              </select>
            )}
          </div>
          
          <button 
            onClick={handleCapture}
            disabled={!!error}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-[var(--color-brand-yellow)] text-zinc-900 rounded-xl font-bold hover:bg-[var(--color-brand-yellow-hover)] transition-all w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            <Camera className="w-5 h-5" />
            Tirar Foto
          </button>
        </div>
      </div>
    </div>
  );
}
