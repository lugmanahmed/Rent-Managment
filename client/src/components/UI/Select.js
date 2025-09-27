import React from 'react';
import { ChevronDown } from 'lucide-react';

const Select = React.forwardRef(({ 
  className, 
  error,
  options = [],
  placeholder = "Select an option",
  searchable = false,
  ...props 
}, ref) => {
  return (
    <div className="w-full">
      <div className="relative">
        <select
          className={`input appearance-none pr-10 ${error ? 'border-red-500 focus-visible:ring-red-500' : ''} ${className || ''}`}
          ref={ref}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value || option} value={option.value || option}>
              {option.label || option}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
export { Select };
