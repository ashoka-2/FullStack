import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useSettings } from '../../Settings/Hooks/useSettings';

const ReturnsPolicy = () => {
  const { settings, loading } = useSelector((state) => state.settings);
  const { handleGetSettings } = useSettings();

  useEffect(() => {
    handleGetSettings();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto space-y-12 fade-in">
        <div className="text-center space-y-4">
          <p className="text-[10px] font-black tracking-[0.4em] uppercase text-accent">Legal</p>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-widest">Return Policy</h1>
        </div>

        <div className="bg-surface border border-border-theme/50 rounded-3xl p-8 md:p-12 space-y-8 font-mono text-sm leading-relaxed">
          {loading && !settings ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-border-theme rounded w-3/4"></div>
              <div className="h-4 bg-border-theme rounded w-1/2"></div>
              <div className="h-4 bg-border-theme rounded w-5/6"></div>
            </div>
          ) : (
            <div 
              className="text-gray-400 whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: settings?.legal?.returnPolicy || "Return Policy content not set." }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ReturnsPolicy;
