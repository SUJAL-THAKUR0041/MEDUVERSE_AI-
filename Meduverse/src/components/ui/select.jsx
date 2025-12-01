import React, { useState, useRef, useEffect } from "react";

const Select = ({ children, value, onValueChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);
  
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [isOpen]);
  
  return (
    <div className="relative">
      {React.Children.map(children, child => {
        // Pass value to SelectValue component
        if (child.type.name === 'SelectValue') {
          return React.cloneElement(child, { value });
        }
        return React.cloneElement(child, { 
          value, 
          onValueChange, 
          isOpen, 
          setIsOpen,
          triggerRef,
          position
        });
      })}
    </div>
  );
};

const SelectTrigger = ({ children, className, isOpen, setIsOpen, triggerRef, value }) => (
  <button
    ref={triggerRef}
    type="button"
    onClick={() => setIsOpen(!isOpen)}
    className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-background placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ""}`}
  >
    {React.Children.map(children, child => 
      child.type.name === 'SelectValue' 
        ? React.cloneElement(child, { value })
        : child
    )}
    <span className="text-gray-400">▼</span>
  </button>
);

const SelectValue = ({ placeholder = "Select an option", value }) => (
  <span className={`${value ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
    {value || placeholder}
  </span>
);

const SelectContent = ({ children, isOpen, setIsOpen, onValueChange, position }) => {
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed z-50 rounded-md border border-gray-300 bg-white shadow-lg max-h-[300px] overflow-y-auto"
      style={{
        top: position.top + 'px',
        left: position.left + 'px',
        width: position.width + 'px',
        minWidth: '200px'
      }}
    >
      {React.Children.map(children, child =>
        React.cloneElement(child, { onValueChange, setIsOpen })
      )}
    </div>
  );
};

const SelectItem = ({ children, value, onValueChange, setIsOpen }) => (
  <div
    onClick={() => {
      onValueChange(value);
      setIsOpen(false);
    }}
    className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm text-gray-900 outline-none hover:bg-blue-50 hover:text-blue-900 bg-white"
  >
    {children}
  </div>
);

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };