import { Bus } from './event-bus.js';

/**
 * Global Error Handler for graceful degradation
 */
export const ErrorHandler = {
  init() {
    window.addEventListener('error', (e) => this.handleGlobalError(e));
    window.addEventListener('unhandledrejection', (e) => this.handlePromiseError(e));
  },

  handleGlobalError(e) {
    console.error('[Global Error]', e.error || e.message);
    this.logTelemetry('global_error', e.message);
  },

  handlePromiseError(e) {
    console.error('[Promise Error]', e.reason);
    this.logTelemetry('promise_error', String(e.reason));
  },

  handleFetchError(context, error) {
    console.error(`[Fetch Failed] ${context}:`, error);
    Bus.emit('ui_error', { type: 'fetch', context, error });
    // Renders retry boundary if component-level failsafe is listening
  },

  handleThirdPartyError(library, error) {
    console.warn(`[3rd Party Failed] ${library}: fallback active.`, error);
    Bus.emit('library_fallback', { library, error });
  },

  logTelemetry(type, details) {
    // Stub for pushing to analytics backend
    if (performance && performance.mark) {
      performance.mark(`error_${type}`);
    }
  }
};
