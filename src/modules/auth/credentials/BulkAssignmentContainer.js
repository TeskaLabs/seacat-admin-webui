import React, { useState, useEffect, useMemo } from "react"
import { useTranslation } from 'react-i18next';
import { Link } from "react-router-dom";
import { Card, CardBody, CardHeader,
	CardFooter, Button, ButtonGroup } from "reactstrap";
import { DataTable, ButtonWithAuthz } from 'asab-webui';
import RoleDropdown from "../components/RoleDropdown";
import { useSelector } from "react-redux";

const BulkAssignmentContainer = (props) => {

	const { t } = useTranslation();

	const [data, setData] = useState([]);
	const [count, setCount] = useState(0);
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(0);
	const [loading, setLoading] = useState(true);
	const [credentialsFilter, setCredentialsFilter] = useState("");
	const [selectedCredentials, setSelectedCredentials] = useState([]);

	const [tenants, setTenants] = useState([]);
	const [tenantsPage, setTenantsPage] = useState(1);
	const [tenantsCount, setTenantsCount] = useState(0);
	const [tenantsLimit, setTenantsLimit] = useState(0);
	const [tenantsFilter, setTenantsFilter] = useState("");
	const [loadingTenants, setLoadingTenants] = useState(true);
	const [globalRoles, setGlobalRoles] = useState([{global: false, selectedRole: []}]);
	const [selectedTenants, setSelectedTenants] = useState([]);

	const resource = "authz:superuser";
	const resources = useSelector(state => state.auth?.resources);

	// headers for Credentails List
	const headers = [
		{
			name: '',
			customComponent: {
				generate: (credential) => (
					<div>
						<ButtonWithAuthz
							title={t(`BulkAssignmentContainer|${credential.assigned ? "Credential already assigned" : "Add credential"}`)}
							id={credential._id}
							size="sm"
							color="primary"
							outline
							onClick={() => saveToSelectedCredentials(credential)}
							resource={resource}
							resources={resources}
							disabled={credential.assigned}
						>
							<i className="cil-plus"></i>
						</ButtonWithAuthz>
					</div>
				)
			}
		},
		{
			name: '',
			customComponent: {
				generate: (obj) => (
					<div className="no-wrap-40ch">
						{(obj.suspended === true) ?
							<span className="cil-user-unfollow text-muted mr-1" title={(obj.registered === false) ? t("BulkAssignmentContainer|Credentials invited") : t("BulkAssignmentContainer|Credentials suspended")}/>
							: <span className="cil-user mr-1" />}
						<Link
							className={obj.suspended ? 'credentials-suspended' : null}
							onClick={() => confirmForm(`/auth/credentials/${obj._id}`)}
							>
							{/* TODO: substitute with Credentials component, when it's ready */}
							{obj.username ?? obj._id}
						</Link>
					</div>
				)
			},
		}
	];

	// headers for Tenants List
	const tenantHeaders = [
		{
			name: '',
			customComponent: {
				generate: (tenant) => (
					<div>
						<ButtonWithAuthz
							title={t(`BulkAssignmentContainer|${tenant.assigned ? "Tenant already assigned" : "Add tenant"}`)}
							id={tenant._id}
							size="sm"
							color="primary"
							outline
							onClick={() => saveToSelectedTenants(tenant)}
							resource={resource}
							resources={resources}
							disabled={tenant.assigned}
						>
							<i className="cil-plus"></i>
						</ButtonWithAuthz>
					</div>
				)
			}
		},
		{
			name: '',
			customComponent: {
				generate: (tenant) => (
					<Link onClick={() => confirmForm(`/auth/tenant/${tenant._id}`)}>
						{tenant._id}
					</Link>
				)
			}
		}
	];

	// UseEffect to fetch data for Credentials List based on changes in page/credentialsFilter/limit
	useEffect(() => {
		if (limit > 0) {
			retrieveData();
		}
	}, [page, credentialsFilter, limit]);

	// UseEffect to fetch data for Tenants List based on changes in page/tenantsFilter/limit
	useEffect(() => {
		if (limit > 0) {
			retrieveTenants();
		}
	}, [tenantsPage, tenantsFilter, tenantsLimit]);

	/* Actual modified data (this data set was compared compared with `selectedCredentials` and `assigned: true` was added to matching credentials. Assigned:true property
	disables the "+"" button) to be displayed in Credentials list data table */
	const matchAssigned = (data, selectedEvent) => {
		let tableData = [];
		if (data) {
			data.map((dataObj) => {
				let matchedObj = selectedEvent.find(obj => obj._id === dataObj._id);
				if (matchedObj) {
					matchedObj['assigned'] = true;
					tableData.push(matchedObj);
				} else {
					dataObj['assigned'] = false;
					tableData.push(dataObj);
				};
			});
		};
		return tableData;
	};

	/* Actual modified data (this data set was compared compared with `selectedCredentials`/`selectedTenants` and `assigned: true` was added to matching credentials/tenants. Assigned:true property
	disables the "+"" button) to be displayed in Credentials & Tenants list data table */
	const datatableCredentialsData = useMemo(() => {
		return matchAssigned(data, selectedCredentials);
	}, [data, selectedCredentials]);

	const datatableTenantsData = useMemo(() => {
		return matchAssigned(tenants, selectedTenants);
	}, [tenants, selectedTenants]);

	// fetches Credentials Data from server
	const retrieveData = async () => {
		setLoading(true);
		try {
			let SeaCatAuthAPI = props.app.axiosCreate('seacat_auth');
			let response = await SeaCatAuthAPI.get("/credentials", {params: {p:page, i: limit, f: credentialsFilter}});
			if (response.data.result !== "OK") {
				throw new Error(t("BulkAssignmentContainer|Failed to fetch credentials"));
			};
			setData(response.data.data);
			setCount(response.data.count);
			setLoading(false);
		} catch(e) {
			console.error(e);
			setLoading(false);
			// error message for unauthorized access
			if (e.response.status === 401) {
				props.app.addAlert("warning", t("BulkAssignmentContainer|Can't fetch credentials, you don't have rights to display it"), 30);
				return;
			};
			props.app.addAlert("warning", `${t("BulkAssignmentContainer|Failed to fetch credentials")}. ${e?.response?.data?.message}`, 30);
		};
	};

	// fetch data for Tenants List from server
	const retrieveTenants = async () => {
		setLoadingTenants(true);
		try {
			let SeaCatAuthAPI = props.app.axiosCreate('seacat_auth');
			let response = await SeaCatAuthAPI.get("/tenants", {params: {p: tenantsPage, i: tenantsLimit, f: tenantsFilter}});
			setTenants(response.data.data);
			setTenantsCount(response.data.count);
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("BulkAssignmentContainer|Failed to fetch tenants")}. ${e?.response?.data?.message}`, 30);
		}
		setLoadingTenants(false);
	};

	// call to assign all selected tenants to all selected credentials
	const bulkAction = async (actionType) => {
		let credential_ids = [];
		let tenantObj = {};
		// adjustments to data structure. selectedCredentials is an array of objects. Server expects credential_ids to be an array of ids only [ 'id1', 'id2', ..]
		selectedCredentials.map((obj) => {
			credential_ids.push(obj._id);
		})
		/* adjustments to data structure. selectedTenants is an array of objects. Server expects credential_ids to be an object with
		tenants as keys and array of roles as their values { tenant1: [role1, role2], tenant2: [], ...}
		Unless we'd like to do bulk *unassignment*, then unassigning from tenant as a whole requires { tenant1: "UNASSIGN-TENANT", tenant2: [role1, role2,..], ...} */
		selectedTenants.map((obj) => {
			let roles = [];
			if (obj.selectedRole && (obj.selectedRole?.length > 0)) {
					roles = obj.selectedRole;
			} else if (actionType === '/tenant_unassign_many') {
				roles = "UNASSIGN-TENANT";
			};
			// This part of the code uses {_id: Global roles, ...}, which is the representation of global roles, however the API call expects _id to be defined as an asterisk '*' as a representation of global roles
			tenantObj[obj._id] = roles;
		})
		if (globalRoles[0].global) {
			tenantObj['*'] = globalRoles[0].selectedRole
		};
		try {
			let SeaCatAuthAPI = props.app.axiosCreate('seacat_auth');
			let response = await SeaCatAuthAPI.put(actionType, {"credential_ids": credential_ids, "tenants": tenantObj });
			if (response.data.result !== "OK") {
				throw new Error(t("BulkAssignmentContainer|Failed to perform bulk operation"));
			};
			props.app.addAlert("success", `${t("BulkAssignmentContainer|Bulk action was successful")}.`, 5);
			setSelectedCredentials([]);
			setSelectedTenants([]);
			setGlobalRoles([{global: false, selectedRole: []}]);
		} catch (e) {
			console.error(e);
			props.app.addAlert("warning", `${t("BulkAssignmentContainer|Failed to perform bulk operation")}. ${e?.response?.data?.message}`, 30);
		}
	};

	// pops up confirmation prompt. The prompt notifies user about selected data loss after redirection to a credential/tenant detail screen
	const confirmForm = (route) => {
		var r = confirm(t('BulkAssignmentContainer|Do you really want to leave this screen? Selected data will be lost'));
		if (r === true) {
			props.history.push(route);
		}
	};

	// add specific(selected) credential object to selectedCrenetials state
	const saveToSelectedCredentials = (credentialObj) => {
		setSelectedCredentials([...selectedCredentials, credentialObj]);
	};

	// remove item from selectedCredentials state
	const unselectCredential = (idx) => {
		let selectedCredData = selectedCredentials;
		selectedCredData.splice(idx, 1);
		setSelectedCredentials([...selectedCredData]);
	};

	// add specific(selected) tenant object to selectedTenants state
	const saveToSelectedTenants = (tenantObj) => {
		let arr = [...selectedTenants];
		arr.push(tenantObj);
		setSelectedTenants([...arr]);
	};

	// remove item from selectedTenants state
	const unselectTenant = (idx) => {
		let tenantData = [...selectedTenants];
		tenantData.splice(idx, 1);
		setSelectedTenants([...tenantData]);
	};

	// removes selected Role
	const unselectRole = (tenantIndex, roleIndex) => {
		let tenantData = [...selectedTenants];
		tenantData[tenantIndex].selectedRole.splice(roleIndex, 1);
		setSelectedTenants([...tenantData]);
	};

	const unselectGlobalRole = (roleIndex) => {
		let globalCopy = [...globalRoles];
		globalCopy[0].selectedRole.splice(roleIndex, 1);
		if (globalCopy[0].selectedRole.length === 0) {
			globalCopy[0].global = false;
		}
		setGlobalRoles(globalCopy);
	}

	return (
		<div className='bulk-actions-wraper'>
			<div className='credentials-list'>
					<DataTable
						title={{ text: t("BulkAssignmentContainer|Credentials"), icon: "cil-people" }}
						headers={headers}
						data={datatableCredentialsData}
						count={count}
						limit={limit}
						setLimit={setLimit}
						currentPage={page}
						setPage={setPage}
						search={{ icon: 'cil-magnifying-glass', placeholder: t("BulkAssignmentContainer|Search") }}
						onSearch={(value) => setCredentialsFilter(value)}
						isLoading={loading}
						contentLoader={loading}
						checkbox={{title: t("BulkAssignmentContainer|Select displayed"), checked: selectedCredentials, setChecked: setSelectedCredentials }}
					/>
			</div>

			<Card className="credentials-selection">
				<CardHeader className="border-bottom">
					<div className="card-header-title">
						<i className="cil-people mr-2" />
						{t("BulkAssignmentContainer|Selected credentials")}
					</div>
					<Button outline secondary disabled={(selectedCredentials.length === 0)} onClick={() => setSelectedCredentials([])}>{t("BulkAssignmentContainer|Clear selection")}</Button>
				</CardHeader>
				<CardBody>
					{selectedCredentials.map((obj, idx) => {
						return (
							<div className='d-flex flex-direction-row align-items-center selected-row'>
								<Button
									title={t("BulkAssignmentContainer|Unselect")}
									outline
									size="sm"
									onClick={() => unselectCredential(idx)}
								>
									<i className='cil-x'/>
								</Button>
								<i className="cil-user mr-1 ml-3"/>{obj.username ?? obj._id}
							</div>
						)
					})}
				</CardBody>
			</Card>

			<div className='tenant-list'>
				<DataTable
					title={{ text: t("BulkAssignmentContainer|Tenants"), icon: "cil-apps" }}
					headers={tenantHeaders}
					data={datatableTenantsData}
					count={tenantsCount}
					limit={tenantsLimit}
					setLimit={setTenantsLimit}
					currentPage={tenantsPage}
					setPage={setTenantsPage}
					search={{ icon: 'cil-magnifying-glass', placeholder: t("BulkAssignmentContainer|Search") }}
					onSearch={(value) => setTenantsFilter(value)}
					isLoading={loadingTenants}
					contentLoader={loadingTenants}
				/>
			</div>

			<Card className="tenant-selection">
				<CardHeader className="border-bottom">
					<div className="card-header-title">
						<i className="cil-apps mr-2" />
						{t("BulkAssignmentContainer|Selected tenants and roles")}
					</div>
				</CardHeader>
				<CardBody className="selected-roles-tenants">
					<div className='d-flex flex-direction-row align-items-center selected-row'>
						<span className="ml-3">{t("BulkAssignmentContainer|Global roles")}</span>
						<RoleDropdown
							props={props}
							tenantObj={globalRoles[0]}
							selectedTenants={globalRoles}
							setSelectedTenants={setGlobalRoles}
							idx={0}
						/>
					</div>
					<div className="role-wrapper ml-2">
						{globalRoles[0]?.selectedRole ?
							globalRoles[0]?.selectedRole.map((role, i) => {
								return (
									<div className="role-item selected-row ml-4">
										<Button
											title={t("BulkAssignmentContainer|Unselect")}
											className="btn-xs"
											size="sm"
											outline
											color="secondary"
											onClick={() => unselectGlobalRole(i)}
										>
											<i className="cil-x"/>
										</Button>
										<span className="pl-2">{role}</span>
									</div>
								)
							})
						:
							null
						}
					</div>
					{selectedTenants?.map((obj, idx) => {
						return (
							<>
								<div className='d-flex flex-direction-row align-items-center selected-row'>
									<Button
										title={t("BulkAssignmentContainer|Unselect")}
										outline
										size="sm"
										className="tenant-unselect-btn"
										onClick={() => unselectTenant(idx)}
									>
										<i className='cil-x'/>
									</Button>
									<span className="ml-3">{obj._id}</span>
									<RoleDropdown
										props={props}
										tenantObj={obj}
										selectedTenants={selectedTenants}
										setSelectedTenants={setSelectedTenants}
										idx={idx}
									/>
								</div>
								<div className="role-wrapper ml-2">
									{obj?.selectedRole ?
										obj.selectedRole.map((role, i) => {
											return (
												<div className="role-item selected-row ml-4">
													<Button
														title={t("BulkAssignmentContainer|Unselect")}
														className="btn-xs"
														size="sm"
														outline
														color="secondary"
														onClick={() => unselectRole(idx, i)}
													>
														<i className="cil-x"/>
													</Button>
													<span className="pl-2">{role}</span>
												</div>
											)
										})
									:
										null
									}
								</div>
							</>
						)
					})}
				</CardBody>
				<CardFooter className="border-top">
					<ButtonGroup>
						<ButtonWithAuthz
							title={t(`BulkAssignmentContainer|${((selectedCredentials.length === 0) || ((selectedTenants.length === 1) && (globalRoles[0]?.selectedRole?.length === 0))) ? 'Select credentials and tenants' : 'Assign in bulk'}`)}
							color="primary"
							onClick={() => bulkAction('/tenant_assign_many')}
							resource={resource}
							resources={resources}
							disabled={(selectedCredentials.length === 0) || ((selectedTenants.length === 0) && (globalRoles[0]?.selectedRole?.length === 0))}
						>
							{t('BulkAssignmentContainer|Assign in bulk')}
						</ButtonWithAuthz>
					</ButtonGroup>
					<div className="actions-right">
						<ButtonWithAuthz
							title={t(`BulkAssignmentContainer|${((selectedCredentials.length === 0) || ((selectedTenants.length === 0) && (globalRoles[0]?.selectedRole?.length === 0))) ? 'Select credentials and tenants' : 'Remove assignment'}`)}
							color="primary"
							outline
							onClick={() => bulkAction('/tenant_unassign_many')}
							resource={resource}
							resources={resources}
							disabled={(selectedCredentials.length === 0) || ((selectedTenants.length === 0) && (globalRoles[0]?.selectedRole?.length === 0))}
						>
							{t('BulkAssignmentContainer|Remove assignment')}
						</ButtonWithAuthz>
					</div>
				</CardFooter>
			</Card>
		</div>
	)
};

export default BulkAssignmentContainer
