"use client";

import { useQuery } from "@tanstack/react-query";
import Select from "react-select";
import React from "react";

type LorebookOption = { label: string; value: string };

const LorebookSelector = ({
    selectedLorebooks,
    setSelectedLorebooks,
}: {
    selectedLorebooks: { label: string; value: string }[];
    setSelectedLorebooks: React.Dispatch<
        React.SetStateAction<{ label: string; value: string }[]>
    >;
}) => {
    const { data, error } = useQuery<any[]>({
        queryKey: ["lorebooks"],
        queryFn: () => fetch("/api/lorebooks?filter=library").then(res => res.json().then(d => d.data)),
    });

    if (error) return <p className="text-red-400 text-xs">{error.message}</p>;

    return (
        <Select
            placeholder="Search and link lorebooks..."
            name="lorebooks"
            isMulti
            options={data?.map((lb) => ({
                label: `${lb.name} (${lb._count?.entries || 0} entries)`,
                value: lb.id
            })) || []}
            value={selectedLorebooks}
            onChange={(options) => setSelectedLorebooks([...(options as LorebookOption[])])}
            classNamePrefix={"select"}
            menuPortalTarget={typeof document !== "undefined" ? document.body : null}
            menuPosition="fixed"
            styles={{
                control: (styles, { isFocused }) => ({
                    ...styles,
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: isFocused ? "1px solid rgba(56, 189, 248, 0.5)" : "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "16px",
                    padding: "8px",
                    boxShadow: isFocused ? "0 0 0 4px rgba(56, 189, 248, 0.1)" : "none",
                    transition: "all 0.3s ease",
                    "&:hover": {
                        borderColor: "rgba(255, 255, 255, 0.2)",
                    },
                    minHeight: "48px",
                }),
                valueContainer: (styles) => ({
                    ...styles,
                    padding: "4px 12px",
                }),
                input: (styles) => ({
                    ...styles,
                    color: "white",
                }),
                placeholder: (styles) => ({
                    ...styles,
                    color: "rgba(255, 255, 255, 0.2)",
                    fontSize: "13px",
                    fontWeight: "600",
                }),
                multiValue: (styles) => ({
                    ...styles,
                    backgroundColor: "rgba(56, 189, 248, 0.1)",
                    borderRadius: "10px",
                    padding: "2px 8px",
                    border: "1px solid rgba(56, 189, 248, 0.3)",
                }),
                multiValueLabel: (styles) => ({
                    ...styles,
                    color: "#38bdf8",
                    fontSize: "11px",
                    fontWeight: "800",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                }),
                multiValueRemove: (styles) => ({
                    ...styles,
                    color: "#38bdf8",
                    ":hover": {
                        backgroundColor: "rgba(56, 189, 248, 0.2)",
                        color: "white",
                        borderRadius: "8px",
                    },
                }),
                menu: (styles) => ({
                    ...styles,
                    backgroundColor: "#0f172a",
                    backdropFilter: "blur(40px)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "20px",
                    overflow: "hidden",
                    marginTop: "12px",
                    boxShadow: "0 25px 80px rgba(0,0,0,0.8)",
                    zIndex: 9999,
                }),
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                option: (styles, { isFocused, isSelected }) => ({
                    ...styles,
                    backgroundColor: isSelected ? "#38bdf8" : isFocused ? "rgba(255, 255, 255, 0.08)" : "transparent",
                    color: isSelected ? "#0f172a" : "white",
                    fontSize: "13px",
                    fontWeight: isSelected ? "800" : "600",
                    cursor: "pointer",
                    padding: "14px 20px",
                    transition: "all 0.2s ease",
                    active: {
                        backgroundColor: "rgba(56, 189, 248, 0.2)",
                    },
                }),
            }}
        />
    );
};

export default LorebookSelector;
