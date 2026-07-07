import { useState } from "react";

interface AddFunctionControlProps {
  onAdd: (name: string) => void;
  placeholder?: string;
}

export default function AddFunctionControl({ onAdd, placeholder }: AddFunctionControlProps): JSX.Element {
  const [name, setName] = useState("");

  const handleAdd = (): void => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setName("");
  };

  return (
    <div className="dz-add-function">
      <input
        type="text"
        value={name}
        placeholder={placeholder ?? "function/property/name"}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleAdd();
        }}
      />
      <button type="button" className="dz-btn dz-btn--secondary" onClick={handleAdd} disabled={!name.trim()}>
        Add Function
      </button>
    </div>
  );
}
