// The cat. A fixed slot in the layout that the owner's own drawing fills.
//
// public/mascot.png is a stand-in: the reference drawing cropped and with its
// ruled-paper background made transparent (the untouched original is in
// design/mascot-original.png). Swapping in the final art is replacing that one
// file — keep the transparent background and roughly the same proportions, and
// nothing here needs to change.
//
// Decorative, so no alt text: it carries no information a screen reader needs.
export function Mascot({ size = "md", className = "" }) {
  return (
    <img
      className={`mascot mascot-${size} ${className}`.trim()}
      src="/mascot.png"
      alt=""
      width="668"
      height="349"
      draggable="false"
    />
  );
}
