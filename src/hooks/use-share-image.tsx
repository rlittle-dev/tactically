import { useRef, useCallback } from "react";
import html2canvas from "html2canvas";
import { Download, Link, Share2 } from "lucide-react";
import { toast } from "sonner";

const SITE_URL = "https://tactically.me";

export function useShareAsImage() {
  const captureRef = useRef<HTMLDivElement>(null);

  const downloadImage = useCallback(async (filename: string = "tactically-card") => {
    if (!captureRef.current) return;
    try {
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: "#0a0a0a",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Image downloaded!");
    } catch {
      toast.error("Failed to capture image");
    }
  }, []);

  const copyShareLink = useCallback((path: string = "/") => {
    const url = path.startsWith("http") ? path : `${SITE_URL}${path}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Link copied to clipboard!");
    }).catch(() => {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      toast.success("Link copied to clipboard!");
    });
  }, []);

  return { captureRef, downloadImage, copyShareLink };
}

interface ShareButtonsProps {
  onDownload: () => void;
  onShare: () => void;
  compact?: boolean;
}

export const ShareButtons = ({ onDownload, onShare, compact }: ShareButtonsProps) => (
  <div className={`flex items-center ${compact ? "gap-1" : "gap-2"}`}>
    <button
      onClick={onDownload}
      className={`flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors ${
        compact ? "p-1.5" : "px-3 py-1.5 rounded-lg border border-border/60 hover:border-foreground/30 text-xs"
      }`}
      title="Download as image"
    >
      <Download className={compact ? "h-3.5 w-3.5" : "h-3.5 w-3.5"} />
      {!compact && "Download"}
    </button>
    <button
      onClick={onShare}
      className={`flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors ${
        compact ? "p-1.5" : "px-3 py-1.5 rounded-lg border border-border/60 hover:border-foreground/30 text-xs"
      }`}
      title="Copy share link"
    >
      <Link className={compact ? "h-3.5 w-3.5" : "h-3.5 w-3.5"} />
      {!compact && "Share Link"}
    </button>
  </div>
);
