"use client";

type SearchBoxProps = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
};

export default function SearchBox({ value, onChange, placeholder = "Search..." }: SearchBoxProps) {
  return (
    <input
      className="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label="search"
    />
  );
}
