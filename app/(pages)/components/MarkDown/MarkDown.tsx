import React from "react";
import ReactMarkDown, { Components } from "react-markdown";

const MarkDown = ({ children, isLight = false }: { children: string; isLight?: boolean }) => {
  const processStyles = (text: string) => {
    if (typeof text !== "string") return text;

    // Regex to handle thoughts ('...') while allowing internal apostrophes (I'm, don't)
    // and dialogue ("...")
    // Split by both patterns
    const patterns = [
      /(^|\s)('(?:[^']|(?<=\w)'(?=\w))+')(?=$|\s|[.,!?;])/g, // Thoughts
      /("[^"]+")/g,                                        // Dialogue
    ];

    let segments: (string | React.ReactNode)[] = [text];

    patterns.forEach((pattern, patternIdx) => {
      const newSegments: (string | React.ReactNode)[] = [];
      segments.forEach((segment) => {
        if (typeof segment !== "string") {
          newSegments.push(segment);
          return;
        }

        const parts = segment.split(pattern);
        parts.forEach((part, i) => {
          if (!part) return;

          // Check if part matches the current pattern
          // Note: regex with groups in split returns the groups
          if (part.startsWith("'") && part.endsWith("'") && part.length > 2 && patternIdx === 0) {
            newSegments.push(
              <span key={`${patternIdx}-${i}`} className={`${isLight ? 'text-cyan-700' : 'text-cyan-400/90'} italic font-medium`}>
                {part}
              </span>
            );
          } else if (part.startsWith('"') && part.endsWith('"') && patternIdx === 1) {
            newSegments.push(
              <span key={`${patternIdx}-${i}`} className={`${isLight ? 'text-zinc-950 underline decoration-zinc-950/20 underline-offset-4' : 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]'} font-bold`}>
                {part}
              </span>
            );
          } else {
            newSegments.push(part);
          }
        });
      });
      segments = newSegments;
    });

    return segments;
  };

  return (
    <ReactMarkDown
      components={
        {
          p: ({ node, children, ...props }) => (
            <p
              className="text-wrap wrap-break-word whitespace-pre-wrap word-break-break-all"
              {...props}
            >
              {React.Children.map(children, (child) => {
                if (typeof child === "string") {
                  return processStyles(child);
                }
                return child;
              })}
            </p>
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-black" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className={`italic opacity-80 ${isLight ? 'decoration-zinc-950/20' : 'decoration-primary/30'}`} {...props} />
          ),
        } as Components
      }
    >
      {children}
    </ReactMarkDown>
  );
};

export default MarkDown;
