# CHANGELOG

## Release Candidate

### Features

- ASAB WebUI submodule version bump [[5e6c5a8](https://github.com/TeskaLabs/asab-webui/commit/5e6c5a83b1a90624345cd0309a24abbb692aaa12)] commit (INDIGO Sprint 230217, [!19](https://github.com/TeskaLabs/seacat-admin-webui/pull/19))

- Resources actions extended. Added posibility to rename, delete, hard-delete and retrieve resources (INDIGO Sprint 230217, [!19](https://github.com/TeskaLabs/seacat-admin-webui/pull/19))

### Refactoring

- Dropdown menu used to assign `tenants` nad `roles` to specific `Credentials` has been refactored to offer more data than the initial limit, upon clicking the 'More ...' button. (INDIGO Sprint 230203, [!14](https://github.com/TeskaLabs/seacat-admin-webui/pull/14))

## v23.5

### Features

- ASAB WebUI submodule version bump [[186b907](https://github.com/TeskaLabs/asab-webui/commit/186b907f3b1adef77d8664dbc5d68e3ee9d84ac2)] commit (INDIGO Sprint 230120, [!17](https://github.com/TeskaLabs/seacat-admin-webui/pull/17))

### Refactoring

- Add new input `cookie_domain` to Clients. Fix min-max height styles for CustomComponent (INDIGO Sprint 230120, [!15](https://github.com/TeskaLabs/seacat-admin-webui/pull/15))

## v23.4

### Compatibility

- [x] **SeaCat Auth UI `v23.4` or newer**
- [x] **SeaCat Auth `v23.3` or newer**

⚠️ Due to implementation of new features, invitation will not work with SeaCat Auth service versions older than `v23.3`

### Features

- ASAB WebUI submodule version bump [[25d5a5c](https://github.com/TeskaLabs/asab-webui/commit/25d5a5ce97c6f2286525127cc3a31531b03312f3)] commit (INDIGO Sprint 230106, [!8](https://github.com/TeskaLabs/seacat-admin-webui/pull/8))

- Create invitation components (INDIGO Sprint 230106, [!8](https://github.com/TeskaLabs/seacat-admin-webui/pull/8))

### Refactoring

- Add new input `preferred_client_id` to ClientCreateContainer (INDIGO Sprint 221209, [!7](https://github.com/TeskaLabs/seacat-admin-webui/pull/7))

- Replace `phone_number` with `phone` and `preferred_username` with `username` (INDIGO Sprint 221209, [!10](https://github.com/TeskaLabs/seacat-admin-webui/pull/10))

- Update alert responses with full message from the service and prolong the time of the error message to 30s (INDIGO Sprint 230106, [!8](https://github.com/TeskaLabs/seacat-admin-webui/pull/8))

- Refactorization of CustomDataContainer to prevent passing invalid format of `uri` prop. Added documentation. (INDIGO Sprint 221209, [!11](https://github.com/TeskaLabs/seacat-admin-webui/pull/11))

## v22.48

### Compatibility

- [x] **ASAB UI `v22.48` or newer**
- [x] **SeaCat Auth `v22.48` or newer**

⚠️ Due to breaking changes in the OpenID Connect module, tenant authorization will not work with older versions of SeaCat Auth service and ASAB UI based apps.

### Features

- ASAB WebUI submodule version bump [[e7c9b7eb](https://github.com/TeskaLabs/asab-webui/commit/e7c9b7eb60eaba9cae39ea18d569301dcc7500c4)] commit (INDIGO Sprint 221125, [!6](https://github.com/TeskaLabs/seacat-admin-webui/pull/6))

### Refactoring

- Fix the height of the ClientDetailContainer card in edit mode (INDIGO Sprint 221125, [!5](https://github.com/TeskaLabs/seacat-admin-webui/pull/5))

## v22.46

### Features

- ASAB WebUI submodule version bump [[bd1bb40](https://github.com/TeskaLabs/asab-webui/commit/bd1bb40c82badf4c8363bbc077d7b67320ad59e6)] commit (INDIGO Sprint 221111, [!3](https://github.com/TeskaLabs/seacat-admin-webui/pull/3))

### Refactoring

- Refactor put and post requests in Credentials. When creating credentials, phone and email will be send in a body of a request only when filled in. When updating the credentials, phone or email will be defined in a request body as `null` if value not specified. (INDIGO Sprint 221111, [!3](https://github.com/TeskaLabs/seacat-admin-webui/pull/3))


### Bugfix

## v22.45

- Initialize SeaCat Admin repo with content (INDIGO Sprint 221031, [!2](https://github.com/TeskaLabs/seacat-admin-webui/pull/2))
