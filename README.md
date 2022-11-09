# SeaCat Admin WebUI

SeaCat Admin WebUI provides a self-care portal for administration as a superstructure for [SeaCat Auth](https://github.com/TeskaLabs/seacat-auth).

## Dependencies

### SeaCat Auth service

Information about how to setup [SeaCat Auth service](https://github.com/TeskaLabs/seacat-auth) can be found here: https://github.com/TeskaLabs/seacat-auth

## Clone SeaCat Admin WebUI

```
$ git clone https://github.com/TeskaLabs/seacat-admin-webui
$ cd seacat-admin-webui
```

## Prerequisities

### Initiate ASAB-WebUI submodule

[asab-webui](https://github.com/TeskaLabs/asab-webui) must be pulled so that can be referenced from the UI project.

```
$ git submodule update --init --recursive
```

## Installation

Install all necessary dependecies

```
$ yarn install
```

## Start in dev environment

Run application in dev environment

```
$ yarn start -c conf/config.js
```

## Build to production or build environment

```
$ yarn build
```

## SeaCat Admin modules

### SeaCat Auth module

This module serves the purpose of administration maintenance. Some parts of the module stays hidden for credentials without particular resource.

**Create credentials on first initialization**

On first application initialization, one have to login in `provisioning mode` to create a initial administrator credential. This mode has to be set up in [SeaCat Auth](https://github.com/TeskaLabs/seacat-auth) configuration.

### Home module

This module serves the purpose of displaying the basic information about SeaCat Admin application. This module is optional and can be removed via configuration in `conf/config.js`

## Default SeaCat Admin resources

- `authz:superuser` - users with this resource can see and trigger any action available in SeaCat Admin application
- `authz:tenant:admin` - users with this resource has limited rights options compared to superuser
- `seacat:access` - users with this resource has read-only rights

### Restricted access

Credentials without `authz:superuser` or `seacat:access` resource are not able to display any data if they enter the application. Administrator's `Auth` module will not be displayed in the Sidebar of the application as well.

## Custom branding and styling customization

For custom branding and styling customization, please follow a guidline on [docs.teskalabs.com](https://docs.teskalabs.com/logman.io/configuration/branding)
