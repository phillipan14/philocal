"use client";

import { useState } from "react";
import { UserPreferences } from "@/lib/types";
import { getPreferences, savePreferences } from "@/lib/preferences";

interface PreferencesModalProps {
  onClose: () => void;
}

export default function PreferencesModal({ onClose }: PreferencesModalProps) {
  const [prefs, setPrefs] = useState<UserPreferences>(getPreferences());

  function handleSave() {
    savePreferences(prefs);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content animate-in-scale"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6">
          <h2
            className="text-2xl font-normal mb-1"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Settings
          </h2>
          <p className="text-sm text-[var(--text-tertiary)]">
            Customize how PhiloCal manages your schedule.
          </p>
        </div>

        <div className="space-y-5">
          {/* Working hours */}
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)] mb-3">
              Working hours
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-[var(--text-secondary)] block mb-1.5">
                  Start time
                </label>
                <input
                  type="text"
                  value={prefs.workingHoursStart}
                  onChange={(e) =>
                    setPrefs({ ...prefs, workingHoursStart: e.target.value })
                  }
                  placeholder="09:00"
                />
              </div>
              <div>
                <label className="text-sm text-[var(--text-secondary)] block mb-1.5">
                  End time
                </label>
                <input
                  type="text"
                  value={prefs.workingHoursEnd}
                  onChange={(e) =>
                    setPrefs({ ...prefs, workingHoursEnd: e.target.value })
                  }
                  placeholder="18:00"
                />
              </div>
            </div>
          </div>

          {/* Timezone */}
          <div>
            <label className="text-sm text-[var(--text-secondary)] block mb-1.5">
              Timezone
            </label>
            <input
              type="text"
              value={prefs.timezone}
              onChange={(e) =>
                setPrefs({ ...prefs, timezone: e.target.value })
              }
            />
          </div>

          {/* Meeting defaults */}
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)] mb-3">
              Meeting defaults
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-[var(--text-secondary)] block mb-1.5">
                  Buffer (min)
                </label>
                <input
                  type="number"
                  value={prefs.bufferMinutes}
                  onChange={(e) =>
                    setPrefs({
                      ...prefs,
                      bufferMinutes: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm text-[var(--text-secondary)] block mb-1.5">
                  Duration (min)
                </label>
                <input
                  type="number"
                  value={prefs.defaultDuration}
                  onChange={(e) =>
                    setPrefs({
                      ...prefs,
                      defaultDuration: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-sm text-[var(--text-secondary)] block mb-1.5">
              Default location
            </label>
            <input
              type="text"
              value={prefs.defaultLocation}
              onChange={(e) =>
                setPrefs({ ...prefs, defaultLocation: e.target.value })
              }
              placeholder="Google Meet"
            />
          </div>

          {/* AI Provider */}
          <div
            className="rounded-xl p-5 mt-2"
            style={{
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border)",
            }}
          >
            <p className="text-sm font-medium text-[var(--text-primary)] mb-3">
              AI Provider
            </p>
            <p className="text-sm text-[var(--text-tertiary)] mb-4">
              Choose which AI powers your scheduling proposals. Add your API key below.
            </p>

            {/* Provider toggle */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                type="button"
                onClick={() => setPrefs({ ...prefs, aiProvider: "openai" })}
                className="p-3 rounded-xl text-sm font-medium text-left transition-all"
                style={{
                  background:
                    prefs.aiProvider === "openai"
                      ? "var(--accent-soft)"
                      : "var(--bg-secondary)",
                  border:
                    prefs.aiProvider === "openai"
                      ? "1px solid var(--accent)"
                      : "1px solid var(--border)",
                  color:
                    prefs.aiProvider === "openai"
                      ? "var(--text-primary)"
                      : "var(--text-secondary)",
                }}
              >
                OpenAI (GPT-4o)
              </button>
              <button
                type="button"
                onClick={() => setPrefs({ ...prefs, aiProvider: "anthropic" })}
                className="p-3 rounded-xl text-sm font-medium text-left transition-all"
                style={{
                  background:
                    prefs.aiProvider === "anthropic"
                      ? "var(--accent-soft)"
                      : "var(--bg-secondary)",
                  border:
                    prefs.aiProvider === "anthropic"
                      ? "1px solid var(--accent)"
                      : "1px solid var(--border)",
                  color:
                    prefs.aiProvider === "anthropic"
                      ? "var(--text-primary)"
                      : "var(--text-secondary)",
                }}
              >
                Anthropic (Claude)
              </button>
            </div>

            {/* API Key input — shows the relevant one */}
            {prefs.aiProvider === "openai" ? (
              <div>
                <label className="text-sm text-[var(--text-secondary)] block mb-1.5">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  value={prefs.openaiApiKey}
                  onChange={(e) =>
                    setPrefs({ ...prefs, openaiApiKey: e.target.value })
                  }
                  placeholder="sk-proj-..."
                />
                <p className="text-xs text-[var(--text-tertiary)] mt-2">
                  Get one at{" "}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--accent)] hover:underline"
                  >
                    platform.openai.com
                  </a>
                  . Stored locally in your browser only.
                </p>
              </div>
            ) : (
              <div>
                <label className="text-sm text-[var(--text-secondary)] block mb-1.5">
                  Anthropic API Key
                </label>
                <input
                  type="password"
                  value={prefs.anthropicApiKey}
                  onChange={(e) =>
                    setPrefs({ ...prefs, anthropicApiKey: e.target.value })
                  }
                  placeholder="sk-ant-..."
                />
                <p className="text-xs text-[var(--text-tertiary)] mt-2">
                  Get one at{" "}
                  <a
                    href="https://console.anthropic.com/settings/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--accent)] hover:underline"
                  >
                    console.anthropic.com
                  </a>
                  . Stored locally in your browser only.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="btn-secondary flex-1 py-3">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary flex-1 py-3">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
