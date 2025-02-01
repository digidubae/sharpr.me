import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface SpaceCardProps {
  id: string;
  title: string;
  lastVisited: number;
  isPinned?: boolean;
  isSelected?: boolean;
  onSelect?: (index: number | null) => void;
  onDelete?: (id: string, e: React.MouseEvent) => void;
  onPin?: (id: string, e: React.MouseEvent) => void;
  index: number;
  onClick?: (id: string) => void;
  section: 'recent' | 'library';
  disabled?: boolean;
  showActions?: boolean;
}

export default function SpaceCard({
  id,
  title,
  lastVisited,
  isPinned = false,
  isSelected = false,
  onSelect,
  onDelete,
  onPin,
  index,
  onClick,
  section,
  disabled = false,
  showActions = true,
}: SpaceCardProps) {
  return (
    <motion.div
      className="group relative flex"
      layout
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <motion.div
        onClick={disabled || !onClick ? undefined : () => onClick(id)}
        className={`flex-1 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm 
                   ${!disabled && 'hover:shadow-md cursor-pointer'} 
                   transition-shadow text-left flex justify-between items-center
                   relative
                   ${isSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}
                   ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        whileHover={disabled ? undefined : { scale: 1.01 }}
        whileTap={disabled ? undefined : { scale: 0.99 }}
        onMouseEnter={() => !disabled && onSelect?.(index)}
        onMouseLeave={() => !disabled && onSelect?.(null)}
        layout
      >
        <div className="flex items-center gap-2">
          {showActions && onPin && (
            <motion.button
              initial={{ opacity: isPinned ? 1 : 0 }}
              animate={{ opacity: isSelected || isPinned ? 1 : 0 }}
              onClick={(e) => onPin(id, e)}
              className={`p-1 transition-colors ${
                isPinned 
                  ? 'text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-500'
                  : 'text-gray-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400'
              }`}
              title={isPinned ? "Unpin space" : "Pin space"}
            >
              <svg 
                className="w-5 h-5" 
                viewBox="0 0 24 24"
                fill={isPinned ? "currentColor" : "none"}
                stroke="currentColor"
              >
                {isPinned ? (
                  <path d="M5 5c0-1.1.9-2 2-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                ) : (
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" 
                  />
                )}
              </svg>
            </motion.button>
          )}
          <h3 className="font-medium flex items-center">
            <span>{title}</span>
            <span className="ml-2 text-sm text-gray-400 dark:text-gray-500">/{id}</span>
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last visited {formatDistanceToNow(lastVisited, { addSuffix: true })}
          </p>
          {showActions && onDelete && isSelected && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => onDelete(id, e)}
              className="p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 
                        dark:hover:text-red-400 transition-colors"
              title={section === 'recent' ? "Remove from recently visited" : "Remove from library"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
} 