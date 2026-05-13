interface PageIntroProps {
  title: string;
  description: string;
  kicker?: string;
}

export function PageIntro({ title, description, kicker }: PageIntroProps) {
  return (
    <section className="page-intro">
      {kicker ? <span className="section-kicker">{kicker}</span> : null}
      <h1>{title}</h1>
      <p>{description}</p>
    </section>
  );
}
