import { AREAS } from '../data/catalog';

const S = ({ children, sw = 2, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    {children}
  </svg>
);

export const Arrow = (p) => <S sw={2.2} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></S>;
export const Clock = (p) => <S {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></S>;
export const Search = (p) => <S {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></S>;
export const Check = (p) => <S sw={2.2} {...p}><circle cx="12" cy="12" r="10" opacity=".25" /><path d="M8 12.5l2.8 2.8L16.5 9.5" /></S>;
export const Users = (p) => <S {...p}><circle cx="9" cy="8" r="4" /><path d="M2 21v-1a6 6 0 0 1 12 0v1M16 3.5a4 4 0 0 1 0 9M22 21v-1a6 6 0 0 0-4-5.6" /></S>;
export const Book = (p) => <S {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" /><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" /></S>;
export const Key = (p) => <S {...p}><circle cx="8" cy="15" r="5" /><path d="M11.5 11.5L21 2M17 6l3 3M15 8l2 2" /></S>;
export const Mail = (p) => <S {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></S>;
export const Pin = (p) => <S {...p}><path d="M12 22s7-6.4 7-12a7 7 0 0 0-14 0c0 5.6 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></S>;
export const Chat = (p) => <S {...p}><path d="M21 12a8 8 0 0 1-11.8 7L3 21l2-6A8 8 0 1 1 21 12z" /></S>;
export const Layers = (p) => <S sw={1.8} {...p}><path d="M12 2l10 5-10 5L2 7z" /><path d="M2 12l10 5 10-5M2 17l10 5 10-5" /></S>;
export const Play = (p) => <S sw={1.8} {...p}><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M8 22h8M10 8.5v5l4.5-2.5z" /></S>;
export const Mentor = (p) => <S sw={1.8} {...p}><circle cx="8" cy="7" r="3.5" /><circle cx="17" cy="10" r="2.5" /><path d="M2 21v-1.5A5.5 5.5 0 0 1 7.5 14h1A5.5 5.5 0 0 1 14 19.5V21M15 21v-1a4 4 0 0 1 7-2.6" /></S>;
export const Flask = (p) => <S sw={1.8} {...p}><path d="M9 3h6M10 3v6L4.5 18.5A2 2 0 0 0 6.2 21.5h11.6a2 2 0 0 0 1.7-3L14 9V3" /><path d="M7.5 15h9" /></S>;
export const Target = (p) => <S sw={1.8} {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></S>;
export const Globe = (p) => <S sw={1.8} {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></S>;
export const Spark = (p) => <S sw={1.8} {...p}><path d="M13 2L4 14h7l-1 8 9-12h-7z" /></S>;
export const Table = (p) => <S {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M3 15h18M9 4v16" /></S>;
export const Grid = (p) => <S {...p}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></S>;
export const Download = (p) => <S {...p}><path d="M12 3v12M7 10l5 5 5-5M4 19h16" /></S>;
export const Moon = (p) => <S {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></S>;
export const Menu = (p) => <S {...p}><path d="M4 7h16M4 12h16M4 17h16" /></S>;
export const Up = (p) => <S sw={2.2} {...p}><path d="M12 19V5M5 12l7-7 7 7" /></S>;
export const Close = (p) => <S sw={2.4} {...p}><path d="M6 6l12 12M18 6L6 18" /></S>;
export const Minus = (p) => <S sw={2.2} {...p}><path d="M6 12h12" /></S>;
export const Reset = (p) => <S {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></S>;
export const Mic = (p) => <S {...p}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></S>;
export const ChatDots = (p) => <S {...p}><path d="M21 12a8 8 0 0 1-11.8 7L3 21l2-6A8 8 0 1 1 21 12z" /><path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" strokeWidth="3" /></S>;

export const AreaIcon = ({ area, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" dangerouslySetInnerHTML={{ __html: (AREAS[area] || AREAS.Data).i }} {...p} />
);
