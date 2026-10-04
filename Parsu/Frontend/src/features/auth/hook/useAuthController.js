import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from './useAuth';
import { clearError } from '../auth.slice';
import { getActiveBackendUrl, AUTH_TOKEN_KEY } from '../../../utils/axios.js';

const FOCUS = {
  password: [28, 8, "I won't peek."], confirmPassword: [28, 8, "I won't peek."],
  newPassword: [28, 8, "I won't peek."], confirmNewPassword: [28, 8, "I won't peek."],
  email: [32, 4, 'Looking good.'], username: [32, -2, 'Nice name.'], otp: [28, 4, 'Enter the 6-digit code.'],
};
const OAUTH_ERRORS = {
  auth_failed: 'Google sign-in was cancelled or failed. Please try again.',
  google_no_email: 'No email address found for your Google account.',
  server_error: 'Authentication server error. Please try again.',
  account_blocked: 'This account has been deactivated by an administrator.',
  unverified_email: 'Please verify your email address before signing in.',
};
const SWITCH_TEXT = { register: "Let's set you up.", forgot: "We'll send you a code.", login: 'Welcome back.' };
const apiMsg = (e, fallback) => e.response?.data?.message || e.response?.data?.errors?.[0]?.msg || e.message || fallback;
const pwError = (p) =>
  p.length < 6 ? 'Password must be at least 6 characters long'
  : !/[A-Z]/.test(p) ? 'Password must contain at least one uppercase letter'
  : !/[0-9]/.test(p) ? 'Password must contain at least one number' : null;
const usernameError = (u) =>
  !u ? 'Username is required'
  : u.length < 3 || u.length > 30 ? 'Username must be between 3 and 30 characters'
  : !/^[a-zA-Z0-9_]+$/.test(u) ? 'Username can only contain letters, numbers and underscores' : null;

/** All Auth page state + handlers. The page itself stays purely presentational. */
export default function useAuthController({ initialMode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { handleLogin, handleRegister, handleResendEmail, handleForgotPassword, handleVerifyOtp, handleResetPassword, handleGetMe } = useAuth();

  const user = useSelector((s) => s.auth.user);
  const loading = useSelector((s) => s.auth.loading);
  const reduxError = useSelector((s) => s.auth.error);

  const queryMode = searchParams.get('mode');
  const [mode, setMode] = useState(queryMode === 'forgot' ? 'forgot' : initialMode === 'register' || queryMode === 'register' ? 'register' : 'login');

  // form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // forgot flow
  const [forgotStep, setForgotStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [forgotCooldown, setForgotCooldown] = useState(0);
  const [forgotLoading, setForgotLoading] = useState(false);
  // status
  const [isRegistered, setIsRegistered] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [resendStatus, setResendStatus] = useState(null);
  const [toast, setToast] = useState({ message: null, type: 'info' });
  const [unverifiedEmailError, setUnverifiedEmailError] = useState(false);
  // mascot
  const [blobMood, setBlobMood] = useState('curious');
  const [blobGaze, setBlobGaze] = useState({ x: 10, y: 0 });
  const [closedEyes, setClosedEyes] = useState(false);
  const [isPasswordSleeping, setIsPasswordSleeping] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const [celebrateCount, setCelebrateCount] = useState(0);
  const [isNodding, setIsNodding] = useState(false);
  const [bubbleText, setBubbleText] = useState('Welcome to Parsu.');
  const [pokeCount, setPokeCount] = useState(0);
  const pokeTimer = useRef(null);
  const nodTimer = useRef(null);
  const typingTimer = useRef(null);

  const destination = user?.role === 'admin' ? '/admin/dashboard' : location.state?.from?.pathname || '/ai';

  /* ── small helpers ── */
  const say = (mood, text, gaze) => { setBlobMood(mood); if (text) setBubbleText(text); if (gaze) setBlobGaze(gaze); };
  const clean = () => { dispatch(clearError()); setLocalError(null); };
  const fail = (msg, mood = 'angry') => { setClosedEyes(false); setLocalError(msg); setToast({ message: msg, type: 'error' }); say(mood, msg); };
  const win = (msg, text, mood = 'happy') => { setToast({ message: msg, type: 'success' }); say(mood, text); };

  /* ── effects ── */
  useEffect(() => {
    const token = searchParams.get('token');
    const code = searchParams.get('code');
    if (code && !token) { window.location.href = `${getActiveBackendUrl()}/api/auth/google/callback${window.location.search}`; return; }
    if (!token) return;
    try { localStorage.setItem(AUTH_TOKEN_KEY, token); } catch (e) { console.error('Failed to save auth token', e); }
    setCelebrateCount((c) => c + 1);
    win('Signed in with Google.', 'Signed in. Welcome!', 'love');
    handleGetMe()
      .then((res) => setTimeout(() => navigate(res?.user?.role === 'admin' ? '/admin/dashboard' : location.state?.from?.pathname || '/ai', { replace: true }), 400))
      .catch(() => setTimeout(() => navigate('/ai', { replace: true }), 400));
    const next = new URLSearchParams(searchParams);
    next.delete('token');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (queryMode && queryMode !== mode && SWITCH_TEXT[queryMode]) { setMode(queryMode); setBubbleText(SWITCH_TEXT[queryMode]); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryMode]);

  useEffect(() => {
    if (forgotCooldown <= 0) return;
    const t = setTimeout(() => setForgotCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [forgotCooldown]);

  useEffect(() => () => {
    dispatch(clearError());
    [pokeTimer, nodTimer, typingTimer].forEach((r) => clearTimeout(r.current));
  }, [dispatch]);

  useEffect(() => {
    const err = searchParams.get('error');
    if (!err) return;
    fail(OAUTH_ERRORS[err] || `Sign in failed: ${err}`, 'sad');
    const next = new URLSearchParams(searchParams);
    next.delete('error');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (!reduxError && !localError) return;
    setClosedEyes(false); setIsPasswordSleeping(false);
    say('surprised', 'Something went wrong.', { x: 0, y: -10 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduxError, localError]);

  /* ── mascot interactions ── */
  const triggerTypingNod = () => {
    setIsNodding(true);
    clearTimeout(nodTimer.current);
    nodTimer.current = setTimeout(() => setIsNodding(false), 500);
  };
  const handleFieldFocus = (field) => {
    setActiveField(field);
    const f = FOCUS[field];
    if (!f) return;
    setIsPasswordSleeping(false); setClosedEyes(false);
    say('curious', f[2], { x: f[0], y: f[1] });
  };
  const handlePasswordTyping = (val, isConfirm = false, customSetter = null) => {
    if (customSetter) customSetter(val); else if (isConfirm) setConfirmPassword(val); else setPassword(val);
    triggerTypingNod();
    clearTimeout(typingTimer.current);
    if (isConfirm ? !showConfirmPassword : !showPassword) {
      setIsPasswordSleeping(true); setClosedEyes(true);
      say('password', 'Eyes closed. No peeking.', { x: -35, y: -4 });
      typingTimer.current = setTimeout(() => {
        setIsPasswordSleeping(false); setClosedEyes(false);
        say('curious', 'Ready when you are.', { x: 28, y: 8 });
      }, 1100);
    } else {
      setIsPasswordSleeping(false); setClosedEyes(false);
      say('shy', 'Looking away.', { x: -20, y: 2 });
    }
  };
  const handleFieldBlur = () => {
    setActiveField(null);
    clearTimeout(typingTimer.current);
    setIsPasswordSleeping(false);
    if (!loading && !reduxError && !localError) { setClosedEyes(false); say('curious', 'Ask anything. Explore everything.', { x: 10, y: 0 }); }
  };
  const handleBlobPoke = () => {
    const n = pokeCount + 1;
    setPokeCount(n);
    clearTimeout(pokeTimer.current);
    pokeTimer.current = setTimeout(() => { setPokeCount(0); setClosedEyes(false); say('neutral', "I'm here to help."); }, 2800);
    setClosedEyes(false);
    if (n >= 5) say('angry', 'Okay, okay. Enough!');
    else if (n >= 3) say('surprised', "You're energetic today.");
    else { say('happy', 'Hehe, that tickles.'); setIsNodding(true); setTimeout(() => setIsNodding(false), 600); }
  };

  /* ── mode switching ── */
  const handleSwitchMode = (m) => {
    setMode(m); clean();
    if (m === 'forgot') setForgotStep(1);
    setSearchParams(m === 'login' ? {} : { mode: m }, { replace: true });
    setClosedEyes(false); setIsPasswordSleeping(false);
    say('wave', SWITCH_TEXT[m], { x: 18, y: 0 });
    setTimeout(() => setBlobMood('curious'), 1200);
  };

  /* ── submits ── */
  const handleLoginSubmit = async (e) => {
    e.preventDefault(); clean(); setUnverifiedEmailError(false); setClosedEyes(false);
    say('hmm', 'Signing you in…', { x: 20, y: 0 });
    try {
      const res = await handleLogin({ email: email.trim(), password });
      setCelebrateCount((c) => c + 1);
      win('Signed in successfully.', 'Welcome back!', 'love');
      setTimeout(() => navigate(res?.user?.role === 'admin' ? '/admin/dashboard' : location.state?.from?.pathname || '/'), 500);
    } catch (err) {
      const msg = apiMsg(err, 'Login failed. Check your credentials.');
      setLocalError(msg); setToast({ message: msg, type: 'error' });
      if (msg.toLowerCase().includes('verify your email') || err.response?.data?.err === 'email not verified') {
        setUnverifiedEmailError(true); say('curious', 'Please verify your email first.');
      } else say('surprised', msg);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault(); clean(); setResendStatus(null); setUnverifiedEmailError(false);
    const u = username.trim();
    const err = usernameError(u)
      || (!email.includes('@') && 'Please enter a valid email address')
      || (password !== confirmPassword && 'Passwords do not match')
      || pwError(password);
    if (err) return fail(err, err.startsWith('Password must') ? 'surprised' : 'angry');
    say('hmm', 'Creating your account…'); setClosedEyes(false);
    try {
      await handleRegister({ username: u, email: email.trim(), password });
      setIsRegistered(true); setCelebrateCount((c) => c + 1);
      win(`Verification link sent to ${email.trim()}.`, 'Check your inbox.', 'love');
    } catch (e2) { fail(apiMsg(e2, 'Registration failed. Please try again.')); }
  };

  const resendEmail = async () => {
    if (!email) return fail('Please enter your email address first', 'surprised');
    setResendStatus('Sending...');
    try {
      await handleResendEmail({ email: email.trim() });
      setResendStatus('Sent!');
      win(`New verification link sent to ${email.trim()}.`, 'Link re-sent.');
      setTimeout(() => setResendStatus(null), 3500);
    } catch (e) {
      setResendStatus(null);
      const msg = apiMsg(e, 'Failed to resend verification email');
      setToast({ message: msg, type: 'error' }); say('surprised', msg);
    }
  };

  const forgotCall = async (fn, onOk, busyText, errFallback) => {
    clean(); setForgotLoading(true); say('hmm', busyText);
    try { await onOk(await fn()); } catch (e) { fail(apiMsg(e, errFallback), 'surprised'); } finally { setForgotLoading(false); }
  };
  const handleSendOtp = (e) => {
    e?.preventDefault();
    const em = email.trim();
    if (!em) return fail('Please enter your registered email address');
    return forgotCall(() => handleForgotPassword({ email: em }), (res) => {
      setForgotStep(2); setForgotCooldown(60);
      win(res?.message || `Reset code sent to ${em}.`, 'Code sent.');
    }, 'Sending your code…', 'Failed to send reset code');
  };
  const handleVerifyOtpSubmit = (e) => {
    e.preventDefault();
    const code = otp.trim();
    if (code.length !== 6) return fail('Please enter the 6-digit verification code');
    return forgotCall(() => handleVerifyOtp({ email: email.trim(), otp: code }), (res) => {
      setForgotStep(3); win(res?.message || 'Code verified.', 'Verified. Set a new password.');
    }, 'Checking your code…', 'Invalid or expired verification code');
  };
  const handleResetPasswordSubmit = (e) => {
    e.preventDefault();
    const err = pwError(newPassword) || (newPassword !== confirmNewPassword && 'New passwords do not match');
    if (err) return fail(err);
    return forgotCall(() => handleResetPassword({ email: email.trim(), otp: otp.trim(), newPassword }), (res) => {
      setCelebrateCount((c) => c + 1);
      win(res?.message || 'Password reset. Please sign in.', 'All set. Sign in.', 'love');
      setForgotStep(1); setOtp(''); setNewPassword(''); setConfirmNewPassword('');
      setTimeout(() => handleSwitchMode('login'), 1500);
    }, 'Updating password…', 'Failed to reset password. Please try again.');
  };

  return {
    mode, user, loading, reduxError, localError, destination, toast, setToast,
    username, setUsername, email, setEmail, password, setPassword, confirmPassword, setConfirmPassword,
    showPassword, setShowPassword, showConfirmPassword, setShowConfirmPassword,
    forgotStep, setForgotStep, otp, setOtp, newPassword, setNewPassword, confirmNewPassword, setConfirmNewPassword,
    showNewPassword, setShowNewPassword, showConfirmNewPassword, setShowConfirmNewPassword, forgotCooldown, forgotLoading,
    isRegistered, setIsRegistered, resendStatus, unverifiedEmailError,
    blobMood, setBlobMood, blobGaze, setBlobGaze, closedEyes, setClosedEyes, isPasswordSleeping, setIsPasswordSleeping,
    activeField, celebrateCount, isNodding, bubbleText, setBubbleText,
    triggerTypingNod, handleFieldFocus, handleFieldBlur, handlePasswordTyping, handleBlobPoke, handleSwitchMode,
    handleLoginSubmit, handleRegisterSubmit, resendEmail, handleSendOtp, handleVerifyOtpSubmit, handleResetPasswordSubmit,
  };
}