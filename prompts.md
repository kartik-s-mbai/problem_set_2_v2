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
In the Town dropdown, keep the 26 dataset town values as the values sent to
api/resale, but change three display labels: show CENTRAL AREA as "Central Area
(Bugis, River Valley, Chinatown)", KALLANG/WHAMPOA as "Kallang / Whampoa", and
BUKIT MERAH as "Bukit Merah (Tiong Bahru, Redhill)". Do not add any town that is
not one of the 26; the dataset has no data for it. Change nothing else.

## Change
some of them are all caps, such as YISHUN. make none of them all caps
