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

## Blind Arbiter: Missing Price Range and Transaction Count

### Prompt

ROLE: You are a neutral arbiter between two usability reviewers who rated the same
claimed problem differently. You do not know which of them built the product. Do not
try to work it out.

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

Where: https://firsttimehdb.vercel.app/, main screen, resale price result.

What I did, what I saw: After receiving the resale price result, I wanted to understand
how much actual flats in that category varied in price. The product only showed the
average, so I could not tell whether most flats were close to that number or whether
the actual prices were spread across a wide range.

Which heuristic: 1, Visibility of System Status.

Screen or system: Screen. The page could show more information beside the main price
result.

Severity, and why: 2. The main result gives the user a useful starting point, but without
the range or number of transactions it is difficult to understand how representative
the estimate actually is.

The repair: Show additional information beside the main result, such as the lowest
price, highest price, median price and number of transactions used in the calculation.


REVIEWER B:

Where: https://firsttimehdb.vercel.app/, the 3 Room, 4 Room and 5 Room resale price cards.

What I did, what I saw: I repeated the same check on the live site. Each result card
already showed a headline labelled "Median Resale Price", a minimum-to-maximum price
range, and the number of transactions used. For example, the Bukit Timah 3 Room card
showed a median of $480,000, a range of S$480,000 to S$480,000, and 1 transaction.
The same types of information were visible on the other result cards.

Which heuristic: 1, Visibility of System Status.

Screen or system: Screen. The information described as missing is already displayed
directly on the result cards.

Severity, and why: 0. I do not agree that the claimed usability problem is present on
the live site because the median, range and transaction count are already visible.

The repair: No repair for this specific finding. Keep the median, range and transaction
count visible on each result card.


EVIDENCE NEITHER REVIEWER CONTROLS:

- Groupmates who raised this problem independently: 1 out of 3 groupmates who reviewed
  the product.
- Severities that reviewers other than A and B gave this problem: NONE.

GOAL: Judge the evidence, not the reviewers.

1. Say whether A and B describe the same claimed problem. If they do not, say so and stop.
2. For each of the four factors, say what the evidence shows and what it cannot show.
3. Give the severity the evidence supports, and name the factor that decided it.
4. Name the one observation that would change your rating, and say how it could be
   collected quickly.

GUARDRAILS: Do not split the difference between A and B unless the evidence puts the
rating there. If the evidence is too thin to decide, say so plainly instead of inventing
a reason. Do not ask which reviewer built the product.

### Claude Response

### 1. Same claimed problem?

Yes. Both reviewers are describing the same element, the resale price result, and the same claim: that the result doesn't show enough to judge how representative the headline price is (spread and number of transactions). A's proposed repair (lowest, highest, median, count) matches, item for item, what B says is already on the card. So they aren't disagreeing about how bad the problem is. They're disagreeing about whether it exists. Both chose heuristic 1, so the heuristic isn't in dispute.

I fetched the live URL to see whether it could settle this. It returned only the page shell, because the result cards render in the browser after a query. The page's own meta description says the product shows "median resale price and transaction volume." That supports B on two of the four items. It doesn't mention the range, and it only reflects the current deployment, not whatever A saw.

### 2. The four factors

**Frequency.** If the information were missing, this would hit every result for every user who wants to judge representativeness, so frequency would be high. But the evidence on whether it's missing favours B. B gives a specific, checkable instance (Bukit Timah 3 Room, $480,000, range S$480,000–S$480,000, 1 transaction) and says it holds across cards. A gives no town, flat type, or figure. A also calls the number an "average" when, per B, the card is labelled "Median Resale Price," which suggests A either read the card loosely or saw a different version. Only 1 of 3 groupmates raised the problem, and the prompt doesn't say whether that one is A. What the evidence can't show is whether A saw an earlier build, a different viewport such as mobile, or an edge-case state where the range and count really don't render.

**Impact.** If the information were absent, the cost would be real but moderate. A first-time buyer could anchor on one number without knowing whether flats sell tightly around it or across a wide band. That cost disappears if the information is present. The evidence can't show whether any user has actually misjudged a budget this way.

**Persistence.** If the information were absent, users couldn't learn around it inside the product, because no amount of familiarity reveals data that isn't there. If it's present and A simply overlooked it, a second look at the same card would fix that. There's no evidence on whether real users notice the range and count.

**Market impact.** For a product whose whole purpose is price transparency, appearing to hide spread would hurt trust out of proportion. That only applies if the claim is true, and the evidence can't show how users or anyone else perceive the product.

### 3. Rating

**0, decided by frequency.** The evidence indicates the claimed condition doesn't occur on the live product. B's observation is specific and reproducible, A's isn't, and the product's own metadata supports B on median and count. The only uncertainty is A's unexplained observation, which could reflect an older build or an untested state. That keeps 0 from being certain, but it doesn't justify 1. Nobody has produced evidence of a cosmetic version of this problem, so rating 1 would just be splitting the difference.

Two related issues should stay out of this rating. First, if the information turns out to be present but easy to overlook, that's a different problem about salience, not absence, and it needs its own finding and evidence. Second, B's own example shows a separate candidate problem: a headline "median" built from a single transaction, with the range collapsed to one number and no warning. For a first-time buyer, that may be the more serious representativeness issue. It deserves its own write-up rather than being folded into this one.

### 4. The observation that would change the rating

The observation would be **a result card on the live site, for any town, flat type, or screen width, that shows the price without the range and transaction count.** If one turns up, the rating should rise to about 2, the level A argued, because A's impact reasoning is sound and nothing contradicts it.

It's quick to collect. Ask A for the exact town and flat type they queried, then run that query plus a handful of others (including a low-volume town and a phone-width viewport) and screenshot each card. Whoever has Vercel access can also check the deployment history to see whether the range and count were added after A's review. That would explain both reports without either reviewer being wrong.

# Problem Set 4 — Step 5 Revision Prompts

## Repair 1: Low Sample Size in Resale Benchmarks

### Sceptical Review Prompt

ROLE: You are a sceptical senior developer and usability reviewer working in my
existing project. Before you write any code, your job is to argue against the repair
I propose.

CONTEXT:
- Live address: https://firsttimehdb.vercel.app/
- Who the product is for, and what it does for them: First time HDB buyers who want
to understand what resale flats are actually selling for in different areas of Singapore.

- The finding, in its six lines:

Where: https://firsttimehdb.vercel.app/, the 3 Room, 4 Room and 5 Room resale price cards.

What I did, what I saw: I selected Bukit Timah. The 3 Room card showed a median resale
price of $480,000 based on 1 transaction, and the 4 Room card showed $930,000 based
on 1 transaction. The 5 Room card was based on only 3 transactions. All figures were
from the current unfinished month, September 2026.

Which heuristic: 1, Visibility of System Status.

Screen or system: System. The benchmark is calculated from only the latest month, so
low-volume towns can produce a median from one or two sales.

Severity, and why: 3, driven by impact and damage to trust. A first time buyer may
interpret a single sale as a meaningful town benchmark.

The repair: When the current month has a very small number of transactions, the user
should be clearly warned that the benchmark is based on a low sample size and should
be treated with caution.

- The evidence behind it: 2 of 3 groupmates raised this problem independently.
- The repair I propose: Keep the existing calculations, but show a clear low sample
warning whenever a result is based on fewer than 5 transactions.

GOAL: Argue against my repair.
1. Does it solve the problem the finding describes, or a problem I already believed I had?
2. Does the problem belong to the screen or to the system, and does my repair sit in the right half?
3. Name one heuristic this repair could break while it serves the one above, and how.
4. Propose the smallest alternative that would make the same thing true.
5. Tell me exactly what to do on the live address to check that the repair worked.

OUTPUT: Your arguments first, as a numbered list. Then stop. Write no code until I
reply with the repair I have chosen.

GUARDRAILS: Do not tell me the repair is good. If you have no strong reason to doubt
it, say so plainly instead of inventing one. When I do ask you to build, change only
what the repair needs. Do not remove Disqus or the privacy notice, and do not break
/api/health.

### AI Studio Response

1. **Does it solve the problem the finding describes, or a problem you already believed you had?**  
   It solves a problem of disclosure, not the user problem identified in the finding. The user problem is that first-time buyers come to the site to find a dependable benchmark for budgeting, and the site gives them a volatile figure (e.g. $480,000 for a 3-room in Bukit Timah) that represents a single transaction rather than an actual market median. The card *already* displays the exact transaction count right beneath the price (e.g. "1 transaction recorded in 2026-09"). Two of your groupmates still flagged the issue because presenting an unrepresentative single data point as the primary headline figure in 36px bold text undermines credibility, regardless of fine print. A warning banner simply shifts the cognitive burden to an anxious buyer to guess what to do with a number the system itself admits is untrustworthy.

2. **Does the problem belong to the screen or to the system, and does your repair sit in the right half?**  
   The problem belongs firmly to the **system**, but your proposed repair sits entirely on the **screen**. The root cause is the backend query logic (/api/resale), which restricts the aggregation strictly to month = latest_available_month, even when that month is incomplete or has near-zero volume for smaller estates. Applying a screen-side warning banner is a cosmetic band-aid on a pipeline defect: it leaves the brittle data model intact and uses UI real estate to apologize for it.

3. **Name one heuristic this repair could break while it serves the one above, and how.**  
   **Heuristic 5: Error Prevention** (and secondarily **Heuristic 8: Aesthetic and Minimalist Design**).
   - By continuing to render an invalid statistical outlier as a prominent price headline, the interface fails to prevent cognitive anchoring. In housing decisions, users involuntarily anchor on the first bold dollar figure they see, even when a disclaimer is placed next to it.
   - Visually, adding warning containers across multiple cards (in estates like Bukit Timah or Marine Parade where all 3 flat types often have < 5 transactions) clutters the cards with alarmist banners alongside existing badges, range lines, and lease metadata, breaking minimalist visual hierarchy.

4. **Propose the smallest alternative that would make the same thing true.**
   - **System alternative (recommended, minimal code change in server.ts):** When the latest month yields fewer than 5 records for a town/type combination, have the query aggregate over a trailing 3-month window (e.g., July–September 2026). This produces an authentic, statistically grounded median without needing any new warning UI.
   - **Screen alternative (if backend logic must remain untouched):** When count < 5, suppress the prominent "Median Resale Price" label and giant dollar figure entirely, replacing it with a clean neutral state: e.g. "Insufficient volume in [Month] to establish a median benchmark (fewer than 5 transactions)" or label it directly as "Last recorded transaction: $X" rather than presenting it as a "Median".

5. **Tell me exactly what to do on the live address to check that the repair worked.**
   1. Navigate to https://firsttimehdb.vercel.app/.
   2. Open the **Town** dropdown and select **Bukit Timah** (or **Marine Parade**).
   3. Inspect the **3 ROOM** and **4 ROOM** cards (which currently show 1 transaction for the latest month).
   4. Verify that the low-sample treatment is visible, accurate, and cleanly aligned without breaking card heights or layout symmetry across the 3-column grid.
   5. Switch the dropdown back to **Tampines**, **Woodlands**, or **All of Singapore** (where counts well exceed 5) and verify that the normal median presentation displays without any warning or degradation.

### My Decision

I choose the system repair.

If the latest available month has fewer than 5 transactions for a town and flat type, aggregate the most recent 3 months of available transactions for that same town and flat type instead.

The card must clearly show the actual period used, for example "July–September 2026", and the transaction count must reflect that full period.

If the latest month has 5 or more transactions, keep the current latest-month behavior unchanged.

Change only what is required for this repair. Do not change the layout, styling, Disqus, privacy notice, or any unrelated functionality. Do not break /api/health.

### AI Studio Implementation Response

The system repair has been implemented:

- **Aggregation Logic (/api/resale)**:
  - When the latest available month has **5 or more transactions** (e.g., high-volume towns like Tampines), the response retains the current single-month benchmark (2026-09) and count.
  - When the latest available month has **fewer than 5 transactions** for a town and flat type, the endpoint aggregates the transactions from the trailing 3-month window (e.g., July–September 2026).
  - The calculated median price, price range, price per sq ft/sqm, and remaining lease are computed across this full 3-month period.
- **Card Display**:
  - The badge and transaction footer display the exact period used (e.g., "July–September 2026" for Bukit Timah 3 Room, 4 Room, and 5 Room).
  - The transaction counter reflects the total transactions recorded across that entire 3-month period.
- **Guardrails**:
  - Styling, grid layout, Disqus integration, and privacy notice remain intact.
  - /api/health continues to return 200 OK.
  - Type checking, compilation, and production builds completed cleanly.

### Live Check and Follow-Up

I tested the revised product on the live address.

Tampines continued to use September 2026 because its flat types had more than 5 transactions.

Bukit Timah correctly switched to the July–September 2026 fallback period. However, the 3 Room result still had only 2 transactions and the 4 Room result still had only 4 transactions after expanding the period to three months.

The system repair therefore improved the sample size, but did not completely eliminate the low-sample problem for very low-volume categories.

### Follow-Up Safeguard Prompt

The 3-month fallback is working correctly, but the live test shows that some low-volume categories still have fewer than 5 transactions even after the fallback.

Keep the current 3-month fallback exactly as implemented.

Add one additional safeguard only:
If the final 3-month transaction count is still fewer than 5, show a short warning on that card saying:

"Low sample size: based on fewer than 5 transactions. Use this benchmark with caution."

Do not show the warning when the final count is 5 or more.

Change nothing else. Do not alter the aggregation logic, layout, Disqus, privacy notice, or /api/health.

### AI Studio Response

The safeguard has been added:

- **Condition**: On any flat type card where the final transaction count is fewer than 5 (even after the 3-month aggregation window), a warning callout is displayed:
  > *"Low sample size: based on fewer than 5 transactions. Use this benchmark with caution."*
- **Suppression**: When the final count is 5 or more (e.g. Bukit Timah 5 Room with 7 sales, or Tampines with 78 sales), no warning is rendered.
- **Integrity**: Aggregation logic in /api/resale, card layouts, Disqus, privacy notices, and /api/health (verified returning status 200) remain unchanged. Production assets compiled cleanly.

### Final Verification

On the live address:

- Bukit Timah 3 Room showed the July–September 2026 fallback with 2 transactions and the low-sample warning.
- Bukit Timah 4 Room showed the July–September 2026 fallback with 4 transactions and the low-sample warning.
- Bukit Timah 5 Room showed 7 transactions and did not display the warning.
- High-volume towns continued to use the latest month and did not display the warning.
- Disqus remained functional.
- /api/health continued to work.


## Repair 2: Budget Wording Mismatch

### Sceptical Review Prompt

ROLE: You are a sceptical senior developer and usability reviewer working in my
existing project. Before you write any code, your job is to argue against the repair
I propose.

CONTEXT:
- Live address: https://firsttimehdb.vercel.app/
- Who the product is for, and what it does for them: First time HDB buyers who want
to understand what resale flats are actually selling for in different areas of Singapore.

- The finding, in its six lines:

Where: https://firsttimehdb.vercel.app/, main screen introduction.

What I did, what I saw: The page says it is "Evaluating whether a flat in Singapore fits
your housing budget," but there is no place to enter a budget and the tool does not
calculate whether a flat is affordable for a particular user. It shows resale price
benchmarks by town and flat type.

Which heuristic: 2, Match Between the System and the Real World.

Screen or system: Screen. The functionality works, but the wording describes a broader
job than the product actually performs.

Severity, and why: 2. Two groupmates independently noticed the mismatch. A blind
arbiter also rated it 2 because the wording can create the wrong expectation, although
there was no evidence that users made a costly affordability decision because of it.

The repair: Change the introductory wording so it accurately describes the product as
a resale price checking tool rather than implying that it evaluates a user's personal budget.

- The evidence behind it: 2 of 3 groupmates raised this problem independently, and the
blind arbiter rated it severity 2.

- The repair I propose: Replace the current sentence
"Evaluating whether a flat in Singapore fits your housing budget."
with:
"Check what HDB resale flats are actually selling for by town and flat type."

Keep the title "Singapore HDB Resale Prices" unchanged.

GOAL: Argue against my repair.
1. Does it solve the problem the finding describes, or a problem I already believed I had?
2. Does the problem belong to the screen or to the system, and does my repair sit in the right half?
3. Name one heuristic this repair could break while it serves the one above, and how.
4. Propose the smallest alternative that would make the same thing true.
5. Tell me exactly what to do on the live address to check that the repair worked.

OUTPUT: Your arguments first, as a numbered list. Then stop. Write no code until I
reply with the repair I have chosen.

GUARDRAILS: Do not tell me the repair is good. If you have no strong reason to doubt
it, say so plainly instead of inventing one. When I do ask you to build, change only
what the repair needs. Do not remove Disqus or the privacy notice, and do not break
/api/health.

### AI Studio Response

1. **Does it solve the problem the finding describes, or a problem you already believed I had?**  
   It solves the symptom identified in the finding—that the site overpromises a personalized affordability/budget evaluation calculator that does not exist—but it does so by retreating into generic marketing copy. Notice that the current implementation dynamically reflects the user's active context: "Evaluating whether a flat in {isAllSingapore ? 'Singapore' : chosenTownDisplay} fits your housing budget." Hardcoding "Check what HDB resale flats are actually selling for by town and flat type." discards that locality awareness. It replaces a misleading verb with a generic imperative that repeats what the user can already see from the dropdown and cards.

2. **Does the problem belong to the screen or to the system, and does your repair sit in the right half?**  
   The finding classifies this as a **screen** issue, and your repair sits on the screen. However, from a product positioning perspective, the mismatch exists because your branding badge above the heading still declares "First-Time Buyer Guide". If the system is merely a read-only viewer for data.gov.sg percentiles, stripping the word "budget" from the screen solves the literal copy discrepancy, but leaves the underlying system mismatch intact: first-time buyers need affordability guidance, and the system still offers only raw median benchmarks.

3. **Name one heuristic this repair could break while it serves the one above, and how.**  
   **Heuristic 8: Aesthetic and Minimalist Design (Unnecessary Redundancy)**.
   - The page heading is already "[Town] HDB Resale Prices", the selector directly underneath is labeled "Town", and the three primary cards are explicitly titled "3 ROOM", "4 ROOM", and "5 ROOM".
   - Adding the sentence *"Check what HDB resale flats are actually selling for by town and flat type"* describes the visual interface elements in words rather than communicating actual utility or data provenance. It adds textual clutter without providing new information.
   - Alternatively, it impairs **Heuristic 1: Visibility of System Status**, because eliminating the active town name from the subheader removes an immediate reassurance that the page context has updated to the selected estate.

4. **Propose the smallest alternative that would make the same thing true.**  
   Keep the dynamic locality binding and simply replace the inaccurate verb phrase with a factual descriptive statement:
   - Change:  
     Evaluating whether a flat in {isAllSingapore ? 'Singapore' : chosenTownDisplay} fits your housing budget.
   - To:  
     Recent resale flat transaction prices and benchmarks across {isAllSingapore ? 'Singapore' : chosenTownDisplay}.  
     This is a one-sentence edit that eliminates the false promise of personal budget evaluation while preserving contextual town responsiveness.

5. **Tell me exactly what to do on the live address to check that the repair worked.**
   1. Navigate to https://firsttimehdb.vercel.app/.
   2. Inspect the introductory paragraph (#page-subheading) directly below the main heading "Singapore HDB Resale Prices".
   3. Confirm that "Evaluating whether a flat in Singapore fits your housing budget." has been removed and replaced with the agreed text.
   4. Switch the Town dropdown from **All of Singapore** to **Bukit Timah** (and **Bedok**), verifying that the text is legible, does not cause jarring reflow or overlap with the dropdown, and that the cards below continue to fetch and render normally.

### My Decision

I accept the smaller alternative.

Replace the current subheading:

"Evaluating whether a flat in {isAllSingapore ? 'Singapore' : chosenTownDisplay} fits your housing budget."

with:

"Recent resale flat transaction prices and benchmarks across {isAllSingapore ? 'Singapore' : chosenTownDisplay}."

Keep the dynamic town name behavior.

Change only this wording. Do not change the title, layout, styling, data logic, Disqus, privacy notice, or any unrelated functionality. Do not break /api/health.

### AI Studio Implementation Response

The repair has been implemented:

- **Subheading Wording**: Updated the first sentence of the introduction in src/App.tsx from:
  > *"Evaluating whether a flat in {isAllSingapore ? 'Singapore' : chosenTownDisplay} fits your housing budget."*
  to:
  > *"Recent resale flat transaction prices and benchmarks across {isAllSingapore ? 'Singapore' : chosenTownDisplay}."*
- **Integrity**:
  - Dynamic town naming behavior (Singapore vs. selected town display name) is preserved.
  - Page title, layout, styling, data aggregation, Disqus discussion thread, and privacy notice remain intact.
  - /api/health verified returning status 200. TypeScript compilation and production build completed without errors.

### Verification

The revised subheading correctly describes the product as a resale transaction price and benchmark tool rather than implying that it calculates personal affordability.

The selected town remains dynamically reflected in the wording.


## Repair 3: Currency and Date Formatting Consistency

### Sceptical Review Prompt

ROLE: You are a sceptical senior developer and usability reviewer working in my
existing project. Before you write any code, your job is to argue against the repair
I propose.

CONTEXT:
- Live address: https://firsttimehdb.vercel.app/
- Who the product is for, and what it does for them: First time HDB buyers who want
to understand what resale flats are actually selling for in different areas of Singapore.

- The finding, in its six lines:

Where: https://firsttimehdb.vercel.app/, the resale price result cards.

What I did, what I saw: The cards use inconsistent currency and date formats. The main
median price uses "$" while the range and per-square-foot values use "S$". High-volume
results show dates such as "September 2026 (2026-09)" in the badge and "recorded in
2026-09" in the footer, while low-volume fallback results show a human-readable period
such as "July–September 2026".

Which heuristic: 4, Consistency and Standards.

Screen or system: Screen. The underlying data is correct, but the same types of
information are displayed in different formats.

Severity, and why: 2. The inconsistency does not prevent use, but it makes the cards
look less polished and forces the user to interpret multiple formats for the same
currency and date information.

The repair: Use one consistent currency and date format across every result card.

- The evidence behind it: 1 of 3 groupmates raised this problem.
- The repair I propose:
  1. Use "S$" for the headline median resale price as well as all supporting price figures.
  2. For a single-month result, show "September 2026" in the badge and
     "recorded in September 2026" in the footer.
  3. For a multi-month result, keep the human-readable period such as
     "July–September 2026" in both the badge and footer.
  4. Remove technical YYYY-MM strings such as "2026-09" from the visible cards.

GOAL: Argue against my repair.
1. Does it solve the problem the finding describes, or a problem I already believed I had?
2. Does the problem belong to the screen or to the system, and does my repair sit in the right half?
3. Name one heuristic this repair could break while it serves the one above, and how.
4. Propose the smallest alternative that would make the same thing true.
5. Tell me exactly what to do on the live address to check that the repair worked.

OUTPUT: Your arguments first, as a numbered list. Then stop. Write no code until I
reply with the repair I have chosen.

GUARDRAILS: Do not tell me the repair is good. If you have no strong reason to doubt
it, say so plainly instead of inventing one. When I do ask you to build, change only
what the repair needs. Do not remove Disqus or the privacy notice, and do not break
/api/health.

### AI Studio Response

1. **Does it solve the problem the finding describes, or a problem you already believed I had?**  
   It directly targets the inconsistency noted in the finding, but it makes an unvalidated assumption about *which* standard to enforce. In Singapore, local property portals and government agencies (HDB, URA) routinely use $ rather than S$ because there is no domestic ambiguity. Adding S$ to the headline median price lengthens high-figure numbers (e.g., S$1,180,000), which increases line wrapping pressure on mobile viewports. Furthermore, completely stripping the YYYY-MM technical string removes the exact query key needed if an analytical buyer wishes to cross-reference records against the raw data.gov.sg datastore.

2. **Does the problem belong to the screen or to the system, and does your repair sit in the right half?**  
   The problem belongs squarely to the **screen** (presentation layer in src/App.tsx), and your repair sits in the right half. The API already delivers clean numeric figures and month/period identifiers; the discrepancy exists solely because formatCurrency uses standard en-SG locale ($), while the details block hardcodes S$, and the footer bypasses formatMonth to print raw data.month.

3. **Name one heuristic this repair could break while it serves the one above, and how.**  
   **Heuristic 8: Aesthetic and Minimalist Design (Redundancy and Visual Density)**.
   - If a card displays "September 2026" in the top-right header badge and then repeats "recorded in September 2026" in the footer box directly below the price, the exact same human-readable date string appears twice within a 150px vertical span on the same card.
   - Additionally, prefixing S$ to the text-3xl sm:text-4xl font-black headline expands the headline bounding box, crowding the visual hierarchy on narrow mobile viewports (360px and below).

4. **Propose the smallest alternative that would make the same thing true.**
   - **Currency**: Unify on standard domestic $ rather than S$. Drop the manual "S" from the Range and Per-sq-ft labels (Range: $..., Per sq ft: $...) so all currency figures cleanly match the output of Intl.NumberFormat('en-SG').
   - **Date**: Create a single helper function getDisplayPeriod(monthStr):
     - If it matches YYYY-MM, format it as "September 2026".
     - If it is already a range (e.g., "July–September 2026"), pass it through.
     - Use this single formatted string in both the badge and the footer.

5. **Tell me exactly what to do on the live address to check that the repair worked.**
   1. Navigate to https://firsttimehdb.vercel.app/ with default town ("All of Singapore") or "Tampines".
   2. Verify that the currency prefix on the headline median price (#price-4-room), the range line (#range-4-room), and the per-sq-ft line (#persqft-4-room) are completely uniform.
   3. Check the badge (#badge-month-4-room) at the top right: confirm it reads "September 2026" without (2026-09).
   4. Check the footer: confirm it reads "recorded in September 2026" rather than "recorded in 2026-09".
   5. Switch the town dropdown to **Bukit Timah**: confirm that low-volume cards with fallback periods show "July–September 2026" in both the badge and the footer, with matching currency formatting.

### My Decision

I accept the smaller alternative.

Make the following screen-level consistency changes only:

1. Use "$" consistently for all visible currency values on the result cards.
   - Keep the headline median price as "$".
   - Change the Range and Per sq ft values from "S$" to "$".

2. Use one human-readable date format everywhere.
   - For a single-month result, show "September 2026" in both the badge and footer.
   - For a multi-month fallback result, show the existing human-readable range such as "July–September 2026" in both the badge and footer.
   - Remove visible technical YYYY-MM strings such as "2026-09" from the cards.

Change only this presentation formatting. Do not change the aggregation logic, calculations, layout, Disqus, privacy notice, or any unrelated functionality. Do not break /api/health.

### AI Studio Implementation Response

The presentation formatting changes have been applied:

1. **Currency Consistency**:
   - The headline median resale price retains the standard domestic $ prefix (e.g., $671,500).
   - Range and Per-sq-ft figures now consistently use $ instead of S$ (e.g., Range: $580,000 – $760,000, Per sq ft: $625).

2. **Date Format Standardization**:
   - Single-month results display the human-readable month and year (e.g., "September 2026") in both the top-right badge and the footer ("recorded in September 2026").
   - Multi-month fallback results display the human-readable range (e.g., "July–September 2026") in both the badge and the footer ("recorded in July–September 2026").
   - Technical YYYY-MM strings (such as "2026-09") have been removed from the user-facing cards.

All aggregation logic, calculations, layout, Disqus integration, privacy notice, and /api/health remain intact and functional.

### Final Verification

The live product was checked after the change.

High-volume towns display:
- "$" consistently across the headline price, range and per-square-foot figures.
- A human-readable single-month period such as "September 2026".
- No visible technical YYYY-MM date strings.

Bukit Timah displays:
- "$" consistently across all currency figures.
- "July–September 2026" consistently for the fallback period.
- Low-sample warnings for the 3 Room and 4 Room cards.
- No low-sample warning for the 5 Room card because the fallback contains 7 transactions.

Disqus and /api/health remain functional.
