/** Цветные значки интерфейса урока. Поле 24×24, «губа» снизу — как у кнопок. */
const UI_ICONS = {
  calendar: (
    <>
      <rect x={3} y={4.5} width={18} height={17} rx={3.5} fill="#fff" stroke="#ff9600" strokeWidth={1.8} />
      <path d="M3 8 Q3 4.5 6.5 4.5 H17.5 Q21 4.5 21 8 V9.5 H3 Z" fill="#ff9600" />
      <path d="M8 2.5 V6.5 M16 2.5 V6.5" stroke="#cc7800" strokeWidth={2} strokeLinecap="round" />
      <path d="M8 15 L11 18 L16.5 12.5" stroke="#58cc02" strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  heart: (
    <>
      <path d="M12 21.5 C5 16.5 2 13 2 8.8 C2 5.8 4.3 3.5 7.1 3.5 C9.1 3.5 10.9 4.6 12 6.3 C13.1 4.6 14.9 3.5 16.9 3.5 C19.7 3.5 22 5.8 22 8.8 C22 13 19 16.5 12 21.5 Z" fill="#ff4b4b" />
      <path d="M6 7.5 Q7 6 8.6 6.2" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" fill="none" opacity={0.7} />
    </>
  ),
  bulb: (
    <>
      <path d="M12 2.5 C7.9 2.5 5 5.4 5 9.2 C5 11.7 6.3 13.4 7.6 14.6 C8.4 15.3 8.8 16.1 8.8 17 H15.2 C15.2 16.1 15.6 15.3 16.4 14.6 C17.7 13.4 19 11.7 19 9.2 C19 5.4 16.1 2.5 12 2.5 Z" fill="#ffc800" />
      <rect x={8.8} y={17.6} width={6.4} height={2.2} rx={1} fill="#a0a8b5" />
      <rect x={9.8} y={20.3} width={4.4} height={1.8} rx={0.9} fill="#a0a8b5" />
      <path d="M9 8.6 Q9.6 6.4 11.8 5.8" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" fill="none" opacity={0.8} />
    </>
  ),
  ticket: (
    <>
      <path d="M3 6 H21 V9.5 A2.5 2.5 0 0 0 21 14.5 V18 H3 V14.5 A2.5 2.5 0 0 0 3 9.5 Z" fill="#1cb0f6" />
      <path d="M15 7.5 V16.5" stroke="#fff" strokeWidth={1.6} strokeDasharray="1.8 1.6" />
      <path d="M6.5 10.5 H12 M6.5 13.5 H10.5" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" />
    </>
  ),
  repeat: (
    <>
      <path d="M4 11 V10 Q4 6.5 7.5 6.5 H18 M15 3.5 L18 6.5 L15 9.5" stroke="#ff9600" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M20 13 V14 Q20 17.5 16.5 17.5 H6 M9 20.5 L6 17.5 L9 14.5" stroke="#ff9600" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  gem: (
    <>
      <path d="M6.5 4 H17.5 L22 9.5 L12 21 L2 9.5 Z" fill="#1cb0f6" />
      <path d="M2 9.5 H22 M8.5 9.5 L12 21 L15.5 9.5 M6.5 4 L8.5 9.5 L12 4 L15.5 9.5 L17.5 4" stroke="#84d8ff" strokeWidth={1.2} strokeLinejoin="round" fill="none" />
    </>
  ),
  target: (
    <>
      <circle cx={12} cy={12} r={9.5} fill="#ff4b4b" />
      <circle cx={12} cy={12} r={6.5} fill="#fff" />
      <circle cx={12} cy={12} r={3.5} fill="#ff4b4b" />
      <path d="M12 12 L20.5 3.5 M17.5 3.5 H20.5 V6.5" stroke="#3c3c3c" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  clock: (
    <>
      <circle cx={12} cy={13} r={9} fill="#ce82ff" />
      <circle cx={12} cy={13} r={6.6} fill="#fff" />
      <path d="M12 9 V13 L14.6 14.6" stroke="#a568cc" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x={10} y={1.6} width={4} height={2.4} rx={1} fill="#a568cc" />
    </>
  ),
  book: (
    <>
      <path d="M12 6 Q8 3.5 3 4.5 V19 Q8 18 12 20.5 Z" fill="#1cb0f6" />
      <path d="M12 6 Q16 3.5 21 4.5 V19 Q16 18 12 20.5 Z" fill="#84d8ff" />
    </>
  ),
  fire: (
    <>
      <path d="M12 22 C7 22 4.5 18.6 4.5 15 C4.5 10.5 8.5 8.5 8.8 3.5 C11.8 5.5 13 8 12.8 10.5 C14 9.6 14.8 8.3 15 6.8 C18 9 19.5 12 19.5 15 C19.5 18.8 16.8 22 12 22 Z" fill="#ff9600" />
      <path d="M12 22 C9.6 22 8.3 20.4 8.3 18.4 C8.3 16 10.4 14.8 11 12.6 C13.6 14 15.7 15.9 15.7 18.4 C15.7 20.4 14.3 22 12 22 Z" fill="#ffc800" />
    </>
  ),
  star: (
    <path d="M12 2.8 L14.8 8.6 L21.1 9.4 L16.5 13.8 L17.7 20.1 L12 17 L6.3 20.1 L7.5 13.8 L2.9 9.4 L9.2 8.6 Z" fill="#ffc800" stroke="#ffc800" strokeWidth={1.6} strokeLinejoin="round" />
  ),
  check: (
    <>
      <circle cx={12} cy={12} r={10} fill="#58cc02" />
      <path d="M7 12.4 L10.4 15.6 L17 8.8" stroke="#fff" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  cross: (
    <>
      <circle cx={12} cy={12} r={10} fill="#ff4b4b" />
      <path d="M8.2 8.2 L15.8 15.8 M15.8 8.2 L8.2 15.8" stroke="#fff" strokeWidth={2.8} strokeLinecap="round" />
    </>
  ),
  trophy: (
    <>
      <path d="M6.5 3.5 H17.5 V9 Q17.5 15 12 15 Q6.5 15 6.5 9 Z" fill="#ffc800" />
      <path d="M6.5 5.5 H3.5 Q3.5 10.5 7.8 11 M17.5 5.5 H20.5 Q20.5 10.5 16.2 11" stroke="#e0a800" strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <rect x={10.5} y={15} width={3} height={3.5} fill="#e0a800" />
      <rect x={7} y={18.5} width={10} height={3} rx={1} fill="#e0a800" />
      <path d="M9.5 6 Q9.5 10 11.5 12" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" fill="none" opacity={0.7} />
    </>
  ),
  lock: (
    <>
      <path d="M7.5 11 V8 A4.5 4.5 0 0 1 16.5 8 V11" stroke="#afafaf" strokeWidth={2.6} fill="none" />
      <rect x={4.5} y={10.5} width={15} height={11} rx={3} fill="#afafaf" />
      <circle cx={12} cy={15.2} r={1.8} fill="#fff" />
      <rect x={11.2} y={15.5} width={1.6} height={3} rx={0.8} fill="#fff" />
    </>
  ),
  gear: (
    <>
      <path
        d="M10.3 2.5 H13.7 L14.3 5.2 L16.4 6.4 L19 5.5 L20.7 8.4 L18.6 10.3 V12.7 L20.7 14.6 L19 17.5 L16.4 16.6 L14.3 17.8 L13.7 20.5 H10.3 L9.7 17.8 L7.6 16.6 L5 17.5 L3.3 14.6 L5.4 12.7 V10.3 L3.3 8.4 L5 5.5 L7.6 6.4 L9.7 5.2 Z"
        fill="#afafaf"
        stroke="#afafaf"
        strokeWidth={1.2}
        strokeLinejoin="round"
        transform="translate(0 0.5)"
      />
      <circle cx={12} cy={12} r={3.6} fill="#fff" />
    </>
  ),
  pencil: (
    <>
      <path d="M4 20 L5 15.5 L15.5 5 L19 8.5 L8.5 19 Z" fill="#ffc800" />
      <path d="M15.5 5 L17 3.5 Q18 2.5 19 3.5 L20.5 5 Q21.5 6 20.5 7 L19 8.5 Z" fill="#ff4b4b" />
      <path d="M4 20 L5 15.5 L8.5 19 Z" fill="#3c3c3c" />
    </>
  ),
  bell: (
    <>
      <path d="M12 3 C8 3 6 6 6 9.5 V14 L4 17 H20 L18 14 V9.5 C18 6 16 3 12 3 Z" fill="#ffc800" />
      <circle cx={12} cy={19.5} r={2.2} fill="#e0a800" />
      <path d="M8.6 8.4 Q9.2 6.2 11.2 5.7" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" fill="none" opacity={0.75} />
    </>
  ),
  speaker: (
    <>
      <path d="M3 9 H7 L12 4.5 V19.5 L7 15 H3 Z" fill="#1cb0f6" strokeLinejoin="round" />
      <path d="M15 8.5 Q17 12 15 15.5 M17.8 6 Q21.3 12 17.8 18" stroke="#1cb0f6" strokeWidth={2} strokeLinecap="round" fill="none" />
    </>
  ),
  gift: (
    <>
      <rect x={3.5} y={9} width={17} height={4.5} rx={1} fill="#ff4b4b" />
      <rect x={5} y={13.5} width={14} height={8} rx={1} fill="#ff4b4b" />
      <rect x={10.5} y={9} width={3} height={12.5} fill="#ffc800" />
      <path d="M12 9 C9 9 6.5 7.5 7.5 5.5 C8.5 3.5 11 5.5 12 9 C13 5.5 15.5 3.5 16.5 5.5 C17.5 7.5 15 9 12 9 Z" fill="#ffc800" />
    </>
  ),
  pin: (
    <>
      <path d="M12 22 C12 22 5 14.5 5 9.5 A7 7 0 0 1 19 9.5 C19 14.5 12 22 12 22 Z" fill="#ff4b4b" />
      <circle cx={12} cy={9.5} r={2.8} fill="#fff" />
    </>
  ),
  compass: (
    <>
      <circle cx={12} cy={12} r={10} fill="#58cc02" />
      <circle cx={12} cy={12} r={7.8} fill="#fff" />
      <path d="M12 5.5 L14.2 12 H9.8 Z" fill="#ff4b4b" />
      <path d="M12 18.5 L9.8 12 H14.2 Z" fill="#afafaf" />
    </>
  ),
  run: (
    <g stroke="#ff9600" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <circle cx={14.5} cy={4} r={2.4} fill="#ff9600" stroke="none" />
      <path d="M13 8 L10.5 14" strokeWidth={3.4} />
      <path d="M12.5 8.5 L16.5 11 L19 9 M12.5 8.5 L8.5 9.5 L6.5 12.5" strokeWidth={2} />
      <path d="M10.5 14 L14 17 L13 21.5 M10.5 14 L8 18 L4 18.5" strokeWidth={2.4} />
    </g>
  ),
  brain: (
    <>
      <path d="M12 4.5 C10.5 2.8 7.5 3 6.5 5.2 C4 5.2 2.8 7.8 3.8 9.8 C2.4 11.4 2.8 14.2 4.8 15 C4.6 17.6 7 19.5 9.3 18.6 C10 20.2 11.2 20.7 12 20 Z" fill="#ff86d0" />
      <path d="M12 4.5 C13.5 2.8 16.5 3 17.5 5.2 C20 5.2 21.2 7.8 20.2 9.8 C21.6 11.4 21.2 14.2 19.2 15 C19.4 17.6 17 19.5 14.7 18.6 C14 20.2 12.8 20.7 12 20 Z" fill="#ffaee0" />
      <path d="M12 4.5 V20 M7 9.5 Q9 9.5 9.5 12 M17 9.5 Q15 9.5 14.5 12 M7.5 15 Q9 14 10 15.5" stroke="#d65aa5" strokeWidth={1.4} strokeLinecap="round" fill="none" />
    </>
  ),
  medal: (
    <>
      <path d="M7 2.5 H11 L13 9 H9 Z" fill="#1cb0f6" />
      <path d="M17 2.5 H13 L11 9 H15 Z" fill="#ff4b4b" />
      <circle cx={12} cy={15} r={6.5} fill="#ffc800" />
      <circle cx={12} cy={15} r={4.2} fill="none" stroke="#e0a800" strokeWidth={1.4} />
    </>
  ),
  city: (
    <>
      <rect x={3} y={9} width={7} height={13} fill="#ce82ff" />
      <rect x={10} y={3} width={8} height={19} fill="#a568cc" />
      <rect x={18} y={12} width={3.5} height={10} fill="#ce82ff" />
      {[5, 8.5, 12, 15.5].map((y) => (
        <g key={y} fill="#fff">
          <rect x={12} y={y} width={1.6} height={1.8} />
          <rect x={14.8} y={y} width={1.6} height={1.8} />
        </g>
      ))}
      <rect x={5} y={12} width={1.6} height={1.8} fill="#fff" />
      <rect x={5} y={15.5} width={1.6} height={1.8} fill="#fff" />
    </>
  ),
  car: (
    <>
      <path d="M5 11 L7 6 Q7.6 4.8 9 4.8 H15 Q16.4 4.8 17 6 L19 11 Z" fill="#1cb0f6" />
      <path d="M7.4 10.5 L8.7 7 H15.3 L16.6 10.5 Z" fill="#ddf4ff" />
      <rect x={3} y={10.5} width={18} height={7} rx={2.5} fill="#1cb0f6" />
      <circle cx={7} cy={18} r={2.4} fill="#3c3c3c" />
      <circle cx={17} cy={18} r={2.4} fill="#3c3c3c" />
      <rect x={4.5} y={12.5} width={3} height={1.8} rx={0.8} fill="#ffc800" />
      <rect x={16.5} y={12.5} width={3} height={1.8} rx={0.8} fill="#ffc800" />
    </>
  ),
  bolt: <path d="M13.5 2.5 L5 13.5 H11 L10 21.5 L19 10 H13 Z" fill="#ffc800" stroke="#ffc800" strokeWidth={1.2} strokeLinejoin="round" />,
  flag: (
    <>
      <rect x={4} y={2.5} width={2.2} height={19} rx={1} fill="#777" />
      <path d="M6 3.5 H19 L16.5 8 L19 12.5 H6 Z" fill="#fff" stroke="#3c3c3c" strokeWidth={1.2} strokeLinejoin="round" />
      <path d="M6 3.5 H9.5 V8 H6 Z M9.5 8 H13 V12.5 H9.5 Z M13 3.5 H16 L16.5 8 H13 Z" fill="#3c3c3c" />
    </>
  ),
  lights: (
    <>
      <rect x={7} y={2} width={10} height={20} rx={3} fill="#3c3c3c" />
      <circle cx={12} cy={6.5} r={2.3} fill="#ff4b4b" />
      <circle cx={12} cy={12} r={2.3} fill="#ffc800" />
      <circle cx={12} cy={17.5} r={2.3} fill="#58cc02" />
    </>
  ),
  warn: (
    <>
      <path d="M12 3 L21.5 20 H2.5 Z" fill="#ffc800" stroke="#ffc800" strokeWidth={2} strokeLinejoin="round" />
      <rect x={10.8} y={8.5} width={2.4} height={6.5} rx={1.2} fill="#3c3c3c" />
      <circle cx={12} cy={17.3} r={1.4} fill="#3c3c3c" />
    </>
  ),
  sheet: (
    <>
      <path d="M5 2.5 H15 L19.5 7 V21.5 H5 Z" fill="#fff" stroke="#00a47d" strokeWidth={1.8} strokeLinejoin="round" />
      <path d="M15 2.5 V7 H19.5" fill="#c9f2e3" stroke="#00a47d" strokeWidth={1.4} strokeLinejoin="round" />
      <path d="M8 11 H16 M8 14.5 H16 M8 18 H12.5" stroke="#00a47d" strokeWidth={1.6} strokeLinecap="round" />
    </>
  ),
  kids: (
    <g fill="#1cb0f6">
      <circle cx={8} cy={5} r={2.4} />
      <circle cx={16.5} cy={7.5} r={2} />
      <path d="M5.5 9 H10.5 L11.5 15 H9.6 L9.2 21 H6.8 L6.4 15 H4.5 Z" />
      <path d="M14.5 11 H18.5 L19.2 16 H17.8 L17.5 21 H15.5 L15.2 16 H13.8 Z" />
    </g>
  ),
  puzzle: (
    <path d="M4 7 H8.5 A2.5 2.5 0 1 1 13.5 7 H18 V11 A2.5 2.5 0 1 1 18 16 V20 H13.5 A2.5 2.5 0 1 0 8.5 20 H4 Z" fill="#ce82ff" />
  ),
  road: (
    <>
      <path d="M8.5 2.5 H15.5 L21 21.5 H3 Z" fill="#777" />
      <path d="M12 4 V7 M12 10 V13.5 M12 16.5 V20.5" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" />
    </>
  ),
  chevron: <path d="M9 5 L16 12 L9 19" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />,
  fox: (
    <>
      <path d="M4 3 L9 9 H15 L20 3 L19.5 12 Q19 19 12 21 Q5 19 4.5 12 Z" fill="#ff9600" />
      <path d="M7 13 Q9 14.5 12 21 Q15 14.5 17 13 Q14 16 12 16 Q10 16 7 13 Z" fill="#fff" />
      <circle cx={9} cy={11.5} r={1.2} fill="#3c3c3c" />
      <circle cx={15} cy={11.5} r={1.2} fill="#3c3c3c" />
      <circle cx={12} cy={17.5} r={1.3} fill="#3c3c3c" />
    </>
  ),
  lanes: (
    <>
      <rect x={2.5} y={2.5} width={19} height={19} rx={5} fill="#6f7682" />
      <path d="M12 4.5 V7.5 M12 10.5 V13.5 M12 16.5 V19.5" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" />
      <path d="M17 19 V11.5 Q17 9 14.8 9" stroke="#ffc800" strokeWidth={2.2} strokeLinecap="round" fill="none" />
      <path d="M15.6 6.8 L13.6 9 L15.6 11.2" stroke="#ffc800" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M7 19 V9" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" />
      <path d="M5 11 L7 8.6 L9 11" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  priority: (
    <>
      <rect x={4.2} y={4.2} width={15.6} height={15.6} rx={2.4} fill="#fff" stroke="#4a3b33" strokeWidth={1.2} transform="rotate(45 12 12)" />
      <rect x={7.6} y={7.6} width={8.8} height={8.8} rx={1.2} fill="#ffc800" transform="rotate(45 12 12)" />
    </>
  ),
  trick: (
    <>
      <path d="M4 4 H20 Q22 4 22 6 V15 Q22 17 20 17 H11 L6.5 21 V17 H4 Q2 17 2 15 V6 Q2 4 4 4 Z" fill="#ff9600" />
      <path d="M9.6 8.6 Q9.8 6.6 12 6.6 Q14.4 6.6 14.4 8.6 Q14.4 10 12.6 10.7 Q12 11 12 12" stroke="#fff" strokeWidth={2} strokeLinecap="round" fill="none" />
      <circle cx={12} cy={14.4} r={1.2} fill="#fff" />
    </>
  ),
  rides: (
    <>
      <path d="M3 15.5 Q2.6 12.3 5 11.6 L7.6 7.8 Q8.4 6.6 10 6.6 H14.6 Q16 6.6 17 7.8 L19.4 11 Q21.6 11.4 21.4 14.5 V16.5 H3 Z" fill="#ff4b4b" />
      <path d="M8.6 11 L10 8.3 H12 V11 Z M13.4 11 V8.3 H14.6 Q15.4 8.3 16 9 L17.4 11 Z" fill="#bfe3ff" />
      <circle cx={7.5} cy={16.6} r={2.6} fill="#3c3c46" />
      <circle cx={17} cy={16.6} r={2.6} fill="#3c3c46" />
      <circle cx={7.5} cy={16.6} r={1} fill="#d8dce2" />
      <circle cx={17} cy={16.6} r={1} fill="#d8dce2" />
      <path d="M2.8 21.4 H21.2" stroke="#d9cbb9" strokeWidth={1.4} strokeLinecap="round" />
    </>
  ),
  record: (
    <>
      <path d="M6.5 2 H10.5 L13 9 H9 Z" fill="#1cb0f6" />
      <path d="M17.5 2 H13.5 L11 9 H15 Z" fill="#ff4b4b" />
      <circle cx={12} cy={15} r={7} fill="#ffc800" />
      <circle cx={12} cy={15} r={5} fill="#ffb020" />
      <path d="M12 11.6 L13 13.8 L15.3 14 L13.6 15.6 L14.1 17.9 L12 16.7 L9.9 17.9 L10.4 15.6 L8.7 14 L11 13.8 Z" fill="#fff6c2" />
    </>
  ),
  uturn: (
    <>
      <rect x={2.5} y={2.5} width={19} height={19} rx={5} fill="#1cb0f6" />
      <path d="M15.5 18.5 V10 A3.5 3.5 0 0 0 8.5 10 V15" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" fill="none" />
      <path d="M6 13 L8.5 16 L11 13" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  trolley: (
    <>
      <path d="M8 7 L13 1.5 M11 7 L16 1.5" stroke="#3c3c46" strokeWidth={1.2} strokeLinecap="round" />
      <rect x={2} y={6.5} width={20} height={12} rx={3} fill="#2bb24c" />
      <rect x={4} y={8.5} width={4} height={4} rx={1} fill="#bfe3ff" />
      <rect x={10} y={8.5} width={4} height={4} rx={1} fill="#bfe3ff" />
      <rect x={16} y={8.5} width={4} height={4} rx={1} fill="#bfe3ff" />
      <path d="M2 14.5 H22" stroke="#1f8f3c" strokeWidth={1.2} />
      <circle cx={7} cy={19} r={2.2} fill="#3c3c46" />
      <circle cx={17} cy={19} r={2.2} fill="#3c3c46" />
    </>
  ),
  busstop: (
    <>
      <path d="M2 7 Q2 4.5 4.5 4.5 H14 V7 Z" fill="#ff9600" />
      <rect x={3} y={7} width={10} height={9} fill="#cdeeff" />
      <path d="M3 7 V20 M13 7 V20" stroke="#8a5a3c" strokeWidth={1.4} strokeLinecap="round" />
      <rect x={4} y={13.5} width={8} height={1.6} rx={0.8} fill="#8a5a3c" />
      <path d="M18.5 9 V21.5" stroke="#6f7682" strokeWidth={1.6} strokeLinecap="round" />
      <rect x={15} y={2.5} width={7} height={7} rx={1.4} fill="#1cb0f6" />
      <rect x={16.6} y={4} width={3.8} height={4} rx={0.8} fill="#ffc800" />
      <path d="M2 21.5 H22" stroke="#d9cbb9" strokeWidth={1.4} strokeLinecap="round" />
    </>
  ),
  inspector: (
    <>
      <path d="M5 22 Q5 15 12 15 Q19 15 19 22 Z" fill="#c6ff3d" />
      <path d="M10.2 15.2 L12 18.4 L13.8 15.2 Z" fill="#24346b" />
      <circle cx={12} cy={10.5} r={4.2} fill="#ffd2a8" />
      <path d="M6.8 8.4 Q7 3 12 3 Q17 3 17.2 8.4 Z" fill="#24346b" />
      <rect x={6.2} y={7.6} width={11.6} height={1.8} rx={0.9} fill="#1b2550" />
      <circle cx={12} cy={5.6} r={1} fill="#ffc800" />
      <path d="M17 20.5 L22 13.5" stroke="#3c3c46" strokeWidth={3} strokeLinecap="round" />
      <path d="M17 20.5 L22 13.5" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
      <path d="M17 20.5 L22 13.5" stroke="#ff4b4b" strokeWidth={2} strokeDasharray="1.6 1.6" />
    </>
  ),
} as const;

export type UiIconId = keyof typeof UI_ICONS;

export function UiIcon({ id, size = 22 }: { id: UiIconId; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className="ui-icon" aria-hidden="true">
      {UI_ICONS[id]}
    </svg>
  );
}
