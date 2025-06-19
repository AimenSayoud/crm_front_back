"use client"

import type React from "react"
import { forwardRef, useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "@/app/context/ThemeContext"
import TextArea from "@/components/ui/TextArea"
import { FiSend, FiUser, FiBriefcase, FiCommand } from "react-icons/fi"

interface ModernAIInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onSend: () => void
  onSlashCommand: () => void
  placeholder?: string
  disabled?: boolean
  entityName?: string | null
  entityType?: "candidate" | "company" | null
}

const ModernAIInput = forwardRef<HTMLTextAreaElement, ModernAIInputProps>(
  (
    {
      value,
      onChange,
      onKeyDown,
      onSend,
      onSlashCommand,
      placeholder = "Type a message or / for commands...",
      disabled = false,
      entityName = null,
      entityType = null,
    },
    ref,
  ) => {
    const { colors, theme } = useTheme()
    const [isFocused, setIsFocused] = useState(false)
    const [showSlashHint, setShowSlashHint] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const isLightTheme = theme === "light"

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "/" && value === "") {
        e.preventDefault()
        onSlashCommand()
        return
      }
      onKeyDown(e)
    }

    // Show slash hint when input is empty and focused
    useEffect(() => {
      setShowSlashHint(isFocused && value === "")
    }, [isFocused, value])

    useEffect(() => {
      if (entityName && containerRef.current) {
        const inputElement = containerRef.current.querySelector("textarea")
        if (inputElement) {
          inputElement.style.transform = "scale(1.02)"
          setTimeout(() => {
            inputElement.style.transform = "scale(1)"
          }, 200)
        }
      }
    }, [entityName])

    const entityIcon = entityType === "candidate" ? <FiUser /> : <FiBriefcase />
    const entityColor = entityType === "candidate" ? colors.primary : colors.secondary
    const canSend = !disabled && value.trim().length > 0

    return (
      <div className="relative w-full" ref={containerRef}>
        <AnimatePresence>
          {entityName && (
            <motion.div
              className="absolute -top-8 left-4 z-0 rounded-t-lg px-3 py-1.5 font-medium text-xs shadow-sm flex items-center gap-1.5"
              initial={{ opacity: 0, y: 10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: 10, height: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              style={{
                background: isLightTheme ? `${entityColor}15` : `${entityColor}26`,
                color: entityColor,
                borderTop: `2px solid ${entityColor}`,
                borderLeft: `1px solid ${entityColor}40`,
                borderRight: `1px solid ${entityColor}40`,
              }}
            >
              <span className="text-[0.7rem] uppercase tracking-wider font-bold opacity-70">Context</span>
              <div className="w-4 h-4 flex items-center justify-center">{entityIcon}</div>
              <span className="font-semibold">{entityName}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className={`relative flex items-end rounded-xl transition-all duration-300 ${
            entityName ? "rounded-t-none border-t-0" : ""
          }`}
          style={{
            background: colors.card,
            boxShadow: isFocused
              ? `0 0 0 2px ${colors.primary}40, 0 4px 12px rgba(0,0,0,0.08)`
              : "0 2px 6px rgba(0,0,0,0.05)",
            border: `2px solid ${isFocused ? colors.primary : isLightTheme ? "#E2E8F0" : "#334155"}`,
            borderTopColor: entityName
              ? entityColor
              : isFocused
                ? colors.primary
                : isLightTheme
                  ? "#E2E8F0"
                  : "#334155",
          }}
        >
          <div className="relative flex-1 bg-transparent rounded-lg overflow-hidden">
            <TextArea
              ref={ref}
              value={value}
              onChange={onChange}
              onKeyDown={handleInputKeyDown}
              placeholder={placeholder}
              rows={1}
              maxRows={6}
              fullWidth
              className="resize-none pr-14 border-0 shadow-none focus:shadow-none focus:ring-0 transition-all duration-200 bg-transparent"
              style={{
                padding: "0.875rem 0.875rem",
                fontSize: "0.9375rem",
                lineHeight: "1.6",
                outline: "none",
                color: colors.text,
                minHeight: "56px",
              }}
              disabled={disabled}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              aria-label="Message input"
            />

            <AnimatePresence>
              {showSlashHint && (
                <motion.div
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2 pointer-events-none"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 0.6, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="w-5 h-5 rounded-md flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                    <FiCommand className="w-3 h-3" />
                  </div>
                  <span className="text-sm opacity-70">Type / for commands</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            onClick={onSend}
            disabled={!canSend}
            className="absolute right-3 bottom-3 rounded-lg flex items-center justify-center transition-all duration-200 transform"
            title="Send message"
            style={{
              width: "42px",
              height: "42px",
              background: canSend
                ? `linear-gradient(135deg, ${colors.primary}, ${colors.primary}dd)`
                : isLightTheme
                  ? "#E2E8F0"
                  : "#334155",
              color: canSend ? "#FFFFFF" : isLightTheme ? "#94A3B8" : "#475569",
              opacity: canSend ? 1 : 0.6,
            }}
            whileHover={canSend ? { scale: 1.05 } : {}}
            whileTap={canSend ? { scale: 0.95 } : {}}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
              boxShadow: canSend ? `0 2px 8px ${colors.primary}50` : "none",
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 15,
            }}
          >
            <FiSend className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Character count indicator (optional) */}
        {value.length > 0 && (
          <motion.div
            className="absolute right-3 -bottom-6 text-xs opacity-60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
          >
            {value.length} {value.length === 1 ? "character" : "characters"}
          </motion.div>
        )}
      </div>
    )
  },
)

ModernAIInput.displayName = "ModernAIInput"

export default ModernAIInput
