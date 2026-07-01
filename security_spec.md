# Security Spec: Mots & Blocs Québec

## 1. Data Invariants
- An `Utilisateur` document can only be read and written by its owner (`userId == request.auth.uid`).
- `etoiles` must be an integer >= 0.
- `motsDebloques` must be an array of strings (max 2000 items to prevent size issues).
- Every update or create must maintain the document structure.

## 2. Dirty Dozen Payloads
1. Create empty document
2. Create document for another user
3. Update someone else's document
4. Update `etoiles` to string
5. Update `etoiles` to negative number
6. Update `motsDebloques` with a non-string array element
7. Inject a huge string as a document ID
8. Inject an oversized array for `motsDebloques` (Denial of wallet)
9. Delete someone else's document
10. Update `derniereMiseAJour` to a non-timestamp value
11. Unauthenticated read/write
12. Shadow Update (add extra unsolicited fields like `isAdmin: true`).
