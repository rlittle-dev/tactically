import { useState } from "react";
import { Search } from "lucide-react";

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
      <div className="relative group">
        <div className="absolute inset-0 rounded-sm bg-foreground/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
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
          <button
            type="submit"
            disabled={loading || !value.trim()}
            className="px-5 py-3.5 bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Loading…" : "Analyze"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default UsernameSearch;
