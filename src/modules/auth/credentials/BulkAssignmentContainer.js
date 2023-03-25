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
	const [tenantsFilter, setTenantsFilter] = useState("");
	const [loadingTenants, setLoadingTenants] = useState(true);
	const [selectedTenants, setSelectedTenants] = useState([]);

	const [show, setShow] = useState(false);

	let SeaCatAuthAPI = props.app.axiosCreate('seacat_auth');

	// const resourceCreateCredentials = "authz:tenant:admin";
	// const resources = useSelector(state => state.auth?.resources);
	// const tenant = useSelector(state => state.tenant?.current);


	// headers for CredentailsList
	const headers = [
		{
			name: '',
			customComponent: {
				generate: (credential) => (
					<div className="">
						<ButtonWithAuthz
							title={t("Add Credential")}
							id={credential._id}
							size="sm"
							color="primary"
							outline
							onClick={() => saveToSelectedCredentials(credential)}
							resource="authz:superuser"
							// resources={resources}
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
							}}>
							{/* TODO: substitute with Credentials component, when it's ready */}
							{obj.username ?? obj._id}
						</Link>
					</div>
				)
			},
		}
	];

	// headers for Roles
	const tenantHeaders = [
		{
			name: '',
			customComponent: {
				generate: (tenant) => (
					<div className="">
						<ButtonWithAuthz
							title={t("Add Tenant")}
							id={tenant._id}
							size="sm"
							color="primary"
							outline
							onClick={() => saveToSelectedTenants(tenant)}
							resource="authz:superuser"
							// resources={resources}
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
				pathname: "/auth/tenant/"
			}
		}
	];

	// const suspendRow = {condition: (row) => (row.suspended === true), className: "bg-light"};

	// Filter the value
	const onSearch = (value) => {
		setFilter(value);
	};

	// for CREDENTIALS
	useEffect(() => {
		setShow(false);
		if (data?.length === 0) {
			// Timeout delays appearance of content loader in DataTable. This measure prevents 'flickering effect' during fast fetch of data, where content loader appears just for a split second.
			setTimeout(() => setShow(true), 500);
		}
		if (limit > 0) {
			retrieveData();
		}
		// remove limit, since it will probabbly bbe hard coded?
	}, [page, filter, limit]);

	// for TENANTS
	useEffect(() => {
		setShow(false);
		if (data?.length === 0) {
			// Timeout delays appearance of content loader in DataTable. This measure prevents 'flickering effect' during fast fetch of data, where content loader appears just for a split second.
			setTimeout(() => setShow(true), 500);
		}
		if (limit > 0) {
			retrieveTenants();
		}
		// remove limit, since it will probabbly bbe hard coded?
	}, [tenantsPage, tenantsFilter, tenantsLimit]);

	const datatableCredentialsData = useMemo(() => {
		let credentialsTableData = [];
		if (data) {
			data.map((credObj) => {
				let matchObj = selectedCredentials.find(obj => obj._id === credObj._id);
				console.log('selectedCredentials', selectedCredentials);
				console.log('matchObj', matchObj);
				if (matchObj) {
					matchObj['assigned'] = true;
					credentialsTableData.push(matchObj);
				} else {
					credObj['assigned'] = false;
					credentialsTableData.push(credObj);
				}
			})
		}
		return credentialsTableData
	}, [data, selectedCredentials])

	const datatableTenantsData = useMemo(() => {
		let tenantsTableData = [];
		if (tenants.length > 0) {
			tenants.map((tenantObj) => {
				let matchObj = selectedTenants.find(obj => obj._id === tenantObj._id);
				console.log('selectedTenants', selectedTenants);
				console.log('matchObj', matchObj);
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
	}, [tenants, selectedTenants])

	//retrieves Credentials Data
	const retrieveData = async () => {
		let SeaCatAuthAPI = props.app.axiosCreate('seacat_auth');
		let response;
		setLoading(true);
		try {
			response = await SeaCatAuthAPI.get("/credentials", {params: {p:page, i: limit, f: filter}});
			if (response.data.result !== "OK") {
				throw new Error(t("BulkAssignmentContainer|Failed to fetch data"));
			}
			setData(response.data.data);
			setCount(response.data.count);
			setLoading(false);
		} catch(e) {
			console.error(e);
			setLoading(false);
			if (e.response.status === 401) {
				props.app.addAlert("warning", t("BulkAssignmentContainer|Can't fetch the data, you don't have rights to display it"), 30);
				return;
			}
			props.app.addAlert("warning", `${t("BulkAssignmentContainer|Failed to fetch data")}. ${e?.response?.data?.message}`, 30);
		}
	};

	// retrieves tenatns to display in Tenants List
	const retrieveTenants = async () => {
		try {
			let response = await SeaCatAuthAPI.get("/tenants", {params: {p:tenantsPage, i:tenantsLimit}});
			setTenants(response.data.data);
			setTenantsCount(response.data.count);
			setLoadingTenants(false);
		} catch(e) {
			console.error(e);
			setLoadingTenants(false);
			props.app.addAlert("warning", `${t("BulkAssignmentContainer|Failed to fetch tenants")}. ${e?.response?.data?.message}`, 30);
		}
	}

	const assignMany = async () => {
		let credential_ids = [];
		let tenantObj = {};
		selectedCredentials.map((obj) => {
			credential_ids.push(obj._id);
		})
		selectedTenants.map((obj) => {
			tenantObj[obj._id] = [];
		})
		console.log('credential_ids', credential_ids)
		console.log('tenant_ids', tenantObj)
		try {
			await SeaCatAuthAPI.put("/tenant_assign_many", {"credential_ids": credential_ids, "tenants": tenantObj })
		} catch (error) {

		}
	}

	const saveToSelectedCredentials = (credentialObj) => {
		setSelectedCredentials([...selectedCredentials, credentialObj]);
	}

	// remove item from selected credentials
	const unselectCredential = (idx) => {
		let credData = selectedCredentials;
		credData.splice(idx, 1);
		setSelectedCredentials([...credData]);
	}

	const saveToSelectedTenants = (tenantObj) => {
		setSelectedTenants([...selectedTenants, tenantObj]);
	}

	const unselectTenant = (idx) => {
		let tenantData = selectedTenants;
		tenantData.splice(idx, 1);
		setSelectedTenants([...tenantData]);
	}

	return (
		// <div className="h-100" ref={ref}>
		<div className='wraper'>

			<div className='credentials-list'>
					<DataTable
						title={{ text: t("CredentialsListdiv|Credentials"), icon: "cil-storage" }}
						headers={headers}
						data={datatableCredentialsData}
						count={count}
						limit={limit}
						setLimit={setLimit}
						currentPage={page}
						setPage={setPage}
						search={{ icon: 'cil-magnifying-glass', placeholder: t("CredentialsListdiv|Search") }}
						onSearch={onSearch}
						customRowClassName={'bg-white'}
						isLoading={loading}
						contentLoader={show}
						height={700}
					/>
			</div>

			<div className='credentials-selection'>
				<Card>
					<CardHeader>
						<div className="card-header-title">
							<i className="cil-list" />
							Selected credentials
						</div>
					</CardHeader>
					<CardBody>
						{selectedCredentials.map((obj, idx) => {
							return (
								<div className='d-flex flex-direction-row align-items-center selected-row'>
									<Button outline size="sm" secondary onClick={() => unselectCredential(idx)}><i className='cil-x'/></Button>
									<span className="cil-user mr-1 ml-3" />{obj.username ?? obj._id}
								</div>
							)
						})}
					</CardBody>
					<CardFooter className="border-top">
						<Button onClick={() => console.log('selected', selectedCredentials)}>Action</Button>
					</CardFooter>
				</Card>
			</div>

			<div className='tenant-list'>
				<DataTable
					title={{ text: t("TenantListContainer|Tenants"), icon: "cil-apps" }}
					headers={tenantHeaders}
					data={datatableTenantsData}
					count={tenantsCount}
					limit={tenantsLimit}
					setLimit={setTenantsLimit}
					currentPage={tenantsPage}
					setPage={setTenantsPage}
					isLoading={loadingTenants}
					contentLoader={show}
				/>
			</div>

			<div className='tenant-selection'>
				<Card>
					<CardHeader>
						<div className="card-header-title">
							<i className="cil-list" />
							Selected Tenants
						</div>
					</CardHeader>
					<CardBody>
						{selectedTenants.map((obj, idx) => {
							return (
								<div className='d-flex flex-direction-row align-items-center selected-row'>
									<Button outline size="sm" secondary onClick={() => unselectTenant(idx)}><i className='cil-x'/></Button>
									<span className="ml-3">{obj._id}</span>
								</div>
							)
						})}
					</CardBody>
					<CardFooter className="border-top">
						<Button onClick={() => assignMany()}>Action</Button>
					</CardFooter>
				</Card>
			</div>
		</div>
	)
};

export default BulkAssignmentContainer
