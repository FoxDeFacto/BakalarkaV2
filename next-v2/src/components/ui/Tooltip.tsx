// src/components/ui/Tooltip.tsx
import React, { useState, useRef, ReactElement, JSXElementConstructor } from 'react';

interface TooltipProps {
  content: string;
  children: ReactElement<any, string | JSXElementConstructor<any>>;
  position?: 'top' | 'right' | 'bottom' | 'left';
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Position classes
  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2',
    right: 'left-full top-1/2 transform translate-x-2 -translate-y-1/2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 translate-y-2',
    left: 'right-full top-1/2 transform -translate-x-2 -translate-y-1/2',
  };

  // Arrow classes
  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-800 border-l-transparent border-r-transparent border-b-transparent',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-r-gray-800 border-t-transparent border-b-transparent border-l-transparent',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-800 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-l-gray-800 border-t-transparent border-b-transparent border-r-transparent',
  };

  // Handle existing event handlers
  const childProps = children.props;
  const originalMouseEnter = childProps.onMouseEnter;
  const originalMouseLeave = childProps.onMouseLeave;

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    setIsVisible(true);
    if (originalMouseEnter) {
      originalMouseEnter(e);
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    setIsVisible(false);
    if (originalMouseLeave) {
      originalMouseLeave(e);
    }
  };

  return (
    <div className="relative inline-block">
      {React.cloneElement(children, {
        ...childProps,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
      })}
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute z-10 px-3 py-2 text-sm font-medium text-white bg-gray-800 rounded-md shadow-sm ${positionClasses[position]}`}
        >
          {content}
          <div className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}></div>
        </div>
      )}
    </div>
  );
}