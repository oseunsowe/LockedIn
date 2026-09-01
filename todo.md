I researched free/open-source Figma and design-system resources that can accelerate a production-quality LockedIn design system. I would **not copy existing kits directly**; we should use them as foundations and build a proprietary design language on top.

Useful foundations:

* Figma provides free mobile UI kits that are structured with reusable components and customizable design systems. ([Figma][1])
* Nucleus UI Lite is a free Figma component system with variants, variables, dark mode, and commercial-use friendly components. ([Gumroad][2])
* Finmori is an open-source design system example showing how Figma designs can map toward production React Native/web components. ([GitHub][3])
* React Native UI Kitten provides reusable React Native components and theming patterns that can inspire implementation consistency. ([GitHub][4])
* figma-to-mobile demonstrates a workflow for converting Figma structures into SwiftUI, UIKit, and Compose implementations, which fits our handoff goal. ([GitHub][5])

Now I would create the LockedIn design system differently from normal productivity apps.

---

# LOCKEDIN DESIGN SYSTEM v1.0

## Design Philosophy

### "A game interface disguised as a productivity tool."

The user should feel:

"I am progressing."

Not:

"I have unfinished tasks."

---

# 1. Design Language

## Product Category

Gamified personal development.

Visual references:

* Apple Fitness rings
* Duolingo streak psychology
* RPG character progression
* Premium fintech dashboards
* Modern AI interfaces

---

# 2. Design Tokens

## Colors

### Core Background

Midnight

`#07090D`

Purpose:

Focus mode.

---

### Surface

Carbon

`#11151C`

Cards.

---

### Primary Energy

Electric Indigo

`#635BFF`

AI + intelligence.

---

### Achievement Gold

`#FFC857`

Rewards.

---

### Growth Green

`#34D399`

Completed missions.

---

### Danger Red

`#EF4444`

Failed commitments.

---

### XP Gradient

Purple → Blue

Used only for progression.

---

# 3. Typography

## Display

SF Pro Display / Inter

---

## Levels

Example:

LEVEL 24

Large:

48px

---

## Mission Titles

22px

---

## Body

16px

---

# 4. Core Components

## Component 001

# Mission Card

The most important UI component.

Variants:

### Active Mission

Shows:

* mission name
* difficulty
* timer
* XP reward
* proof requirement

Example:

```
🔥 MAIN QUEST

Launch Website

Epic Difficulty

02:34:20 Remaining


Proof Required

📸 Screenshot
🎤 Voice
💻 URL


+500 XP
```

---

## Component 002

# XP Progress Ring

Center of dashboard.

Example:

```
      82%

  Execution Score

 Level 18 → Level 19
```

---

## Component 003

# Player Avatar

The user becomes the character.

States:

Beginner

Builder

Executor

Master

Legend

---

## Component 004

# AI Companion

Not chatbot.

A visual companion.

Examples:

"Mission risk detected"

"Great execution today"

"Your consistency improved"

---

## Component 005

# Achievement Badge

Examples:

🏆

First Mission

🔥

30 Day Streak

⚡

Deep Focus Master

---

# 5. Animation System

Critical.

The app should feel alive.

---

## Mission Complete

Animation:

* XP explosion
* badge unlock
* progress increase

---

## Level Up

Full-screen moment:

"LEVEL 25 UNLOCKED"

---

## Failed Mission

No shame.

Animation:

"Recovery Mode Activated"

---

# 6. Main Screen Architecture

## Home

The user's command center.

---

Layout:

```
--------------------------------

Good Evening, David

Level 18 Builder

████████░░

82% Execution Score


TODAY'S MISSIONS


🔥 Main Mission

Build Landing Page


Side Missions


Workout

Read


--------------------------------
```

---

# 7. Screen Designs

## Screen 1

# Welcome Experience

Goal:

Convert visitor into user.

---

Hero:

Character standing in futuristic mission environment.

Text:

"Your goals deserve execution."

Buttons:

START JOURNEY

IMPORT SCREENSHOTS

SPEAK YOUR GOALS

---

# Screen 2

# Identity Builder

Cards:

```
Who are you becoming?

Developer
Founder
Creator
Athlete
Student
Professional
```

---

Interaction:

Cards float.

Selected card upgrades avatar.

---

# Screen 3

# Screenshot Intelligence

This should be a signature screen.

---

Design:

Camera roll preview.

AI scanning animation.

Text:

"Finding unfinished goals..."

---

Result:

```
Found:

23 hidden intentions


12 Career

6 Learning

5 Business
```

---

Button:

"Turn Into Missions"

---

# Screen 4

# Mission Board

This is the heart.

---

Top:

Player stats.

Middle:

Main Quest.

Bottom:

Side missions.

---

# Screen 5

# Active Mission Mode

Full focus interface.

---

Design:

Minimal.

Large timer.

Mission objective.

Proof buttons.

---

Example:

```
BUILD APP FEATURE

01:42:12


Focus Mode

ACTIVE


Submit Proof

```

---

# Screen 6

# Proof Submission

Options:

Large cards:

📷 Photo

🎤 Voice

📱 Screenshot

🔗 Connected App

---

# Screen 7

# AI Verification Result

Example:

```
MISSION VERIFIED

Confidence

96%


Reward

+350 XP


Achievement

Unlocked
```

---

# Screen 8

# Progress Profile

The user's identity page.

Shows:

* level
* class
* achievements
* statistics
* personal trends

---

# Screen 9

# Pricing Screen

Very important.

Do not make it look like a SaaS paywall.

Make it look like unlocking a game upgrade.

---

Example:

```
Unlock Your Next Level

Become More Consistent


FREE

PRO

ELITE

```

---

# Screen 10

# AI Coach

Voice-first.

Large microphone.

Minimal chat.

Example:

"Tell me what happened today."

---

# Figma File Structure

```
LOCKEDIN DESIGN SYSTEM

00 Cover

01 Brand

02 Foundations

    Colors
    Typography
    Icons
    Motion


03 Components

    Buttons
    Cards
    Mission Cards
    XP
    Avatar
    Badges
    AI Components


04 Screens

    Onboarding
    Dashboard
    Missions
    Proof
    Screenshot AI
    Progress
    Pricing


05 Prototype

    User flows
    Animations
    Interactions


06 Developer Handoff

    Tokens
    Variables
    Specs

```

---

# Assets We Need To Create

## Custom

Not from kits:

* LockedIn logo
* app icon
* avatar system
* XP icons
* mission icons
* achievement badges
* AI companion

---

# Recommended Build Order

## Design Sprint 1

Create:

1. Brand identity
2. App icon
3. Color system
4. Typography
5. Mission card
6. Dashboard

---

## Design Sprint 2

Create:

7. Onboarding
8. Screenshot AI
9. Mission execution
10. Proof system

---

## Design Sprint 3

Create:

11. Gamification
12. Pricing
13. Subscription flow

---

# Important Product Decision

The first screen after login should **not** show tasks.

It should show:

## "Today's Mission"

One dominant mission.

The human brain responds better to a clear challenge than a list of obligations.

---



That will give us the first investor-quality visual prototype.

[1]: https://www.figma.com/templates/mobile-ui-kit/?utm_source=chatgpt.com "Free Mobile UI Kit | Figma"
[2]: https://nucleusui.gumroad.com/l/nucleus-core-ui-component/?utm_source=chatgpt.com "Nucleus UI Lite – UI kit and Design system for Figma – Free"
[3]: https://github.com/KhoaSuperman/Finmori?utm_source=chatgpt.com "GitHub - KhoaSuperman/Finmori: Smart Budget & Expense Tracker Mobile App UI Kit · GitHub"
[4]: https://github.com/akveo/react-native-ui-kitten?utm_source=chatgpt.com "GitHub - akveo/react-native-ui-kitten: :boom: React Native UI Library based on Eva Design System :new_moon_with_face::sparkles:Dark Mode · GitHub"
[5]: https://github.com/TimeAground/figma-to-mobile?utm_source=chatgpt.com "GitHub - TimeAground/figma-to-mobile: Convert Figma designs to production-ready mobile UI code (Compose / XML / SwiftUI / UIKit) · GitHub"
