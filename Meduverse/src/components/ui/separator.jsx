import React from "react";

const Separator = React.forwardRef(
  ({ className, orientation = "horizontal", ...props }, ref) => (
    <div
      ref={ref}
      className={`shrink-0 bg-border ${
        orientation === "vertical"
          ? "h-full w-px"
          : "h-px w-full"
      } ${className || ""}`}
      {...props}
    />
  )
);
Separator.displayName = "Separator";

export { Separator };
