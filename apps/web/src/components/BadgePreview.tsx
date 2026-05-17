import servicePreviewImage from "../assets/landing/hero-extension-preview.png";

export function BadgePreview() {
  return (
    <section className="badge-preview" aria-label="extension badge preview">
      <div className="service-preview-shot">
        <img src={servicePreviewImage} alt="Programmers badge extension popup preview" />
      </div>
    </section>
  );
}
