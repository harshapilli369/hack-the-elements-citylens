# Hack The Elements — Presentation Reference
> Say this out loud before you go up. These are your talking points, not technical notes.

---

## Open With This

Our project simulates how disasters trigger population displacement, cascade across Atlantic Canadian cities, and cause long-term ecological damage.

Every number in this simulation comes from a real source — Statistics Canada, UNHCR, Transport Canada, Marine Atlantic, Environment Canada. When something happens in our simulation, there's a citation behind it.

The four cities are Moncton, Halifax, Charlottetown, and St. John's — their populations are exact Statistics Canada 2021 Census figures.

---

## Displacement Rates

When a disaster hits, we calculate how many people flee using real UN data. Different disasters displace very different percentages of people:

- Conflict displaces 45% — people are fleeing for their lives (UNHCR 2023)
- Wildfire displaces 40% — calibrated to Fort McMurray 2016
- Flood displaces 20% — structural damage, but many stay
- Drought displaces only 8% — it's slow, people try to hold on
- Heatwave displaces only 5% — mainly vulnerable populations

Most people also flee at the very beginning. Our formula front-loads displacement — urgency is highest on day one and drops quickly, which is exactly how real evacuations work.

**Say:** "A conflict displaces 45% of people. A heatwave displaces 5%. That's not us guessing — that's UNHCR data."

---

## Gravity Model — Where People Go

Displaced people don't go to random cities. They follow a gravity model — the same concept used by UN migration researchers and urban planners.

The idea is simple: people are attracted to large cities but pushed away by distance. Halifax pulls more people than Charlottetown because it's bigger. A city that's already full or already stressed repels migrants — which prevents the unrealistic scenario where everyone piles into one city.

**Say:** "People flow toward big, nearby, low-stress cities. That's how migration actually works, and it's how our simulation works."

---

## Live Weather Integration

Our simulation connects to real live weather data from OpenMeteo — a free open-source weather API. Every few minutes it checks the actual current weather in all four cities.

We use Environment Canada's official thresholds to decide when weather becomes dangerous:
- Heavy rain or thunderstorm → flood
- Hot, dry, and windy together (above 28°C, humidity below 35%, wind above 25 km/h) → wildfire
- Above 32°C → heatwave
- Persistently low humidity with no rain → drought

So if it's genuinely a wildfire-risk day in Moncton right now, our simulation knows and triggers automatically.

**Say:** "If it's actually 33°C and dry in Moncton today, our app automatically triggers a heatwave — using the same thresholds Environment Canada uses for public weather alerts."

---

## Configurable Disaster Triggers

When someone manually triggers a disaster, they set three parameters:

- **Severity 1 to 5** — like hurricane categories. Severity 5 is Fort McMurray scale. This multiplies how many people flee and how fast resources collapse.
- **Affected population** — 25%, 50%, 75%, or 100% of the city. A flood might only hit the low-lying riverside areas. A catastrophic hurricane hits everyone.
- **Duration** — short, medium, or long. Some disasters are fast and intense. Others drag on for weeks.

As you adjust these, the screen shows the estimated displaced people count updating live — before you even confirm. So you can see: increase severity from 3 to 5, and displaced people jump from 40,000 to 67,000.

**Say:** "You're not just clicking a button — you're making an informed decision, and the simulation shows you the consequences before you commit."

---

## Real Infrastructure Bottlenecks

This is one of the most important things we built.

People don't teleport to safety. They join a queue — they've decided to leave but they're still in the city — and that queue drains only as fast as the actual infrastructure allows.

The real capacities we used from Transport Canada and Marine Atlantic:
- Trans-Canada Highway out of Moncton: **2,700 people per hour**
- Confederation Bridge from Charlottetown: **3,240 per hour**
- Northumberland Ferry to Halifax: **108 per hour**
- Marine Atlantic from St. John's: **326 per hour**

Here's what that means in practice:

If 30% of St. John's population needs to evacuate — about 64,500 people — and the only way out moves 326 people per hour, it takes **8 days** to fully evacuate.

The same disaster in Moncton, with Highway 104 at 2,700 per hour, clears in **24 hours**.

Same disaster. Same severity. Same percentage displaced. The only difference is the infrastructure.

This is a real, documented vulnerability of Newfoundland's island geography — and our simulation makes it visible.

**Say:** "St. John's takes 8 days to evacuate what Moncton clears in 24 hours. That's not a design choice — that's the Marine Atlantic ferry schedule."

---

## Background Migration (StatCan Data)

Even when no disaster is happening, people move between provinces every day. We built that into the baseline using Statistics Canada interprovincial migration data (CANSIM table, 2019–2023 average).

More people leave New Brunswick for Nova Scotia than the reverse. Newfoundland is a net population loser to Nova Scotia — that's real brain drain built into our simulation. PEI and New Brunswick are roughly balanced.

When a disaster hits, it accelerates flows that were already happening. A disaster in St. John's pushes more people out along a route that was already draining.

**Say:** "The background migration reflects what's actually happening in Atlantic Canada — NL losing people to NS, NB losing people to NS — and disasters accelerate those existing trends."

---

## Chain Reaction Resolution — How It Ends

A chain reaction needs a stopping condition. Ours has three.

**Return Migration:** Real UNHCR data shows 60–80% of displaced people return home once it's safe. How many return and how fast depends on the disaster:
- Heatwave: 95% return — it was temporary
- Wildfire: 86% return — Fort McMurray 2016, 86% were back within a year
- Flood: 58% return — Hurricane Fiona and Katrina data combined
- Drought: only 35% return — mostly permanent agricultural loss
- Conflict: only 20% — mostly permanent displacement

There's a realistic delay before anyone goes back. After a wildfire you wait about 12 days. After a flood, about 21 days. After a conflict, about 62 days. On screen you see soft blue-white figures walking back along the same routes they left on.

**Recovery Boost:** After a disaster ends, the city recovers faster temporarily — this represents government emergency aid. Without this, the city stays stressed forever and nobody goes home.

**Cascade Fatigue:** After a city triggers three cascades, the probability of a fourth drops by nearly 10 times. In real life, people run out of capacity to keep moving — savings deplete, social networks exhaust.

**The key insight:** That same Marine Atlantic bottleneck that slowed the evacuation also slows the return. St. John's takes 3 times longer to fully recover from the same wildfire as Moncton. The infrastructure asymmetry shows up twice — once going out, once coming back.

**Say:** "The chain reaction ends — and how long it takes to end is itself the metric. St. John's takes 3× longer to recover from the same disaster as Moncton, purely because of the ferry."

---

## Data Audit

We went through every single number in our simulation and asked: where did this come from? If we couldn't cite a source, we found one and updated it.

Things we corrected during the audit:
- Marine Atlantic capacity was wrong by nearly 4×. We had 83 people per hour. The actual 2023 Annual Report shows 326. We caught our own mistake and fixed it.
- Charlottetown ferry was too high — we corrected it down to 108 per hour based on actual crossing schedules.
- All city starting stress levels now reflect real 2022–2023 conditions. Charlottetown is high because CMHC says it had the fastest-rising rents in Canada. Halifax is high because of a 0.9% vacancy rate.
- Cascade probability now follows a logistic curve from FEMA's Mass Evacuation model — not an arbitrary flat percentage.
- All preset disaster scenarios were corrected to real event data. Our Hurricane Fiona preset was off by 6× — we had 28,000 displaced, CMHC's actual estimate was 4,800.

**Say:** "We caught our own errors and corrected them. That's the point of doing a real data audit — you're testing your assumptions, not defending them."

---

## Chain Analysis Dashboard

The dashboard turns ecological impact analysis into something a policymaker can actually act on.

- A **cascade timeline** shows the event-by-event story of how the chain reaction unfolded — which disaster triggered which cascade, in what order, how many people moved at each step.
- Every receiving city card shows a **sparkline** — a tiny graph of how ecological stress evolved over the simulation. Red means the city ended in bad shape. Green means it recovered.
- Click any city card and it expands into a **full chart** showing three lines over time: ecological stress, watershed stress, and biodiversity index.
- A **Re-analyse button** snapshots the current live simulation state and re-runs the full backend analysis instantly — so if you trigger a second disaster mid-demo, you can refresh the analysis in real time.
- Each policy recommendation has an **"Apply in Simulator" button** that takes you directly to the simulator with the highest-stress city already selected. It also shows a plain-English hint — for example, "Establish wildlife corridors — slow biodiversity index decline."

**Say:** "You can follow the disaster story, see which cities are trending worse, drill into the full ecological data, and click from a recommendation directly into the simulator on the city that needs the most attention."

---

## Master One-Liner

> "We built a simulation of Atlantic Canadian disaster response grounded entirely in real data — StatCan populations, UNHCR displacement rates, Marine Atlantic ferry schedules, Environment Canada weather thresholds — so when St. John's takes 8 days to evacuate what Moncton clears in 24 hours, that's not a design choice. That's the infrastructure."

---

## Judge Questions — Ready Answers

**"What problem are you actually solving?"**
Atlantic Canada has four provinces connected by very limited infrastructure. When a disaster hits one city, the others absorb the displaced people — and that absorption can overload them into a second crisis. Emergency planners have no tool to see this cascade before it happens. Ours shows it in real time.

---

**"Is this a prediction tool or a simulation?"**
A scenario tool. We're not saying "this will happen." We're saying "if a wildfire hits Moncton and 40,000 people leave, here's how Halifax, Charlottetown, and St. John's absorb that shock — and here's which one breaks first." That's useful for NGOs, city planners, and climate ministries running what-if scenarios before a real disaster.

---

**"How is this different from just showing a map with arrows?"**
The arrows are backed by physics. Routing uses a gravity model — people go to bigger, closer, less-stressed cities. Movement is bottlenecked by real infrastructure — the Confederation Bridge, the Trans-Canada, the Marine Atlantic ferry. Cascade probability follows a logistic curve from FEMA's evacuation model, not a coin flip. The ecological damage is computed by a backend engine using peer-reviewed Canadian forestry and climate data. The arrows look simple. What drives them isn't.

---

**"Why only four cities?"**
Atlantic Canada is a real, bounded system with known migration corridors, documented disaster history, and published StatCan migration data we could verify. A global model has too many unknown parameters and loses ground truth. This is a deep case study. We can defend every number in it.

---

**"How accurate are your numbers?"**
Every constant has a source. Population figures are StatCan 2021 Census. Displacement rates are UNHCR and IOM data. Ferry capacities are from Marine Atlantic's 2023 Annual Report. Return migration rates come from Fort McMurray 2016 post-disaster studies and Hurricane Fiona 2022 data. We also caught and corrected our own errors during a data audit — our original Marine Atlantic capacity was off by 4×.

---

**"What's the cascade trigger — how does a second disaster start?"**
When a city's overall stress crosses roughly 78%, a logistic probability curve kicks in. At 85% stress, there's a 50% chance per tick of triggering a cascade. At 95% stress, it's 83%. Below 78%, the probability is near zero. We also built in cascade fatigue — after a city triggers three cascades, the probability drops by nearly 10 times, because in real life people run out of capacity to keep moving.

---

**"Why does St. John's take so much longer to recover?"**
Two reasons, and they're the same reason. Marine Atlantic runs at 326 people per hour. That bottleneck slows evacuation on the way out — and it slows return migration on the way back in. The same ferry that makes St. John's hard to evacuate makes it hard to repopulate after recovery. Moncton has Highway 104 at 2,700 people per hour. Same disaster, 3× longer recovery — purely infrastructure.

---

**"What does the ecological model actually compute?"**
The backend runs through six metrics month by month: carbon emissions shift, forest loss in hectares, biodiversity fragmentation, watershed stress, urban heat island temperature rise, and construction emissions. Each uses peer-reviewed constants — Canadian forests sequester 2.8 tonnes of CO₂ per hectare per year, and urban heat island adds 0.3°C per 1% increase in impervious surface (Oke 1982). The composite stress score weights these and maps to MINIMAL through CRITICAL.

---

**"Why is recovery so slow in your ecological model?"**
Because it actually is. IPCC AR6 data shows forest regrowth takes decades. We set ecological decay at 0.20 points per sample and recovery at 0.03 — six times slower. The simulation shows the real asymmetry: you can displace 40,000 people in three days. The habitat they left behind takes 15 to 30 years to fully recover.

---

**"What do the policy buttons actually do?"**
Each one modifies a real parameter in the simulation. Urban Growth Boundary slows land conversion. Water Recycling reduces water stress growth rate. Wildlife Corridors slow biodiversity index decline. Decarbonisation reduces per-capita emissions delta. They're not cosmetic — applying them changes the ecological stress trajectory you see on the charts in real time.

---

**"Did the live weather actually trigger anything during your testing?"**
Yes. The hook checks current weather every few minutes against Environment Canada thresholds. During development we saw it auto-trigger when temperature and humidity conditions met the threshold. The 10-minute cooldown per city and the silent-fail on network errors mean it never breaks the demo — it just adds a layer of real-world connection when conditions happen to match.

---

**"Who would actually use this?"**
Three groups: emergency management agencies running pre-disaster scenario planning. NGOs like the Red Cross modeling where to pre-position aid. Climate adaptation policymakers asking "if we invest in Halifax's water infrastructure now, how much does that reduce cascade risk during a future flood?" The Chain Analysis dashboard is specifically designed to output the ecological cost data those groups need to justify spending decisions.

---

**"What would you add with more time?"**
Real hospital capacity data per city — health system overload is currently modeled as a generic resource but real ICU-per-capita data would make it much more precise. We'd also connect the simulation output directly to federal emergency preparedness databases so scenario results could feed into actual planning documents rather than just visuals.
