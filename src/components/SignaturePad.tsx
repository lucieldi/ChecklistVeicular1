import React, { useRef, useState, useEffect, useCallback } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Eraser, Check } from 'lucide-react';

interface SignaturePadProps {
  onSave: (signature: string) => void;
  initialSignature?: string;
}

export default function SignaturePad({ onSave, initialSignature }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasSignature, setHasSignature] = useState(!!initialSignature);
  const [dimensions, setDimensions] = useState({ width: 0, height: 160 });

  const resizeCanvas = useCallback(() => {
    if (containerRef.current) {
      const { offsetWidth } = containerRef.current;
      setDimensions(prev => ({ ...prev, width: offsetWidth }));
      
      // After resize, we need to redraw the signature if it exists
      if (initialSignature && sigCanvas.current && sigCanvas.current.isEmpty()) {
        sigCanvas.current.fromDataURL(initialSignature);
      }
    }
  }, [initialSignature]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  useEffect(() => {
    if (initialSignature && sigCanvas.current) {
      // Small delay to ensure canvas is ready
      const timer = setTimeout(() => {
        if (sigCanvas.current && sigCanvas.current.isEmpty()) {
          sigCanvas.current.fromDataURL(initialSignature);
          setHasSignature(true);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialSignature]);

  const clear = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      setHasSignature(false);
      onSave(''); // Clear the saved signature
    }
  };

  const handleEnd = () => {
    if (sigCanvas.current) {
      if (!sigCanvas.current.isEmpty()) {
        setHasSignature(true);
        onSave(sigCanvas.current.getCanvas().toDataURL('image/png'));
      } else {
        setHasSignature(false);
        onSave('');
      }
    }
  };

  return (
    <div className="flex flex-col items-center w-full" ref={containerRef}>
      <div className="border-2 border-dashed border-zinc-300 rounded-xl bg-white w-full max-w-md relative overflow-hidden">
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            width: dimensions.width,
            height: dimensions.height,
            className: 'cursor-crosshair'
          }}
          onEnd={handleEnd}
          penColor="#18181b" // zinc-900
        />
        
        {!hasSignature && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-zinc-400 text-sm font-medium">
            Assine aqui
          </div>
        )}
      </div>
      
      <div className="flex justify-end w-full max-w-md mt-2">
        <button
          type="button"
          onClick={clear}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Eraser className="w-3.5 h-3.5" />
          Limpar
        </button>
      </div>
    </div>
  );
}
