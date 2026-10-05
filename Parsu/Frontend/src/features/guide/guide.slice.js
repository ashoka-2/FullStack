import { createSlice } from "@reduxjs/toolkit";

/**
 * guide.slice.js — Advanced state engine for AI Guided Walkthroughs.
 *
 * State shape:
 *   active                – boolean, is a guide currently playing?
 *   guideId               – string, the ID from guides.registry.js
 *   guideTitle            – string, display title of current guide
 *   stepIndex             – number, current step (0-based)
 *   steps                 – array of step objects (from the registry)
 *   route                 – string|null, current target route
 *   isTransitioning       – boolean, smooth route transition veil active
 *   transitionTargetTitle – string, display title for the page being navigated to
 *   autoPlay              – boolean, auto-advancing steps
 *   soundEnabled          – boolean, audio feedback
 */

const getInitialSound = () => {
  if (typeof localStorage !== "undefined") {
    return localStorage.getItem("parsu_guide_sound_muted") !== "1";
  }
  return true;
};

const guideSlice = createSlice({
  name: "guide",
  initialState: {
    active: false,
    guideId: null,
    guideTitle: "",
    stepIndex: 0,
    steps: [],
    route: null,
    isTransitioning: false,
    transitionTargetTitle: "",
    autoPlay: false,
    soundEnabled: getInitialSound(),
  },
  reducers: {
    startGuide: (state, action) => {
      const { guideId, guideTitle = "", steps, route } = action.payload;
      state.active = true;
      state.guideId = guideId;
      state.guideTitle = guideTitle;
      state.stepIndex = 0;
      state.steps = steps || [];
      state.route = route || null;
      state.isTransitioning = false;
      state.autoPlay = false;
    },
    setStep: (state, action) => {
      const newIndex = action.payload;
      if (newIndex >= 0 && newIndex < state.steps.length) {
        state.stepIndex = newIndex;
      }
    },
    nextStep: (state) => {
      if (state.stepIndex < state.steps.length - 1) {
        state.stepIndex += 1;
      } else {
        // Guide complete
        state.active = false;
        state.guideId = null;
        state.guideTitle = "";
        state.stepIndex = 0;
        state.steps = [];
        state.route = null;
        state.isTransitioning = false;
        state.autoPlay = false;
      }
    },
    prevStep: (state) => {
      if (state.stepIndex > 0) {
        state.stepIndex -= 1;
      }
    },
    skipGuide: (state) => {
      state.active = false;
      state.guideId = null;
      state.guideTitle = "";
      state.stepIndex = 0;
      state.steps = [];
      state.route = null;
      state.isTransitioning = false;
      state.autoPlay = false;
    },
    setIsTransitioning: (state, action) => {
      const { transitioning, title = "" } = action.payload || {};
      state.isTransitioning = Boolean(transitioning);
      state.transitionTargetTitle = title || "";
    },
    toggleAutoPlay: (state) => {
      state.autoPlay = !state.autoPlay;
    },
    toggleSound: (state) => {
      state.soundEnabled = !state.soundEnabled;
    },
  },
});

export const {
  startGuide,
  setStep,
  nextStep,
  prevStep,
  skipGuide,
  setIsTransitioning,
  toggleAutoPlay,
  toggleSound,
} = guideSlice.actions;

export default guideSlice.reducer;
