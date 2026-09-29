# Prompt
ROLE: You are a senior full-stack developer starting a new project for me. Set up a
small React + Vite app with a package.json at the root, then do the following.

GOAL: Build a single screen for a couple deciding whether a 4-room HDB flat in Tampines
is within their budget. It shows the median resale price for the most recent month,
the month it refers to, and the number of transactions it was computed from. The value
comes from real data from the data.gov.sg datastore API (HDB resale flat prices),
fetched through a serverless function of my own.
 1) api/resale.js—calls https://data.gov.sg/api/action/datastore_search with query
    parameters resource_id=d_8b84c4ee58e3cfc0ece0d773c8ca6abc,
    filters={"town":<town>,"flat_type":<type>} and limit=10000, built with
    URLSearchParams so the braces are encoded. Read <town> from ?town= (default
    TAMPINES) and <type> from ?type= (default 4 ROOM); uppercase them and allow only
    letters, digits, spaces and slashes, otherwise return 400 with a sentence. Never use
    the q parameter. Cast resale_price with Number() the moment records arrive. Return
    only the fields my screen needs — { town, flatType, month, medianPrice, count } for
    the most recent month present — and nothing else. Zero records is valid: return
    count: 0 and medianPrice: null.
 2) api/health.js—reports whether the credential is configured (keyConfigured) and
    whether the upstream answered, including the HTTP status it returned. It must
    never print the credential or any part of it. Use limit=1 for the health call.
 3) On the screen, show the live value, read the page's own ?town= and ?type= and pass
    them to /api/resale, and show the town in the heading. Decide what the user sees in
    each of these four cases, as four different sentences shown in the place the value
    would be, only when that condition actually occurs — no buttons, toggles or
    simulated states on the screen:
    - loading: "Checking the latest resale prices…"
    - empty (count is 0): "No resale transactions found for that town and flat type."
    - upstream refused: "Resale prices are unavailable right now — data.gov.sg turned
      the request away. Try again in a few minutes."
    - upstream unreachable: "We couldn't reach data.gov.sg. Check your connection and
      try again."

OUTPUT: Both functions at api/ in the PROJECT ROOT, siblings of package.json, never
 inside src/. If this project has a server entry file, register the same two routes there too,
 because that is the shape the preview can answer. If it has no server file, skip
 that and tell me so rather than inventing one.
 Make sure package.json contains "type": "module" and .gitignore contains .env*.
 Do not create a .env.example.
 BEFORE the fetch, if the credential is missing or empty, return 503 with a message
 naming the variable, and do not call the upstream at all. A missing variable is sent
 as the word "undefined" and looks exactly like a wrong credential, so stop it early.
 AFTER the fetch, check response.ok before reading the body. A refusal often has an
 empty body, so calling .json() on it throws and my function dies with a 500 instead
 of telling me what happened. On a non-2xx reply, return the upstream status and a
 one-line reason in your own JSON. Treat a 200 with success:false the same way.
 Cache the response for one day with Cache-Control: s-maxage=86400,
 stale-while-revalidate=172800, matching how often the source actually changes.
 Do not cache error responses.
 In the footer, credit the source in the exact form the provider's licence asks for:
 "Contains information from Resale flat prices based on registration date from
 Jan-2017 onwards accessed from data.gov.sg which is made available under the terms
 of the Singapore Open Data Licence version 1.0." and link the licence at
 https://data.gov.sg/open-data-licence

GUARDRAILS: Never write the credential into any file, comment or README. Never create
 a variable whose name starts with VITE_. Never call the upstream from browser code;
 every call happens inside api/. Never print the credential, or any part of it, in a
 response or a log. No new npm packages beyond React and Vite. No database, no login.

CONTEXT: Deployed on Vercel from GitHub. This endpoint needs no credential, so there
 is no environment variable; keyConfigured should report "not required" and the 503
 guard does not apply. Every field in the response comes back as a string, including
 resale_price, whose declared type is numeric. A real response from the endpoint,
 called by hand just now, looks like this:
{
  "success": true,
  "result": {
    "resource_id": "d_8b84c4ee58e3cfc0ece0d773c8ca6abc",
    "fields": [
      {"type": "text", "id": "month"},
      {"type": "text", "id": "town"},
      {"type": "text", "id": "flat_type"},
      {"type": "text", "id": "floor_area_sqm"},
      {"type": "text", "id": "remaining_lease"},
      {"type": "numeric", "id": "resale_price"},
      {"type": "int4", "id": "_id"}
    ],
    "records": [
      {"_id": 1, "month": "2017-01", "town": "ANG MO KIO", "flat_type": "2 ROOM",
       "floor_area_sqm": "44", "remaining_lease": "61 years 04 months",
       "resale_price": "232000"}
    ],
    "total": 240345,
    "limit": 5
  }
}

## Change
Remove the "Important Context for First-Time Buyers" card and the "Estimated Couple
Financing" card entirely; the product must not show any figure that did not come from
the data.gov.sg response. Change the word "Real-time" in the subtitle to "Latest".
Change nothing else.

## Change
On the screen, show three cards side by side — 3 ROOM, 4 ROOM and 5 ROOM — for the
town in ?town= (default TAMPINES). Each card calls /api/resale?town=<town>&type=<type>
on its own and shows the median price, month and transaction count for that flat type.
Each card handles its own four states independently, so one empty type shows the
empty-state sentence while the others still show prices. Remove the ?type= handling
from the page URL; keep it in api/resale.js unchanged. On a phone the three cards
stack vertically. Change nothing else.

## Change
Two changes, nothing else.

1) Remove the "Important Context for First-Time Buyers" card and the "Estimated Couple
Financing" card entirely; the product must not show any figure that did not come from
the data.gov.sg response. Change the word "Real-time" in the subtitle to "Latest".

2) On the screen, show three cards side by side — 3 ROOM, 4 ROOM and 5 ROOM — for the
town in ?town= (default TAMPINES). Each card calls /api/resale?town=<town>&type=<type>
on its own and shows the median price, month and transaction count for that flat type.
Each card handles its own four states independently, so one empty type shows the
empty-state sentence while the others still show prices. Remove the ?type= handling
from the page URL; keep it in api/resale.js unchanged. On a phone the three cards
stack vertically.

Do not change api/resale.js or api/health.js.

## Change
Two changes.

1) In api/resale.js, when ?town= is missing or equals ALL, compute the figure for
all of Singapore without paging: first call the datastore with
filters={"flat_type":<type>}, sort=month desc, limit=1 to learn the latest month;
then call it again with filters={"month":<that month>,"flat_type":<type>} and
limit=10000, and compute the median and count from that. Return town: "ALL".
Leave the existing path for a named town exactly as it is.

2) On the screen, default to all of Singapore, with the heading "Singapore HDB
Resale Prices". Add a dropdown above the three cards labelled "Town", with "All of
Singapore" first and then these 26 towns in this order: ANG MO KIO, BEDOK, BISHAN,
BUKIT BATOK, BUKIT MERAH, BUKIT PANJANG, BUKIT TIMAH, CENTRAL AREA, CHOA CHU KANG,
CLEMENTI, GEYLANG, HOUGANG, JURONG EAST, JURONG WEST, KALLANG/WHAMPOA, MARINE PARADE,
PASIR RIS, PUNGGOL, QUEENSTOWN, SEMBAWANG, SENGKANG, SERANGOON, TAMPINES, TOA PAYOH,
WOODLANDS, YISHUN. Choosing a town updates ?town= in the page URL and reloads the
three cards; opening a URL with ?town= already set selects that town in the dropdown.
The heading shows the chosen town. Change nothing else, and do not touch
api/health.js.

## Change
In the Town dropdown, keep the 26 dataset town values as the values sent to
api/resale, but change three display labels: show CENTRAL AREA as "Central Area
(Bugis, River Valley, Chinatown)", KALLANG/WHAMPOA as "Kallang / Whampoa", and
BUKIT MERAH as "Bukit Merah (Tiong Bahru, Redhill)". Do not add any town that is
not one of the 26; the dataset has no data for it. Change nothing else.

## Change
some of them are all caps, such as YISHUN. make none of them all caps

## Change
I want to make one last change. Remove anything about couples. I want this to be for all first time HDB buyers

## Change
Two changes.

1) In api/resale.js, for both the named-town path and the ALL path, compute three
more figures from the same records already fetched for the latest month, and return
them alongside the existing fields: minPrice and maxPrice (lowest and highest
resale_price); medianPricePerSqm (median of resale_price divided by
Number(floor_area_sqm), rounded to the nearest dollar); and medianRemainingLeaseYears
(parse remaining_lease strings like "61 years 04 months" into years plus months/12,
take the median, round to one decimal). When count is 0, return all of them as null.
Change nothing else in the function and do not touch api/health.js.

2) On each of the three cards, under the median price, show three short lines:
"Range: S$<minPrice> – S$<maxPrice>", "Per sqm: S$<medianPricePerSqm>", and
"Remaining lease: <medianRemainingLeaseYears> years (median)". Format prices with
thousands separators. Show these lines only when data is present; the four state
sentences are unchanged. Change nothing else.

## Change
ROLE: You are a front-end developer working in my existing project. Add to it; do not
rewrite what is already there.

GOAL: Add a Disqus comment section to the bottom of my main page only, so that visitors
can leave feedback on the product in a single thread.

CONTEXT:
- My Disqus shortname is: firsttimehdb-vercel-app
- My live address is: https://firsttimehdb.vercel.app/

OUTPUT: A small component on the main page that loads the Disqus Universal Code once, with
page.url set to my full live address (https, and no query string) and page.identifier set
to the fixed string "home". Put one short line above it inviting visitors to say what
worked for them and what did not.

GUARDRAILS: Load the Disqus script only once, even when the component re-renders. Mount it
on the main page only, so that every comment lands in one thread. Do not change anything
else on the page, and add no npm package without telling me why one is needed.

## Blind Arbiter: Budget Checker Mismatch

### Prompt

ROLE: You are a neutral arbiter between two usability reviewers who rated the same
problem differently. You do not know which of them built the product. Do not try to
work it out.

CONTEXT: The product is an AI-augmented web app for first-time HDB buyers who want
to understand what resale flats are actually selling for in different areas of Singapore.

Both reviewers inspected it against Nielsen's ten usability heuristics and rated the
problem on this severity scale:

0 I don't agree that this is a usability problem at all.
1 Cosmetic problem only. Need not be fixed unless extra time is available.
2 Minor usability problem. Fixing this should be given low priority.
3 Major usability problem. Important to fix, so should be given high priority.
4 Usability catastrophe. Imperative to fix before the product can be released.

A rating rests on four factors: how often the problem happens, what it costs when it
does, whether the person can learn around it, and whether it damages the product's
standing out of proportion.

REVIEWER A:

Where: https://firsttimehdb.vercel.app/, the page heading and the three price cards.

What I did, what I saw: The tab is titled "HDB Resale Budget Checker" and the page says
"Evaluating whether a flat in Singapore fits your housing budget", but there is nowhere
to enter a budget. The user has to keep their own budget in mind and compare it with
the prices shown on the cards.

Which heuristic: 6, Recognition Rather than Recall.

Screen or system: Screen. The page already has the median and range for each flat type,
which is enough to compare against a budget if the user could enter one.

Severity, and why: 2, driven by how often it happens. Every first-time buyer arrives
with a budget and meets this, although they can still compare the numbers in their head.

The repair: A buyer can enter a budget once and see on each card whether it is under,
within or above the typical price.


REVIEWER B:

Where: https://firsttimehdb.vercel.app/, main heading and resale price results.

What I did, what I saw: I opened the site and looked at resale prices for different towns
and flat types. The site says it helps determine whether a flat fits the user's housing
budget, but it does not ask about salary, CPF, grants, loan eligibility, interest rates
or other personal financial information. What it actually does is show resale price
benchmarks using real HDB transaction data.

Which heuristic: 2, Match Between the System and the Real World.

Screen or system: Screen. The current data already supports a resale price benchmark,
so the wording can be changed without changing the API or calculations.

Severity, and why: 3. The wording can give the user the wrong expectation about what
the product actually tells them, especially when they are making a major financial
decision.

The repair: Make it clear that the product shows HDB resale price benchmarks and does
not calculate personal affordability.


EVIDENCE NEITHER REVIEWER CONTROLS:

- Reviewers who raised this problem independently, counting A and B: 3 out of 4.
- Severities that reviewers other than A and B gave this problem: 3.

GOAL: Judge the evidence, not the reviewers.

1. Say whether A and B describe the same problem. If they do not, say so and stop.
2. For each of the four factors, say what the evidence shows and what it cannot show.
3. Give the severity the evidence supports, and name the factor that decided it.
4. Name the one observation that would change your rating, and say how it could be
   collected quickly.

GUARDRAILS: Do not split the difference between A and B unless the evidence puts the
rating there. If the evidence is too thin to decide, say so plainly instead of
inventing a reason. Do not ask which reviewer built the product.

### Claude Response

### 1. Same problem?

Yes. Both reviewers point at the same place, the heading and the price results, and the same defect: the page claims to evaluate whether a flat fits the user's budget, and nothing on it does that. A reads the gap as a missing feature that leaves the user holding their budget in memory. B reads it as a claim that overstates what the product does. These are two consequences of one mismatch, and whoever compiled the tally already counted them as one problem. The different heuristic numbers don't change that.

The two repairs pull in opposite directions, which matters for whoever fixes this but not for the rating. A's repair makes the claim true by adding a budget comparison. B's repair makes the claim match the product. A's version could sharpen B's concern, because a card reading "within budget" is easier to mistake for an affordability verdict than a bare price range is.

### 2. The four factors

**Frequency.** The evidence here is strong and uncontested. The claim sits in the tab title and main heading, so every visitor meets it, and both reviewers agree. The 3-of-4 detection rate adds that the problem is conspicuous rather than something one reviewer happened on. The evidence can't show how many users actually read the heading and form an expectation from it. Reviewers noticing a claim is not users acting on it.

**Impact.** This is the only factor where A and B truly disagree. A's cost is verified by inspection: there is no input, so the user compares a number in their head against three cards. That cost is real but small. B's cost, a buyer relying on the product as an affordability check in a major financial decision, would be serious, but no one observed it. It is an inference from the wording.

The evidence partly weakens the strongest version of B's concern. The page asks for nothing about the user, so it's hard to leave believing it assessed *your* affordability. It does not rule out a subtler misreading: a first-time buyer might accept "sticker price versus my number" as the whole test because the product framed it that way, overlooking loan limits, CPF or grants. Nothing in the evidence says whether that happens.

**Persistence.** For the recall burden, the evidence points to low persistence. The missing input is visible on first use, and the workaround is trivial and learned at once. For the misreading, persistence is unknown. A user who never notices the gap never learns around it, but no one checked.

**Market impact.** There is a plausible argument that a "Budget Checker" with no budget check looks unfinished or overclaiming, and that this weighs more where users must trust the numbers. The high detection rate is consistent with the mismatch being easy to spot. Beyond that it is inference; there is no evidence about how users actually regard the product.

The outside severity of 3 matches B and is the strongest point on that side. It arrives without reasoning, though. (It's also unclear whether it comes from one reviewer or both of the others.) It can't tell us whether that rater saw a cost A and B missed, or weighed the same hypothetical cost the way B did. The fourth reviewer's silence tells us nothing, since missed and dismissed look the same.

Neither reviewer's point about ease of repair (data already present, wording changeable without touching the API) is one of the four factors. Ease of repair bears on priority, not severity.

### 3. Severity: 2, decided by impact

Frequency is high and agreed. Persistence and market impact don't clearly move the rating. It turns on impact, and the only cost the evidence establishes is the small one: a recall burden with an obvious workaround, met by everyone. That is a 2. A 3 needs the costly misreading B describes, and the evidence makes that misreading plausible without showing it. The outside 3 is a judgment, not an observation, and I can't weigh reasoning I can't see.

To be plain, this 2 is a floor. The evidence is thin on exactly the factor that decides the rating. The rating stops at 2 because that is as far as the demonstrated cost reaches, not because 2 is the cautious choice.

### 4. What would change the rating

The observation that matters is whether first-time buyers, after using the page, believe it has told them whether they can afford a flat.

A quick comprehension check would answer it. Recruit five people who fit the profile: first-time buyers, or people planning to buy within a few years. Give each a couple of minutes on the page, asking them to use it as they would at the start of a flat search. Then ask one open question: "Based on what you saw, could you afford a 4-room flat in [a town they looked at]?"

If two or more answer as though the page settled that question for them, the costly misreading is real and the rating moves to 3. If they describe the page as showing what flats sell for, the rating stays at 2. Five people give a signal, not a measurement, but that is enough to settle this particular disagreement. It can be run in an afternoon, remotely with an unmoderated testing tool or as a hallway test.

## Blind Arbiter: Transparency of Resale Price Results

### Prompt

ROLE: You are a neutral arbiter between two usability reviewers who rated the same
problem differently. You do not know which of them built the product. Do not try to
work it out.

CONTEXT: The product is an AI-augmented web app for first-time HDB buyers who want
to understand what resale flats are actually selling for in different areas of Singapore.

Both reviewers inspected it against Nielsen's ten usability heuristics and rated the
problem on this severity scale:

0 I don't agree that this is a usability problem at all.
1 Cosmetic problem only. Need not be fixed unless extra time is available.
2 Minor usability problem. Fixing this should be given low priority.
3 Major usability problem. Important to fix, so should be given high priority.
4 Usability catastrophe. Imperative to fix before the product can be released.

A rating rests on four factors: how often the problem happens, what it costs when it
does, whether the person can learn around it, and whether it damages the product's
standing out of proportion.

REVIEWER A:

Where: https://firsttimehdb.vercel.app/, the resale price cards.

What I did, what I saw: I looked at the median resale price, price range, price per
square foot, remaining lease, month, and transaction count. The numbers are shown
clearly, but the page does not explain how the median and other figures are calculated
or exactly which transactions are included.

Which heuristic: 10, Help and Documentation.

Screen or system: Screen. The calculations already exist in the system, so the page
only needs a short explanation of what the figures mean.

Severity, and why: 2. The user can still use the site, but these are large financial
figures and it should be clear what they are based on.

The repair: Add a short explanation or tooltip saying how the median, range, price per
square foot, remaining lease, and transaction count are calculated.


REVIEWER B:

Where: https://firsttimehdb.vercel.app/, main screen, resale price result.

What I did, what I saw: The product showed a resale price result based on the selected
town and flat type, but I could not see the individual HDB transactions that were used
to produce that result.

Which heuristic: 2, Match Between the System and the Real World.

Screen or system: System. The individual transaction records would need to be made
available to the page before the user could inspect them.

Severity, and why: 3. Two flats in the same area and flat type can have very different
resale prices because of factors such as floor level, remaining lease, size and location.
Showing only the summary means the result should mainly be treated as a rough estimate.

The repair: Allow users to view the individual transactions behind the result, including
information such as block, floor range, resale price, remaining lease and transaction date.


EVIDENCE NEITHER REVIEWER CONTROLS:

- Reviewers who raised this problem independently, counting A and B: 2 out of 4.
- Severities that reviewers other than A and B gave this problem: NONE.

GOAL: Judge the evidence, not the reviewers.

1. Say whether A and B describe the same problem. If they do not, say so and stop.
2. For each of the four factors, say what the evidence shows and what it cannot show.
3. Give the severity the evidence supports, and name the factor that decided it.
4. Name the one observation that would change your rating, and say how it could be
   collected quickly.

GUARDRAILS: Do not split the difference between A and B unless the evidence puts the
rating there. If the evidence is too thin to decide, say so plainly instead of
inventing a reason. Do not ask which reviewer built the product.

### Claude Response

### 1. Do A and B describe the same problem?

Yes. Both describe one underlying problem: **the user cannot see what the summary figures rest on.**

A frames it as missing definitions ("how the median… is calculated or exactly which transactions are included"). B frames it as missing records ("I could not see the individual HDB transactions"). A's phrase "which transactions are included" is where the two overlap. They differ in how much of the basis they think the user needs, and that is a disagreement about the repair and the cost, not about what is wrong.

The different heuristic labels (10 and 2) do not make them different problems. The heuristic is a classification choice and does not bear on severity. Neither does the scope of the repair: A's point that the fix is cheap does not lower the severity, and B's point that it needs system work does not raise it. Severity rates the problem, not the fix.

### 2. The four factors

**Frequency.** The evidence shows the gap is structural. It appears on every result view, for every town and flat type, and two of four reviewers found it independently. It cannot show how often real users notice the gap or need the basis while doing their task. Every user is exposed to it, but it is unknown how often it actually gets in anyone's way.

**Cost when it happens.** This is where A and B disagree, and neither side has observed anything. B's argument is sound in principle: flats of the same town and type vary by floor, lease, and size, so a median is a rough guide. But A's own observation cuts against B's mechanism. The cards already show a price range, price per square foot, remaining lease, and transaction count, and the headline figure is labelled a median. So the page does signal that this is an aggregate with spread and a known sample size. The evidence cannot show whether first-time buyers read those signals, or whether they treat the median as the likely price of a particular flat and budget or bid on it.

**Whether users can learn around it.** Neither reviewer addresses this. Repeated use of the product will not dissolve the gap, since the basis stays hidden. However, a user can learn to treat the figure as approximate, and transaction-level data exists outside the product (HDB publishes resale transactions). The evidence cannot show whether first-time buyers know that source or would think to use it.

**Disproportionate damage to standing.** The case for this is plausible. It is a financial product, and an AI-augmented one, where unexplained numbers may invite suspicion that they are generated rather than computed. But neither reviewer reports that any figure is wrong or that any user distrusted it. A states the calculations exist in the system, which suggests they are deterministic. There is no evidence on this factor either way.

### 3. Severity the evidence supports: 2

**The deciding factor is cost.**

- **0 and 1 are ruled out.** Both reviewers agree the problem is real, it was found twice independently, and the figures inform a large financial decision, so it is more than cosmetic.
- **4 is ruled out.** No one reports that the task cannot be completed or that the figures are wrong.

Between 2 and 3, frequency is high but pushes equally under either rating. The rating turns on cost. A 3 requires a user to misread the summary in a way that leads to a costly decision. That cost is argued, not observed, and the range and transaction count already on the card partly counter it. This does not split the difference; it is A's rating, reached because B's higher rating depends on a claim the evidence does not yet support.

The rating is provisional. The evidence on cost is thin, and thin evidence here points to the lower rating only because the higher one needs a positive showing that is missing.

### 4. The observation that would change the rating

The question is **whether first-time buyers take the median as the price of the specific flat they are considering.**

A quick way to answer it is a five-person think-aloud test, done remotely in a day at about 20 minutes each:

1. Give each participant a concrete scenario, such as a 4-room flat in a named town, high floor, about 70 years of lease left, and ask what they would expect to pay using the site.
2. Afterwards, ask what the median means and what it is based on.
3. Note whether they anchor on the median, whether they use the range and transaction count, and whether they look for the underlying transactions.

If three or more of the five treat the median as their flat's price without adjusting for floor or lease, the cost is established and the rating should move to 3. If most use the range and describe the figure as an area-level guide, 2 stands.

Asking the two other reviewers for their severities would be even faster and is standard practice. It would add opinions, though, not evidence on cost, so it would not settle the deciding factor.
