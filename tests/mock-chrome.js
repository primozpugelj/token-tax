// Mock implementation of Chrome Extension APIs for Node.js unit testing

class MockChrome {
  constructor() {
    this.reset();
  }

  reset() {
    this.alarmsCreated = [];
    this.tabsCreated = [];
    this.tabsRemoved = [];
    this.localStorage = {};
    
    // Listeners trackers
    this.listeners = {
      installed: [],
      startup: [],
      alarm: [],
      message: []
    };

    // APIs
    this.alarms = {
      create: (name, options) => {
        this.alarmsCreated.push({ name, options });
      },
      onAlarm: {
        addListener: (callback) => {
          this.listeners.alarm.push(callback);
        }
      }
    };

    this.tabs = {
      create: (options, callback) => {
        const id = Math.floor(Math.random() * 1000) + 1;
        const newTab = { id, ...options };
        this.tabsCreated.push(newTab);
        if (callback) {
          // Defer slightly to simulate async or run synchronously for tests
          callback(newTab);
        }
      },
      remove: (tabId, callback) => {
        this.tabsRemoved.push(tabId);
        if (callback) callback();
      }
    };

    this.storage = {
      local: {
        get: (keys, callback) => {
          const result = {};
          if (Array.isArray(keys)) {
            for (const key of keys) {
              result[key] = this.localStorage[key];
            }
          } else if (typeof keys === "string") {
            result[keys] = this.localStorage[keys];
          } else {
            Object.assign(result, this.localStorage);
          }
          if (callback) callback(result);
        },
        set: (items, callback) => {
          Object.assign(this.localStorage, items);
          if (callback) callback();
        }
      }
    };

    this.runtime = {
      lastError: null,
      onInstalled: {
        addListener: (callback) => {
          this.listeners.installed.push(callback);
        }
      },
      onStartup: {
        addListener: (callback) => {
          this.listeners.startup.push(callback);
        }
      },
      onMessage: {
        addListener: (callback) => {
          this.listeners.message.push(callback);
        }
      }
    };
  }

  // Helper triggers for tests
  triggerInstalled() {
    for (const cb of this.listeners.installed) {
      cb();
    }
  }

  triggerStartup() {
    for (const cb of this.listeners.startup) {
      cb();
    }
  }

  triggerAlarm(name) {
    for (const cb of this.listeners.alarm) {
      cb({ name });
    }
  }

  triggerMessage(message, sender = {}) {
    for (const cb of this.listeners.message) {
      cb(message, sender, () => {});
    }
  }
}

module.exports = MockChrome;
