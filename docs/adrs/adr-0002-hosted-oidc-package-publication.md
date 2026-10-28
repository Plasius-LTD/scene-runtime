# ADR-0002: Hosted OIDC Package Publication

- Status: Accepted
- Date: 2026-08-11

## Context

`@plasius/scene-runtime` must publish without a long-lived npm write token and without
accepting CI evidence for another source snapshot.

## Decision

Publication is phase-isolated: dependency installation, package validation, SBOM generation, and immutable tarball packing run in `validate_and_pack` without the `production` environment or OIDC permission. The final hosted `publish` job downloads only that sealed artifact, explicitly installs npm 11.6.2, runs no repository dependency code, and publishes the tarball with lifecycle scripts disabled. It re-fetches current `main` immediately before the first release mutation and again immediately before npm publication. `.npmrc` contains no registry-auth placeholder, and release preparation returns the reviewed current `main` HEAD rather than package-file history.

Publish only from the GitHub-hosted `production` job using npm trusted
publishing. Prove the prepared SHA is still the exact remote `main` head and
that push-triggered `ci.yml` succeeded for it. Require Node 24 and npm 11.5.1 or
newer, request provenance, and prohibit npm write-token fallbacks.

CI uses the Task #20 and parent Story #1626 approved explicit
`[self-hosted, Linux, X64]` labels. Only repository branch pushes and manual
dispatches are admitted, with a fixed repository/event guard on every job.
There is no PR trigger, hosted CI fallback, reusable CI call, or caller-selected
runner. Trusted branch push checks validate PR heads before merge; external
contributions require maintainer review before admission to a trusted branch.
Checkout credentials are not persisted, package-manager caching is disabled,
timeouts bound both jobs, and branch concurrency cancels superseded CI.

Hosted release preparation, publication dispatch, sealed-package validation and
production OIDC publication remain separate release roles. Scheduled hosted
dependency maintenance is not qualifying CI. This corrects the hosted-CI
regression without changing the package API or publication trust boundary.
Retaining hosted CI or running fork PR code on self-hosted capacity was rejected
because either would violate the tracked recovery acceptance criteria.

## Consequences

Missing trust configuration, moved `main`, absent CI, unsupported runtime, or
missing OIDC identity fails closed before publication.
Self-hosted capacity must be available before merge or release. Rollback disables
the affected CI/CD channel until corrected; it does not restore the removed
registry, introduce fallback runners, or reuse removed package versions. Parent
flag `platform.public-artifact-integrity.enabled` controls site-owned promotion,
while source/artifact and release trust gates cannot be bypassed by the flag.

## Test implications

Workflow tests enforce source, CI, runtime, identity, runner, and token rules,
account for both CI jobs, and reject PR triggers or dynamic/hosted CI selectors.
Exact branch-push CI, exact-main release CI, and the hosted production CD result
are required delivery evidence after local validation and actionlint.
