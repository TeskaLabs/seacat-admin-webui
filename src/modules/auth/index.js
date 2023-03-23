import Module from 'asab-webui/abc/Module';

import CredentialsListContainer from './credentials/CredentialsListContainer';
import CredentialsDetailContainer from './credentials/CredentialsDetailContainer';
import CredentialsCreateContainer from './credentials/CredentialsCreateContainer';
import BulkAssignmentContainer from './credentials/BulkAssignmentContainer';
import ResetPasswordContainer from './credentials/ResetPasswordContainer';

import SessionListContainer from './session/SessionListContainer';
import SessionDetailContainer from './session/SessionDetailContainer';

import TenantListContainer from './tenant/TenantListContainer';
import TenantCreateContainer from './tenant/TenantCreateContainer';
import TenantDetailContainer from './tenant/TenantDetailContainer';

import RolesCreateContainer from './roles/RolesCreateContainer';
import RolesListContainer from './roles/RolesListContainer';
import RolesDetailContainer from './roles/RolesDetailContainer';

import ResourcesListContainer from './resources/ResourcesListContainer';
import ResourcesDetailContainer from './resources/ResourcesDetailContainer';
import ResourcesCreateContainer from './resources/ResourcesCreateContainer';

import ClientListContainer from './clients/ClientListContainer';
import ClientCreateContainer from './clients/ClientCreateContainer';
import ClientDetailContainer from './clients/ClientDetailContainer';

// SCSS
import './tenant/tenant.scss';
import './roles/roles.scss';
import './resources/resources.scss';
import './credentials/credentials.scss';
import './clients/clients.scss';
import './components/customdata.scss';
import './session/session.scss';

export default class SeaCatAuthModule extends Module {
	constructor(app, name){
		super(app, "SeaCatAuthModule");

		// Resources
		app.Router.addRoute({
			path: '/auth/resources',
			exact: true,
			name: 'Resources',
			component: ResourcesListContainer
		});
		app.Router.addRoute({
			path: '/auth/resources/!create',
			exact: true,
			name: 'New resource',
			component: ResourcesCreateContainer
		});
		app.Router.addRoute({
			path: '/auth/resources/:resource_id',
			exact: true,
			name: 'Resource detail',
			component: ResourcesDetailContainer
		});

		// Roles
		app.Router.addRoute({
			path: '/auth/roles',
			exact: true,
			name: 'Roles',
			component: RolesListContainer
		});
		app.Router.addRoute({
			path: '/auth/roles/!create',
			exact: true,
			name: 'New roles',
			component: RolesCreateContainer
		});
		app.Router.addRoute({
			path: '/auth/roles/:tenant_id/:role_name',
			exact: true,
			name: 'Role detail',
			component: RolesDetailContainer
		});

		// Credentials
		app.Router.addRoute({
			path: '/auth/credentials',
			exact: true,
			name: 'Credentials',
			component: CredentialsListContainer
		});

		app.Router.addRoute({
			path: '/auth/credentials/!create',
			name: 'New credentials',
			component: CredentialsCreateContainer
		});

		app.Router.addRoute({
			path: '/auth/credentials/:credentials_id/assigntenants',
			name: 'Assign tenants',
			component: BulkAssignmentContainer
		});

		app.Router.addRoute({
			path: '/auth/credentials/:credentials_id',
			exact: true,
			name: 'Credentials detail',
			component: CredentialsDetailContainer
		});

		app.Router.addRoute({
			path: '/auth/credentials/:credentials_id/passwordreset',
			exact: true,
			name: 'Reset password',
			component: ResetPasswordContainer
		});


		// Sessions
		app.Router.addRoute({
			path: '/auth/session',
			exact: true,
			name: 'Sessions',
			component: SessionListContainer
		});

		app.Router.addRoute({
			path: '/auth/session/:session_id',
			exact: true,
			name: 'Session detail',
			component: SessionDetailContainer
		});


		// Tenants
		app.Router.addRoute({
			path: '/auth/tenant',
			exact: true,
			name: 'Tenants',
			component: TenantListContainer
		});

		app.Router.addRoute({
			path: '/auth/tenant/!create',
			name: 'New tenant',
			component: TenantCreateContainer
		});

		app.Router.addRoute({
			path: '/auth/tenant/:tenant_id',
			exact: true,
			name: 'Tenant detail',
			component: TenantDetailContainer
		});

		// Clients
		app.Router.addRoute({
			path: '/auth/clients',
			exact: true,
			name: 'Clients',
			component: ClientListContainer
		});

		app.Router.addRoute({
			path: '/auth/clients/!create',
			exact: true,
			name: 'New client',
			component: ClientCreateContainer
		});

		app.Router.addRoute({
			path: '/auth/clients/:client_id',
			exact: true,
			name: 'Client detail',
			component: ClientDetailContainer
		});

		app.Router.addRoute({
			path: '/auth/clients/:client_id/edit',
			exact: true,
			name: 'Edit',
			component: ClientCreateContainer
		});

		// Navigation
		app.Navigation.addItem({
			name: 'Auth',
			icon: 'cil-address-book',
			resource: 'seacat:access', // Hide Auth item in sidebar to users without seacat:access rights
			children: [
				{
					name: 'Credentials',
					url: '/auth/credentials',
					icon: 'cil-people'
				},
				{
					name: 'Tenants',
					url: '/auth/tenant',
					icon: 'cil-apps'
				},
				{
					name: 'Sessions',
					url: '/auth/session',
					icon: 'cil-link',
					resource: 'authz:superuser' // Hide Sessions child in sidebar to users without authz:superuser rights
				},
				{
					name: 'Roles',
					url: '/auth/roles',
					icon: 'cil-user'
				},
				{
					name: 'Resources',
					url: '/auth/resources',
					icon: 'cil-lock-unlocked'
				},
				{
					name: 'Clients',
					url: '/auth/clients',
					icon: 'cil-layers',
					resource: 'authz:superuser' // Hide Clients child in sidebar to users without authz:superuser rights
				},
			]
		});
	}
}
