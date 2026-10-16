import React, { useEffect } from 'react'
import { RouterProvider } from 'react-router'
import { router } from './app.routes';
import { useAuth } from '../features/auth/hook/useAuth';
import { initializeSocketConnection } from '../features/chat/service/chat.socket';
import { useDispatch } from 'react-redux';
import { appendChunk, resetStreamingChunk, setActiveToolEvent, setActivityStep } from '../features/chat/chat.slice';
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
        let label = "Using an assistant tool";
        if (event.name === "post_to_social_media" || event.name === "postToSocialMedia") {
          label = "Preparing your social post";
        } else if (event.name === "search_web" || event.name === "tavilySearch") {
          label = "Searching the web";
        } else if (event.name) {
          const knownTools = {
            googleCalendar: "Checking your calendar",
            sendEmail: "Preparing your email",
            searchImages: "Finding relevant images",
            createImage: "Creating an image",
            deviceControl: "Working with a connected device"
          };
          label = knownTools[event.name] || "Using an assistant tool";
        }
        dispatch(setActiveToolEvent({ ...event, label }));
      } else if (event?.type === "tool_end") {
        dispatch(setActiveToolEvent({ ...event, label: "Task complete" }));
      }
    };

    const handleActivityUpdate = (step) => {
      if (step?.id && step?.label) dispatch(setActivityStep(step));
    };

    const handleRelay = ({ action, params }) => {
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
    socket.on("activity:update", handleActivityUpdate);
    socket.on("device:incoming_relay", handleRelay);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      socket.off("chunk", handleChunk);
      socket.off("chunk:reset", handleChunkReset);
      socket.off("tool:event", handleToolEvent);
      socket.off("activity:update", handleActivityUpdate);
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
