// Орнаменти малюємо SVG прямо в розмітці: вони лишаються чіткими
// на будь-якому екрані й не тягнуть жодних зовнішніх файлів.

export const CORNER = `
<svg class="orn corner" viewBox="0 0 60 60" aria-hidden="true">
  <path d="M6 30 Q6 6 30 6" />
  <path d="M11 30 Q11 11 30 11" />
  <path d="M11 30 q10 -1 14 -8 M30 11 q-1 10 -8 14" />
  <path d="M16 34 q6 -2 8 -8 M34 16 q-2 6 -8 8" />
  <circle cx="13" cy="13" r="1.6" />
</svg>`;

export const ROSE = `
<svg class="orn rose" viewBox="0 0 120 26" aria-hidden="true">
  <path d="M4 13 H44" />
  <path d="M116 13 H76" />
  <path d="M44 13 l6 -3 v6 z" />
  <path d="M76 13 l-6 -3 v6 z" />
  <path d="M60 2 L64 13 L60 24 L56 13 Z" />
  <path d="M49 13 L60 9 L71 13 L60 17 Z" />
  <path d="M52 5 L60 13 L52 21" opacity=".5" />
  <path d="M68 5 L60 13 L68 21" opacity=".5" />
  <circle cx="60" cy="13" r="2" />
</svg>`;

export const FOLIO = `
<svg class="orn folio-wing left" viewBox="0 0 60 12" aria-hidden="true">
  <path d="M2 6 H40" /><path d="M44 6 l-5 -3 v6 z" /><path d="M50 6 l-4 -2.5 v5 z" />
</svg>`;

export const FOLIO_RIGHT = `
<svg class="orn folio-wing right" viewBox="0 0 60 12" aria-hidden="true">
  <path d="M58 6 H20" /><path d="M16 6 l5 -3 v6 z" /><path d="M10 6 l4 -2.5 v5 z" />
</svg>`;

export const BRASS = `
<svg class="brass" viewBox="0 0 48 48" aria-hidden="true">
  <path d="M0 0 H30 Q34 0 34 4 V8 Q34 12 30 12 H12 Q8 12 8 16 V30 Q8 34 4 34 H0 Z" />
  <circle cx="18" cy="6" r="1.5" class="stud" />
  <circle cx="6" cy="18" r="1.5" class="stud" />
</svg>`;

// Проста рамка сторінки — подвійна лінія з розривом під орнаменти
export function pageFrame() {
  return `
    <div class="frame"></div>
    ${CORNER.replace('class="orn corner"', 'class="orn corner tl"')}
    ${CORNER.replace('class="orn corner"', 'class="orn corner tr"')}
    ${CORNER.replace('class="orn corner"', 'class="orn corner bl"')}
    ${CORNER.replace('class="orn corner"', 'class="orn corner br"')}
  `;
}

// Латунний кут палітурки
export const BRASS_CORNER = `
<svg class="brass" viewBox="0 0 64 64" aria-hidden="true">
  <defs>
    <linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#e6c887"/>
      <stop offset=".45" stop-color="#b48c46"/>
      <stop offset=".7" stop-color="#8a6630"/>
      <stop offset="1" stop-color="#d9bb7c"/>
    </linearGradient>
  </defs>
  <path d="M0 0 H40 Q46 0 46 6 Q46 12 40 12 H20 Q12 12 12 20 V40 Q12 46 6 46 Q0 46 0 40 Z" fill="url(#bg1)"/>
  <path d="M0 0 H40 Q46 0 46 6 Q46 12 40 12 H20 Q12 12 12 20 V40 Q12 46 6 46 Q0 46 0 40 Z"
        fill="none" stroke="rgba(60,40,12,.55)" stroke-width="1"/>
  <circle cx="26" cy="6" r="2" fill="#f0dca8" stroke="rgba(60,40,12,.5)" stroke-width=".7"/>
  <circle cx="6" cy="26" r="2" fill="#f0dca8" stroke="rgba(60,40,12,.5)" stroke-width=".7"/>
</svg>`;

// Застібка: ремінь із латунною бляхою
export const CLASP = `
<div class="clasp">
  <span class="strap"></span>
  <svg class="plate" viewBox="0 0 40 40" aria-hidden="true">
    <defs>
      <linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#eed7a0"/>
        <stop offset=".5" stop-color="#b48c46"/>
        <stop offset="1" stop-color="#7d5b2a"/>
      </linearGradient>
    </defs>
    <rect x="2" y="6" width="36" height="28" rx="6" fill="url(#bg2)" stroke="rgba(50,32,10,.6)"/>
    <circle cx="20" cy="20" r="8" fill="none" stroke="rgba(60,40,12,.55)" stroke-width="1.1"/>
    <path d="M20 12 L22 20 L20 28 L18 20 Z" fill="rgba(70,46,14,.55)"/>
    <path d="M12 20 L20 18 L28 20 L20 22 Z" fill="rgba(70,46,14,.55)"/>
    <circle cx="7" cy="11" r="1.4" fill="#f2e0b0"/>
    <circle cx="33" cy="11" r="1.4" fill="#f2e0b0"/>
    <circle cx="7" cy="29" r="1.4" fill="#f2e0b0"/>
    <circle cx="33" cy="29" r="1.4" fill="#f2e0b0"/>
  </svg>
</div>`;
