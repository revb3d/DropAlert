/**
 * Minimal stub for expo-modules-core on web/Electron.
 * Provides just enough surface for expo-font, expo-constants, etc. to load
 * without crashing, without the full native module initialization.
 */

class EventEmitter {
  constructor() { this._listeners = {}; }
  addListener(event, listener) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(listener);
    return { remove: () => this.removeAllListeners(event) };
  }
  removeAllListeners(event) {
    if (event) delete this._listeners[event];
    else this._listeners = {};
  }
  emit(event, ...args) {
    (this._listeners[event] || []).forEach(fn => fn(...args));
  }
}

class SharedObject {}
class NativeModule extends EventEmitter {}

const registerWebModule = (moduleClass) => {
  try { return new moduleClass(); } catch { return new moduleClass.prototype.constructor(); }
};

const NativeModulesProxy = new Proxy({}, {
  get: (_, key) => ({ [key]: () => Promise.resolve(null) }[key] ?? null),
});

const CodedError = class CodedError extends Error {
  constructor(code, message) { super(message); this.code = code; }
};

const UnavailabilityError = class UnavailabilityError extends Error {
  constructor(moduleName, propertyName) {
    super(`${moduleName}.${propertyName} is not available`);
  }
};

const Platform = {
  OS: 'web',
  Version: 'web',
  select: (obj) => obj.web ?? obj.default,
};

const UUID = {
  v4: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  }),
};

module.exports = {
  EventEmitter,
  NativeModule,
  SharedObject,
  NativeModulesProxy,
  registerWebModule,
  CodedError,
  UnavailabilityError,
  Platform,
  UUID,
  // no-op stubs for other commonly used exports
  requireNativeModule: () => ({}),
  requireOptionalNativeModule: () => null,
  createPermissionHook: () => () => [{ status: 'granted' }, async () => ({ status: 'granted' })],
};
