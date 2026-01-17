"use client";

import { useQuery } from "@tanstack/react-query";
import Select from "react-select";
import React, { useEffect, useState } from "react";
import { CharacterTag } from "@/app/generated/prisma";

type TagOption = { label: string; value: string };

const CharacterTags = ({
  selectedOptions,
  setSelectedOptions,
}: {
  selectedOptions: { label: string; value: string }[];
  setSelectedOptions: React.Dispatch<
    React.SetStateAction<{ label: string; value: string }[]>
  >;
}) => {
  const { isPending, data, error } = useQuery<CharacterTag[]>({
    queryKey: ["tags"],
    queryFn: () =>
      fetch("/api/tags").then((res) => res.json().then((data) => data.data)),
  });

  if (error) return <p>{error.message}</p>;

  return (
    <Select
      placeholder="Select relevant tags..."
      name="tags"
      isMulti
      options={data?.map((tag) => ({ label: tag.name, value: tag.id })) || []}
      value={selectedOptions}
      onChange={(options) => setSelectedOptions([...(options as TagOption[])])}
      classNamePrefix={"select"}
      menuPortalTarget={typeof document !== "undefined" ? document.body : null}
      menuPosition="fixed"
      styles={{
        control: (styles, { isFocused }) => ({
          ...styles,
          backgroundColor: "var(--bg-input)",
          border: isFocused ? "1px solid var(--border-hover)" : "1px solid var(--border-input)",
          borderRadius: "16px",
          padding: "8px",
          boxShadow: isFocused ? "0 0 0 4px var(--bg-surface-hover)" : "none",
          transition: "all 0.3s ease",
          "&:hover": {
            borderColor: "var(--border-hover)",
          }
        }),
        valueContainer: (styles) => ({
          ...styles,
          padding: "4px 12px",
        }),
        input: (styles) => ({
          ...styles,
          color: "var(--text-primary)",
        }),
        placeholder: (styles) => ({
          ...styles,
          color: "var(--text-muted)",
          fontSize: "13px",
          fontWeight: "600",
        }),
        multiValue: (styles) => ({
          ...styles,
          backgroundColor: "var(--bg-surface-hover)",
          borderRadius: "10px",
          padding: "2px 8px",
          border: "1px solid var(--border-default)",
        }),
        multiValueLabel: (styles) => ({
          ...styles,
          color: "var(--text-primary)",
          fontSize: "11px",
          fontWeight: "800",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }),
        multiValueRemove: (styles) => ({
          ...styles,
          color: "var(--text-muted)",
          ":hover": {
            backgroundColor: "var(--text-primary)",
            color: "var(--bg-page)",
            borderRadius: "8px",
          },
        }),
        menu: (styles) => ({
          ...styles,
          backgroundColor: "var(--bg-surface)",
          backdropFilter: "blur(40px)",
          border: "1px solid var(--border-default)",
          borderRadius: "20px",
          overflow: "hidden",
          marginTop: "12px",
          boxShadow: "var(--shadow-lg)",
          zIndex: 9999,
        }),
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
        option: (styles, { isFocused, isSelected }) => ({
          ...styles,
          backgroundColor: isSelected ? "var(--text-primary)" : isFocused ? "var(--bg-surface-hover)" : "transparent",
          color: isSelected ? "var(--bg-page)" : "var(--text-primary)",
          fontSize: "13px",
          fontWeight: isSelected ? "800" : "600",
          cursor: "pointer",
          padding: "14px 20px",
          transition: "all 0.2s ease",
          active: {
            backgroundColor: "var(--bg-surface-hover)", // Fallback if needed
          }
        }),
      }}
    />
  );
};

export default CharacterTags;
