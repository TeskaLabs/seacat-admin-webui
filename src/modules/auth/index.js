import { lazy } from 'react';
import { componentLoader } from 'asab-webui';
import Module from 'asab-webui/abc/Module';

const CredentialsListContainer = lazy(() => componentLoader(() => import('./credentials/CredentialsListContainer')));
const CredentialsDetailContainer = lazy(() => componentLoader(() => import('./credentials/CredentialsDetailContainer')));
const CredentialsCreateContainer = lazy(() => componentLoader(() => import('./credentials/CredentialsCreateContainer')));
const BulkAssignmentContainer = lazy(() => componentLoader(() => import('./credentials/BulkAssignmentContainer')));
const ResetPasswordContainer = lazy(() => componentLoader(() => import('./credentials/ResetPasswordContainer')));

const SessionListContainer = lazy(() => componentLoader(() => import('./session/SessionListContainer')));
const SessionDetailContainer = lazy(() => componentLoader(() => import('./session/SessionDetailContainer')));

const TenantListContainer = lazy(() => componentLoader(() => import('./tenant/TenantListContainer')));
const TenantCreateContainer = lazy(() => componentLoader(() => import('./tenant/TenantCreateContainer')));
const TenantDetailContainer = lazy(() => componentLoader(() => import('./tenant/TenantDetailContainer')));

const RolesCreateContainer = lazy(() => componentLoader(() => import('./roles/RolesCreateContainer')));
const RolesListContainer = lazy(() => componentLoader(() => import('./roles/RolesListContainer')));
const RolesDetailContainer = lazy(() => componentLoader(() => import('./roles/RolesDetailContainer')));

const ResourcesListContainer = lazy(() => componentLoader(() => import('./resources/ResourcesListContainer')));
const ResourcesDetailContainer = lazy(() => componentLoader(() => import('./resources/ResourcesDetailContainer')));
const ResourcesCreateContainer = lazy(() => componentLoader(() => import('./resources/ResourcesCreateContainer')));
const ResourcesDeletedListContainer = lazy(() => componentLoader(() => import('./resources/ResourcesDeletedListContainer')));;
const DeletedResourceDetailContainer = lazy(() => componentLoader(() => import('./resources/DeletedResourceDetailContainer')));;

const ClientListContainer = lazy(() => componentLoader(() => import('./clients/ClientListContainer')));
const ClientCreateContainer = lazy(() => componentLoader(() => import('./clients/ClientCreateContainer')));
const ClientDetailContainer = lazy(() => componentLoader(() => import('./clients/ClientDetailContainer')));

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
			path: '/auth/resources-deleted',
			exact: true,
			name: 'Deleted resources',
			component: ResourcesDeletedListContainer,
			resource: 'authz:superuser'
		});
		app.Router.addRoute({
			path: '/auth/resources-deleted/:resource_id',
			exact: true,
			name: 'Deleted resource detail',
			component: DeletedResourceDetailContainer,
			resource: 'authz:superuser'
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
			path: '/auth/credentials/!bulk-assignment',
			name: 'Bulk actions',
			component: BulkAssignmentContainer,
			resource: 'authz:superuser'
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
			icon: 'cil-address-book',
			resource: 'seacat:access', // Hide Auth item in sidebar to users without seacat:access rights
			children: [
				{
					name: 'Credentials',
					url: '/auth/credentials',
					icon: 'cil-people',
					resource: "seacat:credentials:access"
				},
				{
					name: 'Tenants',
					url: '/auth/tenant',
					icon: 'cil-apps',
					resource: "seacat:tenant:access"
				},
				{
					name: 'Sessions',
					url: '/auth/session',
					icon: 'cil-link',
					resource: "seacat:session:access"
				},
				{
					name: 'Roles',
					url: '/auth/roles',
					icon: 'cil-user',
					resource: "seacat:role:access"
				},
				{
					name: 'Resources',
					url: '/auth/resources',
					icon: 'cil-lock-unlocked',
					resource: "seacat:resource:access"
				},
				{
					name: 'Clients',
					url: '/auth/clients',
					icon: 'cil-layers',
					resource: "seacat:client:access"
				},
			]
		});
	}
}
