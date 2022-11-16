# CHANGELOG

## Release Candidate

## v22.46

### Features

- ASAB WebUI submodule version bump [[bd1bb40](https://github.com/TeskaLabs/asab-webui/commit/bd1bb40c82badf4c8363bbc077d7b67320ad59e6)] commit (INDIGO Sprint 221111, [!3](https://github.com/TeskaLabs/seacat-admin-webui/pull/3))

### Refactoring

- Refactor put and post requests in Credentials. When creating credentials, phone and email will be send in a body of a request only when filled in. When updating the credentials, phone or email will be defined in a request body as `null` if value not specified. (INDIGO Sprint 221111, [!3](https://github.com/TeskaLabs/seacat-admin-webui/pull/3))

### Bugfix

## v22.45

- Initialize SeaCat Admin repo with content (INDIGO Sprint 221031, [!2](https://github.com/TeskaLabs/seacat-admin-webui/pull/2))
