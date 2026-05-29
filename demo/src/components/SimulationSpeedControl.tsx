/**
 * SimulationSpeedControl - Speed slider and preset buttons
 * Allows setting simulation speed from 0.1x to 4.0x with both slider and buttons
 */

interface SimulationSpeedControlProps {
  speed: number; // Current speed multiplier (1.0 = real-time)
  onSpeedChange: (speed: number) => void;
  disabled?: boolean;
}

const SPEED_PRESETS = [
  { label: "0.5×", value: 0.5 },
  { label: "1×", value: 1.0 },
  { label: "2×", value: 2.0 },
  { label: "4×", value: 4.0 },
];

export default function SimulationSpeedControl({
  speed,
  onSpeedChange,
  disabled = false,
}: SimulationSpeedControlProps) {
  // Convert linear slider (0-100) to logarithmic speed (0.1-4.0)
  // This provides better granularity at lower speeds
  const sliderValue = Math.log2(speed) / Math.log2(4) * 100; // Normalize to 0-100

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    // Convert slider position back to speed
    // slider 0-100 -> log2(0.1)-log2(4.0) -> speed 0.1-4.0
    const logMin = Math.log2(0.1);
    const logMax = Math.log2(4.0);
    const logValue = logMin + (value / 100) * (logMax - logMin);
    const newSpeed = Math.pow(2, logValue);
    onSpeedChange(Math.round(newSpeed * 100) / 100); // Round to 2 decimals
  };

  const handlePreset = (value: number) => {
    onSpeedChange(value);
  };

  return (
    <div className="simulation-speed-control">
      <label className="control-label">Simulation Speed</label>

      {/* Preset buttons */}
      <div className="speed-presets">
        {SPEED_PRESETS.map((preset) => (
          <button
            key={preset.label}
            className={`speed-preset ${speed === preset.value ? "active" : ""}`}
            onClick={() => handlePreset(preset.value)}
            disabled={disabled}
            title={`Set speed to ${preset.label}`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Slider */}
      <div className="speed-slider-container">
        <input
          type="range"
          min="0"
          max="100"
          value={sliderValue}
          onChange={handleSliderChange}
          disabled={disabled}
          className="speed-slider"
          title={`Simulation speed: ${speed.toFixed(2)}×`}
        />
        <span className="speed-display">{speed.toFixed(2)}×</span>
      </div>

      {/* Speed description */}
      <div className="speed-description">
        {speed < 1 && <span>Slow motion</span>}
        {speed === 1 && <span>Real-time</span>}
        {speed > 1 && speed <= 2 && <span>Fast forward</span>}
        {speed > 2 && <span>Very fast</span>}
      </div>
    </div>
  );
}
