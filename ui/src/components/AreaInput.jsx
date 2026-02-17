import { useMemo, useRef, useState } from "react";
export default function AreaInput({
  value,
  onChange,
  placeholder,
  inputClassName = "form-control",
  required = false,
  name,
  id,
  options = [],
}) {
  const [open, setOpen] = useState(false);
  const [directionUp, setDirectionUp] = useState(false);
  const wrapperRef = useRef(null);

  const suggestions = useMemo(() => {
    const query = (value || "").trim().toLowerCase();
    if (!query) return [];
    return options
      .filter((option) => option.toLowerCase().includes(query))
      .slice(0, 8);
  }, [options, value]);

  const handleSelect = (area) => {
    onChange(area);
    setOpen(false);
  };

  const handleFocus = () => {
    setOpen(true);
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setDirectionUp(spaceBelow < 260);
    }
  };

  return (
    <div className="area-input" ref={wrapperRef}>
      <input
        type="text"
        className={inputClassName}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={handleFocus}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        required={required}
        name={name}
        id={id}
      />
      {open && suggestions.length > 0 ? (
        <div
          className={`area-suggest-list list-group ${
            directionUp ? "area-suggest-up" : ""
          }`}
        >
          {suggestions.map((area) => (
            <button
              key={area}
              type="button"
              className="list-group-item list-group-item-action"
              onMouseDown={() => handleSelect(area)}
            >
              {area}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
