/**
 * Media Handlers Utility
 * Helps with camera management and stream validation.
 */

export const validateMediaPermissions = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasCam = devices.some(device => device.kind === 'videoinput');
    const hasMic = devices.some(device => device.kind === 'audioinput');
    return { hasCam, hasMic };
  } catch (e) {
    console.error("Permission Check Failed:", e);
    return { hasCam: false, hasMic: false };
  }
};

export const getFacingMode = (stream) => {
  if (!stream) return null;
  const videoTrack = stream.getVideoTracks()[0];
  if (!videoTrack) return null;
  return videoTrack.getSettings().facingMode;
};
