// Countries for the phone field: ISO 3166 code → international dialling code. Names come from the browser (Intl.DisplayNames).
const DIAL = 'af93 al355 dz213 as1 ad376 ao244 ai1 ag1 ar54 am374 aw297 au61 at43 az994 bs1 bh973 bd880 bb1 by375 be32 bz501 bj229 bm1 bt975 '
  + 'bo591 ba387 bw267 br55 io246 vg1 bn673 bg359 bf226 bi257 kh855 cm237 ca1 cv238 ky1 cf236 td235 cl56 cn86 co57 km269 cg242 cd243 '
  + 'ck682 cr506 ci225 hr385 cu53 cw599 cy357 cz420 dk45 dj253 dm1 do1 ec593 eg20 sv503 gq240 er291 ee372 sz268 et251 fk500 fo298 fj679 '
  + 'fi358 fr33 gf594 pf689 ga241 gm220 ge995 de49 gh233 gi350 gr30 gl299 gd1 gp590 gu1 gt502 gg44 gn224 gw245 gy592 ht509 hn504 hk852 '
  + 'hu36 is354 in91 id62 ir98 iq964 ie353 im44 il972 it39 jm1 jp81 je44 jo962 kz7 ke254 ki686 xk383 kw965 kg996 la856 lv371 lb961 ls266 '
  + 'lr231 ly218 li423 lt370 lu352 mo853 mg261 mw265 my60 mv960 ml223 mt356 mh692 mq596 mr222 mu230 yt262 mx52 fm691 md373 mc377 mn976 '
  + 'me382 ms1 ma212 mz258 mm95 na264 nr674 np977 nl31 nc687 nz64 ni505 ne227 ng234 nu683 nf672 kp850 mk389 mp1 no47 om968 pk92 pw680 '
  + 'ps970 pa507 pg675 py595 pe51 ph63 pl48 pt351 pr1 qa974 re262 ro40 ru7 rw250 bl590 sh290 kn1 lc1 mf590 pm508 vc1 ws685 sm378 st239 '
  + 'sa966 sn221 rs381 sc248 sl232 sg65 sx1 sk421 si386 sb677 so252 za27 kr82 ss211 es34 lk94 sd249 sr597 se46 ch41 sy963 tw886 tj992 '
  + 'tz255 th66 tl670 tg228 tk690 to676 tt1 tn216 tr90 tm993 tc1 tv688 ug256 ua380 ae971 gb44 us1 uy598 uz998 vu678 va39 ve58 vn84 '
  + 'vi1 wf681 ye967 zm260 zw263';

const names = (() => { try { return new Intl.DisplayNames([navigator.language, 'en'], { type: 'region' }); } catch { return null; } })();

export const COUNTRIES = DIAL.trim().split(/\s+/).map((s) => {
  const code = s.slice(0, 2).toUpperCase();
  return { code, dial: s.slice(2), name: names?.of(code) || code };
}).sort((a, b) => a.name.localeCompare(b.name));

export const byCountry = Object.fromEntries(COUNTRIES.map((c) => [c.code, c]));

/** The visitor's country from their browser language (en-IN → IN), else the US. */
export function guessCountry() {
  for (const tag of navigator.languages || [navigator.language]) {
    const region = (() => { try { return new Intl.Locale(tag).maximize().region; } catch { return ''; } })();
    if (region && byCountry[region]) return region;
  }
  return 'US';
}
