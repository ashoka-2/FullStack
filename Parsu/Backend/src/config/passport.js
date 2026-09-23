import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

const backendUrl = (process.env.BACKEND_URL || "http://localhost:3000").replace(/\/+$/, "");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${backendUrl}/api/auth/google/callback`,
      proxy: true, // Crucial for reverse proxies (Render / Heroku) to preserve HTTPS in callback
    },
    (accessToken, refreshToken, profile, done) => {
      return done(null, profile);
    }
  )
);

export default passport;
