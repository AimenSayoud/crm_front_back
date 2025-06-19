// src/components/ai-assistant/ApiKeySettingsModal.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/app/context/ThemeContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { FiKey, FiShield } from 'react-icons/fi';
import { openai } from '@/services';

interface ApiKeySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ApiKeySettingsModal: React.FC<ApiKeySettingsModalProps> = ({ isOpen, onClose }) => {
  const { colors, theme } = useTheme();
  const [apiKeyInput, setApiKeyInput] = useState('');

  const handleSaveKey = () => {
    if (apiKeyInput.trim().startsWith('sk-')) {
      openai.setApiKey(apiKeyInput.trim());
      onClose();
    }
  };

  if (!isOpen) return null;
  
  return (
    <motion.div 
      className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <motion.div
        className="rounded-xl shadow-xl max-w-md w-full overflow-hidden"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", duration: 0.5 }}
        style={{
          background: theme === 'light'
            ? 'linear-gradient(180deg, #FFFFFF 0%, #F9FAFB 100%)'
            : 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)',
          boxShadow: theme === 'light'
            ? '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            : '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
        }}
      >
        <div className="px-6 py-4 border-b flex items-center" style={{ borderColor: theme === 'light' ? '#E2E8F0' : '#334155' }}>
          <div className="w-10 h-10 rounded-full mr-3 flex items-center justify-center" style={{ backgroundColor: `${colors.primary}20` }}>
            <FiKey className="w-5 h-5" style={{ color: colors.primary }} />
          </div>
          <h3 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            OpenAI API Key Setup
          </h3>
        </div>
        <div className="p-6">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 mb-4 flex items-start">
            <FiShield className="w-5 h-5 text-yellow-500 dark:text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              If backend AI services are unavailable, the system will use this key for direct OpenAI calls. 
              Your key is stored in session storage and never sent to our servers.
            </p>
          </div>
          <div className="space-y-1 mb-4">
            <label htmlFor="apiKeyInputModal" className="block text-sm font-medium" style={{ color: colors.text }}>
              API Key
            </label>
            <Input 
              id="apiKeyInputModal" 
              type="password" 
              value={apiKeyInput} 
              onChange={(e) => setApiKeyInput(e.target.value)} 
              placeholder="sk-..." 
              fullWidth 
              className="p-3"
            />
            <p className="text-xs mt-1" style={{ color: `${colors.text}70` }}>
              Find your API key in the OpenAI dashboard. Keys typically start with "sk-".
            </p>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button 
              variant="primary" 
              onClick={handleSaveKey} 
              disabled={!apiKeyInput.trim().startsWith('sk-')}
            >
              Save API Key
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ApiKeySettingsModal;