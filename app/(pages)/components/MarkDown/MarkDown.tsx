import React from "react";
import ReactMarkDown, { Components } from "react-markdown";

const MarkDown = ({ children }: { children: React.ReactNode }) => {
  return (
    <ReactMarkDown
      components={
        {
          p: ({ node, ...props }) => (
            <p
              className=" text-wrap wrap-break-word whitespace-pre-wrap word-break-break-all"
              {...props}
            />
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
      {children as string}
    </ReactMarkDown>
  );
};

export default MarkDown;
