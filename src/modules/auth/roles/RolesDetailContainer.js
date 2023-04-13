import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Link } from "react-router-dom";

import {
	Container, Row, Col,
	Card, CardHeader, CardBody, CardFooter,
	DropdownToggle, DropdownMenu,
	DropdownItem, Dropdown, Input
} from 'reactstrap';

import ReactJson from 'react-json-view';
import { DateTime, DataTable, ButtonWithAuthz, Credentials } from 'asab-webui';

import RolesResourcesCard from './RolesResourcesCard';

const RolesDetailContainer = (props) =>  {
	const { t } = useTranslation();
	const [role, setRole] = useState(null);
	const SeaCatAuthAPI = props.app.axiosCreate('seacat_auth');
	const { role_name, tenant_id } = props.match.params;

	const [credentialsList, setCredentialsList] = useState([]);
	const [assignedCredentialsDropdown, setAssignedCredentialsDropdown] = useState([]);
	const resource = tenant_id === "*" ? "authz:superuser" : "authz:tenant:admin";
	const resources = useSelector(state => state.auth?.resources);
	const advmode = useSelector(state => state.advmode?.enabled);
	const theme = useSelector(state => state.theme);

	const [count, setCount] = useState(0);
	const timeoutRef = useRef(null);
	const [page, setPage] = useState(1);
	const [filter, setFilter] = useState("");
	const [loading, setLoading] = useState(true);
	const [show, setShow] = useState(false);
	const [dropdownOpen, setDropdownOpen] = useState(false);

	const toggleDropdown = () => setDropdownOpen(prevState => !prevState);
	const limit = 10;

	const headers = [
		{
			name: t('RolesDetailContainer|Name'),
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
							<span className="cil-user-unfollow text-muted mr-1" title={t("RolesDetailContainer|Credentials suspended")}/>
							: <span className="cil-user mr-1" />}
						<Link
							style={{color: obj.suspended === true && '#73818f'}}
							to={{
								pathname: `/auth/credentials/${obj._id}`,
							}}>
						{/* TODO: substitute with Credentials component, when it's ready */}
							{obj.username ??  obj._id}
						</Link>
					</div>
				)
			}
		},
		{
			name: " ",
			customComponent: {
				generate: (credentials) => (
					<div className="d-flex justify-content-end">
						<ButtonWithAuthz
							outline
							title={t("RolesDetailContainer|Unassign credentials")}
							id={credentials._id}
							size="sm"
							color="danger"
							onClick={() => {unassignCredentialsForm(credentials._id)}}
							resource="authz:tenant:admin"
							resources={resources}
						>
							<i className="cil-x"></i>
						</ButtonWithAuthz>
					</div>
				)
			}
		}
	];

	const suspendRow = {condition: (row) => (row.suspended === true), className: "bg-light"};

	useEffect(() => {
		if (timeoutRef.current !== null) {
			clearTimeout(timeoutRef.current);
		}
		timeoutRef.current = setTimeout(() => {
			timeoutRef.current = null;
			retrieveCredentialsForDropdown()
		}, 500);
	}, [filter]);

	useEffect(() => {
		if (role?._id) {
			retrieveAssignedCredentials();
			setShow(false);
			if (credentialsList.length === 0) {
			// Timeout delays appearance of content loader in DataTable. This measure prevents 'flickering effect' during fast fetch of data, where content loader appears just for a split second.
				setTimeout(() => setShow(true), 500);
			};
		}
	}, [role, page]);


	useEffect(() => {
		getRoleDetail();
	}, []);


	const getRoleDetail = async () => {
		try {
			let response = await SeaCatAuthAPI.get(`role/${tenant_id}/${role_name}`);
			setRole(response.data);
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("RolesDetailContainer|Something went wrong, failed to fetch role detail")}. ${e?.response?.data?.message}`, 30);
		}
	}

	const removeRole = async () => {
		try {
			let response = await SeaCatAuthAPI.delete(`role/${tenant_id}/${role_name}`);
			props.app.addAlert("success", t("RolesDetailContainer|Role removed successfully"));
			props.history.push("/auth/roles");
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("RolesDetailContainer|Failed to remove the role")}. ${e?.response?.data?.message}`, 30);
		}
	}

	const removeRoleForm = () => {
		const r = confirm(t("RolesDetailContainer|Do you want to remove the role?"));
		if (r) removeRole();
	}

	const retrieveAssignedCredentials = async () => {
		try {
			let response = await SeaCatAuthAPI.get(`/credentials?m=role&f=${role._id}`, {params: {p:page, i: limit}});
			if (response.data.result === 'NOT-AUTHORIZED') {
				setCredentialsList([]);
				setCount(0);
				setLoading(false);
				return;
			} else if (response.data.result !== "OK") {
				throw new Error(t("RolesDetailContainer|Something went wrong, failed to fetch assigned credentials"));
			}
			setCredentialsList(response.data.data);
			setCount(response.data.count);
			setLoading(false);
		} catch(e) {
			console.error(e);
			setLoading(false);
			props.app.addAlert("warning", `${t("RolesDetailContainer|Something went wrong, failed to fetch assigned credentials")}. ${e?.response?.data?.message}`, 30);
		}
	};

	// Receives data from all credentials
	const retrieveCredentialsForDropdown = async () => {
		let response;
		try {
			response = await SeaCatAuthAPI.get("/credentials", {params: {p:page, i: limit, f: filter}});
			if (response.data.result !== "OK") {
				throw new Error(t("RolesDetailContainer|Something went wrong, failed to fetch data"));
			}
			setAssignedCredentialsDropdown(response.data.data);
			setLoading(false);
		} catch(e) {
			console.error(e);
			setLoading(false);
			if (e.response.status === 401) {
				props.app.addAlert("warning", t("RolesDetailContainer|Can't fetch the data, you don't have rights to display it"), 30);
				return;
			}
			props.app.addAlert("warning", `${t("RolesDetailContainer|Something went wrong, failed to fetch data")}. ${e?.response?.data?.message}`, 30);
		}
	};

	// Assign user to particular tenant
	const assignCredentials = async (credentialsId) => {
		try {
			let response = await SeaCatAuthAPI.post(`/role_assign/${credentialsId}/${role._id}`);

			if (response.data.result != 'OK') {
				throw new Error(t('RolesDetailContainer|Unable to assign credentials'));
			}
			retrieveAssignedCredentials();
		} catch(e) {
			if (e.response?.data?.result === "ALREADY-EXISTS") {
				props.app.addAlert("warning", t("RolesDetailContainer|The selected credential has already been assigned"), 30);
			} else {
				console.error(e);
				props.app.addAlert("warning", `${t("RolesDetailContainer|Something went wrong, the credentials cannot be assigned")}. ${e?.response?.data?.message}`, 30);
			}
		}
	};

	// Unassign user to particular tenant
	const unassignCredentials = async (credentialsId) => {
		try {
			let response = await SeaCatAuthAPI.delete(`/role_assign/${credentialsId}/${role._id}`);

			if (response.data.result != 'OK') {
				throw new Error(t('RolesDetailContainer|Unable to unassign credentials'));
			}
			retrieveAssignedCredentials();

		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("RolesDetailContainer|Something went wrong, the credentials cannot be unassigned")}. ${e?.response?.data?.message}`, 30);
		}
	};

	const unassignCredentialsForm = (credentialsId) => {
		var r = confirm(t('RolesDetailContainer|Do you want to unassign these credentials?'));
		if (r == true) {
			unassignCredentials(credentialsId);
		}
	}

	const assignNewCredentials = (
		<Dropdown isOpen={dropdownOpen} toggle={toggleDropdown} onClick={() => retrieveCredentialsForDropdown()}>
			<DropdownToggle caret outline className="card-header-dropdown" color="primary">
				{t("RolesDetailContainer|Assign credentials")}
			</DropdownToggle>
			<DropdownMenu className="assign-credential-list-dropdown">
				<DropdownItem header>
					<Input
						className="m-0"
						placeholder={t("RolesDetailContainer|Search")}
						onChange={e => setFilter(e.target.value)}
						value={filter}
					/>
				</DropdownItem>
				{loading ?
					<DropdownItem><span>{t("RolesDetailContainer|Loading...")}</span></DropdownItem>
					:
					(assignedCredentialsDropdown && Object.keys(assignedCredentialsDropdown).map((item, i) => {
						let checkCredentialsAvailability = credentialsList.findIndex(elem => elem._id === assignedCredentialsDropdown[item]._id);
						if (checkCredentialsAvailability === -1) {
							// Display only if the credentials is not already assigned
							return (
								<DropdownItem key={assignedCredentialsDropdown[item]._id} onClick={() => assignCredentials(assignedCredentialsDropdown[item]._id)}>
									{assignedCredentialsDropdown[item].username ?
										<span>{assignedCredentialsDropdown[item].username}</span>
										:
										<Credentials
											className="disabled-link"
											app={props.app}
											credentials_ids={assignedCredentialsDropdown[item]._id}
										/>
									}
								</DropdownItem>
							)
						} else { return null }
					}))
				}
				{assignedCredentialsDropdown.length === 0 && <DropdownItem><span>{t("RolesDetailContainer|No match")}</span></DropdownItem>}
			</DropdownMenu>
		</Dropdown>
	);

	if (!role) return null;

	return (
		<Container>
			<div className="role-detail-wrapper">
				<Card className="w-100 role-detail-info">
					<CardHeader className="border-bottom">
						<div className="card-header-title">
							<i className="cil-user pr-2"></i>
							{t("RolesDetailContainer|Role")}
						</div>
					</CardHeader>
					<CardBody>
						<Row>
							<Col md={3}>{t("Name")}</Col>
							<Col>{role._id}</Col>
						</Row>
						<Row className="mt-3">
							<Col md={3}>{t("Created at")}</Col>
							<Col><DateTime value={role._c} /></Col>
						</Row>
						<Row>
							<Col md={3}>{t("Modified at")}</Col>
							<Col><DateTime value={role._m} /></Col>
						</Row>
					</CardBody>
					<CardFooter>
						<ButtonWithAuthz
							className="mr-3"
							title={t("RolesDetailContainer|Remove role")}
							color="danger"
							outline
							onClick={removeRoleForm}
							resource={resource}
							resources={resources}
						>
							{t("RolesDetailContainer|Remove role")}
						</ButtonWithAuthz>
					</CardFooter>
				</Card>

				<RolesResourcesCard
					app={props.app}
					role={role}
					params={props.match.params}
					resources={resources}
					resource={resource}
				/>

				<div className="role-detail-credentials-area">
					<DataTable
						title={{ text: t("RolesDetailContainer|Assigned credentials"), icon: "cil-storage" }}
						headers={headers}
						data={credentialsList}
						count={count}
						limit={limit}
						currentPage={page}
						setPage={setPage}
						customComponent={assignNewCredentials}
						customRowClassName={suspendRow}
						isLoading={loading}
						contentLoader={show}
					/>
				</div>

				{advmode &&
					<Card  className="mb-4 w-100 role-detail-json-area">
						<CardHeader className="border-bottom">
							<div className="card-header-title">
								<i className="cil-code pr-2"></i>
								JSON
							</div>
						</CardHeader>
						{role &&
							<CardBody>
								<ReactJson
									theme={theme === 'dark' ? "chalk" : "rjv-default"}
									src={role}
									name={false}
									collapsed={false}
								/>
							</CardBody>
						}
					</Card>
				}
			</div>
		</Container>
	);
}

export default RolesDetailContainer;
