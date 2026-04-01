import { useState } from "react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageOff } from "lucide-react";

interface QuestionImageProps {
  imageUrl: string;
  alt?: string;
}

export const QuestionImage = ({ imageUrl, alt = "Question image" }: QuestionImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full flex justify-center mb-4"
    >
      <div className="relative w-full max-w-md rounded-xl overflow-hidden border border-border bg-muted/30">
        {!loaded && (
          <Skeleton className="w-full aspect-video" />
        )}
        <img
          src={imageUrl}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`w-full object-contain max-h-72 transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0 absolute inset-0"}`}
        />
      </div>
    </motion.div>
  );
};
