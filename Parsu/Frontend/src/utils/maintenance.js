/**
 * Utility to check if the application is currently in Maintenance Mode.
 * Driven by VITE_MAINTENANCE_MODE in environment variables (Vercel / .env).
 */
export const isMaintenanceModeActive = () => {
  const envVal = import.meta.env.VITE_MAINTENANCE_MODE;
  if (typeof envVal === 'string') {
    const clean = envVal.trim().toLowerCase();
    return clean === 'true' || clean === '1' || clean === 'yes';
  }
  return Boolean(envVal);
};
