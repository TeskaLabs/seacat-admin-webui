# CHANGELOG

## Release Candidate

## v22.46

### Features

- ASAB WebUI submodule version bump [[343d91c](https://github.com/TeskaLabs/asab-webui/commit/343d91c6f5cca475f4fd0e013d21a6396d0752ee)] commit (INDIGO Sprint 221125, [!5](https://github.com/TeskaLabs/seacat-admin-webui/pull/5))

### Refactoring

- Refactor put and post requests in Credentials. When creating credentials, phone and email will be send in a body of a request only when filled in. When updating the credentials, phone or email will be defined in a request body as `null` if value not specified. (INDIGO Sprint 221111, [!3](https://github.com/TeskaLabs/seacat-admin-webui/pull/3))

- Fix the height of the ClientDetailContainer card in edit mode (INDIGO Sprint 221125, [!5](https://github.com/TeskaLabs/seacat-admin-webui/pull/5))

### Bugfix

## v22.45

- Initialize SeaCat Admin repo with content (INDIGO Sprint 221031, [!2](https://github.com/TeskaLabs/seacat-admin-webui/pull/2))
