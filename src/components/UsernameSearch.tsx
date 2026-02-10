import { useState } from "react";
import { Search } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  onSearch: (username: string) => void;
  loading: boolean;
}

const UsernameSearch = ({ onSearch, loading }: Props) => {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) onSearch(value.trim());
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="w-full max-w-md mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="relative group">
        <motion.div
          className="absolute -inset-1 rounded-lg bg-foreground/5 blur-xl"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        />
        <div className="relative flex items-center bg-secondary border border-border rounded-sm overflow-hidden focus-within:border-foreground/30 transition-colors">
          <Search className="ml-4 h-5 w-5 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter Chess.com username"
            className="flex-1 bg-transparent px-3 py-3.5 text-foreground placeholder:text-muted-foreground outline-none text-sm tracking-wide"
            disabled={loading}
          />
          <motion.button
            type="submit"
            disabled={loading || !value.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-5 py-3.5 bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Loading…" : "Analyze"}
          </motion.button>
        </div>
      </div>
    </motion.form>
  );
};

export default UsernameSearch;
