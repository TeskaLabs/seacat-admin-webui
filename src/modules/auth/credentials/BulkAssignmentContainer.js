import React, { useState, useEffect, useMemo } from "react"
import { useTranslation } from 'react-i18next';
import { Link } from "react-router-dom";
import { Card, CardBody, CardHeader,
	CardFooter, Button, ButtonGroup } from "reactstrap";
import {DataTable, ButtonWithAuthz  } from 'asab-webui';
import RoleDropdown from "../components/RoleDropdown";
import { useSelector } from "react-redux";

const BulkAssignmentContainer = (props) => {

	const { t } = useTranslation();

	const [data, setData] = useState([]);
	const [count, setCount] = useState(0);
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(0);
	const [credentialsFilter, setCredentialsFilter] = useState("");
	const [loading, setLoading] = useState(true);
	const [selectedCredentials, setSelectedCredentials] = useState([]);

	const [tenants, setTenants] = useState({});
	const [tenantsCount, setTenantsCount] = useState(0);
	const [tenantsPage, setTenantsPage] = useState(1);
	const [tenantsLimit, setTenantsLimit] = useState(0);
	const [tenantsFilter, setTenantsFilter] = useState("");
	const [loadingTenants, setLoadingTenants] = useState(true);
	const [selectedTenants, setSelectedTenants] = useState([]);

	const [show, setShow] = useState(false);
	const [showTenantsContentLoader, setShowTenantsContentLoader] = useState(false);

	let SeaCatAuthAPI = props.app.axiosCreate('seacat_auth');

	const resourceAddToSelected = "authz:superuser";
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
							resource={resourceAddToSelected}
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
					<div
						style={{whiteSpace: "nowrap",
							maxWidth: "40ch",
							textOverflow: "ellipsis",
							overflow: "hidden",
							marginBottom: 0}}
					>
						{obj.suspended === true ?
							<span className="cil-user-unfollow text-muted mr-1" title={(obj.registered === false) ? t("BulkAssignmentContainer|Credentials invited") : t("BulkAssignmentContainer|Credentials suspended")}/>
							: <span className="cil-user mr-1" />}
						<Link
							style={{color: obj.suspended === true && '#73818f'}}
							to={{
								pathname: `/auth/credentials/${obj._id}`,
							}}
							target="_blank"
							rel="noopener noreferrer">
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
							resource={resourceAddToSelected}
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
			key: "_id",
			link: {
				key: "_id",
				pathname: "/auth/tenant/",
				target: "_blank"
			}
		}
	];

	// UseEffect to fetch data for Credentials List based on changes in page/credentialsFilter/limit
	useEffect(() => {
		setShow(false);
		if (data?.length === 0) {
			// Timeout delays appearance of content loader in DataTable. This measure prevents 'flickering effect' during fast fetch of data, where content loader appears just for a split second.
			setTimeout(() => setShow(true), 500);
		}
		if (limit > 0) {
			retrieveData();
		}
	}, [page, credentialsFilter, limit]);

	// UseEffect to fetch data for Tenants List based on changes in page/tenantsFilter/limit
	useEffect(() => {
		setShowTenantsContentLoader(false);
		if (data?.length === 0) {
			// Timeout delays appearance of content loader in DataTable. This measure prevents 'flickering effect' during fast fetch of data, where content loader appears just for a split second.
			setTimeout(() => setShowTenantsContentLoader(true), 500);
		}
		if (limit > 0) {
			retrieveTenants();
		}
	}, [tenantsPage, tenantsFilter, tenantsLimit]);

	// Actual adjusted data (compared with `selectedCredentials`) to be displayed in Credentials list data table
	const datatableCredentialsData = useMemo(() => {
		let credentialsTableData = [];
		if (data) {
			data.map((credObj) => {
				/* we are maping over `data` (state used for Credentials). Each element of `data` state is an object with property `_id` (among others).
				We are trying to match the value of this property with any selectedCredentials state's element's `_id` property.
				If a match is found, a key value pair of `assigned: true` is assigned to that object */
				let matchedObj = selectedCredentials.find(obj => obj._id === credObj._id);
				if (matchedObj) {
					matchedObj['assigned'] = true;
					credentialsTableData.push(matchedObj);
				} else {
					credObj['assigned'] = false;
					credentialsTableData.push(credObj);
				}
			})
		}
		return credentialsTableData
	}, [data, selectedCredentials]);

	const datatableTenantsData = useMemo(() => {
		let tenantsTableData = [];
		if (tenants.length > 0) {
			tenants.map((tenantObj) => {
				/* we are maping over `tenants` (state used for Tenants). Each element of `tenants` state is an object with property `_id` (among others).
				We are trying to match the value of this property with any selectedTenants state's element's `_id` property.
				If a match is found, a key value pair of `assigned: true` is assigned to that object */
				let matchObj = selectedTenants.find(obj => obj._id === tenantObj._id);
				if (matchObj) {
					matchObj['assigned'] = true;
					tenantsTableData.push(matchObj);
				} else {
					tenantObj['assigned'] = false;
					tenantsTableData.push(tenantObj);
				}
			})
		}
		return tenantsTableData
	}, [tenants, selectedTenants]);

	// fetched Credentials Data from server
	const retrieveData = async () => {
		setLoading(true);
		try {
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

	// fetch roles for Tenant dropdowns
	const retrieveRoleList = async (tenantObj) => {
		let response;
		let arr;
		try {
			response = await SeaCatAuthAPI.get(`/role/${tenantObj._id}`, {params: tenantObj._id !== '*' ? {'exclude_global': true} : {}});
			tenantObj['roles'] = response.data;
			arr = [...selectedTenants, tenantObj];
			setSelectedTenants(arr);
		} catch (e) {
			console.error(e);
			props.app.addAlert("warning", `${t("BulkAssignmentContainer|Failed to fetch roles")}. ${e?.response?.data?.message}`, 30);
		}
	}

	// fetch data for Tenants List from server
	const retrieveTenants = async () => {
		setLoadingTenants(true);
		try {
			let response = await SeaCatAuthAPI.get("/tenants", {params: {p: tenantsPage, i: tenantsLimit, f: tenantsFilter}});
			if (response.data.result !== "OK") {
				throw new Error(t("BulkAssignmentContainer|Failed to fetch tenants"));
			};
			setTenants(response.data.data);
			setTenantsCount(response.data.count);
			setLoadingTenants(false);
		} catch(e) {
			console.error(e);
			setLoadingTenants(false);
			props.app.addAlert("warning", `${t("BulkAssignmentContainer|Failed to fetch tenants")}. ${e?.response?.data?.message}`, 30);
		}
	};

	// call to assign all selected tenants to all selected credentials
	const bulkAction = async (actionType) => {
		let credential_ids = [];
		let tenantObj = {};
		// adjustments to data structure. selectedCredentials is an array of objects. Server expects credential_ids to be an array of ids only [ 'id1', 'id2', ..]
		selectedCredentials.map((obj) => {
			credential_ids.push(obj._id);
		})
		//in order to successfully perform a bulk operation on global roles, global roles have to be individually selected. in this condition, we are looking for items, which are defined
		// as global, however do not contain any specific roles to be (un)assigned
		let globalRolesUnspecified = selectedTenants.find((tenantObj) => ((tenantObj._id === '*') && ((tenantObj.selectedRole == undefined) || (tenantObj.selectedRole.length === 0))));
		if (globalRolesUnspecified) {
			props.app.addAlert("warning", `${t("BulkAssignmentContainer|Global roles have to be individually specified")}`, 30);
			return
		}
		/* adjustments to data structure. selectedTenants is an array of objects. Server expects credential_ids to be an object with
		tenants as keys and array of roles as their values { tenant1: [role1, role2], tenant2: [], ...}
		Unless we'd like to do bulk *unassignment*, then unassigning from tenant as a whole requires { tenant1: "UNASSIGN-TENANT", tenant2: [role1, role2,..], ...} */
		selectedTenants.map((obj) => {
			let roles = [];
			if (obj.selectedRole && (obj.selectedRole.length > 0)) {
				roles = obj.selectedRole;
			} else if (actionType === '/tenant_unassign_many') {
				roles = "UNASSIGN-TENANT";
			};
			tenantObj[obj._id] = roles;
		})
		try {
			let response = await SeaCatAuthAPI.put(actionType, {"credential_ids": credential_ids, "tenants": tenantObj });
			if (response.data.result !== "OK") {
				throw new Error(t("BulkAssignmentContainer|Failed to perform bulk operation"));
			};
			props.app.addAlert("success", `${t("BulkAssignmentContainer|Bulk action was successful")}.`, 5);
			setSelectedCredentials([]);
			setSelectedTenants([]);
		} catch (e) {
			console.error(e);
			setLoadingTenants(false);
			props.app.addAlert("warning", `${t("BulkAssignmentContainer|Failed to perform bulk operation")}. ${e?.response?.data?.message}`, 30);

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
		retrieveRoleList(tenantObj)
	};

	// remove item from selectedTenants state
	const unselectTenant = (idx) => {
		let tenantData = selectedTenants;
		tenantData.splice(idx, 1);
		setSelectedTenants([...tenantData]);
	};

	// removes selected Role
	const unselectRole = (tenantIndex, roleIndex) => {
		let tenantData = selectedTenants;
		tenantData[tenantIndex].selectedRole.splice(roleIndex, 1);
		console.log('tenantData', tenantData);
		setSelectedTenants([...tenantData]);
	};


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
						contentLoader={show}
					/>
			</div>

			<Card className="credentials-selection">
				<CardHeader className="border-bottom">
					<div className="card-header-title">
						<i className="cil-people mr-2" />
						{t("BulkAssignmentContainer|Selected credentials")}
					</div>
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
					contentLoader={showTenantsContentLoader}
				/>
			</div>

			<Card className="tenant-selection">
				<CardHeader className="border-bottom">
					<div className="card-header-title">
						<i className="cil-apps mr-2" />
						{t("BulkAssignmentContainer|Selected tenants")}
					</div>
					<ButtonWithAuthz
						title={t("CredentialsListContainer|Add global role(s)")}
						outline
						color="primary"
						onClick={() => retrieveRoleList({_id: '*'})}
						resource={resourceAddToSelected}
						resources={resources}
					>
						{t("BulkAssignmentContainer|Add global role(s)")}
					</ButtonWithAuthz>
				</CardHeader>
				<CardBody>
					{selectedTenants.map((obj, idx) => {
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
										tenantObj={obj}
										selectedTenants={selectedTenants}
										setSelectedTenants={setSelectedTenants}
										idx={idx}
									/>
								</div>
								<div className="role-wrapper ml-2">
									{obj.selectedRole ?
										obj.selectedRole.map((role, i) => {
											return (
												<div className="role-item selected-row ml-4">
													<Button className="btn-xs" size="sm" outline color="secondary" onClick={() => unselectRole(idx, i)}>
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
							title={t(`BulkAssignmentContainer|${((selectedCredentials.length === 0) || (selectedTenants.length === 0)) ? 'Select credentials and tenants' : 'Assign in Bulk'}`)}
							color="primary"
							onClick={() => bulkAction('/tenant_assign_many')}
							resource={resourceAddToSelected}
							resources={resources}
							disabled={(selectedCredentials.length === 0) || (selectedTenants.length === 0)}
						>
							{t('BulkAssignmentContainer|Assign in bulk')}
						</ButtonWithAuthz>
					</ButtonGroup>
					<div className="actions-right">
						<ButtonWithAuthz
							title={t(`BulkAssignmentContainer|${((selectedCredentials.length === 0) || (selectedTenants.length === 0)) ? 'Select credentials and tenants' : 'Remove assignment'}`)}
							color="primary"
							outline
							onClick={() => bulkAction('/tenant_unassign_many')}
							resource={resourceAddToSelected}
							resources={resources}
							disabled={(selectedCredentials.length === 0) || (selectedTenants.length === 0)}
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
