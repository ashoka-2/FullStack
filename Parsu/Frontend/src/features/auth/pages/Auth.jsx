import React, { useRef } from 'react';
import { Navigate, useNavigate } from 'react-router';
import Toast from '../../Components/Toast';
import '../../Components/blob.css';
import AuthGoogleButton from '../components/AuthGoogleButton';
import AuthLoginForm from '../components/AuthLoginForm';
import AuthRegisterForm from '../components/AuthRegisterForm';
import AuthForgotPasswordForm from '../components/AuthForgotPasswordForm';
import useAuthController from '../hook/useAuthController';
import {
  useDisplayFont, useAuthMotion, AuthBackground, AuthTopBar, MascotStage, AuthCard,
  FormHeading, ModeSwitch, VerifyEmailPanel, AuthFooter,
} from '../components/Authparts.jsx';

/** Google button + the active form. Prop plumbing lives here so the page stays tidy. */
const AuthForms = ({ c }) => {
  const shared = {
    onFieldFocus: c.handleFieldFocus, onFieldBlur: c.handleFieldBlur, onPasswordTyping: c.handlePasswordTyping,
    triggerTypingNod: c.triggerTypingNod, setBlobMood: c.setBlobMood,
  };
  const mascot = {
    setBlobGaze: c.setBlobGaze, setBubbleText: c.setBubbleText, setIsPasswordSleeping: c.setIsPasswordSleeping,
    setClosedEyes: c.setClosedEyes, activeField: c.activeField,
  };

  return (
    <div className="auth-swap space-y-4">
      {c.mode !== 'forgot' && (
        <AuthGoogleButton
          mode={c.mode}
          onSwitchMode={c.handleSwitchMode}
          onMouseEnterGoogle={() => { c.setBlobMood('wave'); c.setClosedEyes(false); c.setBlobGaze({ x: 25, y: -4 }); c.setBubbleText('Fast, secure sign-in.'); }}
          onMouseLeaveGoogle={() => { c.setBlobMood('neutral'); c.setBlobGaze({ x: 0, y: 0 }); }}
        />
      )}

      {c.mode === 'forgot' && (
        <AuthForgotPasswordForm
          {...shared}
          forgotStep={c.forgotStep} setForgotStep={c.setForgotStep}
          email={c.email} setEmail={c.setEmail} otp={c.otp} setOtp={c.setOtp}
          newPassword={c.newPassword} setNewPassword={c.setNewPassword}
          confirmNewPassword={c.confirmNewPassword} setConfirmNewPassword={c.setConfirmNewPassword}
          showNewPassword={c.showNewPassword} setShowNewPassword={c.setShowNewPassword}
          showConfirmNewPassword={c.showConfirmNewPassword} setShowConfirmNewPassword={c.setShowConfirmNewPassword}
          forgotLoading={c.forgotLoading} forgotCooldown={c.forgotCooldown}
          onSendOtp={c.handleSendOtp} onVerifyOtpSubmit={c.handleVerifyOtpSubmit}
          onResetPasswordSubmit={c.handleResetPasswordSubmit} onSwitchMode={c.handleSwitchMode}
        />
      )}

      {c.mode === 'login' && (
        <AuthLoginForm
          {...shared} {...mascot}
          email={c.email} setEmail={c.setEmail} password={c.password} setPassword={c.setPassword}
          showPassword={c.showPassword} setShowPassword={c.setShowPassword} loading={c.loading}
          unverifiedEmailError={c.unverifiedEmailError} resendStatus={c.resendStatus} onResendEmail={c.resendEmail}
          onSubmit={c.handleLoginSubmit} onSwitchMode={c.handleSwitchMode} isPasswordSleeping={c.isPasswordSleeping}
        />
      )}

      {c.mode === 'register' && (
        <AuthRegisterForm
          {...shared} {...mascot}
          username={c.username} setUsername={c.setUsername} email={c.email} setEmail={c.setEmail}
          password={c.password} confirmPassword={c.confirmPassword}
          showPassword={c.showPassword} setShowPassword={c.setShowPassword}
          showConfirmPassword={c.showConfirmPassword} setShowConfirmPassword={c.setShowConfirmPassword}
          loading={c.loading} onSubmit={c.handleRegisterSubmit}
        />
      )}
    </div>
  );
};

const Auth = ({ initialMode }) => {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const c = useAuthController({ initialMode });

  useDisplayFont();
  useAuthMotion(rootRef, { mode: c.mode, step: c.forgotStep, done: c.isRegistered, bubble: c.bubbleText, error: c.reduxError || c.localError });

  if (c.user && !c.loading) return <Navigate to={c.destination} replace />;

  const pose = c.isPasswordSleeping
    ? 'rotate(-7deg) translateX(-18px)'
    : c.activeField ? 'rotate(5deg) translateX(18px) scale(1.03)' : 'none';

  return (
    <main ref={rootRef} className="relative flex min-h-[100dvh] flex-col overflow-x-hidden bg-[#050507] px-4 text-zinc-100 selection:bg-[var(--accent-cyan)]/25 sm:px-6">
      {c.toast.message && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-auto">
          <Toast message={c.toast.message} type={c.toast.type} onClose={() => c.setToast({ message: null, type: 'info' })} />
        </div>
      )}
      <AuthBackground />
      <AuthTopBar onHome={() => navigate('/')} />

      <section className="relative z-10 mx-auto grid w-full max-w-5xl flex-1 items-center gap-6 py-4 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-5">
          <MascotStage
            bubbleText={c.bubbleText}
            pose={pose}
            onPoke={c.handleBlobPoke}
            mascot={{ mood: c.blobMood, gaze: c.blobGaze, closedEyes: c.closedEyes, nod: c.isNodding, celebrate: c.celebrateCount }}
          />
        </div>

        <div className="flex w-full justify-center lg:col-span-7 lg:justify-end">
          <AuthCard>
            {c.isRegistered ? (
              <VerifyEmailPanel
                email={c.email}
                resendStatus={c.resendStatus}
                onResend={c.resendEmail}
                onProceed={() => { c.setIsRegistered(false); c.handleSwitchMode('login'); }}
              />
            ) : (
              <>
                <FormHeading mode={c.mode} forgotStep={c.forgotStep} />
                <AuthForms c={c} />
                <ModeSwitch mode={c.mode} onSwitch={c.handleSwitchMode} />
              </>
            )}
          </AuthCard>
        </div>
      </section>

      <AuthFooter />
    </main>
  );
};

export default Auth;