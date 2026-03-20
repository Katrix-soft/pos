import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Search, RefreshCw, ImageIcon, Zap, ZapOff } from 'lucide-react';

/**
 * Katrix Scanner v15.0 — html5-qrcode (universal)
 *
 * Funciona en: Chrome Desktop/Android, Firefox, Safari iOS/macOS, Edge.
 * Motor: html5-qrcode → usa BarcodeDetector si está disponible,
 *        cae a ZXing JS en caso contrario. 100% automático.
 *
 * Sin Quagga. Sin dependencias propias de detección.
 */

const SCANNER_ID = 'katrix-qr-region';

const Scanner = ({ onScan, onClose }) => {
  const scannerRef    = useRef(null);
  const fileInputRef  = useRef(null);
  const isMounted     = useRef(true);

  const [status,     setStatus]     = useState('init');   // 'init' | 'running' | 'error' | 'scanning-file'
  const [errorMsg,   setErrorMsg]   = useState('');
  const [manualCode, setManualCode] = useState('');
  const [flashOn,    setFlashOn]    = useState(false);
  const [cameras,    setCameras]    = useState([]);
  const [camIndex,   setCamIndex]   = useState(0);

  // ── ÉXITO ──────────────────────────────────────────────────────────
  const handleSuccess = useCallback(async (code) => {
    if (!isMounted.current) return;
    if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
    try { await scannerRef.current?.stop(); } catch (_) {}
    onScan(code);
    onClose();
  }, [onScan, onClose]);

  // ── INICIAR ESCÁNER ────────────────────────────────────────────────
  const startScanner = useCallback(async (cameraId) => {
    setStatus('init');
    setErrorMsg('');

    // Detener instancia anterior si existe
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch (_) {}
      try { scannerRef.current.clear(); } catch (_) {}
      scannerRef.current = null;
    }

    try {
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        throw new Error('No se encontró ninguna cámara.');
      }
      if (!isMounted.current) return;
      setCameras(devices);

      // Priorizar cámara trasera (environment)
      const backCam = devices.find(d =>
        /back|rear|environment|trasera/i.test(d.label)
      );
      const chosen = cameraId ?? (backCam?.id || devices[0].id);

      const html5Qrcode = new Html5Qrcode(SCANNER_ID, { verbose: false });
      scannerRef.current = html5Qrcode;

      await html5Qrcode.start(
        chosen,
        {
          fps: 10,
          qrbox: { width: 280, height: 120 },
          aspectRatio: 1.77,     // 16:9
          disableFlip: false,
        },
        (decodedText) => {
          if (!isMounted.current) return;
          handleSuccess(decodedText);
        },
        // onError: ignorar frames sin código (normal)
        () => {}
      );

      if (!isMounted.current) { try { await html5Qrcode.stop(); } catch(_){} return; }
      setStatus('running');

    } catch (err) {
      if (!isMounted.current) return;
      setStatus('error');
      const msg = err?.message || String(err);

      if (/permission|denied|NotAllowed/i.test(msg)) {
        setErrorMsg('Permiso de cámara denegado. Tocá el 🔒 en la barra de dirección → Cámara → Permitir. Luego pulsá Reintentar.');
      } else if (/in use|NotReadable|TrackStart/i.test(msg)) {
        setErrorMsg('La cámara está en uso por otra app o pestaña. Cerrá las demás y pulsá Reintentar.');
      } else if (/camera|found|NotFound/i.test(msg)) {
        setErrorMsg('No se encontró ninguna cámara en este dispositivo.');
      } else {
        setErrorMsg(`Error: ${msg}`);
      }
    }
  }, [handleSuccess]);

  // ── CAMBIAR CÁMARA ─────────────────────────────────────────────────
  const switchCamera = useCallback(async () => {
    const next = (camIndex + 1) % cameras.length;
    setCamIndex(next);
    await startScanner(cameras[next].id);
  }, [camIndex, cameras, startScanner]);

  // ── FLASH ─────────────────────────────────────────────────────────
  const toggleFlash = async () => {
    try {
      if (flashOn) {
        await scannerRef.current?.disableTorch();
      } else {
        await scannerRef.current?.enableTorch();
      }
      setFlashOn(f => !f);
    } catch (_) {
      alert('Linterna no disponible en este dispositivo.');
    }
  };

  // ── FOTO FALLBACK ─────────────────────────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus('scanning-file');

    try {
      // Necesitamos un scanner temporal para decodificar archivo
      // Crear un div temporal oculto
      const tempId = 'katrix-qr-file-temp';
      let tempDiv = document.getElementById(tempId);
      if (!tempDiv) {
        tempDiv = document.createElement('div');
        tempDiv.id = tempId;
        tempDiv.style.display = 'none';
        document.body.appendChild(tempDiv);
      }

      const tempScanner = new Html5Qrcode(tempId, { verbose: false });
      const result = await tempScanner.scanFile(file, false);
      try { tempScanner.clear(); } catch (_) {}

      handleSuccess(result);
    } catch (_) {
      alert('No se detectó ningún código en la imagen. Intentá tomar la foto más de frente, cerca y con buena luz.');
      setStatus('running');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── LIFECYCLE ─────────────────────────────────────────────────────
  useEffect(() => {
    isMounted.current = true;
    startScanner();
    return () => {
      isMounted.current = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const isInit         = status === 'init';
  const isRunning      = status === 'running';
  const isError        = status === 'error';
  const isFileScanning = status === 'scanning-file';

  return (
    <div className="fixed inset-0 z-[9000] bg-black text-white flex flex-col select-none overflow-hidden">

      {/* HEADER */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 bg-black/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center font-black text-sm">K</div>
          <div className="flex items-center gap-2">
            <span className="font-black text-base uppercase italic tracking-tight">
              Katrix <span className="text-primary-400">Scanner</span>
            </span>
            {isRunning && (
              <span className="text-[8px] font-black uppercase tracking-widest text-green-400 ml-1">● ACTIVO</span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-red-500/20 border border-white/5 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* VIEWPORT: el div donde html5-qrcode monta el video */}
      <div className="flex-1 relative bg-black min-h-0 overflow-hidden">

        {/* Contenedor del scanner — siempre en DOM */}
        <div
          id={SCANNER_ID}
          className="w-full h-full"
          style={{ minHeight: '200px' }}
        />

        {/* Overlay de mira — encima del video cuando corre */}
        {isRunning && (
          <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center">
            <div
              className="absolute inset-0"
              style={{ background: 'radial-gradient(ellipse 88% 28% at 50% 50%, transparent, rgba(0,0,0,0.65))' }}
            />
            <div
              className="relative border-2 border-primary-400 rounded-3xl"
              style={{
                width: '82%',
                height: '22%',
                boxShadow: '0 0 32px rgba(251,191,36,0.4)',
              }}
            >
              <span className="absolute -top-px -left-px w-5 h-5 border-t-4 border-l-4 border-primary-400 rounded-tl-2xl" />
              <span className="absolute -top-px -right-px w-5 h-5 border-t-4 border-r-4 border-primary-400 rounded-tr-2xl" />
              <span className="absolute -bottom-px -left-px w-5 h-5 border-b-4 border-l-4 border-primary-400 rounded-bl-2xl" />
              <span className="absolute -bottom-px -right-px w-5 h-5 border-b-4 border-r-4 border-primary-400 rounded-br-2xl" />
              <div
                className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-0.5 bg-primary-400 animate-pulse"
                style={{ boxShadow: '0 0 16px #fbbf24' }}
              />
            </div>
            <p className="absolute text-[10px] font-black uppercase tracking-[0.2em] text-white/40" style={{ top: '60%' }}>
              Centrá el código de barras
            </p>
          </div>
        )}

        {/* Overlay: inicializando */}
        {isInit && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 gap-4 z-20">
            <RefreshCw size={44} className="animate-spin text-primary-500" />
            <p className="font-bold uppercase tracking-widest text-xs text-white/60">Iniciando cámara...</p>
          </div>
        )}

        {/* Overlay: procesando foto */}
        {isFileScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 gap-4 z-20">
            <RefreshCw size={44} className="animate-spin text-emerald-400" />
            <p className="font-bold uppercase tracking-widest text-xs text-white/60">Analizando imagen...</p>
          </div>
        )}

        {/* Overlay: error */}
        {isError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 p-8 text-center gap-5 z-20">
            <div className="text-5xl">📷❌</div>
            <div>
              <p className="font-black text-lg uppercase italic text-red-400 mb-2">Sin Acceso a Cámara</p>
              <p className="text-sm text-white/40 leading-relaxed max-w-sm mx-auto">{errorMsg}</p>
            </div>
            <div className="w-full max-w-sm space-y-3">
              <button
                onClick={() => startScanner()}
                className="w-full bg-primary-600 py-4 rounded-2xl font-black uppercase text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <RefreshCw size={17} /> Reintentar
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-white/5 border border-white/10 py-4 rounded-2xl font-black uppercase text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <ImageIcon size={17} /> Tomar / Subir Foto
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CONTROLES INFERIORES */}
      <div className="flex-shrink-0 bg-slate-950 border-t border-white/5 p-5 space-y-3">

        {isRunning && (
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={toggleFlash}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-xs uppercase transition-all ${
                flashOn ? 'bg-yellow-400 text-black' : 'bg-white/5 text-white hover:bg-white/10'
              }`}
            >
              {flashOn ? <Zap size={14} fill="currentColor" /> : <ZapOff size={14} />} Flash
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 font-black text-xs uppercase transition-all"
            >
              <ImageIcon size={14} /> Foto
            </button>
            {cameras.length > 1 && (
              <button
                onClick={switchCamera}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 font-black text-xs uppercase transition-all"
              >
                <RefreshCw size={14} /> Cámara
              </button>
            )}
          </div>
        )}

        {/* Input manual — siempre visible */}
        <form
          onSubmit={(e) => { e.preventDefault(); if (manualCode.trim()) handleSuccess(manualCode.trim()); }}
          className="flex gap-3"
        >
          <input
            type="text"
            inputMode="numeric"
            placeholder="SKU o código manual..."
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white font-bold placeholder:text-white/20 outline-none focus:border-primary-500 transition-colors text-sm"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
          />
          <button
            type="submit"
            className="bg-primary-600 text-white px-5 rounded-2xl flex items-center justify-center active:scale-95 transition-all"
          >
            <Search size={20} />
          </button>
        </form>

        <p className="text-center text-[8px] font-black uppercase tracking-[0.4em] text-white/10">
          Katrix POS · v15.0 · html5-qrcode multi-engine
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileUpload}
      />
    </div>
  );
};

export default Scanner;
