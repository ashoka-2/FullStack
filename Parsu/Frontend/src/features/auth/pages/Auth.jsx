import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Navigate, useSearchParams, Link } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '../hook/useAuth';
import { clearError } from '../auth.slice';
import Toast from '../../Components/Toast';
import { JellyBlobMascot } from '../../Components/JellyBlobMascot';
import { API_BASE_URL, AUTH_TOKEN_KEY } from '../../../utils/axios.js';
import ParsuLogo from '../../Components/ParsuLogo';
import '../../Components/blob.css';

// Subcomponents
import AuthGoogleButton from '../components/AuthGoogleButton';
import AuthLoginForm from '../components/AuthLoginForm';
import AuthRegisterForm from '../components/AuthRegisterForm';
import AuthForgotPasswordForm from '../components/AuthForgotPasswordForm';

import { 
  RiArrowRightLine, 
  RiArrowLeftLine, 
  RiSparklingFill, 
  RiShieldCheckLine, 
  RiMailSendLine, 
  RiCheckboxCircleFill,
  RiRefreshLine
} from '@remixicon/react';

const Auth = ({ initialMode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { 
    handleLogin, 
    handleRegister, 
    handleResendEmail, 
    handleForgotPassword, 
    handleVerifyOtp,
    handleResetPassword,
    handleGetMe
  } = useAuth();

  // Mode: 'login', 'register', or 'forgot'
  const queryMode = searchParams.get('mode');
  const [mode, setMode] = useState(
    queryMode === 'forgot' ? 'forgot' : initialMode === 'register' || queryMode === 'register' ? 'register' : 'login'
  );

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Forgot password flow states
  const [forgotStep, setForgotStep] = useState(1); // 1 = enter email, 2 = enter OTP, 3 = reset password
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [forgotCooldown, setForgotCooldown] = useState(0);
  const [forgotLoading, setForgotLoading] = useState(false);

  // Status states
  const [isRegistered, setIsRegistered] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [resendStatus, setResendStatus] = useState(null);
  const [toast, setToast] = useState({ message: null, type: 'info' });
  const [unverifiedEmailError, setUnverifiedEmailError] = useState(false);

  // Interactive Mascot State
  const [blobMood, setBlobMood] = useState('curious');
  const [blobGaze, setBlobGaze] = useState({ x: 10, y: 0 });
  const [closedEyes, setClosedEyes] = useState(false);
  const [isPasswordSleeping, setIsPasswordSleeping] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const [celebrateCount, setCelebrateCount] = useState(0);
  const [isNodding, setIsNodding] = useState(false);
  const [bubbleText, setBubbleText] = useState("Hey there! Welcome to Parsu 👋");
  const [pokeCount, setPokeCount] = useState(0);
  const pokeTimerRef = useRef(null);
  const nodTimerRef = useRef(null);
  const passwordTypingTimerRef = useRef(null);

  const user = useSelector(state => state.auth.user);
  const loading = useSelector(state => state.auth.loading);
  const reduxError = useSelector(state => state.auth.error);

  // Handle Google OAuth redirects and callbacks (?token=... or ?code=...)
  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const codeParam = searchParams.get('code');

    // If Google redirected directly to frontend with ?code=, proxy it to backend callback
    if (codeParam && !tokenParam) {
      const searchString = window.location.search;
      window.location.href = `${API_BASE_URL || ''}/api/auth/google/callback${searchString}`;
      return;
    }

    if (tokenParam) {
      try {
        localStorage.setItem(AUTH_TOKEN_KEY, tokenParam);
      } catch (e) {
        console.error("Failed to save auth token", e);
      }
      setBlobMood('love');
      setCelebrateCount(c => c + 1);
      setBubbleText("Google sign-in successful! Welcome to Parsu 🎉");
      setToast({ message: "Signed in with Google successfully!", type: 'success' });
      
      handleGetMe()
        .then((res) => {
          const dest = res?.user?.role === 'admin' ? '/admin/dashboard' : (location.state?.from?.pathname || '/ai');
          setTimeout(() => navigate(dest, { replace: true }), 400);
        })
        .catch(() => {
          setTimeout(() => navigate('/ai', { replace: true }), 400);
        });

      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('token');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams]);

  // Sync mode if query params change externally
  useEffect(() => {
    if (queryMode === 'register' && mode !== 'register') {
      setMode('register');
      setBubbleText("Join Parsu! Let's get you set up 🚀");
    } else if (queryMode === 'login' && mode !== 'login') {
      setMode('login');
      setBubbleText("Welcome back! Ready to explore? 👋");
    } else if (queryMode === 'forgot' && mode !== 'forgot') {
      setMode('forgot');
      setBubbleText("Let's recover your password with a 6-digit code! 🔑");
    }
  }, [queryMode]);

  // Forgot password OTP resend cooldown timer
  useEffect(() => {
    let timer;
    if (forgotCooldown > 0) {
      timer = setTimeout(() => setForgotCooldown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [forgotCooldown]);

  // Clean errors and timers on unmount
  useEffect(() => {
    return () => {
      dispatch(clearError());
      if (pokeTimerRef.current) clearTimeout(pokeTimerRef.current);
      if (nodTimerRef.current) clearTimeout(nodTimerRef.current);
      if (passwordTypingTimerRef.current) clearTimeout(passwordTypingTimerRef.current);
    };
  }, [dispatch]);

  // Check for OAuth error in query params
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      const errorMessages = {
        auth_failed: "Google sign-in was cancelled or failed. Please try again.",
        google_no_email: "No email address found from your Google account.",
        server_error: "Authentication server error. Please try again.",
        account_blocked: "This account has been deactivated or blocked by an administrator.",
        unverified_email: "Please verify your email address before signing in.",
      };
      const msg = errorMessages[errorParam] || `Sign in failed: ${errorParam}`;
      setToast({ message: msg, type: 'error' });
      setLocalError(msg);
      setBlobMood('sad');
      setBubbleText("Google sign-in failed. Try again or use email! 🙁");
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('error');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams]);

  // React blob to errors
  useEffect(() => {
    if (reduxError || localError) {
      setBlobMood('surprised');
      setClosedEyes(false);
      setIsPasswordSleeping(false);
      setBlobGaze({ x: 0, y: -10 });
      setBubbleText("Oops! Something didn't quite work 🥺");
    }
  }, [reduxError, localError]);

  // Redirect if already logged in
  const destination = user?.role === 'admin' ? "/admin/dashboard" : (location.state?.from?.pathname || "/ai");
  if (user && !loading) {
    return <Navigate to={destination} replace />;
  }

  // Switch between Login, Register, and Forgot modes
  const handleSwitchMode = (newMode) => {
    setMode(newMode);
    dispatch(clearError());
    setLocalError(null);
    if (newMode === 'register') {
      setSearchParams({ mode: 'register' }, { replace: true });
    } else if (newMode === 'forgot') {
      setForgotStep(1);
      setSearchParams({ mode: 'forgot' }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
    setBlobMood('wave');
    setClosedEyes(false);
    setIsPasswordSleeping(false);
    setBlobGaze({ x: 18, y: 0 });
    setBubbleText(
      newMode === 'register' 
        ? "Awesome! Let's create your account ✨" 
        : newMode === 'forgot'
        ? "No worries! Enter your registered email to get an OTP 🔐"
        : "Welcome back! Enter your details 👇"
    );
    setTimeout(() => {
      setBlobMood('curious');
    }, 1200);
  };

  // Typing nod trigger
  const triggerTypingNod = () => {
    setIsNodding(true);
    if (nodTimerRef.current) clearTimeout(nodTimerRef.current);
    nodTimerRef.current = setTimeout(() => setIsNodding(false), 500);
  };

  // Field focus handlers
  const handleFieldFocus = (field) => {
    setActiveField(field);

    if (field === 'password' || field === 'confirmPassword' || field === 'newPassword' || field === 'confirmNewPassword') {
      setIsPasswordSleeping(false);
      setClosedEyes(false);
      setBlobMood('curious');
      setBlobGaze({ x: 28, y: 8 });
      setBubbleText("Enter password... I'll go to sleep when you type! 🤫");
    } else if (field === 'email') {
      setIsPasswordSleeping(false);
      setClosedEyes(false);
      setBlobMood('curious');
      setBlobGaze({ x: 32, y: 4 });
      setBubbleText("Checking your email... looking good! 📬");
    } else if (field === 'username') {
      setIsPasswordSleeping(false);
      setClosedEyes(false);
      setBlobMood('curious');
      setBlobGaze({ x: 32, y: -2 });
      setBubbleText("Nice username! Let's set up your profile ✨");
    } else if (field === 'otp') {
      setIsPasswordSleeping(false);
      setClosedEyes(false);
      setBlobMood('curious');
      setBlobGaze({ x: 28, y: 4 });
      setBubbleText("Enter the 6-digit code sent to your email! 🔑");
    }
  };

  // Password typing handler
  const handlePasswordTyping = (val, isConfirm = false, customSetter = null) => {
    if (customSetter) {
      customSetter(val);
    } else if (isConfirm) {
      setConfirmPassword(val);
    } else {
      setPassword(val);
    }
    triggerTypingNod();

    if (passwordTypingTimerRef.current) {
      clearTimeout(passwordTypingTimerRef.current);
    }

    const isMasked = isConfirm ? !showConfirmPassword : !showPassword;
    if (isMasked) {
      setIsPasswordSleeping(true);
      setClosedEyes(true);
      setBlobMood('password');
      setBlobGaze({ x: -35, y: -4 });
      setBubbleText("Zzz... Sleeping! Eyes closed, no peeking! 😴🙈");

      passwordTypingTimerRef.current = setTimeout(() => {
        setIsPasswordSleeping(false);
        setClosedEyes(false);
        setBlobMood('curious');
        setBlobGaze({ x: 28, y: 8 });
        setBubbleText("Taking a break? Ready when you are! 👀");
      }, 1100);
    } else {
      setIsPasswordSleeping(false);
      setClosedEyes(false);
      setBlobMood('shy');
      setBlobGaze({ x: -20, y: 2 });
      setBubbleText("Password visible! Looking away! 🫣");
    }
  };

  const handleFieldBlur = () => {
    setActiveField(null);
    if (passwordTypingTimerRef.current) clearTimeout(passwordTypingTimerRef.current);
    setIsPasswordSleeping(false);
    if (!loading && !reduxError && !localError) {
      setClosedEyes(false);
      setBlobMood('curious');
      setBlobGaze({ x: 10, y: 0 });
      setBubbleText("Ask anything, explore everything 🌐");
    }
  };

  // Mascot poke interaction
  const handleBlobPoke = () => {
    setPokeCount(prev => prev + 1);

    if (pokeTimerRef.current) clearTimeout(pokeTimerRef.current);
    pokeTimerRef.current = setTimeout(() => {
      setPokeCount(0);
      setClosedEyes(false);
      setBlobMood('neutral');
      setBubbleText("I'm here to help you explore! 💡");
    }, 2800);

    const currentPokes = pokeCount + 1;
    if (currentPokes >= 5) {
      setBlobMood('angry');
      setClosedEyes(false);
      setBubbleText("Grrr! Stop poking me so fast! 💢");
    } else if (currentPokes >= 3) {
      setBlobMood('surprised');
      setClosedEyes(false);
      setBubbleText("Whoa! You're really energetic today! 💫");
    } else {
      setBlobMood('happy');
      setClosedEyes(false);
      setBubbleText("Hehe! That tickles! 😆");
      setIsNodding(true);
      setTimeout(() => setIsNodding(false), 600);
    }
  };

  // Submit Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    setLocalError(null);
    setUnverifiedEmailError(false);
    setBlobMood('hmm');
    setClosedEyes(false);
    setBlobGaze({ x: 20, y: 0 });
    setBubbleText("Connecting you to your command center... 🚀");

    try {
      const loginRes = await handleLogin({ email: email.trim(), password });
      setBlobMood('love');
      setCelebrateCount(prev => prev + 1);
      setBubbleText("Woohoo! Welcome back! 🎉");
      setToast({ message: "Signed in successfully!", type: 'success' });
      const targetDestination = loginRes?.user?.role === 'admin' ? '/admin/dashboard' : (location.state?.from?.pathname || '/');
      setTimeout(() => navigate(targetDestination), 500);
    } catch (err) {
      const msg = err.response?.data?.message || 
                  err.response?.data?.errors?.[0]?.msg || 
                  "Login failed. Check your credentials.";
      setLocalError(msg);
      setToast({ message: msg, type: 'error' });

      if (msg.toLowerCase().includes("verify your email") || err.response?.data?.err === "email not verified") {
        setUnverifiedEmailError(true);
        setBlobMood('curious');
        setBubbleText("Please verify your email before logging in! 📬");
      } else {
        setBlobMood('surprised');
        setBubbleText(msg);
      }
    }
  };

  // Submit Register
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    setLocalError(null);
    setResendStatus(null);
    setUnverifiedEmailError(false);

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      const msg = "Username is required";
      setToast({ message: msg, type: 'error' });
      setLocalError(msg);
      setBlobMood('angry');
      setBubbleText("Please enter a username! ⚠️");
      return;
    }
    if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
      const msg = "Username must be between 3 and 30 characters";
      setToast({ message: msg, type: 'error' });
      setLocalError(msg);
      setBlobMood('angry');
      setBubbleText("Username must be between 3 and 30 characters! ⚠️");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      const msg = "Username can only contain letters, numbers, and underscores (no spaces or special symbols)";
      setToast({ message: msg, type: 'error' });
      setLocalError(msg);
      setBlobMood('angry');
      setBubbleText("Username: only letters, numbers & underscores allowed! ⚠️");
      return;
    }

    if (!email || !email.includes('@')) {
      const msg = "Please enter a valid email address";
      setToast({ message: msg, type: 'error' });
      setLocalError(msg);
      setBlobMood('angry');
      setBubbleText("Please enter a valid email address! ⚠️");
      return;
    }

    if (password !== confirmPassword) {
      const msg = "Passwords do not match!";
      setToast({ message: msg, type: 'error' });
      setLocalError(msg);
      setBlobMood('angry');
      setClosedEyes(false);
      setBubbleText("Passwords don't match! Double check them ⚠️");
      return;
    }

    if (password.length < 6) {
      const msg = "Password must be at least 6 characters long";
      setToast({ message: msg, type: 'error' });
      setLocalError(msg);
      setBlobMood('surprised');
      setBubbleText("Password must be at least 6 characters long! ⚠️");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      const msg = "Password must contain at least one uppercase letter";
      setToast({ message: msg, type: 'error' });
      setLocalError(msg);
      setBlobMood('surprised');
      setBubbleText("Password needs at least one uppercase letter (A-Z)! ⚠️");
      return;
    }
    if (!/[0-9]/.test(password)) {
      const msg = "Password must contain at least one number";
      setToast({ message: msg, type: 'error' });
      setLocalError(msg);
      setBlobMood('surprised');
      setBubbleText("Password needs at least one number (0-9)! ⚠️");
      return;
    }

    setBlobMood('hmm');
    setClosedEyes(false);
    setBubbleText("Creating your account... 🚀");
    try {
      await handleRegister({ username: trimmedUsername, email: email.trim(), password });
      setIsRegistered(true);
      setBlobMood('love');
      setCelebrateCount(prev => prev + 1);
      setBubbleText("Verification email sent! Check your inbox to activate 📬");
      setToast({ 
        message: `Verification link sent to ${email.trim()}! Please verify your email to log in.`, 
        type: 'success' 
      });
    } catch (err) {
      const msg = err.response?.data?.message || 
                  err.response?.data?.errors?.[0]?.msg || 
                  "Registration failed. Please try again.";
      setLocalError(msg);
      setToast({ message: msg, type: 'error' });
      setBlobMood('angry');
      setBubbleText(msg);
    }
  };

  // Resend email
  const resendEmail = async () => {
    if (!email) {
      const msg = "Please enter your email address first";
      setToast({ message: msg, type: 'error' });
      setLocalError(msg);
      setBlobMood('surprised');
      return;
    }
    setResendStatus("Sending...");
    try {
      await handleResendEmail({ email: email.trim() });
      setResendStatus("Sent!");
      setBlobMood('happy');
      setBubbleText("Verification link re-sent! Check your inbox 📨");
      setToast({ 
        message: `New verification link sent to ${email.trim()}! Check your inbox.`, 
        type: 'success' 
      });
      setTimeout(() => setResendStatus(null), 3500);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to resend verification email";
      setResendStatus(null);
      setToast({ message: msg, type: 'error' });
      setBlobMood('surprised');
      setBubbleText(msg);
    }
  };

  // Send OTP for Forgot Password
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    dispatch(clearError());
    setLocalError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      const msg = "Please enter your registered email address";
      setToast({ message: msg, type: 'error' });
      setLocalError(msg);
      setBlobMood('angry');
      return;
    }

    setForgotLoading(true);
    setBlobMood('hmm');
    setBubbleText("Sending 6-digit OTP code to your inbox... ✉️");

    try {
      const res = await handleForgotPassword({ email: trimmedEmail });
      setForgotStep(2);
      setForgotCooldown(60);
      setBlobMood('happy');
      setBubbleText("Code sent! Check your inbox for the 6-digit OTP 🔑");
      setToast({
        message: res?.message || `6-digit reset code sent to ${trimmedEmail}!`,
        type: 'success'
      });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to send reset code";
      setLocalError(msg);
      setToast({ message: msg, type: 'error' });
      setBlobMood('surprised');
      setBubbleText(msg);
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 2: Validate OTP Code
  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    setLocalError(null);

    const trimmedOtp = otp.trim();
    if (!trimmedOtp || trimmedOtp.length !== 6) {
      const msg = "Please enter the 6-digit verification code";
      setToast({ message: msg, type: 'error' });
      setLocalError(msg);
      setBlobMood('angry');
      return;
    }

    setForgotLoading(true);
    setBlobMood('hmm');
    setBubbleText("Validating your 6-digit OTP code... 🔑");

    try {
      const res = await handleVerifyOtp({ email: email.trim(), otp: trimmedOtp });
      setForgotStep(3);
      setBlobMood('happy');
      setBubbleText("OTP Verified! Now create your new password 🔒");
      setToast({
        message: res?.message || "Code verified successfully! Now please create your new password.",
        type: 'success'
      });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Invalid or expired verification code";
      setLocalError(msg);
      setToast({ message: msg, type: 'error' });
      setBlobMood('surprised');
      setBubbleText(msg);
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 3: Create & Submit New Password
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    setLocalError(null);

    if (newPassword.length < 6) {
      const msg = "New password must be at least 6 characters long";
      setToast({ message: msg, type: 'error' });
      setLocalError(msg);
      setBlobMood('angry');
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      const msg = "New password must contain at least one uppercase letter";
      setToast({ message: msg, type: 'error' });
      setLocalError(msg);
      setBlobMood('angry');
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      const msg = "New password must contain at least one number";
      setToast({ message: msg, type: 'error' });
      setLocalError(msg);
      setBlobMood('angry');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      const msg = "New passwords do not match";
      setToast({ message: msg, type: 'error' });
      setLocalError(msg);
      setBlobMood('angry');
      return;
    }

    setForgotLoading(true);
    setBlobMood('hmm');
    setBubbleText("Updating password... 🔐");

    try {
      const res = await handleResetPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword
      });
      setBlobMood('love');
      setCelebrateCount(prev => prev + 1);
      setBubbleText("Password reset successfully! Ready to sign in 🎉");
      setToast({
        message: res?.message || "Password reset successfully! Please sign in with your new password.",
        type: 'success'
      });
      setForgotStep(1);
      setOtp('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => {
        handleSwitchMode('login');
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to reset password. Please try again.";
      setLocalError(msg);
      setToast({ message: msg, type: 'error' });
      setBlobMood('surprised');
      setBubbleText(msg);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-[#050507] text-zinc-100 flex flex-col justify-between px-4 sm:px-6 lg:px-8 py-4 sm:py-5 relative overflow-y-auto overflow-x-hidden selection:bg-[var(--accent-cyan)]/25 transition-colors duration-300">
      {/* Toast Notification Container */}
      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ message: null, type: 'info' })} 
      />
      
      {/* Ambient Atmospheric Diffused Glows (Apple/AI Dark Studio) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] sm:w-[720px] h-[360px] bg-[var(--accent-cyan)]/[0.04] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[380px] sm:w-[500px] h-[300px] bg-blue-600/[0.03] rounded-full blur-[130px] pointer-events-none" />

      {/* Top Header: Brand & Back to Home */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between z-10 shrink-0 h-12">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-zinc-400 hover:text-white px-3 py-1.5 rounded-full bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] active:scale-[0.97] transition-all duration-150 cursor-pointer"
        >
          <RiArrowLeftLine size={15} />
          <span>Home</span>
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] shadow-xs">
          <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-xs">
            <ParsuLogo size={13} className="text-white" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold tracking-tight text-white">PARSU</span>
            <span className="text-[9px] font-black uppercase tracking-wider text-black bg-[var(--accent-cyan)] px-1 rounded-xs">AI</span>
          </div>
        </div>
      </header>

      {/* Main Stage Grid: Left Mascot Companion, Right Form Card */}
      <section className="flex-1 flex items-center justify-center w-full max-w-5xl mx-auto py-4 sm:py-6 lg:py-8 z-10">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-14 items-center">
          
          {/* ============================================================ */}
          {/* LEFT COLUMN: THE INTERACTIVE JELLYBLOB MASCOT STAGE */}
          {/* ============================================================ */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center select-none text-center">
            
            {/* Reactive Speech Bubble */}
            <div className="mb-3 sm:mb-5 min-h-[36px] flex items-center justify-center">
              <div className="px-3.5 py-1.5 rounded-full bg-[#101114]/90 backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_20px_-4px_rgba(0,0,0,0.6)] text-xs font-medium text-zinc-200 flex items-center gap-2 max-w-[320px] transition-all duration-200 animate-in fade-in zoom-in-95">
                <RiSparklingFill className="w-3.5 h-3.5 text-[var(--accent-cyan)] shrink-0" />
                <span className="truncate">{bubbleText}</span>
              </div>
            </div>

            {/* Responsive Blob Canvas */}
            <div 
              onClick={handleBlobPoke}
              className="w-32 h-32 xs:w-40 xs:h-40 sm:w-56 sm:h-56 lg:w-68 lg:h-68 relative flex items-center justify-center cursor-pointer group transition-transform duration-200 hover:scale-[1.02] active:scale-[0.97]"
              title="Click to interact with mascot!"
            >
              {/* Ambient Underglow */}
              <div className="absolute inset-2 bg-[var(--accent-cyan)]/[0.12] rounded-full blur-2xl sm:blur-3xl group-hover:bg-[var(--accent-cyan)]/[0.2] transition-all pointer-events-none" />

              {/* Mascot Element with physical leaning towards form */}
              <div 
                className="w-full h-full blob-floating-levitate transition-transform duration-500 ease-out origin-bottom"
                style={{
                  transform: isPasswordSleeping
                    ? 'rotate(-7deg) translateX(-18px)'
                    : activeField
                    ? 'rotate(5deg) translateX(18px) scale(1.03)'
                    : 'rotate(0deg) translateX(0px) scale(1)'
                }}
              >
                <JellyBlobMascot
                  mood={blobMood}
                  eyeStyle="v2"
                  gaze={blobGaze}
                  closedEyes={closedEyes}
                  nod={isNodding}
                  celebrate={celebrateCount}
                  onPoke={handleBlobPoke}
                  className="w-full h-full drop-shadow-2xl"
                />
              </div>
            </div>

            {/* Value Proposition Anchoring (Desktop/Tablet) */}
            <div className="hidden lg:flex flex-col items-center mt-6 space-y-2.5 max-w-xs">
              <h2 className="text-sm font-semibold tracking-tight text-white">Your Intelligent Thinking Space</h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Live web synthesis, deep memory recall, and multi-model intelligence in one focused workspace.
              </p>
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[10px] font-medium text-zinc-400 bg-white/[0.04] border border-white/[0.06] px-2.5 py-0.5 rounded-full">Encrypted</span>
                <span className="text-[10px] font-medium text-zinc-400 bg-white/[0.04] border border-white/[0.06] px-2.5 py-0.5 rounded-full">Web Search</span>
                <span className="text-[10px] font-medium text-zinc-400 bg-white/[0.04] border border-white/[0.06] px-2.5 py-0.5 rounded-full">AI Memory</span>
              </div>
            </div>

          </div>

          {/* ============================================================ */}
          {/* RIGHT COLUMN: THE SLEEK AUTH FORM CARD */}
          {/* ============================================================ */}
          <div className="lg:col-span-7 flex justify-center lg:justify-end w-full">
            <div className="w-full max-w-[440px] bg-[#0c0d10]/90 backdrop-blur-3xl border border-white/[0.08] rounded-[26px] p-5 xs:p-6 sm:p-7 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)] relative overflow-hidden transition-all duration-300">
              
              {/* Apple-grade hairline top glass specular highlight */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

              {isRegistered ? (
                /* Dedicated Email Verification Stage */
                <div className="text-center py-4 space-y-5 animate-in fade-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-[var(--accent-cyan)] flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/10 animate-bounce">
                    <RiMailSendLine size={34} />
                  </div>

                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
                      <RiCheckboxCircleFill size={14} />
                      <span>Account Created Successfully</span>
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      Verify Your Email Address
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed max-w-sm mx-auto">
                      We've sent an activation link to <br/>
                      <strong className="text-[var(--accent-cyan)] font-semibold break-all text-sm">{email}</strong>.
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-2">
                      Please check your inbox (or spam folder) and click the link to verify your account before logging in.
                    </p>
                  </div>

                  <div className="pt-2 space-y-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegistered(false);
                        handleSwitchMode('login');
                      }}
                      className="w-full h-11 bg-[var(--accent-cyan)] hover:bg-[#1bb0c4] active:scale-[0.98] text-zinc-950 font-bold rounded-xl transition-all duration-150 text-sm cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                    >
                      <span>Proceed to Sign In</span>
                      <RiArrowRightLine size={16} />
                    </button>

                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={resendEmail}
                        disabled={resendStatus === 'Sending...'}
                        className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-[var(--accent-cyan)] active:scale-[0.97] transition-all cursor-pointer"
                      >
                        <RiRefreshLine size={13} className={resendStatus === 'Sending...' ? 'animate-spin' : ''} />
                        <span>{resendStatus === 'Sent!' ? '✓ Email re-sent! Check inbox' : "Didn't receive email? Resend link"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Form Header */}
                  <div className="mb-5 text-center sm:text-left">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] text-[11px] font-medium mb-2">
                      <RiShieldCheckLine size={13} />
                      <span>Parsu Workspace</span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {mode === 'login' 
                        ? 'Welcome back' 
                        : mode === 'register' 
                        ? 'Create your account' 
                        : forgotStep === 1 
                        ? 'Reset Password' 
                        : forgotStep === 2 
                        ? 'Verify OTP Code' 
                        : 'Create New Password'}
                    </h1>
                    <p className="text-xs text-zinc-400 mt-1">
                      {mode === 'login' 
                        ? 'Enter your credentials to access your chats' 
                        : mode === 'register' 
                        ? 'Start your intelligent journey with Parsu' 
                        : forgotStep === 1
                        ? 'Enter your registered email to receive an OTP code'
                        : forgotStep === 2
                        ? 'Enter the 6-digit verification code sent to your email'
                        : 'Enter and confirm your new account password'}
                    </p>
                  </div>

                  {/* Mode Tab Switcher & Google OAuth Button */}
                  {mode !== 'forgot' && (
                    <AuthGoogleButton
                      mode={mode}
                      onSwitchMode={handleSwitchMode}
                      onMouseEnterGoogle={() => {
                        setBlobMood('wave');
                        setClosedEyes(false);
                        setBlobGaze({ x: 25, y: -4 });
                        setBubbleText("Fast & secure login with Google! ✨");
                      }}
                      onMouseLeaveGoogle={() => {
                        setBlobMood('neutral');
                        setBlobGaze({ x: 0, y: 0 });
                      }}
                    />
                  )}

                  {/* Active Form */}
                  {mode === 'forgot' ? (
                    <AuthForgotPasswordForm
                      forgotStep={forgotStep}
                      setForgotStep={setForgotStep}
                      email={email}
                      setEmail={setEmail}
                      otp={otp}
                      setOtp={setOtp}
                      newPassword={newPassword}
                      setNewPassword={setNewPassword}
                      confirmNewPassword={confirmNewPassword}
                      setConfirmNewPassword={setConfirmNewPassword}
                      showNewPassword={showNewPassword}
                      setShowNewPassword={setShowNewPassword}
                      showConfirmNewPassword={showConfirmNewPassword}
                      setShowConfirmNewPassword={setShowConfirmNewPassword}
                      forgotLoading={forgotLoading}
                      forgotCooldown={forgotCooldown}
                      onSendOtp={handleSendOtp}
                      onVerifyOtpSubmit={handleVerifyOtpSubmit}
                      onResetPasswordSubmit={handleResetPasswordSubmit}
                      onSwitchMode={handleSwitchMode}
                      onFieldFocus={handleFieldFocus}
                      onFieldBlur={handleFieldBlur}
                      onPasswordTyping={handlePasswordTyping}
                      triggerTypingNod={triggerTypingNod}
                      setBlobMood={setBlobMood}
                    />
                  ) : mode === 'login' ? (
                    <AuthLoginForm
                      email={email}
                      setEmail={setEmail}
                      password={password}
                      setPassword={setPassword}
                      showPassword={showPassword}
                      setShowPassword={setShowPassword}
                      loading={loading}
                      unverifiedEmailError={unverifiedEmailError}
                      resendStatus={resendStatus}
                      onResendEmail={resendEmail}
                      onSubmit={handleLoginSubmit}
                      onSwitchMode={handleSwitchMode}
                      onFieldFocus={handleFieldFocus}
                      onFieldBlur={handleFieldBlur}
                      onPasswordTyping={handlePasswordTyping}
                      triggerTypingNod={triggerTypingNod}
                      setBlobMood={setBlobMood}
                      setBlobGaze={setBlobGaze}
                      setBubbleText={setBubbleText}
                      setIsPasswordSleeping={setIsPasswordSleeping}
                      setClosedEyes={setClosedEyes}
                      activeField={activeField}
                      isPasswordSleeping={isPasswordSleeping}
                    />
                  ) : (
                    <AuthRegisterForm
                      username={username}
                      setUsername={setUsername}
                      email={email}
                      setEmail={setEmail}
                      password={password}
                      confirmPassword={confirmPassword}
                      showPassword={showPassword}
                      setShowPassword={setShowPassword}
                      showConfirmPassword={showConfirmPassword}
                      setShowConfirmPassword={setShowConfirmPassword}
                      loading={loading}
                      onSubmit={handleRegisterSubmit}
                      onFieldFocus={handleFieldFocus}
                      onFieldBlur={handleFieldBlur}
                      onPasswordTyping={handlePasswordTyping}
                      triggerTypingNod={triggerTypingNod}
                      setBlobMood={setBlobMood}
                      setBlobGaze={setBlobGaze}
                      setBubbleText={setBubbleText}
                      setIsPasswordSleeping={setIsPasswordSleeping}
                      setClosedEyes={setClosedEyes}
                      activeField={activeField}
                    />
                  )}

                  {/* Bottom Switcher Link */}
                  <div className="mt-5 pt-3.5 border-t border-white/[0.06] text-center text-xs text-zinc-400">
                    {mode === 'forgot' ? (
                      <span>
                        Remember your password?{' '}
                        <button
                          type="button"
                          onClick={() => handleSwitchMode('login')}
                          className="text-[var(--accent-cyan)] hover:underline font-semibold cursor-pointer active:scale-[0.98]"
                        >
                          Sign In
                        </button>
                      </span>
                    ) : mode === 'login' ? (
                      <span>
                        Don't have an account?{' '}
                        <button
                          type="button"
                          onClick={() => handleSwitchMode('register')}
                          className="text-[var(--accent-cyan)] hover:underline font-semibold cursor-pointer active:scale-[0.98]"
                        >
                          Create Account
                        </button>
                      </span>
                    ) : (
                      <span>
                        Already have an account?{' '}
                        <button
                          type="button"
                          onClick={() => handleSwitchMode('login')}
                          className="text-[var(--accent-cyan)] hover:underline font-semibold cursor-pointer active:scale-[0.98]"
                        >
                          Sign In
                        </button>
                      </span>
                    )}
                  </div>
                </>
              )}

            </div>
          </div>

        </div>
      </section>

      {/* Subtle Minimalist Bottom Footer */}
      <footer className="w-full max-w-5xl mx-auto shrink-0 py-2 sm:py-3 text-center text-[11px] text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-white/[0.04] z-10">
        <span className="font-normal text-zinc-400">© {new Date().getFullYear()} Parsu AI. All rights reserved.</span>
        <div className="flex items-center gap-4 text-zinc-400">
          <Link to="/privacy" className="hover:text-zinc-200 transition-colors cursor-pointer">Privacy Policy</Link>
          <span>•</span>
          <Link to="/terms" className="hover:text-zinc-200 transition-colors cursor-pointer">Terms of Service</Link>
          <span>•</span>
          <Link to="/status" className="hover:text-zinc-200 transition-colors cursor-pointer">System Status</Link>
        </div>
      </footer>
    </main>
  );
};

export default Auth;
