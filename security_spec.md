# Security Specification for Giang Hồ Lục

## Data Invariants
1. A project must be owned by the user who created it and can only be accessed by them.
2. Episodes, Characters, Arcs, and Factions must belong to a valid project ID that belongs to the user.
3. Users can only modify their own data.
4. Timestamps should be server-generated.

## The Dirty Dozen Payloads
1. Create a project with another user's `ownerId`.
2. Read a project belonging to someone else.
3. Update a project's `ownerId` to yourself.
4. Create an episode in a project you don't own.
5. List episodes of a project you don't own.
6. Create an episode without a `projectId`.
7. Inject a 2MB string into a character's name.
8. Set a character's `status` to an invalid enum value.
9. Delete a project you don't own.
10. Update an episode's logic warnings as if you were an admin (if admin was implemented).
11. Spoof a user email in the project doc.
12. Modify a project's `createdAt` timestamp.

## The Test Runner
A `firestore.rules.test.ts` will be created to verify these restrictions.
