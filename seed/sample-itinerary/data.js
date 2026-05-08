// Sample data for the seed brochure. Replace every value here when you
// duplicate this template into your own briefing — the layout in app.jsx
// is data-driven, so editing data.js is enough to retitle, reorder, or
// fully repopulate the brief.

window.TRIP = {
  title: "Reykjavík",
  client: "Acme Studios",
  prepared_for: "Riley",
  base: "Reykjavík",
  duration_label: "4 days",
  dates_label: "To be confirmed",
  hero_caption: "Reykjavík · South Coast · Highlands",
  vol: "Vol. I",
};

window.ITINERARY = [
  {
    day: "Day 1",
    label: "Arrival · Reykjavík",
    items: [
      {
        who: "Jordan Park",
        company: "Northwind Studio",
        prio: "P1",
        email: "jordan@example.com",
        location: "Laugavegur 12, Reykjavík",
        context: "Long-running collaborator. Studio walkthrough, current commissions, gear changes since last visit.",
        expectation: "Lock in the late-spring residency dates and get the printed portfolio set we'll use through the rest of the trip.",
      },
      {
        who: "Sam Rivera",
        company: "Glacier Press",
        prio: "P1",
        email: "sam@example.com",
        location: "Tryggvagata 6, Reykjavík",
        context: "Indie publisher; been waiting on us to pick a paper stock.",
        expectation: "Decide on stock + binding. Bring back two physical samples for the studio review on Day 4.",
      },
      {
        who: "Welcome dinner",
        beat: true,
        expectation: "Casual, no agenda — just settle in.",
      },
    ],
  },
  {
    day: "Day 2",
    label: "Field studios",
    items: [
      {
        who: "Alex Chen",
        company: "Hver Workshop",
        prio: "P2",
        email: "alex@example.com",
        location: "Hellisheiði (1 hr east)",
        context: "Geothermal-glass workshop. Want a half-day visit to see the kiln cycle in person.",
        expectation: "Watch one cycle end-to-end. Decide whether the residency uses their kiln or rents the smaller one in Reykjavík.",
      },
      {
        who: "Pat Olsen",
        company: "Independent",
        prio: "P3",
        email: "pat@example.com",
        location: "Selfoss",
        context: "Sculptor. Possible collaborator on the spring open studio.",
        expectation: "Quick studio visit; gauge fit and timing.",
      },
      {
        who: "Drive back to Reykjavík",
        beat: true,
        expectation: "Travel.",
      },
    ],
  },
  {
    day: "Day 3",
    label: "Downtown cluster",
    note: "All four meetings within walking distance.",
    items: [
      {
        who: "Morgan Lee",
        company: "Harbor Gallery",
        prio: "P2",
        time: "9:30",
        email: "morgan@example.com",
        location: "Aðalstræti 2",
        context: "Gallerist. Has a slot in the autumn programme.",
        expectation: "Confirm the slot and the four pieces we'd ship.",
      },
      {
        who: "Working coffee",
        beat: true,
        time: "11:00",
        expectation: "Reset.",
      },
      {
        who: "Casey Hart",
        company: "Atlas Foundation",
        prio: "P3",
        time: "13:00",
        email: "casey@example.com",
        location: "Hverfisgata 19",
        context: "Grant body. Open to a small project proposal.",
        expectation: "Walk them through the residency outline; get a sense of timing.",
      },
      {
        who: "Reykjavík Art Museum",
        beat: true,
        time: "Evening",
        expectation: "Quiet hour before tomorrow's wrap.",
      },
    ],
  },
  {
    day: "Day 4",
    label: "Wrap-up",
    items: [
      {
        who: "Studio review",
        company: "Internal",
        prio: "P1",
        time: "Morning",
        context: "Lay out everything we collected this week.",
        expectation: "Pick the three pieces that go into the autumn show; decide on residency dates.",
      },
      {
        who: "Closing dinner",
        beat: true,
        expectation: "With Jordan and Sam.",
      },
    ],
  },
];

window.LONG_TAIL = [
  {
    who: "Robin Stone",
    company: "Independent · Akureyri",
    prio: "P∞",
    email: "robin@example.com",
    location: "Akureyri · 5 hr north",
    note: "Worth a virtual call before the next trip — too far for this one.",
  },
];

window.ATTACHMENTS = [
  { ref: "A-01", title: "Residency outline",  meta: "Draft · for Atlas Foundation" },
  { ref: "A-02", title: "Portfolio sample",   meta: "Sent ahead to Northwind Studio" },
  { ref: "A-03", title: "Paper stock samples",meta: "Bring back two from Glacier Press" },
];

window.ROWS = { length: 7 };

window.WEATHER = {
  city: "Reykjavík",
  month: "May",
  high_c: 9,
  low_c: 3,
  high_f: 48,
  low_f: 37,
  rain_days: 13,
  sun_hours: 6,
  note: "Late spring — wind, frequent showers, bright evenings.",
};

window.RECS = [
  { tag: "Pack",   text: "Layers + a real jacket. The wind makes it feel colder than the forecast." },
  { tag: "Wear",   text: "Waterproof shoes for Day 2 — the workshop drive runs through wet ground." },
  { tag: "Eat",    text: "Anything at the harbour. Skyr for breakfast, lamb soup at noon." },
  { tag: "See",    text: "Reykjavík Art Museum on Day 3 evening, before the wrap-up." },
  { tag: "Travel", text: "KEF → city ~45 min by Flybus. Keep a half-day buffer for the south coast." },
];
