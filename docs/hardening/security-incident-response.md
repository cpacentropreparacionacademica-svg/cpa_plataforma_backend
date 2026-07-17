# Immediate credential incident response

## Confirmed condition

The public repository history contains an environment file with production-looking database, cache, backup, and test-account credentials. Removing the file from the current branch prevents new checkouts from receiving it, but **does not remove it from Git history**.

## Mandatory containment before production use

1. Rotate every primary and backup database credential exposed in repository history.
2. Rotate or revoke the Redis credential/endpoint and invalidate all active application sessions.
3. Change bootstrap and smoke-test passwords; disable any account that is not required.
4. Inspect database, cache, hosting, and source-control audit logs for use after the first exposed commit.
5. Temporarily restrict the repository if the credentials are still valid.
6. Rewrite history with a reviewed `git filter-repo` procedure, force-push all affected refs, and ask every collaborator to re-clone.
7. Run a secret scanner over the complete rewritten history before restoring normal access.

## Evidence required to close the incident

- rotation timestamps and responsible owner;
- confirmation that old credentials fail;
- list of inspected audit-log ranges and findings;
- secret-scanner report for all branches and tags;
- confirmation that deployment variables now come from a protected secret store.

Never paste the exposed values into tickets, logs, pull requests, or this document.
