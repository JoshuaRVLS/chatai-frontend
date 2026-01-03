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
      styles={{
        control: (styles, { isFocused }) => ({
          ...styles,
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          border: isFocused ? "1px solid rgba(56, 189, 248, 0.5)" : "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "12px",
          padding: "4px",
          boxShadow: isFocused ? "0 0 0 1px rgba(56, 189, 248, 0.2)" : "none",
          transition: "all 0.3s ease",
          "&:hover": {
            borderColor: "rgba(255, 255, 255, 0.2)",
          }
        }),
        valueContainer: (styles) => ({
          ...styles,
          padding: "8px 12px",
        }),
        input: (styles) => ({
          ...styles,
          color: "white",
        }),
        placeholder: (styles) => ({
          ...styles,
          color: "rgba(255, 255, 255, 0.2)",
          fontSize: "13px",
          fontWeight: "500",
        }),
        multiValue: (styles) => ({
          ...styles,
          backgroundColor: "rgba(56, 189, 248, 0.1)",
          borderRadius: "8px",
          padding: "2px 6px",
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
            borderRadius: "6px",
          },
        }),
        menu: (styles) => ({
          ...styles,
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "16px",
          overflow: "hidden",
          marginTop: "8px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
        }),
        option: (styles, { isFocused, isSelected }) => ({
          ...styles,
          backgroundColor: isSelected ? "#38bdf8" : isFocused ? "rgba(255, 255, 255, 0.05)" : "transparent",
          color: isSelected ? "#0f172a" : "white",
          fontSize: "13px",
          fontWeight: isSelected ? "800" : "500",
          cursor: "pointer",
          padding: "12px 16px",
          active: {
            backgroundColor: "rgba(56, 189, 148, 0.2)",
          }
        }),
      }}
    />
  );
};

export default CharacterTags;
