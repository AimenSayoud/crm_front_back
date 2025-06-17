// src/components/ui/AdvancedFilter.tsx
import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import Button from './Button';
import Input from './Input';
import Select from './Select';

export interface FilterOption {
  id: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'number';
  options?: { value: string; label: string }[];
  value: string;
}

interface AdvancedFilterProps {
  filters: FilterOption[];
  onFilterChange: (id: string, value: string) => void;
  onClear: () => void;
  onApply: () => void;
}

const AdvancedFilter: React.FC<AdvancedFilterProps> = ({
  filters,
  onFilterChange,
  onClear,
  onApply,
}) => {
  const { colors } = useTheme();

  const handleInputChange = (id: string, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onFilterChange(id, e.target.value);
  };

  return (
    <div 
      className="p-4 rounded-lg border"
      style={{ borderColor: colors.border }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filters.map(filter => (
          <div key={filter.id}>
            {filter.type === 'select' ? (
              <Select
                label={filter.label}
                value={filter.value}
                onChange={(e) => handleInputChange(filter.id, e)}
                options={filter.options || []}
                fullWidth
              />
            ) : filter.type === 'date' ? (
              <Input
                label={filter.label}
                type="date"
                value={filter.value}
                onChange={(e) => handleInputChange(filter.id, e)}
                fullWidth
              />
            ) : filter.type === 'number' ? (
              <Input
                label={filter.label}
                type="number"
                value={filter.value}
                onChange={(e) => handleInputChange(filter.id, e)}
                fullWidth
              />
            ) : (
              <Input
                label={filter.label}
                type="text"
                value={filter.value}
                onChange={(e) => handleInputChange(filter.id, e)}
                fullWidth
              />
            )}
          </div>
        ))}
      </div>
      
      <div className="flex justify-end mt-4 space-x-2">
        <Button variant="outline" onClick={onClear}>
          Clear
        </Button>
        <Button variant="primary" onClick={onApply}>
          Apply Filters
        </Button>
      </div>
    </div>
  );
};

export default AdvancedFilter;