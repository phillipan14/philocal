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
        className="modal-content animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold mb-1">Preferences</h2>
        <p className="text-xs text-[var(--text-tertiary)] mb-5">
          Tell PhiloCal how you like your time managed.
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">
                Work starts
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
              <label className="text-xs text-[var(--text-secondary)] block mb-1">
                Work ends
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

          <div>
            <label className="text-xs text-[var(--text-secondary)] block mb-1">
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">
                Buffer (minutes)
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
              <label className="text-xs text-[var(--text-secondary)] block mb-1">
                Default duration
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

          <div>
            <label className="text-xs text-[var(--text-secondary)] block mb-1">
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
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary flex-1">
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
