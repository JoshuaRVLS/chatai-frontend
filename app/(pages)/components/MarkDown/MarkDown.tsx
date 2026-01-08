import React from "react";
import ReactMarkDown, { Components } from "react-markdown";

const MarkDown = ({ children }: { children: string }) => {
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
              <span key={`${patternIdx}-${i}`} className="text-cyan-400/90 italic font-medium">
                {part}
              </span>
            );
          } else if (part.startsWith('"') && part.endsWith('"') && patternIdx === 1) {
            newSegments.push(
              <span key={`${patternIdx}-${i}`} className="text-white font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
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
            <em className="italic opacity-80 decoration-primary/30" {...props} />
          ),
        } as Components
      }
    >
      {children}
    </ReactMarkDown>
  );
};

export default MarkDown;
