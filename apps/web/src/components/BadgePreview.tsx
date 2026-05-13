import promoSmallImage from "../../../extension/store-assets/promo-small-440x280.png";

import { siteLinks } from "../data/site";

export function BadgePreview() {
  return (
    <section className="badge-preview" aria-label="badge preview">
      <div className="preview-browser">
        <div className="browser-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <img src={promoSmallImage} alt="Programmers badge extension preview" />
      </div>
      <div className="badge-url-panel">
        <span className="panel-label">Public Badge URL</span>
        <code>{siteLinks.badgeExample}</code>
      </div>
    </section>
  );
}
