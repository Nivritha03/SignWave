import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GlossDisplayProps {
  glosses: string[];
  listening?: boolean;
}

/**
 * Displays a live list of glosses with a subtle fade‑in animation.
 * Shows a "Listening…" placeholder when no glosses have been received yet.
 */
const GlossDisplay: React.FC<GlossDisplayProps> = ({ glosses, listening = false }) => {
  // Show only the most recent few glosses for readability.
  const recent = glosses.slice(-5);

  return (
    <div className="glass p-4 rounded-xl border border-white/10 max-w-md mx-auto mb-4">
      <h3 className="text-sm font-medium text-white mb-2">Live Glosses</h3>
      <div className="min-h-[4rem] text-white text-sm space-y-1">
        {listening && glosses.length === 0 && (
          <motion.div
            key="listening"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="italic text-gray-400"
          >
            Listening…
          </motion.div>
        )}
        <AnimatePresence>
          {recent.map((g, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {g}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GlossDisplay;
