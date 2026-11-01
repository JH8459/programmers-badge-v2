import miniBadgeImage from "../assets/landing/badge-mini-sample.svg";
import standardBadgeImage from "../assets/landing/badge-standard-sample.svg";

export function BadgePreview() {
  return (
    <section className="badge-preview" aria-label="표준·미니 배지 예시">
      <p>표준(Standard)</p>
      <img src={standardBadgeImage} alt="예시 데이터로 생성한 표준 배지" />
      <p>미니(Mini)</p>
      <img src={miniBadgeImage} width="110" height="20" alt="예시 데이터로 생성한 미니 배지" />
      <small>예시 데이터로 생성한 배지입니다.</small>
    </section>
  );
}
