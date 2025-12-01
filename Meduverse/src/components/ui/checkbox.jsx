import React from "react";

const Checkbox = React.forwardRef(({ id, checked = false, onCheckedChange, className = "", ...props }, ref) => {
  const handleChange = (e) => {
    if (typeof onCheckedChange === 'function') onCheckedChange(e.target.checked);
  };

  return (
    <input
      id={id}
      type="checkbox"
      ref={ref}
      checked={checked}
      onChange={handleChange}
      className={`h-4 w-4 rounded border border-input bg-background text-emerald-600 focus:ring-2 focus:ring-ring ${className}`}
      {...props}
    />
  );
});
Checkbox.displayName = "Checkbox";

export { Checkbox };
