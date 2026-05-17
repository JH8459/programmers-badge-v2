import { siteLinks } from "../data/site";

export function BadgePreview() {
  return (
    <section className="badge-preview" aria-label="extension badge preview">
      <div className="extension-shot" aria-label="extension popup screenshot">
        <div className="extension-window-bar" aria-hidden="true">
          <span />
          <span />
          <span />
          <strong>PROGRAMMERS-BADGE</strong>
        </div>
        <div className="extension-popup-body">
          <div className="extension-status-row">
            <span>완료</span>
            <small>방금 동기화됨</small>
          </div>
          <div className="extension-profile-card">
            <span className="extension-profile-name">Programmers User</span>
            <strong>Skill 3 · 128 solved</strong>
            <div className="extension-badge-surface">
              <span>Programmers</span>
              <strong>Intermediate</strong>
              <small>Rank 42</small>
            </div>
          </div>
          <div className="extension-segment-control" aria-hidden="true">
            <span className="is-selected">standard</span>
            <span>mini</span>
          </div>
          <div className="extension-copy-list">
            <div>
              <span>Badge URL</span>
              <code>{siteLinks.badgeExample}</code>
            </div>
            <div>
              <span>Markdown</span>
              <code>![Programmers Badge](...)</code>
            </div>
          </div>
          <button className="extension-sync-button" type="button">
            다시 동기화
          </button>
        </div>
      </div>
      <p className="preview-caption">
        확장 프로그램 popup에서 동기화 상태, standard/mini 배지 미리보기, URL과 Markdown 복사
        항목을 한 화면에서 확인합니다.
      </p>
    </section>
  );
}
