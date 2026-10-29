# Alivia Users Web Application

`alivia-users-web-application` is the web application for end-users of the Alivia platform: family members and caregivers.

This application serves as the main interface for users to interact with the Alivia platform. It provides features for monitoring the daily activities of assisted persons, managing the care network, handling subscriptions and payments, and keeping up with notifications and autonomy metrics.

## Purpose

In the current version, the application focuses on:

- authenticating users (sign-in and password recovery) and managing the session
- adapting navigation and content to the user's access level (principal caregiver or invited caregiver)
- displaying a home dashboard with the day's care agenda, device alerts and upcoming events
- managing the assisted person's profile and the care network (family members, caregivers and invitations)
- managing and tracking care activities
- managing subscriptions and payments
- tracking technical support incidents and device installation
- monitoring the IoT devices linked to the assisted person
- displaying autonomy metrics and insights
- managing the user profile and notification preferences

## Bounded Contexts

### IAM

The IAM bounded context is responsible for user identities, sessions and access levels.

Main responsibility:

- authenticate users, restore sessions and renew tokens
- request and complete password recovery through a token link
- derive the access level from the user's role: `ROLE_RELATIVE` is `principal` and `ROLE_CAREGIVER` is `invitado`; accounts with any other role belong to the administrator web and are rejected

Main domain concept:

- `User`
- `Role`
- `AuthSession`

### Profiles

The Profiles bounded context is responsible for the personal information of the people involved in the care.

Main responsibility:

- store and update the user's personal profile (name, phone and photo)
- provide the names displayed across the application

Main domain concept:

- `PersonProfile`

The household information shown in the design has no backend aggregate yet.

### Assistance

The Assistance bounded context is responsible for the care of assisted persons and the network of people involved in it. The family member registers on their own, pays the subscription, manages assisted persons, invites caregivers by email and assigns care activities.

Main responsibility:

- manage assisted persons, family members and caregivers
- handle invitations to join the care network
- manage care activities, their assignments and the daily agenda

Main domain concept:

- `Relative`
- `AssistedPerson`
- `Caregiver`
- `Invitation`
- `CareActivity`
- `AgendaItem`

### Subscriptions

The Subscriptions bounded context is responsible for subscription plans and payments for the Alivia service.

Main responsibility:

- manage subscription plans and their lifecycle
- process and track payments

Main domain concept:

- `Subscription`
- `Payment`

### Support

The Support bounded context is responsible for technical support, from the initial evaluation through device installation to ongoing incident tracking.

Main responsibility:

- schedule and track evaluations and installations
- manage and follow up on technical incidents

Main domain concept:

- `Evaluation`
- `Installation`
- `Incident`

### Communication

The Communication bounded context is responsible for the notifications delivered to users.

Main responsibility:

- display notifications to the user
- manage communication channels and preferences

Main domain concept:

- `Notification`

### Tracking

The Tracking bounded context is responsible for monitoring the devices installed in the assisted person's home and the data they produce.

Main responsibility:

- monitor device status and readings
- surface device alerts

Main domain concept:

- `Monitoring`
- `Synchronization`

### Analytics

The Analytics bounded context is responsible for displaying autonomy metrics derived from the tracking data.

Main responsibility:

- display autonomy metrics, insights and reports

Main domain concept:

- `Metric`

## Architecture

Each bounded context follows a layered structure inspired by light DDD principles. Business logic lives in the backend; this frontend consumes its REST API.

### Domain Layer

Contains the core concepts and data shapes of the bounded context, mirroring the backend domain model.

Responsibilities:

- define entities, value objects and enumerations (as const arrays with derived types)
- define commands with field-level validation
- define domain errors with stable codes, never user-facing texts

### Application Layer

Coordinates the workflows of the bounded context. In IAM it contains a single framework-free module, `iam.store.ts`.

Responsibilities:

- keep the session state and expose the use cases (sign in, sign out, password recovery)
- orchestrate calls to the infrastructure layer
- throw typed domain errors, leaving messages and navigation to the presentation layer

### Infrastructure Layer

Contains the technical implementations for communicating with the backend.

Responsibilities:

- implement endpoint clients extending `BaseApiEndpoint`
- implement assemblers extending `BaseAssembler`, which are the only place that knows the shape of API responses
- read configuration from the environment modules
- provide a development mock that follows the backend contract

### Presentation Layer (Interfaces)

Exposes the views and components of the bounded context to the user.

Responsibilities:

- display data retrieved from the application layer
- handle user interactions, form state and navigation
- render context-specific UI components and route guards

## Project Structure

```text
alivia-users-web-application/
├── package.json
├── pnpm-lock.yaml
├── README.md
├── LICENSE.md
├── .env.example
├── .gitignore
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── eslint.config.js
├── sonar-project.properties
├── docs/
│   ├── iam-api-contract.md
│   └── home-data-contract.md
└── src/
    ├── index.css
    ├── main.tsx
    ├── App.tsx
    ├── vite-env.d.ts
    ├── ARCHITECTURE.txt
    ├── app/
    │   ├── router.tsx
    │   ├── providers.tsx
    │   ├── RequireAccess.tsx
    │   ├── layout/
    │   │   └── AppTopBar.tsx
    │   └── home/
    │       ├── HomeView.tsx
    │       ├── HomePrincipalView.tsx
    │       ├── HomeGuestView.tsx
    │       ├── home.view-model.ts
    │       ├── home.data-source.ts
    │       ├── home.demo-data.ts
    │       ├── home.dates.ts
    │       ├── useHomeSummary.ts
    │       ├── i18n/
    │       └── components/
    ├── shared/
    │   ├── config/
    │   │   ├── environment.types.ts
    │   │   └── environment.ts
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
    │           ├── page-not-found/
    │           └── placeholder-page/
    ├── iam/
    │   ├── index.ts
    │   ├── bounded-context.txt
    │   ├── domain/
    │   │   └── model/
    │   │       ├── valueobjects/
    │   │       │   └── email-address.ts
    │   │       ├── iam.enums.ts
    │   │       ├── field-errors.ts
    │   │       ├── iam-error.ts
    │   │       ├── password-policy.ts
    │   │       ├── role.entity.ts
    │   │       ├── user.entity.ts
    │   │       ├── auth-session.ts
    │   │       ├── sign-in.command.ts
    │   │       ├── sign-up.command.ts
    │   │       ├── verify-email.command.ts
    │   │       ├── resend-verification-code.command.ts
    │   │       ├── forgot-password.command.ts
    │   │       └── reset-password.command.ts
    │   ├── application/
    │   │   └── iam.store.ts
    │   ├── infrastructure/
    │   │   ├── forgot-password/
    │   │   ├── refresh/
    │   │   ├── reset-password/
    │   │   ├── sign-in/
    │   │   ├── iam-api.ts
    │   │   ├── iam-session.storage.ts
    │   │   ├── iam.assembler.ts
    │   │   ├── iam.resources.ts
    │   │   ├── iam.environment.ts
    │   │   └── iam.environment.types.ts
    │   └── presentation/
    │       ├── IamSessionProvider.tsx
    │       ├── hooks/
    │       ├── guards/
    │       ├── components/
    │       ├── i18n/
    │       └── views/
    │           ├── sign-in/
    │           ├── forgot-password/
    │           ├── reset-password/
    │           └── password-updated/
    ├── profiles/
    ├── assistance/
    ├── subscriptions/
    ├── support/
    ├── communication/
    ├── tracking/
    └── analytics/
```

## Technology Stack

The web application is built using the following technologies:

- TypeScript 6
- React 19
- Vite 8
- Tailwind
- React Router 8
- pnpm 11
- ESLint
- SonarQube Cloud
