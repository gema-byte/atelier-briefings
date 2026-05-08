// Sample brochure — content lives in data.js. Edit window.TRIP / ITINERARY
// / WEATHER / RECS / ATTACHMENTS there and this layout reflows.

function Cover() {
  const t = window.TRIP || {};
  const total = (window.ITINERARY || []).reduce((n, d) => n + (d.items || []).filter(it => !it.beat).length, 0)
              + (window.LONG_TAIL || []).length;
  return (
    <header className="cover">
      <div className="page cover-body">
        <div className="cover-grid">
          <div className="cover-title">
            <div className="eyebrow">Field brochure · {t.vol || 'Vol. I'}</div>
            <h1>
              A trip to <span className="underline">{t.title}</span>,<br/>
              and the people we'll meet.
            </h1>
            <p className="lede">{t.duration_label} based in {t.base}. A guided walk through the people, places and meetings on the agenda.</p>
          </div>

          <div className="cover-hero">
            <image-slot id="cover-hero" shape="rect" placeholder={`Hero photo · ${t.title}`}></image-slot>
            <div className="hero-cap">{t.hero_caption}</div>
          </div>
        </div>

        <dl className="cover-foot">
          <div><dt>Base</dt><dd>{t.base}</dd></div>
          <div><dt>Duration</dt><dd>{t.duration_label}</dd></div>
          <div><dt>Dates</dt><dd>{t.dates_label}</dd></div>
          <div><dt>Contacts</dt><dd>{total}</dd></div>
        </dl>
      </div>
    </header>
  );
}

function ItinerarySection() {
  const t = window.TRIP || {};
  const total = (window.ITINERARY || []).reduce((n, d) => n + (d.items || []).filter(it => !it.beat).length, 0)
              + (window.LONG_TAIL || []).length;
  return (
    <section className="page section" data-screen-label="Itinerary">
      <div className="section-head">
        <h2><span className="num">§ 1</span>The plan</h2>
        <span className="eyebrow">{t.base} base · {total} contacts</span>
      </div>

      <div className="brochure">
        {window.ITINERARY.map((day, i) => (
          <DayCard key={i} day={day} index={i} />
        ))}
      </div>

      <div className="long-tail">
        <div className="long-tail-head">
          <span className="eyebrow">Off-itinerary · handle separately</span>
          <h3>Virtual / asynchronous</h3>
        </div>
        <ul>
          {window.LONG_TAIL.map((p, i) => (
            <li key={i}>
              <span className="lt-prio">{p.prio}</span>
              <span className="lt-name">{p.who}</span>
              <span className="lt-company">{p.company}</span>
              <span className="lt-note">{p.note}</span>
              {p.location && <span className="lt-loc">📍 {p.location}</span>}
              {p.email && <span className="lt-email">✉ {p.email}</span>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function DayCard({ day, index }) {
  const meetings = day.items.filter(it => !it.beat);
  const beats = day.items.filter(it => it.beat);
  return (
    <article className="day">
      <header className="day-header">
        <div className="day-num">
          <span className="day-label">{day.day}</span>
          <span className="day-title">{day.label}</span>
        </div>
        <div className="day-rule"></div>
      </header>

      {day.note && <div className="day-note">{day.note}</div>}

      <div className="day-body">
        <div className="day-photo">
          <image-slot id={`day-${index}-photo`} shape="rect" placeholder={`Photo · ${day.label}`}></image-slot>
        </div>

        <div className="day-meetings">
          {meetings.map((it, j) => <MeetingRow key={j} it={it} />)}
        </div>
      </div>

      {beats.length > 0 && (
        <footer className="day-footer">
          {beats.map((b, j) => (
            <div key={j} className="day-beat">
              <span className="beat-dot"></span>
              {b.time && <span className="beat-time">{b.time}</span>}
              <span className="beat-who">{b.who}</span>
              <span className="beat-note">{b.expectation}</span>
            </div>
          ))}
        </footer>
      )}
    </article>
  );
}

function MeetingRow({ it }) {
  return (
    <div className="meeting">
      <div className="meeting-head">
        <div className="meeting-stamp">
          {it.time && <span className="m-time">{it.time}</span>}
          {it.prio && <span className={`m-prio p-${it.prio.replace(/[^a-z0-9]/gi,'')}`}>{it.prio}</span>}
        </div>
        <div className="meeting-id">
          <div className="m-name">{it.who}</div>
          {it.company && <div className="m-company">{it.company}</div>}
          <div className="m-contact">
            {it.email && <span className="m-email">✉ {it.email}</span>}
            {it.phone && <span className="m-phone">☎ {it.phone}</span>}
            {it.location && <span className="m-loc">📍 {it.location}</span>}
          </div>
        </div>
      </div>
      <dl className="meeting-body">
        {it.context && <><dt>Who</dt><dd>{it.context}</dd></>}
        {it.expectation && <><dt>We want</dt><dd className="exp">{it.expectation}</dd></>}
        {it.attachments && <><dt>Attach</dt><dd className="att">{it.attachments}</dd></>}
      </dl>
    </div>
  );
}

function AttachmentsIndex() {
  return (
    <section className="page section" data-screen-label="Attachments">
      <div className="section-head">
        <h2><span className="num">§ 2</span>Attachments</h2>
        <span className="eyebrow">Reference</span>
      </div>
      <div className="attach">
        {window.ATTACHMENTS.map(a => (
          <div key={a.ref} className="attach-row">
            <div className="icon"></div>
            <div>
              <div className="title">{a.title}</div>
              <div className="meta">{a.meta}</div>
            </div>
            <div className="ref">{a.ref}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Colophon() {
  const t = window.TRIP || {};
  return (
    <footer className="page colophon">
      <div>{t.client} · {t.title} · {t.vol || 'Vol. I'}</div>
      <div>Prepared for {t.prepared_for} · {t.dates_label}</div>
    </footer>
  );
}

const ITIN_PALETTES = {
  "Field journal": { paper: '#f3ece0', paper2: '#ebe1d0', ink: '#1d2a25', accent: '#b8612a', accent2: '#2d5a4a', rule: '#c9bda8', mute: '#8a8275' },
  "Prairie sky":   { paper: '#eef2f3', paper2: '#dbe4e8', ink: '#1a2733', accent: '#c66a3a', accent2: '#3a6a78', rule: '#b9c5cb', mute: '#7a8690' },
  "Ranger green":  { paper: '#efe9d9', paper2: '#e2dac4', ink: '#1f2a1a', accent: '#a04a22', accent2: '#3d5a2a', rule: '#bdb29a', mute: '#82796a' },
  "Vintage rail":  { paper: '#f5ede0', paper2: '#e9dcc4', ink: '#28160d', accent: '#a83626', accent2: '#3a4d2c', rule: '#c8b89a', mute: '#8a7a64' },
};
function applyPalette(p) {
  const r = document.documentElement;
  r.style.setProperty('--paper', p.paper);
  r.style.setProperty('--paper-2', p.paper2);
  r.style.setProperty('--ink', p.ink);
  r.style.setProperty('--accent', p.accent);
  r.style.setProperty('--accent-2', p.accent2);
  r.style.setProperty('--rule', p.rule);
  r.style.setProperty('--ink-mute', p.mute);
}
function ItinTweaks() {
  const [t, setTweak] = useTweaks({ palette: "Field journal", dense: false });
  React.useEffect(() => { applyPalette(ITIN_PALETTES[t.palette] || ITIN_PALETTES["Field journal"]); }, [t.palette]);
  React.useEffect(() => { document.body.classList.toggle('dense', !!t.dense); }, [t.dense]);
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection title="Palette">
        <TweakRadio label="Mood" value={t.palette} options={Object.keys(ITIN_PALETTES)} onChange={v => setTweak('palette', v)} />
      </TweakSection>
      <TweakSection title="Layout">
        <TweakToggle label="Dense" value={t.dense} onChange={v => setTweak('dense', v)} />
      </TweakSection>
    </TweaksPanel>
  );
}

function WeatherStrip() {
  const w = window.WEATHER;
  return (
    <section className="page section weather-section" data-screen-label="Weather">
      <div className="weather-strip">
        <div className="weather-card">
          <span className="eyebrow">Weather · {w.city} · {w.month}</span>
          <div className="weather-temps">
            <div className="temp-block">
              <span className="temp-label">High</span>
              <span className="temp-val">{w.high_c}°<small>C</small></span>
              <span className="temp-f">{w.high_f}°F</span>
            </div>
            <div className="temp-rule"></div>
            <div className="temp-block">
              <span className="temp-label">Low</span>
              <span className="temp-val">{w.low_c}°<small>C</small></span>
              <span className="temp-f">{w.low_f}°F</span>
            </div>
            <div className="temp-rule"></div>
            <div className="temp-block">
              <span className="temp-label">Sun</span>
              <span className="temp-val">{w.sun_hours}<small>h</small></span>
              <span className="temp-f">{w.rain_days} rain days</span>
            </div>
          </div>
          <p className="weather-note">{w.note}</p>
        </div>

        <div className="recs-card">
          <span className="eyebrow">Recommendations</span>
          <ul className="recs-list">
            {window.RECS.map((r, i) => (
              <li key={i}>
                <span className="rec-tag">{r.tag}</span>
                <span className="rec-text">{r.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function App() {
  return (
    <>
      <Cover />
      <ItinerarySection />
      <WeatherStrip />
      <AttachmentsIndex />
      <Colophon />
      <ItinTweaks />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
