import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Sidebar from '../../components/Sidebar';
import socket from '../../services/socket';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Whatsapp() {
  const [status, setStatus] = useState('disconnected'); // 'disconnected', 'qr', 'authenticated', 'ready'
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar estado inicial
  useEffect(() => {
    fetch(`${API_URL}/api/whatsapp/status`)
      .then(res => res.json())
      .then(data => {
        setStatus(data.status);
        setQrCode(data.qr);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error cargando estado WP:', err);
        setLoading(false);
      });
  }, []);

  // Escuchar eventos WebSocket en tiempo real
  useEffect(() => {
    socket.connect();
    
    socket.on('whatsapp:status', (data) => {
      setStatus(data.status);
      setQrCode(data.qr);
    });

    return () => {
      socket.off('whatsapp:status');
    };
  }, []);

  const handleDesvincular = async () => {
    if (!confirm('¿Estás seguro de que deseas desvincular el dispositivo actual? WhatsApp se desconectará y deberás volver a escanear el código QR.')) {
      return;
    }
    
    try {
      setStatus('disconnected');
      setQrCode(null);
      await fetch(`${API_URL}/api/whatsapp/logout`, {
        method: 'POST'
      });
      alert('Dispositivo desvinculado. El sistema está generando un nuevo código QR, por favor espera...');
    } catch (err) {
      console.error('Error al desvincular:', err);
      alert('Hubo un error al intentar desvincular el dispositivo.');
    }
  };

  return (
    <div className="flex min-h-screen bg-crema">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="mb-8">
          <h1 className="section-title">Configuración de WhatsApp</h1>
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Cabecera */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center text-2xl">
              <i className="fab fa-whatsapp"></i>
              📱
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Estado de Conexión</h2>
              <p className="text-gray-500 text-sm">Gestiona el dispositivo que enviará los mensajes a los clientes</p>
            </div>
          </div>
          
          <div>
            {status === 'ready' && (
              <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full font-semibold flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Conectado
              </span>
            )}
            {status === 'authenticated' && (
              <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-semibold flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
                Iniciando sesión...
              </span>
            )}
            {status === 'qr' && (
              <span className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full font-semibold flex items-center gap-2">
                ⏳ Esperando QR
              </span>
            )}
            {status === 'disconnected' && (
              <span className="px-4 py-2 bg-red-100 text-red-700 rounded-full font-semibold flex items-center gap-2">
                ❌ Desconectado
              </span>
            )}
          </div>
        </div>

        {/* Contenido principal */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
          {loading ? (
            <div className="py-12 flex flex-col items-center">
              <div className="w-10 h-10 border-4 border-cafe border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-500">Comprobando estado...</p>
            </div>
          ) : (
            <>
              {status === 'ready' || status === 'authenticated' ? (
                <div className="py-8 space-y-6">
                  <div className="w-24 h-24 bg-green-50 mx-auto rounded-full flex items-center justify-center">
                    <span className="text-5xl">✅</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">¡Todo está listo!</h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      El sistema está vinculado a tu cuenta de WhatsApp y listo para enviar y recibir mensajes automáticos de los clientes.
                    </p>
                  </div>
                  
                  <div className="pt-6">
                    <button 
                      onClick={handleDesvincular}
                      className="px-6 py-3 bg-red-50 text-red-600 hover:bg-red-100 font-semibold rounded-xl transition-colors flex items-center gap-2 mx-auto"
                    >
                      <span>Desvincular dispositivo</span>
                    </button>
                    <p className="text-xs text-gray-400 mt-3">Usa esto solo si necesitas cambiar el número de teléfono o si el bot dejó de responder.</p>
                  </div>
                </div>
              ) : status === 'qr' && qrCode ? (
                <div className="py-4 space-y-6 flex flex-col items-center">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Vincula tu WhatsApp</h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      1. Abre WhatsApp en tu celular<br/>
                      2. Toca Menú o Configuración y selecciona Dispositivos vinculados<br/>
                      3. Toca Vincular un dispositivo<br/>
                      4. Apunta la cámara a esta pantalla
                    </p>
                  </div>
                  
                  <div className="bg-white p-4 border-2 border-gray-100 rounded-xl inline-block shadow-sm">
                    <QRCodeSVG value={qrCode} size={256} />
                  </div>
                  
                  <div className="pt-4 flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 px-4 py-2 rounded-lg">
                    <span className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></span>
                    Esperando escaneo...
                  </div>
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center">
                  <div className="w-10 h-10 border-4 border-gray-300 border-t-cafe rounded-full animate-spin mb-4"></div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Iniciando servicio...</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    El sistema está preparando la conexión con WhatsApp. El código QR aparecerá en unos segundos.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
        </div>
      </main>
    </div>
  );
}
