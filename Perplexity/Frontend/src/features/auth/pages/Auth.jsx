import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Navigate, useSearchParams } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '../hook/useAuth';
import { clearError } from '../auth.slice';
import Toast from '../../Components/Toast';
import { JellyBlobMascot } from '../../Components/JellyBlobMascot';
import { API_BASE_URL } from '../../../utils/axios.js';
import { 
  RiEyeLine, 
  RiEyeOffLine, 
  RiLoader4Line, 
  RiCheckboxCircleFill,
  RiMailLine,
  RiMailSendLine,
  RiUser3Line,
  RiLockPasswordLine,
  RiSparklingFill,
  RiShieldCheckLine,
  RiShieldKeyholeLine,
  RiArrowRightLine,
  RiArrowLeftLine,
  RiKey2Line,
  RiRefreshLine,
  RiAlertLine
} from '@remixicon/react';
import PerplexityIcon from '../../Components/PerplexityIcon';
import '../../Components/blob.css';

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
    handleResetPassword 
  } = useAuth();

  // Mode: 'login', 'register', or 'forgot' from query param or initialMode
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
  const [forgotStep, setForgotStep] = useState(1); // 1 = enter email, 2 = enter OTP & new password
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
  const [bubbleText, setBubbleText] = useState("Hey there! Welcome to Perplexity 👋");
  const [pokeCount, setPokeCount] = useState(0);
  const pokeTimerRef = useRef(null);
  const nodTimerRef = useRef(null);
  const passwordTypingTimerRef = useRef(null);

  const user = useSelector(state => state.auth.user);
  const loading = useSelector(state => state.auth.loading);
  const reduxError = useSelector(state => state.auth.error);

  // Sync mode if query params change externally
  useEffect(() => {
    if (queryMode === 'register' && mode !== 'register') {
      setMode('register');
      setBubbleText("Join Perplexity! Let's get you set up 🚀");
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
  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  // Switch between Login, Register, and Forgot modes smoothly on the single /auth route without page reload
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

  // Field focus handlers:
  // - Non-password fields: bends and looks towards form (right) with normal cute eyes
  // - Password field: when cursor placed but NOT typing, looks with open cute eyes (Image 2)
  const handleFieldFocus = (field) => {
    setActiveField(field);

    if (field === 'password' || field === 'confirmPassword' || field === 'newPassword' || field === 'confirmNewPassword') {
      // Cursor is on password field, but NOT typing yet: looks with same open cute eyes!
      setIsPasswordSleeping(false);
      setClosedEyes(false);
      setBlobMood('curious');
      setBlobGaze({ x: 28, y: 8 }); // Bending towards password field
      setBubbleText("Enter password... I'll go to sleep when you type! 🤫");
    } else if (field === 'email') {
      // Look to RIGHT side towards email input, bending body towards form
      setIsPasswordSleeping(false);
      setClosedEyes(false);
      setBlobMood('curious');
      setBlobGaze({ x: 32, y: 4 });
      setBubbleText("Checking your email... looking good! 📬");
    } else if (field === 'username') {
      // Look to RIGHT side towards username input, bending body towards form
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

  // Password typing handler:
  // - While typing: sleeps with closed eyes and looks away
  // - When typing stops: wakes up and looks with open eyes towards the field
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
      // When typing password, it sleeps!
      setIsPasswordSleeping(true);
      setClosedEyes(true);
      setBlobMood('password');
      setBlobGaze({ x: -35, y: -4 }); // Looks away to the left
      setBubbleText("Zzz... Sleeping! Eyes closed, no peeking! 😴🙈");

      // When user pauses typing, wake up and look with open eyes as shown in the image
      passwordTypingTimerRef.current = setTimeout(() => {
        setIsPasswordSleeping(false);
        setClosedEyes(false);
        setBlobMood('curious');
        setBlobGaze({ x: 28, y: 8 });
        setBubbleText("Taking a break? Ready when you are! 👀");
      }, 1100);
    } else {
      // If password unmasked, peek shyly
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

  // Mascot poke interaction (like floating blob)
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
      // Rapid poking makes it angry!
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
      await handleLogin({ email: email.trim(), password });
      setBlobMood('love');
      setCelebrateCount(prev => prev + 1);
      setBubbleText("Woohoo! Welcome back! 🎉");
      setToast({ message: "Signed in successfully!", type: 'success' });
      setTimeout(() => navigate('/'), 500);
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
      setForgotStep(3); // Successfully validated OTP -> Move to Step 3 (Create New Password)!
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
    <main className="min-h-[100dvh] bg-[#f4f5f7] dark:bg-[#07080a] text-zinc-900 dark:text-zinc-100 flex flex-col items-center justify-between p-3 xs:p-4 sm:p-6 lg:p-10 relative overflow-y-auto overflow-x-hidden selection:bg-[#20b8cd]/30 transition-colors duration-300">
      {/* Toast Notification Container */}
      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ message: null, type: 'info' })} 
      />
      
      {/* Ambient Atmospheric Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-[#4ecde0]/15 dark:bg-[#199eb0]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-blue-500/10 dark:bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header: Brand & Back to Home */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between py-1 sm:py-2 mb-2 sm:mb-4 z-10 shrink-0">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer px-2.5 py-1.5 rounded-xl hover:bg-zinc-200/60 dark:hover:bg-white/5"
        >
          <RiArrowLeftLine size={16} />
          <span>Home</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
            <PerplexityIcon size={16} className="text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white">Perplexity</span>
        </div>
      </div>

      {/* Main Single Page Grid: Left Blob, Right Form */}
      <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-4 sm:gap-8 lg:gap-12 relative z-10 my-auto py-2">
        
        {/* ============================================================ */}
        {/* LEFT COLUMN: THE INTERACTIVE JELLYBLOB MASCOT STAGE */}
        {/* ============================================================ */}
        <div className="w-full lg:w-[48%] flex flex-col items-center justify-center py-1 sm:py-3 lg:py-6 select-none shrink-0">
          
          {/* Reactive Speech Bubble (Like Floating Mascot) */}
          <div className="mb-2 sm:mb-4 min-h-[30px] sm:min-h-[44px] flex items-center justify-center">
            <div className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-2xl bg-white/90 dark:bg-[#15171a]/90 backdrop-blur-md border border-cyan-500/25 shadow-md shadow-cyan-500/5 text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200 text-center animate-in fade-in zoom-in-95 duration-200 max-w-[260px] sm:max-w-[340px] flex items-center gap-1.5 sm:gap-2">
              <RiSparklingFill className="w-3.5 h-3.5 text-[#20b8cd] shrink-0" />
              <span className="truncate">{bubbleText}</span>
            </div>
          </div>

          {/* Responsive Blob Canvas */}
          <div 
            onClick={handleBlobPoke}
            className="w-24 h-24 xs:w-28 xs:h-28 sm:w-60 sm:h-60 md:w-72 md:h-72 lg:w-84 lg:h-84 relative flex items-center justify-center cursor-pointer group transition-transform duration-300 hover:scale-[1.03]"
            title="Click to interact with mascot!"
          >
            {/* Blob Ambient Underglow */}
            <div className="absolute inset-0 bg-[#4ecde0]/20 dark:bg-[#199eb0]/15 rounded-full blur-2xl sm:blur-3xl group-hover:bg-[#4ecde0]/30 transition-all pointer-events-none" />

            {/* Mascot Element with levitation and physical leaning towards form */}
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
                className="w-full h-full drop-shadow-xl"
              />
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: THE SLEEK AUTH FORM CARD */}
        {/* ============================================================ */}
        <div className="w-full lg:w-[52%] max-w-[460px] shrink-0">
          <div className="bg-white/90 dark:bg-[#111214]/90 backdrop-blur-2xl border border-zinc-200/90 dark:border-white/10 rounded-2xl sm:rounded-3xl p-4 xs:p-6 sm:p-8 shadow-2xl transition-all duration-300">
            
            {isRegistered ? (
              /* Dedicated Email Verification Stage */
              <div className="text-center py-4 sm:py-6 space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 text-[#20b8cd] flex items-center justify-center mx-auto shadow-xl shadow-cyan-500/10 animate-bounce">
                  <RiMailSendLine size={38} />
                </div>

                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold mb-2">
                    <RiCheckboxCircleFill size={14} />
                    <span>Account Created Successfully</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                    Verify Your Email Address
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed max-w-sm mx-auto">
                    We've sent an activation link to <br/>
                    <strong className="text-[#20b8cd] font-semibold break-all text-sm">{email}</strong>.
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">
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
                    className="w-full bg-gradient-to-r from-[#20b8cd] to-[#0ea5e9] hover:from-[#199eb0] hover:to-[#0284c7] text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 text-sm cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                  >
                    <span>Proceed to Sign In</span>
                    <RiArrowRightLine size={16} />
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={resendEmail}
                      disabled={resendStatus === 'Sending...'}
                      className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-[#20b8cd] transition-colors cursor-pointer"
                    >
                      <RiRefreshLine size={14} className={resendStatus === 'Sending...' ? 'animate-spin' : ''} />
                      <span>{resendStatus === 'Sent!' ? '✓ Email re-sent! Check inbox' : "Didn't receive email? Resend link"}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Form Header */}
                <div className="mb-6 text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[#20b8cd] text-xs font-semibold mb-2">
                    <RiShieldCheckLine size={14} />
                    <span>AI Search & Social Hub</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                    {mode === 'login' 
                      ? 'Welcome back' 
                      : mode === 'register' 
                      ? 'Create your account' 
                      : forgotStep === 1 
                      ? 'Forgot Password' 
                      : forgotStep === 2 
                      ? 'Verify OTP Code' 
                      : 'Create New Password'}
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    {mode === 'login' 
                      ? 'Enter your credentials to access your chats' 
                      : mode === 'register' 
                      ? 'Start your intelligent journey with Perplexity' 
                      : forgotStep === 1
                      ? 'Enter your registered email to receive an OTP code'
                      : forgotStep === 2
                      ? 'Enter the 6-digit verification code sent to your email'
                      : 'Enter and confirm your new account password'}
                  </p>
                </div>

                {/* Segmented Pill Tab Switcher & Google Button (Only in login / register modes) */}
                {mode !== 'forgot' && (
                  <>
                    <div className="flex p-1 rounded-xl bg-zinc-100 dark:bg-white/[0.05] border border-zinc-200/80 dark:border-white/5 mb-5">
                      <button
                        type="button"
                        onClick={() => handleSwitchMode('login')}
                        className={`w-1/2 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
                          mode === 'login'
                            ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs'
                            : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                        }`}
                      >
                        Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSwitchMode('register')}
                        className={`w-1/2 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
                          mode === 'register'
                            ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs'
                            : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                        }`}
                      >
                        Create Account
                      </button>
                    </div>

                    {/* Google 1-Tap OAuth Button */}
                    <a
                      href={`${API_BASE_URL || ''}/api/auth/google`}
                      onMouseEnter={() => {
                        setBlobMood('wave');
                        setClosedEyes(false);
                        setBlobGaze({ x: 25, y: -4 });
                        setBubbleText("Fast & secure login with Google! ✨");
                      }}
                      onMouseLeave={() => {
                        setBlobMood('neutral');
                        setBlobGaze({ x: 0, y: 0 });
                      }}
                      className="w-full flex items-center justify-center gap-3 bg-zinc-50 dark:bg-white/[0.03] hover:bg-zinc-100 dark:hover:bg-white/[0.07] border border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-zinc-200 font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 text-sm cursor-pointer shadow-xs"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                      </svg>
                      <span>Continue with Google</span>
                    </a>

                    {/* Clean Divider */}
                    <div className="flex items-center gap-3 my-5">
                      <div className="flex-1 h-px bg-zinc-200 dark:bg-white/10" />
                      <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                        or continue with email
                      </span>
                      <div className="flex-1 h-px bg-zinc-200 dark:bg-white/10" />
                    </div>
                  </>
                )}

                {/* Unverified Email Notice if user tried to sign in without verifying */}
                {mode === 'login' && unverifiedEmailError && (
                  <div className="mb-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-600 dark:text-amber-400 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-2">
                      <RiAlertLine size={18} className="shrink-0 text-amber-500" />
                      <span>Your email is not verified yet. Please verify it to log in.</span>
                    </div>
                    <button
                      type="button"
                      onClick={resendEmail}
                      disabled={resendStatus === 'Sending...'}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 text-zinc-950 font-bold hover:bg-amber-400 transition-all shrink-0 cursor-pointer text-xs flex items-center gap-1"
                    >
                      <RiRefreshLine size={12} className={resendStatus === 'Sending...' ? 'animate-spin' : ''} />
                      <span>{resendStatus === 'Sent!' ? '✓ Sent' : resendStatus === 'Sending...' ? 'Sending...' : 'Resend Link'}</span>
                    </button>
                  </div>
                )}

                {/* Form Content */}
                {mode === 'forgot' ? (
                  <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                    {/* 3-Step Progress Indicator */}
                    <div className="flex items-center justify-between mb-2 px-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                          forgotStep === 1 
                            ? 'bg-[#20b8cd] text-zinc-950 shadow-xs' 
                            : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                        }`}>
                          {forgotStep > 1 ? '✓' : '1'}
                        </div>
                        <span className={`text-xs font-semibold ${forgotStep === 1 ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}`}>
                          Email
                        </span>
                      </div>

                      <div className={`flex-1 h-0.5 mx-2.5 transition-all ${forgotStep > 1 ? 'bg-[#20b8cd]' : 'bg-zinc-200 dark:bg-white/10'}`} />

                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                          forgotStep === 2 
                            ? 'bg-[#20b8cd] text-zinc-950 shadow-xs' 
                            : forgotStep > 2 
                            ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                            : 'bg-zinc-100 dark:bg-white/5 text-zinc-400'
                        }`}>
                          {forgotStep > 2 ? '✓' : '2'}
                        </div>
                        <span className={`text-xs font-semibold ${forgotStep === 2 ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}`}>
                          Verify OTP
                        </span>
                      </div>

                      <div className={`flex-1 h-0.5 mx-2.5 transition-all ${forgotStep > 2 ? 'bg-[#20b8cd]' : 'bg-zinc-200 dark:bg-white/10'}`} />

                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                          forgotStep === 3 
                            ? 'bg-[#20b8cd] text-zinc-950 shadow-xs' 
                            : 'bg-zinc-100 dark:bg-white/5 text-zinc-400'
                        }`}>
                          3
                        </div>
                        <span className={`text-xs font-semibold ${forgotStep === 3 ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}`}>
                          New Password
                        </span>
                      </div>
                    </div>

                    {/* Step 1: Enter Email */}
                    {forgotStep === 1 && (
                      <form onSubmit={handleSendOtp} className="space-y-4">
                        <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-700 dark:text-cyan-300 leading-relaxed">
                          Enter your registered email address. If an account exists with this email, we will send you a 6-digit OTP code to verify and reset your password.
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 ml-0.5">
                            Registered Email Address <span className="text-red-500 font-bold ml-0.5" title="Required">*</span>
                          </label>
                          <div className="relative">
                            <RiMailLine className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                              type="email"
                              required
                              value={email}
                              onChange={(e) => {
                                setEmail(e.target.value);
                                triggerTypingNod();
                              }}
                              onFocus={() => handleFieldFocus('email')}
                              onBlur={handleFieldBlur}
                              placeholder="name@example.com"
                              className="w-full bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-[#20b8cd] focus:ring-1 focus:ring-[#20b8cd] transition-all"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={forgotLoading}
                          onMouseEnter={() => !forgotLoading && setBlobMood('happy')}
                          onMouseLeave={() => !forgotLoading && setBlobMood('curious')}
                          className="w-full mt-2 bg-gradient-to-r from-[#20b8cd] to-[#0ea5e9] hover:from-[#199eb0] hover:to-[#0284c7] text-white font-bold py-2.5 px-4 rounded-xl transition-all duration-200 text-sm cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-60"
                        >
                          {forgotLoading ? (
                            <>
                              <RiLoader4Line className="animate-spin w-4 h-4" />
                              <span>Checking & Sending OTP...</span>
                            </>
                          ) : (
                            <>
                              <span>Send Verification Code</span>
                              <RiArrowRightLine size={16} />
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSwitchMode('login')}
                          className="w-full text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-semibold py-2 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <RiArrowLeftLine size={14} /> Back to Sign In
                        </button>
                      </form>
                    )}

                    {/* Step 2: Enter & Validate OTP */}
                    {forgotStep === 2 && (
                      <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
                        <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-700 dark:text-cyan-300 flex items-center justify-between">
                          <span className="truncate mr-2">Code sent to: <strong className="font-semibold text-zinc-900 dark:text-white">{email}</strong></span>
                          <button
                            type="button"
                            onClick={() => setForgotStep(1)}
                            className="text-xs text-[#20b8cd] hover:underline font-bold shrink-0 cursor-pointer"
                          >
                            Change Email
                          </button>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between ml-0.5">
                            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                              6-Digit OTP Code <span className="text-red-500 font-bold ml-0.5" title="Required">*</span>
                            </label>
                            <button
                              type="button"
                              disabled={forgotCooldown > 0 || forgotLoading}
                              onClick={handleSendOtp}
                              className="text-xs text-[#20b8cd] hover:underline disabled:text-zinc-400 disabled:no-underline font-medium cursor-pointer"
                            >
                              {forgotCooldown > 0 ? `Resend in ${forgotCooldown}s` : 'Resend Code'}
                            </button>
                          </div>
                          <div className="relative">
                            <RiKey2Line className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                              type="text"
                              required
                              maxLength={6}
                              value={otp}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                setOtp(val);
                                triggerTypingNod();
                              }}
                              onFocus={() => handleFieldFocus('otp')}
                              onBlur={handleFieldBlur}
                              placeholder="123456"
                              className="w-full font-mono text-center tracking-[0.35em] font-bold bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-base text-zinc-900 dark:text-zinc-100 placeholder:tracking-normal placeholder:font-sans placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-[#20b8cd] focus:ring-1 focus:ring-[#20b8cd] transition-all"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={forgotLoading || otp.trim().length !== 6}
                          onMouseEnter={() => !forgotLoading && setBlobMood('happy')}
                          onMouseLeave={() => !forgotLoading && setBlobMood('curious')}
                          className="w-full mt-2 bg-gradient-to-r from-[#20b8cd] to-[#0ea5e9] hover:from-[#199eb0] hover:to-[#0284c7] text-white font-bold py-2.5 px-4 rounded-xl transition-all duration-200 text-sm cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-60"
                        >
                          {forgotLoading ? (
                            <>
                              <RiLoader4Line className="animate-spin w-4 h-4" />
                              <span>Validating OTP Code...</span>
                            </>
                          ) : (
                            <>
                              <span>Validate OTP & Continue</span>
                              <RiShieldCheckLine size={16} />
                            </>
                          )}
                        </button>

                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={() => setForgotStep(1)}
                            className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-semibold cursor-pointer flex items-center gap-1"
                          >
                            <RiArrowLeftLine size={14} /> Back to Email
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSwitchMode('login')}
                            className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-semibold cursor-pointer"
                          >
                            Sign In Instead
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Step 3: Create New Password */}
                    {forgotStep === 3 && (
                      <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed flex items-center gap-2">
                          <RiShieldCheckLine size={18} className="shrink-0 text-emerald-500" />
                          <span>OTP validated! Set a new password for your account below.</span>
                        </div>

                        {/* Enter New Password */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 ml-0.5">
                            Enter New Password <span className="text-red-500 font-bold ml-0.5" title="Required">*</span>
                          </label>
                          <div className="relative">
                            <RiLockPasswordLine className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                              type={showNewPassword ? 'text' : 'password'}
                              required
                              value={newPassword}
                              onChange={(e) => handlePasswordTyping(e.target.value, false, setNewPassword)}
                              onFocus={() => handleFieldFocus('newPassword')}
                              onBlur={handleFieldBlur}
                              placeholder="Min 6 chars, uppercase & number"
                              className="w-full bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-[#20b8cd] focus:ring-1 focus:ring-[#20b8cd] transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer"
                            >
                              {showNewPassword ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                            </button>
                          </div>
                        </div>

                        {/* Re-enter New Password */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 ml-0.5">
                            Re-enter New Password <span className="text-red-500 font-bold ml-0.5" title="Required">*</span>
                          </label>
                          <div className="relative">
                            <RiLockPasswordLine className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                              type={showConfirmNewPassword ? 'text' : 'password'}
                              required
                              value={confirmNewPassword}
                              onChange={(e) => handlePasswordTyping(e.target.value, false, setConfirmNewPassword)}
                              onFocus={() => handleFieldFocus('confirmNewPassword')}
                              onBlur={handleFieldBlur}
                              placeholder="Repeat new password"
                              className="w-full bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-[#20b8cd] focus:ring-1 focus:ring-[#20b8cd] transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer"
                            >
                              {showConfirmNewPassword ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                            </button>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={forgotLoading}
                          onMouseEnter={() => !forgotLoading && setBlobMood('happy')}
                          onMouseLeave={() => !forgotLoading && setBlobMood('curious')}
                          className="w-full mt-2 bg-gradient-to-r from-[#20b8cd] to-[#0ea5e9] hover:from-[#199eb0] hover:to-[#0284c7] text-white font-bold py-2.5 px-4 rounded-xl transition-all duration-200 text-sm cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-60"
                        >
                          {forgotLoading ? (
                            <>
                              <RiLoader4Line className="animate-spin w-4 h-4" />
                              <span>Saving New Password...</span>
                            </>
                          ) : (
                            <>
                              <span>Save New Password & Sign In</span>
                              <RiShieldCheckLine size={16} />
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSwitchMode('login')}
                          className="w-full text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-semibold py-2 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <RiArrowLeftLine size={14} /> Back to Sign In
                        </button>
                      </form>
                    )}
                  </div>
                ) : mode === 'login' ? (
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    {/* Email Field (Blob looks right) */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 ml-0.5">
                        Email Address <span className="text-red-500 font-bold ml-0.5" title="Required">*</span>
                      </label>
                      <div className="relative">
                        <RiMailLine className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            triggerTypingNod();
                          }}
                          onFocus={() => handleFieldFocus('email')}
                          onBlur={handleFieldBlur}
                          placeholder="name@example.com"
                          className="w-full bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-[#20b8cd] focus:ring-1 focus:ring-[#20b8cd] transition-all"
                        />
                      </div>
                    </div>

                    {/* Password Field (Blob looks left & closes eyes) */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between ml-0.5">
                        <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                          Password <span className="text-red-500 font-bold ml-0.5" title="Required">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleSwitchMode('forgot')}
                          className="text-xs text-[#20b8cd] hover:underline cursor-pointer font-medium"
                        >
                          Forgot?
                        </button>
                      </div>
                      <div className="relative">
                        <RiLockPasswordLine className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => handlePasswordTyping(e.target.value, false)}
                          onFocus={() => handleFieldFocus('password')}
                          onBlur={handleFieldBlur}
                          placeholder="••••••••"
                          className="w-full bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-[#20b8cd] focus:ring-1 focus:ring-[#20b8cd] transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const next = !showPassword;
                            setShowPassword(next);
                            if (next) {
                              setIsPasswordSleeping(false);
                              setClosedEyes(false);
                              setBlobMood('shy');
                              setBlobGaze({ x: -20, y: 2 });
                              setBubbleText("Peekaboo! 🫣");
                            } else {
                              setClosedEyes(false);
                              setIsPasswordSleeping(false);
                              setBlobMood('curious');
                              setBlobGaze({ x: 28, y: 8 });
                              setBubbleText("Masked again! Eyes open, waiting for you! 👀");
                            }
                          }}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer"
                        >
                          {showPassword ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Submit Sign In Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      onMouseEnter={() => !loading && setBlobMood('happy')}
                      onMouseLeave={() => !loading && setBlobMood(activeField ? (activeField.includes('password') && isPasswordSleeping ? 'password' : 'curious') : 'curious')}
                      className="w-full mt-2 bg-gradient-to-r from-[#20b8cd] to-[#0ea5e9] hover:from-[#199eb0] hover:to-[#0284c7] text-white font-bold py-2.5 px-4 rounded-xl transition-all duration-200 text-sm cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <RiLoader4Line className="animate-spin w-4 h-4" />
                          <span>Signing in...</span>
                        </>
                      ) : (
                        <span>Sign In to Perplexity</span>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                    {/* Username Field (Blob looks right) */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 ml-0.5">
                        Username <span className="text-red-500 font-bold ml-0.5" title="Required">*</span>
                      </label>
                      <div className="relative">
                        <RiUser3Line className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                          type="text"
                          required
                          value={username}
                          onChange={(e) => {
                            setUsername(e.target.value);
                            triggerTypingNod();
                          }}
                          onFocus={() => handleFieldFocus('username')}
                          onBlur={handleFieldBlur}
                          placeholder="alex_dev (letters, numbers, _)"
                          className="w-full bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-[#20b8cd] focus:ring-1 focus:ring-[#20b8cd] transition-all"
                        />
                      </div>
                    </div>

                    {/* Email Field (Blob looks right) */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 ml-0.5">
                        Email Address <span className="text-red-500 font-bold ml-0.5" title="Required">*</span>
                      </label>
                      <div className="relative">
                        <RiMailLine className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            triggerTypingNod();
                          }}
                          onFocus={() => handleFieldFocus('email')}
                          onBlur={handleFieldBlur}
                          placeholder="name@example.com"
                          className="w-full bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-[#20b8cd] focus:ring-1 focus:ring-[#20b8cd] transition-all"
                        />
                      </div>
                    </div>

                    {/* Password Field (Blob looks left & closes eyes) */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 ml-0.5">
                        Password <span className="text-red-500 font-bold ml-0.5" title="Required">*</span>
                      </label>
                      <div className="relative">
                        <RiLockPasswordLine className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => handlePasswordTyping(e.target.value, false)}
                          onFocus={() => handleFieldFocus('password')}
                          onBlur={handleFieldBlur}
                          placeholder="Min 6 chars, 1 uppercase, 1 number"
                          className="w-full bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-[#20b8cd] focus:ring-1 focus:ring-[#20b8cd] transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const next = !showPassword;
                            setShowPassword(next);
                            if (next) {
                              setIsPasswordSleeping(false);
                              setClosedEyes(false);
                              setBlobMood('shy');
                              setBlobGaze({ x: -20, y: 2 });
                              setBubbleText("Peekaboo! 🫣");
                            } else {
                              setClosedEyes(false);
                              setIsPasswordSleeping(false);
                              setBlobMood('curious');
                              setBlobGaze({ x: 28, y: 8 });
                              setBubbleText("Masked again! Eyes open, waiting for you! 👀");
                            }
                          }}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer"
                        >
                          {showPassword ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password Field (Blob looks left & closes eyes) */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 ml-0.5">
                        Confirm Password <span className="text-red-500 font-bold ml-0.5" title="Required">*</span>
                      </label>
                      <div className="relative">
                        <RiLockPasswordLine className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => handlePasswordTyping(e.target.value, true)}
                          onFocus={() => handleFieldFocus('confirmPassword')}
                          onBlur={handleFieldBlur}
                          placeholder="Repeat password"
                          className="w-full bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-[#20b8cd] focus:ring-1 focus:ring-[#20b8cd] transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const next = !showConfirmPassword;
                            setShowConfirmPassword(next);
                            if (next) {
                              setIsPasswordSleeping(false);
                              setClosedEyes(false);
                              setBlobMood('shy');
                              setBlobGaze({ x: -20, y: 2 });
                              setBubbleText("Peekaboo! 🫣");
                            } else {
                              setClosedEyes(false);
                              setIsPasswordSleeping(false);
                              setBlobMood('curious');
                              setBlobGaze({ x: 28, y: 8 });
                              setBubbleText("Masked again! Eyes open, waiting for you! 👀");
                            }
                          }}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer"
                        >
                          {showConfirmPassword ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Submit Register Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      onMouseEnter={() => !loading && setBlobMood('happy')}
                      onMouseLeave={() => !loading && setBlobMood(activeField ? (activeField.includes('password') ? 'password' : 'curious') : 'neutral')}
                      className={`w-full mt-2 font-bold py-2.5 px-4 rounded-xl transition-all duration-200 text-sm cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 bg-gradient-to-r from-[#20b8cd] to-[#0ea5e9] hover:from-[#199eb0] hover:to-[#0284c7] text-white ${loading ? 'opacity-70' : ''}`}
                    >
                      {loading ? (
                        <>
                          <RiLoader4Line className="animate-spin w-4 h-4" />
                          <span>Creating account...</span>
                        </>
                      ) : (
                        <span>Create Free Account</span>
                      )}
                    </button>
                  </form>
                )}

                {/* Bottom Switcher Link */}
                <div className="mt-6 pt-4 border-t border-zinc-200/80 dark:border-white/5 text-center text-xs text-zinc-500 dark:text-zinc-400">
                  {mode === 'forgot' ? (
                    <span>
                      Remember your password?{' '}
                      <button
                        type="button"
                        onClick={() => handleSwitchMode('login')}
                        className="text-[#20b8cd] hover:underline font-bold cursor-pointer"
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
                        className="text-[#20b8cd] hover:underline font-bold cursor-pointer"
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
                        className="text-[#20b8cd] hover:underline font-bold cursor-pointer"
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
    </main>
  );
};

export default Auth;
