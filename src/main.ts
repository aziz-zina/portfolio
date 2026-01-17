import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';
import { inject } from "@vercel/analytics"
import { injectSpeedInsights } from '@vercel/speed-insights';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));

// Wrap analytics in try-catch to handle ad blockers gracefully
try {
  inject();
} catch (e) {
  // Analytics blocked by ad blocker - fail silently
}

try {
  injectSpeedInsights();
} catch (e) {
  // Speed insights blocked by ad blocker - fail silently
}

