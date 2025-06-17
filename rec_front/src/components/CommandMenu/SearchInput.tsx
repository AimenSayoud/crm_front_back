// src/components/ai-assistant/CommandMenu/SearchInput.tsx
import React, { forwardRef } from 'react';
import { FiSearch } from 'react-icons/fi';
import Input from '@/components/ui/Input';

interface SearchInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder: string;
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onChange, onKeyDown, placeholder }, ref) => {
    return (
      <Input
        ref={ref}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        fullWidth
        leftIcon={<FiSearch className="w-4 h-4 text-gray-400" />}
        className="text-base"
      />
    );
  }
);

SearchInput.displayName = 'SearchInput';
export default SearchInput;
