import React, { useState, useEffect, useRef, useMemo } from "react"
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Container, Row, Form,  Card,
	CardBody, CardHeader, CardFooter,
	ButtonGroup, Button, Col,
	Input, Dropdown, DropdownToggle,
	DropdownItem, DropdownMenu } from "reactstrap";
import { Credentials, DataTable, ButtonWithAuthz  } from 'asab-webui';

const BulkAssignmentContainer = (props) => {

	const { t } = useTranslation();

	const [data, setData] = useState([]);
	const [count, setCount] = useState(0);
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(0);
	const [filter, setFilter] = useState("");
	const [loading, setLoading] = useState(true);
	const [selectedCredentials, setSelectedCredentials] = useState([]);

	const [tenants, setTenants] = useState({});
	const [tenantsCount, setTenantsCount] = useState(0);
	const [tenantsPage, setTenantsPage] = useState(1);
	const [tenantsLimit, setTenantsLimit] = useState(0);
	const [loadingTenants, setLoadingTenants] = useState(true);
	const [selectedTenants, setSelectedTenants] = useState([]);

	const [show, setShow] = useState(false);
	const [showTenantsContentLoader, setShowTenantsContentLoader] = useState(false);

	let SeaCatAuthAPI = props.app.axiosCreate('seacat_auth');

	// const resourceAddToSelected = "authz:superuser";
	// const resources = useSelector(state => state.auth?.resources);


	// headers for Credentails List
	const headers = [
		{
			name: '',
			customComponent: {
				generate: (credential) => (
					<div>
						<ButtonWithAuthz
							title={t(`BulkAssignment|${credential.assigned ? "Credential already assigned" : "Add credential"}`)}
							id={credential._id}
							size="sm"
							color="primary"
							outline
							onClick={() => saveToSelectedCredentials(credential)}
							// resource={resourceAddToSelected}
							// resources={resources}
							resource="authz:superuser"
							resources={"authz:superuser"}
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
							title={t(`BulkAssignment|${tenant.assigned ? "Tenant already assigned" : "Add tenant"}`)}
							id={tenant._id}
							size="sm"
							color="primary"
							outline
							onClick={() => saveToSelectedTenants(tenant)}
							// resource={resourceAddToSelected}
							// resources={resources}
							resource="authz:superuser"
							resources={"authz:superuser"}
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

	// UseEffect to fetch data for Credentials List based on changes in page/filter/limit
	useEffect(() => {
		setShow(false);
		if (data?.length === 0) {
			// Timeout delays appearance of content loader in DataTable. This measure prevents 'flickering effect' during fast fetch of data, where content loader appears just for a split second.
			setTimeout(() => setShow(true), 500);
		}
		if (limit > 0) {
			retrieveData();
		}
	}, [page, filter, limit]);

	// UseEffect to fetch data for Tenants List based on changes in page/limit
	useEffect(() => {
		setShowTenantsContentLoader(false);
		if (data?.length === 0) {
			// Timeout delays appearance of content loader in DataTable. This measure prevents 'flickering effect' during fast fetch of data, where content loader appears just for a split second.
			setTimeout(() => setShowTenantsContentLoader(true), 500);
		}
		if (limit > 0) {
			retrieveTenants();
		}
	}, [tenantsPage, tenantsLimit]);

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
			let response = await SeaCatAuthAPI.get("/credentials", {params: {p:page, i: limit, f: filter}});
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
		setLoadingTenants(true)
		try {
			let response = await SeaCatAuthAPI.get("/tenants", {params: {p:tenantsPage, i:tenantsLimit}});
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
	const assignMany = async () => {
		let credential_ids = [];
		let tenantObj = {};
		// adjustments to data structure. selectedCredentials is an array of objects. Server expects credential_ids to be an array of ids only [ 'id1', 'id2', ..]
		selectedCredentials.map((obj) => {
			credential_ids.push(obj._id);
		})
		/* adjustments to data structure. selectedTenants is an array of objects. Server expects credential_ids to be an object with
		tenants as keys and array of roles as their values { tenant1: [role1, role2], tenant2: [...], ...} */
		selectedTenants.map((obj) => {
			tenantObj[obj._id] = [];
		})
		try {
			let response = await SeaCatAuthAPI.put("/tenant_assign_many", {"credential_ids": credential_ids, "tenants": tenantObj });
			if (response.data.result !== "OK") {
				throw new Error(t("BulkAssignmentContainer|Failed to perform bulk operation"));
			};
			props.app.addAlert("success", `${t("BulkAssignmentContainer|Bulk action was successful")}.`, 5);
			setSelectedCredentials([]);
			setSelectedTenants([]);
		} catch (e) {
			console.error(e);
			setLoadingTenants(false);
			props.app.addAlert("warning", `${t("BulkAssignmentContainer|Failed to fetch tenants")}. ${e?.response?.data?.message}`, 30);

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
		setSelectedTenants([...selectedTenants, tenantObj]);
	};

	// remove item from selectedTenants state
	const unselectTenant = (idx) => {
		let tenantData = selectedTenants;
		tenantData.splice(idx, 1);
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
						onSearch={(value) => setFilter(value)}
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
				</CardHeader>
				<CardBody>
					{selectedTenants.map((obj, idx) => {
						return (
							<div className='d-flex flex-direction-row align-items-center selected-row'>
								<Button
									title={t("BulkAssignmentContainer|Unselect")}
									outline
									size="sm"
									onClick={() => unselectTenant(idx)}
								>
									<i className='cil-x'/>
								</Button>
								<span className="ml-3">{obj._id}</span>
							</div>
						)
					})}
				</CardBody>
				<CardFooter className="border-top">
					<Button onClick={() => assignMany()}>
						{t("BulkAssignmentContainer|Assign in bulk")}
					</Button>
				</CardFooter>
			</Card>
		</div>
	)
};

export default BulkAssignmentContainer
