"use client";

import React, { useRef, useState } from "react";
import {
    FiBold,
    FiItalic,
    FiUnderline,
    FiLink,
    FiImage,
    FiCode,
    FiAlignLeft,
    FiAlignCenter,
    FiAlignRight,
    FiMaximize2
} from "react-icons/fi";
import Editor, { OnMount } from "@monaco-editor/react";

interface DescriptionEditorProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
}

const DescriptionEditor: React.FC<DescriptionEditorProps> = ({
    value,
    onChange,
    className = "",
    placeholder = "Enter description...",
}) => {
    const editorRef = useRef<any>(null);

    const handleEditorDidMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;

        // Custom theme adjustment if needed, but 'vs-dark' is usually good
        // We can define a theme to match the app better if requested later
    };

    const insertText = (before: string, after: string = "") => {
        const editor = editorRef.current;
        if (!editor) return;

        const selection = editor.getSelection();
        const selectedText = editor.getModel()?.getValueInRange(selection) || "";

        const text = before + selectedText + after;

        editor.executeEdits("toolbar", [{
            range: selection,
            text: text,
            forceMoveMarkers: true
        }]);

        if (!selectedText) {
            // If no text selected, place cursor between tags (after 'before')
            const model = editor.getModel();
            const insertOffset = model.getOffsetAt(selection.getStartPosition());
            const newCursorOffset = insertOffset + before.length;
            const newPosition = model.getPositionAt(newCursorOffset);

            editor.setPosition(newPosition);
        }

        // Restore focus
        editor.focus();
    };

    const ToolbarButton = ({
        icon: Icon,
        onClick,
        tooltip
    }: {
        icon: any,
        onClick: () => void,
        tooltip: string
    }) => (
        <button
            type="button"
            onClick={onClick}
            title={tooltip}
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
            <Icon size={14} />
        </button>
    );

    return (
        <div className={`flex flex-col border border-white/10 rounded-2xl overflow-hidden bg-[#1e1e1e] focus-within:border-white/20 transition-colors ${className}`}>
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b border-white/10 bg-black/20 overflow-x-auto scrollbar-hide shrink-0 z-10">
                <ToolbarButton
                    icon={FiBold}
                    onClick={() => insertText("<b>", "</b>")}
                    tooltip="Bold (<b>)"
                />
                <ToolbarButton
                    icon={FiItalic}
                    onClick={() => insertText("<i>", "</i>")}
                    tooltip="Italic (<i>)"
                />
                <ToolbarButton
                    icon={FiUnderline}
                    onClick={() => insertText("<u>", "</u>")}
                    tooltip="Underline (<u>)"
                />
                <div className="w-px h-4 bg-white/10 mx-1" />
                <ToolbarButton
                    icon={FiAlignLeft}
                    onClick={() => insertText('<div style="text-align: left;">', "</div>")}
                    tooltip="Align Left"
                />
                <ToolbarButton
                    icon={FiAlignCenter}
                    onClick={() => insertText('<div style="text-align: center;">', "</div>")}
                    tooltip="Align Center"
                />
                <ToolbarButton
                    icon={FiAlignRight}
                    onClick={() => insertText('<div style="text-align: right;">', "</div>")}
                    tooltip="Align Right"
                />
                <div className="w-px h-4 bg-white/10 mx-1" />
                <ToolbarButton
                    icon={FiLink}
                    onClick={() => insertText('<a href="">', "</a>")}
                    tooltip="Link (<a>)"
                />
                <ToolbarButton
                    icon={FiImage}
                    onClick={() => insertText('<img src="" />')}
                    tooltip="Image (<img>)"
                />
                <ToolbarButton
                    icon={FiCode}
                    onClick={() => insertText("<code>", "</code>")}
                    tooltip="Code (<code>)"
                />
                <div className="w-px h-4 bg-white/10 mx-1" />
                <ToolbarButton
                    icon={FiMaximize2}
                    onClick={() => insertText('<style>\n  body::before { content: ""; position: fixed; inset: 0; background: url(\'\'); background-size: cover; opacity: 0.2; z-index: 0; pointer-events: none; }\n</style>')}
                    tooltip="Insert Global Background Template"
                />
            </div>

            {/* Editor Area */}
            <div className="flex-1 relative min-h-0">
                <Editor
                    height="100%"
                    defaultLanguage="html"
                    theme="vs-dark"
                    value={value}
                    onChange={(value) => onChange(value || "")}
                    onMount={handleEditorDidMount}
                    options={{
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        fontSize: 14,
                        fontFamily: "'Fira Code', 'Fira Mono', monospace",
                        wordWrap: "on",
                        wrappingIndent: "indent",
                        automaticLayout: true,
                        // autoClosingTags is handled by language defaults or extension
                        linkedEditing: true, // Auto rename tags
                        formatOnPaste: true,
                        formatOnType: true,
                        padding: { top: 16, bottom: 16 },
                        lineNumbers: "on",
                        renderLineHighlight: "none",
                        overviewRulerBorder: false,
                        hideCursorInOverviewRuler: true,
                    }}
                />
            </div>

            <div className="px-4 py-2 text-[10px] text-zinc-500 font-mono border-t border-white/5 flex justify-between shrink-0 bg-black/20">
                <span>VS Code Engine Active</span>
                <span>Auto-Close & Rename Enabled</span>
            </div>
        </div>
    );
};

export default DescriptionEditor;
