"use client";

/**
 * AETERNA — Magic Input Bar.
 * Строка быстрого создания задач.
 * При вводе текста и Enter → открывается TaskCreateModal с предзаполненным названием.
 * Кнопка "+" также открывает модалку.
 */

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TaskCreateModal from "./TaskCreateModal";

const springConfig = { type: "spring" as const, stiffness: 400, damping: 25 };

export default function MagicInputBar() {
  const [isFocused, setIsFocused] = useState(false);
  const [value, setValue] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    openModal();
  };

  const openModal = () => {
    setIsModalOpen(true);
    inputRef.current?.blur();
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setValue("");
  };

  return (
    <>
      <motion.form
        onSubmit={handleSubmit}
        layout
        transition={springConfig}
        className="relative w-full"
      >
        <motion.div
          animate={{
            boxShadow: isFocused
              ? "0 0 0 3px rgba(184, 115, 51, 0.15), 0 0 30px rgba(184, 115, 51, 0.08)"
              : "0 0 0 0px rgba(184, 115, 51, 0)",
          }}
          transition={springConfig}
          className="relative flex items-center rounded-2xl bg-surface-2 border border-gunmetal overflow-hidden"
        >
          {/* Search Icon */}
          <div className="pl-4 pr-2 text-text-muted">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Новая задача…"
            className="flex-1 bg-transparent py-4 pr-2 text-text-primary placeholder-text-muted text-sm font-sans outline-none"
            id="magic-input"
          />

          {/* Add Button */}
          <motion.button
            type="button"
            onClick={openModal}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={springConfig}
            className="mr-3 p-2 rounded-xl bg-copper/10 text-copper hover:bg-copper/20 transition-colors"
            aria-label="Создать задачу"
            id="add-task-button"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </motion.button>
        </motion.div>

        {/* Focused hint */}
        <AnimatePresence>
          {isFocused && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={springConfig}
              className="absolute -bottom-6 left-4 text-xs text-text-muted"
            >
              Enter — открыть форму задачи
            </motion.p>
          )}
        </AnimatePresence>
      </motion.form>

      {/* Task Creation Modal */}
      <TaskCreateModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        initialTitle={value.trim()}
      />
    </>
  );
}
