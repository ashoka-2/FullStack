import React, { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../hook/useAuth';
import FormField from '../components/FormField';
import Toast from '../../Components/Toast';
import { useDispatch, useSelector } from 'react-redux';
import { clearError } from '../auth.slice';
import { RiUserAddLine, RiCheckboxCircleFill, RiMailSendLine, RiLoader4Line } from '@remixicon/react';

const Register = () => {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isRegistered, setIsRegistered] = useState(false)
  const [localError, setLocalError] = useState(null)
  const [resendStatus, setResendStatus] = useState(null)

  const dispatch = useDispatch();
  const { handleRegister, handleResendEmail } = useAuth();
  
  const reduxError = useSelector(state => state.auth.error);
  const loading = useSelector(state => state.auth.loading);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleRegisterClick = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    setLocalError(null);
    setResendStatus(null);

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match!");
      return;
    }

    try {
      await handleRegister({ username, email, password });
      setIsRegistered(true);
    } catch (err) {
      // Errors are handled in useAuth via dispatch
    }
  };

  const resendEmail = async () => {
    if (!email) {
      setLocalError("Please enter your email first");
      return;
    }
    setResendStatus("Sending...");
    try {
        await handleResendEmail({ email });
        setResendStatus("Sent!");
        setTimeout(() => setResendStatus(null), 3000);
    } catch (err) {
        setResendStatus(null);
    }
  }

  return (
    <section className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 selection:bg-[#60A6AF]/30">
      <div className="w-full max-w-[480px] bg-[#191a1a] border border-[#2d2e2e] rounded-3xl p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
        {/* Perplexity Glow Effects */}
        <div className="absolute -top-[10%] -right-[10%] w-[300px] h-[300px] bg-[#60A6AF]/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[250px] h-[250px] bg-[#60A6AF]/3 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center mb-10">
          <div className="w-14 h-14 bg-zinc-800/50 rounded-2xl mb-6 flex items-center justify-center border border-[#2d2e2e] shadow-inner">
            <RiUserAddLine className="w-7 h-7 text-[#60A6AF]" />
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight">Create your account</h1>
          <p className="text-zinc-500 mt-3 text-sm font-medium">Join the next generation of knowledge discovery.</p>
        </div>

        <form onSubmit={handleRegisterClick} className="space-y-6">
          <FormField
            label="Username"
            type="text"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose a cool username"
          />
          <FormField
            label="Email"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <FormField
            label="Password"
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 characters"
          />
          <FormField
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
          />

          <button
            type="submit"
            disabled={loading || isRegistered}
            className={`w-full font-bold py-4 rounded-xl transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.98] shadow-xl mt-4 cursor-pointer flex items-center justify-center gap-3
              ${isRegistered 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-none' 
                : 'bg-[#20b8cd] hover:bg-[#1da9bc] text-zinc-950 shadow-[#20b8cd]/10'}
              ${loading ? 'opacity-70 cursor-wait' : ''}`}
          >
            {loading ? (
              <>
                <RiLoader4Line className="animate-spin w-5 h-5" />
                Processing...
              </>
            ) : isRegistered ? (
              <>
                <RiCheckboxCircleFill className="w-5 h-5" />
                Registered, verify sent in email
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-10 space-y-5 text-center relative z-10">
          <p className="text-zinc-500 text-sm font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-[#20b8cd] hover:text-[#1da9bc] font-bold transition-colors underline-offset-4 hover:underline">
              Log in
            </Link>
          </p>

          <div className="pt-6 border-t border-[#2d2e2e]">
            <button
              onClick={resendEmail}
              disabled={loading}
              className="group text-zinc-400 hover:text-zinc-200 text-sm transition-all duration-200 flex items-center justify-center gap-2 mx-auto cursor-pointer"
            >
              <RiMailSendLine className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${resendStatus === 'Sent!' ? 'text-emerald-400' : 'text-zinc-500'}`} />
              <div className="flex gap-1.5">
                <span>{resendStatus === 'Sent!' ? 'Check your inbox' : "Didn't get the email?"}</span>
                <span className={`font-bold ${resendStatus === 'Sent!' ? 'text-emerald-400' : 'text-[#20b8cd]'}`}>
                    {resendStatus || 'Resend'}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <Toast 
        message={reduxError || localError} 
        type="error" 
        onClose={() => {
          dispatch(clearError());
          setLocalError(null);
        }} 
      />
    </section>
  )
}

export default Register