import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Sidebar from '../../Components/Sidebar';
import Footer from '../../Components/Footer';
import { addToast } from '../../../utils/toast.slice';
import ProfileSettingsForm from '../components/ProfileSettingsForm';
import PasswordChangeForm from '../components/PasswordChangeForm';
import MascotCompanionSettings from '../components/MascotCompanionSettings';
import CustomKeyManager from '../components/CustomKeyManager';
import VoiceSettingsForm from '../components/VoiceSettingsForm';
import { RiMenuLine } from '@remixicon/react';

const Settings = () => {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [previewMood, setPreviewMood] = useState('curious');
  const [celebrateCount, setCelebrateCount] = useState(0);

  const triggerCelebrate = () => {
    setPreviewMood('love');
    setCelebrateCount(c => c + 1);
    setTimeout(() => setPreviewMood('curious'), 2500);
  };

  return (
    <div className="flex bg-[#f4f5f7] dark:bg-[#050505] min-h-[100dvh] text-zinc-900 dark:text-zinc-100 font-sans selection:bg-[#20b8cd]/30">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-h-[100dvh] lg:pl-56 overflow-y-auto custom-scrollbar">
        {/* Header */}
        <header className="flex items-center justify-between px-3.5 sm:px-8 h-12 sm:h-16 bg-[#f4f5f7]/85 dark:bg-[#050505]/80 backdrop-blur-md sticky top-0 z-30 border-b border-zinc-200 dark:border-white/5">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-1.5 sm:p-2 -ml-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer rounded-lg active:scale-95"
              aria-label="Open navigation menu"
            >
              <RiMenuLine size={20} />
            </button>
            <h1 className="text-sm sm:text-lg font-bold text-zinc-900 dark:text-white">Settings & Profile</h1>
          </div>
        </header>

        {/* Content Container */}
        <div className="max-w-4xl w-full mx-auto px-3.5 sm:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8 pb-32">
          {/* Section 1: User Profile Settings */}
          <ProfileSettingsForm 
            user={user} 
            onSuccess={triggerCelebrate} 
          />

          {/* Section 2: Security & Change Password */}
          <PasswordChangeForm 
            onSuccess={triggerCelebrate} 
          />

          {/* Section 3: AI Models & Custom API Keys Manager */}
          <CustomKeyManager 
            onNotify={(message, type) => dispatch(addToast({ message, type }))} 
          />

          {/* Section 4: Floating Mascot Companion Settings */}
          <MascotCompanionSettings 
            previewMood={previewMood}
            setPreviewMood={setPreviewMood}
            celebrateCount={celebrateCount}
          />

          {/* Section 5: AI Voice & Speech Settings */}
          <VoiceSettingsForm 
            onSuccess={triggerCelebrate}
          />
        </div>

        <Footer />
      </div>

      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
        />
      )}
    </div>
  );
};

export default Settings;
