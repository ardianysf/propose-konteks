# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML/CSS/JS prototype (user chose "interactive HTML prototype" for the pitch). Production app stack is not part of this work.

## Users

Primary for this work: the internal Konteks team (founders, PM, engineers) evaluating a redesign pitch. They must come away convinced the redesign is worth building.

End users of the product (observed in the live app, workspace "Refactory"): software engineers and engineering leads at agencies/consultancies who start "initiatives" against a Software System, let AI agents plan and deliver the work on runtimes they own, and step in at decision points (review a plan, approve a cost estimate, choose a repository, merge). Many users per workspace, each with a role (Engineering Contributor, Delivery Approver, Workspace Owner, and 13 more built-in roles).

## Product Purpose

Konteks ("Governed AI Software Delivery") lets a team hand software work to AI agents while keeping humans in control: every initiative moves through planning → PRD → breakdown into tickets → costed estimate → approval → delivery (PR) → receipt, and nothing runs or costs money until an authorized person approves. Success: people know at a glance what needs them, trust what the agents did, and approve spend with confidence.

## Positioning

- Agents run on the customer's own computers ("runtimes"); Konteks never holds a provider key or account.
- Spend is quoted before it happens ("Nothing runs until you approve"), settled in Story Points with a receipt.
- Governance is first-class: roles, permissions, access requests, audit.

## Operating Context

Core objects: Workspace, Software System, Initiative, PRD, Breakdown, Ticket, Estimate/Quote, Delivery, PR, Receipt, Story Points, Runtime, Workloads, VCS connectors, Ops channels, Skills, Tools, MCPs, Context files. UI in English and Indonesian.

## Capabilities and Constraints

- Approval is permission-gated (Delivery Approver role).
- Sign-in (live): Backstage sign-in page with the Google provider only.

## Brand Commitments

- Keep the existing base colour family: matcha/olive greens (#4F7044, #5F8D4E, #8FBF6A), warm off-white ground (#FAF8EF), deep green-black ink (#243025), amber #9A6212, danger #B3261E, blue #2F6F8F. (User-pinned.)
- Name: Konteks. Voice: plain, reassuring about safety.

## Evidence on Hand

- Full UI/UX audit of the live app. No real customer data; all demo data synthetic and labeled.

## Product Principles

1. Show who must act, and why, before anything else.
2. Money and agent work never start without a visible, authorized decision.
3. One status truth per object.
4. Human summary first, agent trace on demand.
5. Governance is visible, not buried.

### Direction preference (user, 2026-10-27)

Keep every existing process and flow; make the UI dramatically better, not different. Craft bar = Linear.
