import * as React from "react";

type OperatorButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
};

export default function OperatorButton({ className = "", variant = "primary", ...props }: OperatorButtonProps) {
  return <button {...props} className={`operator-btn ${variant === "ghost" ? "operator-btn-ghost" : ""} ${className}`.trim()} />;
}
