/**
 * FORGE — Card
 *
 * Default variant uses the signature double-rule "title block" frame
 * (.panel-rule from globals.css). Status variants use a left accent
 * border in the matching status color — no glow on hover.
 */
export default function Card({ children, variant = "default", className = "", padding = "md", as: Tag = "div", ...props }) {
  const variants = {
    default: "panel-rule bg-surface",
    elevated: "bg-elevated border border-border rounded-lg",
    flat: "bg-surface border border-border rounded-lg",
    accent: "bg-surface border border-border border-l-2 border-l-accent rounded-lg",
    info: "bg-surface border border-border border-l-2 border-l-info rounded-lg",
    success: "bg-surface border border-border border-l-2 border-l-success rounded-lg",
    warning: "bg-surface border border-border border-l-2 border-l-warning rounded-lg",
    danger: "bg-error-soft border border-error/20 rounded-lg",
    ghost: "bg-transparent border border-border rounded-lg",
  }

  const paddings = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  }

  const radius = variant === "default" ? "rounded-md" : ""

  return (
    <Tag className={`relative ${radius} transition-colors duration-normal ${variants[variant] ?? variants.default} ${paddings[padding] ?? paddings.md} ${className}`} {...props}>
      <div className="relative z-[1]">{children}</div>
    </Tag>
  )
}
