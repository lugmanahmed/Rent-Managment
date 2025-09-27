import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';

const FormSection = ({ 
  title, 
  children, 
  collapsible = false, 
  defaultExpanded = true,
  className = '' 
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!collapsible) {
    return (
      <div className={clsx('space-y-4', className)}>
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        {children}
      </div>
    );
  }

  return (
    <div className={clsx('space-y-4', className)}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>
      
      {isExpanded && (
        <div className="space-y-4">
          {children}
        </div>
      )}
    </div>
  );
};

export default FormSection;
