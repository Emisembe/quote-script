# Upgrading to an AI that writes its own answers

Read this only when the user wants free-form answers beyond their question list. The FAQ chat in
this skill stays the front end; an AI becomes the fallback for questions the list can't match.

## Why a Blogger theme can't call an AI service directly

Everything in a theme is public: anyone can open the page source. An AI API key placed there can be
copied and used to run up the owner's bill. The key must live on a server the visitor can't read.

## The usual free setup: Google Apps Script as the go-between

1. A Google Apps Script web app (on the organisation's Google account) holds the API key in
   *Script properties*, never in the code.
2. The chat sends the visitor's question to the web app URL; the script calls the AI with:
   - the organisation's own question-and-answer list and key pages as the only knowledge,
   - an instruction to answer only from that material, say "I don't know" otherwise, and hand over
     to WhatsApp/Call for anything about the visitor's own case.
3. The script returns the answer; the chat shows it with a short "general information" note.

Protections to build in:
- A **monthly spending cap** at the AI provider, and a per-visitor limit in the script (e.g. 10
  questions per hour, using CacheService) against abuse.
- A **privacy notice** in the chat: people may type personal details (grievances, health). In Kenya
  the Data Protection Act, 2019 applies; elsewhere the local equivalent. Don't store conversations
  unless the organisation has decided to and says so.
- **Keep the FAQ answers first.** They are free, instant and checked by a person; the AI only answers
  what the list can't.

## Costs and risks to tell the user plainly

- Every AI answer costs a little money; small per question, but it adds up with traffic.
- An AI can be confidently wrong. On legal, employment, medical or money questions that matters;
  that is why answers must be grounded in the organisation's own material and hand over to people.
- It needs someone to own it: the API key, the spending cap, and reviewing what it says.

## Alternative: a hosted chat service

Services such as Tidio or Chatbase offer AI chat bubbles pasted into an HTML gadget. Quick to set up;
free plans are limited, conversations sit with that company, and it is a third-party widget on the
site. Mention it as an option; don't recommend it over the free FAQ chat by default.
