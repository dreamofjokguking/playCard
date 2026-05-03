import type { ReactNode } from 'react';

type SectionCardProps = {
  title: string;
  description?: string;
  children?: ReactNode;
};

export default function SectionCard({ title, description, children }: SectionCardProps) {
  return (
    <section className="card">
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {children}
    </section>
  );
}
