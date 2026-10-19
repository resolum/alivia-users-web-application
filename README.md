# Alivia Users Web Application

`alivia-users-web-application` is the web application for end-users of the Alivia platform, family members and caregivers.

This application serves as the main interface for users to interact with the Alivia platform. It provides features for monitoring the health and daily activities of assisted persons, managing the care network, handling subscriptions and payments, and keeping up with notifications and autonomy metrics.

## Purpose

In the current version, the application focuses on:

- displaying a home dashboard with alerts, devices, activities and subscription summaries
- managing the assisted person's profile and household information
- managing the care network (family members, caregivers and invitations)
- managing and tracking activities
- managing subscriptions and payments
- tracking technical support incidents and device installation
- managing IoT devices linked to the assisted person
- displaying autonomy metrics and insights
- managing user profile and notification preferences

## Bounded Contexts

### IAM

The IAM bounded context is responsible for managing user identities, sessions and access levels within the application.

Main responsibility:

- authenticate users and manage user sessions
- handle access levels (principal and invitado)

Main domain concept:

- `Account`

### Profiles

The Profiles bounded context is responsible for managing user and household profiles, including personal information and preferences.

Main responsibility:

- store and update the user's personal profile
- manage the assisted person's profile and household information

Main domain concept:

- `Profile`
- `HomeProfile`

### Care

The Care bounded context is responsible for managing the network of people involved in the care of an assisted person.

Main responsibility:

- manage family members and caregivers
- handle invitations to join the care network
- manage and track care activities

Main domain concept:

- `FamilyMember`
- `Caregiver`
- `CareTask`
- `Invitation`

### Subscriptions

The Subscriptions bounded context is responsible for managing subscriptions and payments for the Alivia service.

Main responsibility:

- manage subscription plans and their lifecycle
- process and track payments

Main domain concept:

- `Subscription`
- `Payment`

### Support

The Support bounded context is responsible for managing technical support processes, from the initial evaluation through device installation to ongoing incident tracking.

Main responsibility:

- schedule and track evaluations and installations
- manage and follow up on technical incidents

Main domain concept:

- `Evaluation`
- `Installation`
- `Incident`

### Communications

The Communications bounded context is responsible for managing notifications delivered to users.

Main responsibility:

- send and display notifications to the user
- manage communication channels and preferences

Main domain concept:

- `Notification`

### Telemetry

The Telemetry bounded context is responsible for managing IoT devices linked to the assisted person and the data they produce.

Main responsibility:

- manage device registration and synchronization
- monitor device status and readings

Main domain concept:

- `Monitoring`
- `Synchronization`

### Analytics

The Analytics bounded context is responsible for processing and displaying autonomy metrics derived from telemetry data.

Main responsibility:

- process telemetry data into autonomy metrics
- display insights and reports to the user

Main domain concept:

- `Metric`

## Architecture

Each bounded context follows a layered structure inspired by light DDD principles. Business logic lives in the backend; this frontend consumes its REST API.

### Domain Layer

Contains the core concepts and data shapes of the bounded context.

Responsibilities:

- define entities and value objects
- enforce domain-level constraints

### Application Layer

Coordinates data retrieval and presentation-level workflows.

Responsibilities:

- orchestrate calls to the infrastructure layer
- expose data and operations to the presentation layer

### Infrastructure Layer

Contains the technical implementations for communicating with external services.

Responsibilities:

- implement endpoint clients extending `BaseApiEndpoint`
- implement assemblers extending `BaseAssembler`

### Presentation Layer

Exposes the views and components of the bounded context to the user.

Responsibilities:

- display data retrieved from the application layer
- handle user interactions
- render context-specific UI components

## Project Structure

```text
alivia-users-web-application/
├── package.json
├── pnpm-lock.yaml
├── README.md
├── LICENSE.md
├── .gitignore
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── eslint.config.js
└── src/
    ├── index.css
    ├── main.tsx
    ├── App.tsx
    ├── vite-env.d.ts
    ├── app/
    │   ├── router.tsx
    │   ├── providers.tsx
    │   └── RequireAccess.tsx
    ├── shared/
    │   ├── domain/
    │   │   └── model/
    │   │       ├── base-entity.ts
    │   │       ├── currency.entity.ts
    │   │       └── valueobjects/
    │   ├── infrastructure/
    │   │   ├── base-api.ts
    │   │   ├── base-api-endpoint.ts
    │   │   ├── base-assembler.ts
    │   │   ├── base-response.ts
    │   │   └── error-handling-enabled-base-type.ts
    │   └── presentation/
    │       ├── session/
    │       ├── i18n/
    │       ├── hooks/
    │       ├── components/
    │       │   ├── ui/
    │       │   ├── base-form/
    │       │   ├── layout/
    │       │   ├── navigator/
    │       │   ├── top-bar/
    │       │   └── language-switcher/
    │       └── views/
    │           ├── home/
    │           ├── page-not-found/
    │           └── placeholder-page/
    ├── iam/
    │   ├── bounded-context.txt
    │   ├── domain/model/
    │   ├── application/
    │   ├── infrastructure/
    │   └── presentation/
    ├── profiles/
    ├── care/
    ├── subscriptions/
    ├── support/
    ├── communications/
    ├── telemetry/
    └── analytics/
```

## Technology Stack

The web application is built using the following technologies:

- TypeScript 6
- React 19
- Vite 8
- Tailwind CSS v4 (CSS-first configuration, no `tailwind.config.js`)
- React Router 8
- pnpm 11
