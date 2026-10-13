import React, { useEffect } from 'react'
import { RouterProvider } from 'react-router'
import { router } from './app.routes';
import { useAuth } from '../features/auth/hook/useAuth';
import { initializeSocketConnection } from '../features/chat/service/chat.socket';
import { useDispatch } from 'react-redux';
import { appendChunk, resetStreamingChunk, setActiveToolEvent } from '../features/chat/chat.slice';
import { isMaintenanceModeActive } from '../utils/maintenance';
import MaintenanceMode from '../features/pages/MaintenanceMode';

const App = () => {
  const isMaintenance = isMaintenanceModeActive();
  const auth = useAuth();
  const dispatch = useDispatch();

  useEffect(() => {
    // If in maintenance mode, block all server authentication, sockets, and data fetches
    if (isMaintenance) return;

    auth.handleGetMe();
    
    // Initialize global socket and chunk listener
    const socket = initializeSocketConnection();

    let chunkBuffer = "";
    let rafId = null;

    const flushChunks = () => {
      if (chunkBuffer) {
        dispatch(appendChunk(chunkBuffer));
        window.dispatchEvent(new CustomEvent("ai_stream_chunk", { detail: chunkBuffer }));
        chunkBuffer = "";
      }
      rafId = null;
    };

    const handleChunk = (chunk) => {
      chunkBuffer += chunk;
      if (!rafId) {
        rafId = requestAnimationFrame(flushChunks);
      }
    };

    const handleChunkReset = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      chunkBuffer = "";
      dispatch(resetStreamingChunk());
      window.dispatchEvent(new CustomEvent("ai_stream_chunk_reset"));
    };

    const handleToolEvent = (event) => {
      if (event?.type === "tool_start") {
        let label = "Working...";
        if (event.name === "post_to_social_media" || event.name === "postToSocialMedia") {
          const platforms = event.args?.platforms || [];
          const platformStr = Array.isArray(platforms) ? platforms.join(", ") : String(platforms || "");
          label = platformStr ? `Publishing to ${platformStr}...` : "Publishing to social media...";
        } else if (event.name === "search_web" || event.name === "tavilySearch") {
          label = "Searching the web...";
        } else if (event.name) {
          label = `Executing ${event.name}...`;
        }
        dispatch(setActiveToolEvent({ ...event, label }));
      } else if (event?.type === "tool_end") {
        dispatch(setActiveToolEvent(null));
      }
    };

    const handleRelay = ({ action, params, senderDeviceName }) => {
      if (action === "open_url" && params?.url) {
        window.open(params.url, "_blank");
      } else if (action === "write_clipboard" && params?.text) {
        navigator.clipboard?.writeText(params.text).catch(() => {});
      } else if (action === "vibrate" && typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    };

    socket.on("chunk", handleChunk);
    socket.on("chunk:reset", handleChunkReset);
    socket.on("tool:event", handleToolEvent);
    socket.on("device:incoming_relay", handleRelay);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      socket.off("chunk", handleChunk);
      socket.off("chunk:reset", handleChunkReset);
      socket.off("tool:event", handleToolEvent);
      socket.off("device:incoming_relay", handleRelay);
    };
  }, [isMaintenance]);

  // When user is authenticated, automatically register this active device under their account
  useEffect(() => {
    if (!auth?.user?._id) return;
    const socket = initializeSocketConnection();

    const ua = typeof navigator !== "undefined" ? navigator.userAgent.toLowerCase() : "";
    const isAndroid = /android/i.test(ua);
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const isMac = /macintosh|mac os x/i.test(ua);
    const platform = isAndroid ? "android" : isIOS ? "ios" : isMac ? "macos" : "windows";
    const deviceType = (isAndroid || isIOS) ? "mobile" : "desktop";
    const deviceName = isAndroid ? "Android Phone" : isIOS ? "Apple iPhone" : isMac ? "MacBook / iMac" : "Windows Desktop";

    socket.emit("user:subscribe", auth.user._id);
    socket.emit("device:auto_register", {
      userId: auth.user._id,
      platform,
      deviceType,
      name: `${deviceName} (${auth.user.name || 'User'})`,
      userAgent: navigator.userAgent
    });
  }, [auth?.user?._id]);

  // When maintenance mode is active, users can only view the Maintenance Mode page
  if (isMaintenance) {
    return <MaintenanceMode />;
  }

  return (
    <RouterProvider router={router}/>
  );
};

export default App;