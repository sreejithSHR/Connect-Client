import React from "react";
import Modal from "./Modal";

const DeviceSelect = ({ label, value, options, onChange, fallbackLabel }) => (
  <div className="mb-4">
    <label className="mb-1 block text-sm font-medium text-ink2">{label}</label>
    <select
      value={value || (options[0] && options[0].deviceId) || ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-line bg-surface2 px-3 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-brand"
    >
      {options.length === 0 && <option value="">{fallbackLabel}</option>}
      {options.map((d, i) => (
        <option key={d.deviceId || i} value={d.deviceId}>
          {d.label || `${fallbackLabel} ${i + 1}`}
        </option>
      ))}
    </select>
  </div>
);

const SettingsModal = ({
  open,
  onClose,
  devices,
  selected,
  onCamera,
  onMic,
  onSpeaker,
}) => {
  const supportsSinkId = typeof HTMLMediaElement !== "undefined" &&
    "setSinkId" in HTMLMediaElement.prototype;

  return (
    <Modal open={open} onClose={onClose} title="Settings">
      <DeviceSelect
        label="Camera"
        value={selected.camera}
        options={devices.cameras}
        onChange={onCamera}
        fallbackLabel="Camera"
      />
      <DeviceSelect
        label="Microphone"
        value={selected.mic}
        options={devices.mics}
        onChange={onMic}
        fallbackLabel="Microphone"
      />
      {supportsSinkId && (
        <DeviceSelect
          label="Speaker (output)"
          value={selected.speaker}
          options={devices.speakers}
          onChange={onSpeaker}
          fallbackLabel="Speaker"
        />
      )}
      <p className="mt-1 text-xs text-muted">
        Allow camera/mic access for device names to appear.
      </p>
    </Modal>
  );
};

export default SettingsModal;
