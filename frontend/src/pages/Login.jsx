import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Loader2, Fingerprint } from 'lucide-react';
import axios from 'axios';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';


const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { username, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/pos');
    } catch (err) {
      setError('Usuario o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    if (!username) return setError('Por favor, ingresa tu usuario primero');
    setLoading(true);
    setError('');
    try {
      const resOpt = await axios.post('http://localhost:5000/api/webauthn/generate-auth-options', { username });
      let authRes;
      try {
        authRes = await startAuthentication(resOpt.data);
      } catch (e) {
        throw new Error('Autenticación biométrica cancelada o no soportada');
      }
      
      const verRes = await axios.post('http://localhost:5000/api/webauthn/verify-auth', { username, response: authRes });
      
      if (verRes.data.verified) {
        localStorage.setItem('token', verRes.data.token);
        localStorage.setItem('user', JSON.stringify(verRes.data.user));
        navigate('/pos');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Falló la autenticación biométrica');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableBiometrics = async () => {
      if (!username || !password) return setError('Ingresa usuario y contraseña para registrar biometría');
      setLoading(true);
      setError('');
      try {
          // Verify password first
          const loginRes = await axios.post('http://localhost:5000/api/auth/login', { username, password });
          
          const resOpt = await axios.post('http://localhost:5000/api/webauthn/generate-registration-options', { username });
          let regRes;
          try {
             regRes = await startRegistration(resOpt.data);
          } catch (e) {
             throw new Error('Registro cancelado o dispositivo no soportado');
          }

          const verRes = await axios.post('http://localhost:5000/api/webauthn/verify-registration', { username, response: regRes });

          if (verRes.data.verified) {
              alert('¡Hardware biométrico / Passkey registrado exitosamente! Ahora puedes usarlo para entrar.');
              // Opcional: Entrar directamente
              localStorage.setItem('token', loginRes.data.token);
              localStorage.setItem('user', JSON.stringify(loginRes.data.user));
              navigate('/pos');
          }
      } catch (err) {
          setError(err.response?.data?.error || err.message || 'Falló el registro biométrico');
      } finally {
          setLoading(false);
      }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-primary-800 tracking-tight mb-2">Katrix<span className="text-accent">POS</span></h1>
          <p className="text-slate-500 font-medium">Sistema de Gestión de Indumentaria</p>
        </div>
        
        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200 border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Iniciar Sesión</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">Usuario</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  className="input-field pl-12"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  className="input-field pl-12"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <p className="text-xs text-slate-400 mt-2 text-right">Opcional si usas biometría</p>

            </div>
            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
            
            <div className="flex flex-col gap-3 mt-4">
              <button
                type="button"
                onClick={handleLogin}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-sm"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Ingresar con Contraseña'}
              </button>
              
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-semibold uppercase tracking-wider">O usa tu Huella / Cara</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <button
                type="button"
                onClick={handleBiometricLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white py-4 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-slate-900/20 text-sm"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Fingerprint size={20} />}
                Ingresar con Biometría
              </button>

              <button
                type="button"
                onClick={handleEnableBiometrics}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-600 py-3 rounded-xl font-bold transition-all active:scale-95 text-xs mt-2"
              >
                Registrar nuevo dispositivo biométrico
              </button>
            </div>
          </form>
        </div>

        <p className="text-center mt-8 text-slate-400 text-sm">&copy; 2026 Katrix Systems. Todos los derechos reservados.</p>
      </div>
    </div>
  );
};

export default Login;
