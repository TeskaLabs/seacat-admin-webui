import Module from 'asab-webui/abc/Module';

import CredentialsListContainer from './credentials/CredentialsListContainer';
import CredentialsDetailContainer from './credentials/CredentialsDetailContainer';
import CredentialsCreateContainer from './credentials/CredentialsCreateContainer';
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
			component: ResourcesListContainer,
			resource: "seacat:resource:access"
		});
		app.Router.addRoute({
			path: '/auth/resources/!create',
			exact: true,
			name: 'New resource',
			component: ResourcesCreateContainer,
			resource: "seacat:resource:access"
		});
		app.Router.addRoute({
			path: '/auth/resources/:resource_id',
			exact: true,
			name: 'Resource detail',
			component: ResourcesDetailContainer,
			resource: "seacat:resource:access"
		});

		// Roles
		app.Router.addRoute({
			path: '/auth/roles',
			exact: true,
			name: 'Roles',
			component: RolesListContainer,
			resource: "seacat:role:access"
		});
		app.Router.addRoute({
			path: '/auth/roles/!create',
			exact: true,
			name: 'New roles',
			component: RolesCreateContainer,
			resource: "seacat:role:access"
		});
		app.Router.addRoute({
			path: '/auth/roles/:tenant_id/:role_name',
			exact: true,
			name: 'Role detail',
			component: RolesDetailContainer,
			resource: "seacat:role:access"
		});

		// Credentials
		app.Router.addRoute({
			path: '/auth/credentials',
			exact: true,
			name: 'Credentials',
			component: CredentialsListContainer,
			resource: "seacat:credentials:access"
		});

		app.Router.addRoute({
			path: '/auth/credentials/!create',
			name: 'New credentials',
			component: CredentialsCreateContainer,
			resource: "seacat:credentials:access"
		});

		app.Router.addRoute({
			path: '/auth/credentials/:credentials_id',
			exact: true,
			name: 'Credentials detail',
			component: CredentialsDetailContainer,
			resource: "seacat:credentials:access"
		});

		app.Router.addRoute({
			path: '/auth/credentials/:credentials_id/passwordreset',
			exact: true,
			name: 'Reset password',
			component: ResetPasswordContainer,
			resource: "seacat:credentials:access"
		});


		// Sessions
		app.Router.addRoute({
			path: '/auth/session',
			exact: true,
			name: 'Sessions',
			component: SessionListContainer,
			resource: "seacat:session:access"
		});

		app.Router.addRoute({
			path: '/auth/session/:session_id',
			exact: true,
			name: 'Session detail',
			component: SessionDetailContainer,
			resource: "seacat:session:access"
		});


		// Tenants
		app.Router.addRoute({
			path: '/auth/tenant',
			exact: true,
			name: 'Tenants',
			component: TenantListContainer,
			resource: "seacat:tenant:access"
		});

		app.Router.addRoute({
			path: '/auth/tenant/!create',
			name: 'New tenant',
			component: TenantCreateContainer,
			resource: "seacat:tenant:access"
		});

		app.Router.addRoute({
			path: '/auth/tenant/:tenant_id',
			exact: true,
			name: 'Tenant detail',
			component: TenantDetailContainer,
			resource: "seacat:tenant:access"
		});

		// Clients
		app.Router.addRoute({
			path: '/auth/clients',
			exact: true,
			name: 'Clients',
			component: ClientListContainer,
			resource: "seacat:client:access"
		});

		app.Router.addRoute({
			path: '/auth/clients/!create',
			exact: true,
			name: 'New client',
			component: ClientCreateContainer,
			resource: "seacat:client:access"
		});

		app.Router.addRoute({
			path: '/auth/clients/:client_id',
			exact: true,
			name: 'Client detail',
			component: ClientDetailContainer,
			resource: "seacat:client:access"
		});

		app.Router.addRoute({
			path: '/auth/clients/:client_id/edit',
			exact: true,
			name: 'Edit',
			component: ClientCreateContainer,
			resource: "seacat:client:access"
		});

		// Navigation
		app.Navigation.addItem({
			name: 'Auth',
			icon: 'at-phonebook-contacts',
			resource: 'seacat:access', // Hide Auth item in sidebar to users without seacat:access rights
			children: [
				{
					name: 'Credentials',
					url: '/auth/credentials',
					icon: 'at-users',
					resource: "seacat:credentials:access"
				},
				{
					name: 'Tenants',
					url: '/auth/tenant',
					icon: 'at-menu-square',
					resource: "seacat:tenant:access"
				},
				{
					name: 'Sessions',
					url: '/auth/session',
					icon: 'at-link-chain',
					resource: "seacat:session:access"
				},
				{
					name: 'Roles',
					url: '/auth/roles',
					icon: 'at-account',
					resource: "seacat:role:access"
				},
				{
					name: 'Resources',
					url: '/auth/resources',
					icon: 'at-unlock-keyhole',
					resource: "seacat:resource:access"
				},
				{
					name: 'Clients',
					url: '/auth/clients',
					icon: 'at-layers',
					resource: "seacat:client:access"
				},
			]
		});
	}
}
