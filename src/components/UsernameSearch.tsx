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
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative group"
      >
        <div className="absolute -inset-1 rounded-xl bg-foreground/5 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />
        <div className="relative flex items-center bg-secondary/60 backdrop-blur-xl border border-border/60 rounded-xl overflow-hidden focus-within:border-foreground/30 transition-all duration-300 focus-within:shadow-lg focus-within:shadow-foreground/[0.03]">
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
      </motion.div>
    </form>
  );
};

export default UsernameSearch;
