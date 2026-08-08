// Small layout/interaction primitives every page composes from. Keeping
// them together in one file avoids a scatter of five-line modules.
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { listItemVariants, listVariants, snappy } from "../lib/motionVariants.js";

export function PageHeader({ eyebrow, title, subhead }) {
  return (
    <header className="page-header">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      {subhead && <p className="subhead">{subhead}</p>}
    </header>
  );
}

export function Card({ className = "", children, ...rest }) {
  return (
    <div className={`card ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}

const press = { whileHover: { scale: 1.03, y: -1 }, whileTap: { scale: 0.95 }, transition: snappy };

// `to` renders a router Link, otherwise a real <button> — so the same look
// works for navigation and for form submits without faking either one.
export function Button({ to, variant, size, block, className = "", children, ...rest }) {
  const classes = [
    "button",
    variant === "secondary" && "secondary",
    size === "large" && "large",
    size === "small" && "small",
    block && "block",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (to) {
    return (
      <motion.div {...press} style={{ display: "inline-block" }}>
        <Link to={to} className={classes} {...rest}>
          {children}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button className={classes} {...press} {...rest}>
      {children}
    </motion.button>
  );
}

// Staggered list — children rise into place one after another.
export function AnimatedList({ className = "data-list", children }) {
  return (
    <motion.ul className={className} variants={listVariants} initial="hidden" animate="show">
      {children}
    </motion.ul>
  );
}

export function AnimatedListItem({ children, ...rest }) {
  return (
    <motion.li variants={listItemVariants} {...rest}>
      {children}
    </motion.li>
  );
}

// Onboarding collects these; showing them here is what keeps that form
// from being a write-only dead end.
export function StatRow({ user }) {
  const stats = [
    { label: "Weight", value: user.bodyweight ? `${user.bodyweight} kg` : "—" },
    { label: "Height", value: user.height ? `${user.height} cm` : "—" },
    { label: "Age", value: user.age ?? "—" },
  ];

  return (
    <div className="stat-row">
      {stats.map((stat) => (
        <div className="stat" key={stat.label}>
          <span className="stat-value">{stat.value}</span>
          <span className="stat-label">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
