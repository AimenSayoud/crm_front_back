// src/components/ui/Card.tsx
import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  customBorderColor?: string;
  customRingColor?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  headerRight,
  footer,
  className = '',
  noPadding = false,
  customBorderColor,
  customRingColor,
}) => {
  const { colors } = useTheme();

  return (
    <div
      className={`rounded-lg shadow-sm ${className}`}
      style={{ 
        backgroundColor: colors.card, 
        borderColor: customBorderColor || colors.border,
        boxShadow: customRingColor ? `0 0 0 1px ${customRingColor}` : undefined
      }}
    >
      {(title || headerRight) && (
        <div 
          className="flex justify-between items-start border-b p-4"
          style={{ borderColor: colors.border }}
        >
          <div>
            {title && (
              <h3 className="text-lg font-medium" style={{ color: colors.text }}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p 
                className="text-sm mt-1" 
                style={{ color: `${colors.text}99` }} // Adding transparency to the text color
              >
                {subtitle}
              </p>
            )}
          </div>
          {headerRight && <div>{headerRight}</div>}
        </div>
      )}
      
      <div className={noPadding ? '' : 'p-4'}>{children}</div>
      
      {footer && (
        <div 
          className="border-t p-4"
          style={{ borderColor: colors.border }}
        >
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;