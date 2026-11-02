import Image from "next/image";
import Link from "next/link";

export default function VirtusInteriorHeader({
  title,
  description,
  eyebrow = "Your personal development space",
  children,
  backHref = "",
  backLabel = "Back",
}) {
  return (
    <header className="virtus-interior-hero">
      <div className="virtus-interior-hero-decoration" aria-hidden="true" />
      <div className="virtus-interior-hero-main">
        <Link href="/" className="virtus-interior-brand" aria-label="Virtus AI — Home">
          <Image
            src="/virtus-aurum-emblem.svg"
            alt=""
            width={74}
            height={84}
            className="virtus-interior-brand-emblem"
          />
          <span className="virtus-interior-brand-copy">
            <span className="virtus-interior-brand-name">Virtus <span>AI</span></span>
            <span className="virtus-interior-brand-caption">By Enhanced Wellness Solutions</span>
          </span>
        </Link>
        <div className="virtus-interior-hero-heading">
          <p className="virtus-interior-eyebrow">{eyebrow}</p>
          <h1 className="virtus-interior-title">{title}</h1>
          {description ? <p className="virtus-interior-lead">{description}</p> : null}
        </div>
      </div>
      {children ? <div className="virtus-interior-hero-extra">{children}</div> : null}
      {backHref ? (
        <Link href={backHref} className="virtus-interior-hero-back">
          <span aria-hidden="true">←</span> {backLabel}
        </Link>
      ) : null}
    </header>
  );
}
