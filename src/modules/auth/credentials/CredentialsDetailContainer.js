import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useForm } from "react-hook-form";
import { useTranslation } from 'react-i18next';

import {
	Container, Row, Col,
	Card, CardHeader, CardFooter, CardBody,
	Form, Button, ButtonGroup
} from 'reactstrap';

import {
	PhoneField,
	EmailField
} from './FormFields';

import ReactJson from 'react-json-view';
import { DateTime, ButtonWithAuthz, CellContentLoader } from 'asab-webui';

import CredentialsRolesCard from './CredentialsRolesCard';
import CredentialsTenantsCard from './CredentialsTenantsCard';
import CredentialsSessionCard from './CredentialsSessionCard';
import { CustomDataContainer } from '../components/CustomDataContainer';

function CredentialsDetailContainer(props) {

	let SeaCatAuthAPI = props.app.axiosCreate('seacat_auth');
	const { t, i18n } = useTranslation();

	const [data, setData] = useState(null);
	const [suspended, setSuspended] = useState(undefined);
	const [sessions, setSessions] = useState([]);
	const [providerID, setProviderID] = useState(undefined);
	const [updateFeatures, setUpdateFeatures] = useState([]);
	const [customCredentialData, setCustomCredentialData] = useState({'': ''});
	const [loadingCustomData, setLoadingCustomData] = useState(true);
	const [rolesRefresh, setRolesRefresh] = useState(true);

	const resources = useSelector(state => state.auth?.resources);
	const advmode = useSelector(state => state.advmode?.enabled);
	const theme = useSelector(state => state.theme);

	const resourceAssignTenantRole = "authz:tenant:admin";
	const resourceManageCredentials = "authz:superuser";
	const displaySessions = resources ? resources.indexOf("authz:superuser") != -1 : false;
	const credentials_id = props.match.params.credentials_id;

	useEffect(() => {
		retrieveData();
		if (displaySessions) {
			retrieveSessions();
		}
	}, []);

	useEffect(() => {
		if (providerID != undefined) {
			retrieveProviderData();
		}
	}, [providerID]);


	const retrieveData = async () => {
		try {
			let response = await SeaCatAuthAPI.get(`/credentials/${credentials_id}`);
			setData(response.data);
			setSuspended(response.data.suspended);
			setProviderID(response.data._provider_id);
			response.data?.data && setCustomCredentialData(response.data.data);
			setLoadingCustomData(false);
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("CredentialsDetailContainer|Something went wrong, failed to fetch user details")}. ${e?.response?.data?.message}`, 30);
		}
	};


	const retrieveProviderData = async () => {
		try {
			let response = await SeaCatAuthAPI.get(`/provider/${providerID}`);
			if (response.data.result !== "OK") {
				throw new Error(t("CredentialsDetailContainer|Something went wrong, failed to fetch provider data"));
			}
			if (response.data.update) {
				setUpdateFeatures(response.data.update);
			}
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("CredentialsDetailContainer|Something went wrong, failed to fetch provider data")}. ${e?.response?.data?.message}`, 30);
		}
	};


	const retrieveSessions = async () => {
		// Retrieve sessions
		try {
			let response = await SeaCatAuthAPI.get(`/sessions/${credentials_id}`);
			setSessions(response.data.data);
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("CredentialsDetailContainer|Something went wrong, failed to fetch user sessions")}. ${e?.response?.data?.message}`, 30);
		}
	}


	// Set delete user dialog
	const deleteUserForm = () => {
		var r = confirm(t('CredentialsDetailContainer|Do you want to remove this user?'));
		if (r === true) {
			deleteUser();
		}
	}

	// Remove user
	const deleteUser = async () => {
		try {
			let response = await SeaCatAuthAPI.delete(`/credentials/${credentials_id}`);
			props.app.addAlert("success", t('CredentialsDetailContainer|User removed successfully'));
			// Redirect to the Credentials list page
			props.history.push("/auth/credentials");
		} catch(e) {
			console.error(e); // log the error to the browser's console
			props.app.addAlert("warning", `${t("CredentialsDetailContainer|Something went wrong, failed to remove user")}. ${e?.response?.data?.message}`, 30);
		}
	};


	// Set suspend/activate user dialog
	const suspendUserForm = (isActive) => {
		if (isActive) {
			var r = confirm(t('CredentialsDetailContainer|Do you want to suspend this user?'));
		} else {
			var r = confirm(t('CredentialsDetailContainer|Do you want to activate this user?'));
		}

		if (r == true) {
			suspendUser(isActive);
		}
	}

	// Suspend user
	const suspendUser = async (suspend) => {
		if (suspended === false || suspended === undefined) {
			setSuspended(true);
		} else {
			setSuspended(false);
		}

		try {
			let response = await SeaCatAuthAPI.put(`/credentials/${credentials_id}`,
				JSON.stringify({"suspended": suspend}),
				{ headers:
					{
						'Content-Type': 'application/json'
					}
				});
			props.app.addAlert("success", t('CredentialsDetailContainer|User has been updated successfully'));
			// Update page
			retrieveData();
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("CredentialsDetailContainer|Something went wrong, failed to update user")}. ${e?.response?.data?.message}`, 30);
		}
	}

	// Reset password
	const resetPwd = () => {
		props.history.push(`/auth/credentials/${credentials_id}/passwordreset`);
	}

	// Resend invitation
	const resendInvitation = async () => {
		// Body should be empty
		try {
			let response = await SeaCatAuthAPI.post(`/invite/${credentials_id}`,
				{},
				{ headers:
					{
						'Content-Type': 'application/json'
					}
				});
			props.app.addAlert("success", t('CredentialsDetailContainer|Invitation sent successfully'));
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("CredentialsDetailContainer|Something went wrong, failed to resend invitation")}. ${e?.response?.data?.message}`, 30);
		}
	}

	return (
		<Container fluid className="credential-detail-wrapper">
			<div className="credential-detail-info-wrapper credential-detail-info-area">
				<div className="credential-detail-area">
					<Card className="general-info-card">
						<CardHeader className="border-bottom">
							<div className="card-header-title">
								<i className="cil-people pr-2"></i>
								{t("CredentialsDetailContainer|Credentials")}
							</div>
						</CardHeader>

						<CardBody>
						{data !== null ?
						<>
							{data.username !== undefined ?
							<Row>
								<Col sm={3} className="pr-0">{t('CredentialsDetailContainer|Username')}</Col>
								<Col>{data.username}</Col>
							</Row>
							: null}

							<Row>
								<Col sm={3} className="pr-0">{t('CredentialsDetailContainer|ID')}</Col>
								<Col><code>{data._id}</code></Col>
							</Row>

							<Row>
								<Col sm={3} className="pr-0">{t('CredentialsDetailContainer|Status')}</Col>
								<Col>
									{(data.suspended === false) || (data.suspended == undefined) ?
										<span className="credential-status credential-active-status">{t('CredentialsDetailContainer|Active')}</span>
									:
										<span className={`credential-status ${(data?.registered == false) ? "credential-invited-status" : "credential-suspended-status"}`}>
											{(data?.registered == false) ? t('CredentialsDetailContainer|Invited') : t('CredentialsDetailContainer|Suspended')}
										</span>
									}
									<br />
									{(data?.registered == false) ?
									<ButtonWithAuthz
										style={{padding: 0, borderWidth: 0, marginTop: "8px"}}
										onClick={() => { resendInvitation() }}
										color="link"
										resource={resourceManageCredentials}
										resources={resources}
									>
										{t('CredentialsDetailContainer|Resend invitation')}
									</ButtonWithAuthz>
									:
									<ButtonWithAuthz
										style={{padding: 0, borderWidth: 0}}
										onClick={(e) => { e.preventDefault(); suspendUserForm((suspended === false) || (suspended === undefined)) }}
										color="link"
										resource={resourceManageCredentials}
										resources={resources}
									>
										{(suspended === false) || (suspended === undefined) ?
											t('CredentialsDetailContainer|Suspend user')
										:
											t('CredentialsDetailContainer|Activate user')
										}
									</ButtonWithAuthz>
									}
								</Col>
							</Row>

							<Row>
								<Col sm={3} className="pr-0">{t('CredentialsDetailContainer|Created at')}</Col>
								<Col><DateTime value={data._c} /></Col>
							</Row>

							<Row>
								<Col sm={3} className="pr-0">{t('CredentialsDetailContainer|Modified at')}</Col>
								<Col><DateTime value={data._m} /></Col>
							</Row>
						</>
						: null}
						</CardBody>

						<CardFooter>
							<ButtonGroup>
								<ButtonWithAuthz
									resource={resources}
									resources={resources}
									color="danger"
									outline
									onClick={() => { deleteUserForm() }}
								>
									{t('CredentialsDetailContainer|Remove user')}
								</ButtonWithAuthz>
								<ButtonWithAuthz
									color="outline-primary"
									resource={resources}
									resources={resources}
									onClick={() => { resetPwd() }}
								>
									{t('CredentialsDetailContainer|Reset password')}
								</ButtonWithAuthz>
							</ButtonGroup>
						</CardFooter>

					</Card>

					<Card className="login-info-card">
						<CardHeader className="border-bottom">
							<div className="card-header-title">
								<i className="cil-people pr-2"></i>
								{t('CredentialsDetailContainer|Last logins')}
							</div>
						</CardHeader>
						{data !== null ?
						<CardBody>

							<Row>
								<Col sm={3} className="pr-0">{t('CredentialsDetailContainer|Successful')}</Col>
								{ (data._ll === undefined) || (data._ll.sat === undefined) ?
									<Col>N/A</Col>
								:
									<React.Fragment>
										<Col className="pr-0">
											<DateTime value={data._ll.sat} />
										</Col>
										{data._ll.sfi !== undefined && <Col xs={11} sm={4}>
											{data._ll.sfi.join(", ")}
										</Col>}
									</React.Fragment>
								}
							</Row>

							<Row>
								<Col sm={3} className="pr-0">{t('CredentialsDetailContainer|Failed')}</Col>
								{ (data._ll === undefined) || (data._ll.fat === undefined) ?
									<Col>N/A</Col>
								:
									<React.Fragment>
										<Col className="pr-0">
											<DateTime value={data._ll.fat} />
										</Col>
										{data._ll.ffi !== undefined && <Col>
											{data._ll.ffi.join(", ")}
										</Col>}
									</React.Fragment>
								}
							</Row>
						</CardBody>
						:null}
						<CardFooter></CardFooter>
					</Card>
				</div>

				<div className="info-detail-area">
					<CredentialsInfoCard
						app={props.app}
						data={data}
						credentials_id={credentials_id}
						retrieveData={retrieveData}
						updateFeatures={updateFeatures}
						resources={resources}
						resource={resourceManageCredentials}
					/>
					<CustomDataContainer
						resources={resources}
						customData={customCredentialData}
						setCustomData={setCustomCredentialData}
						app={props.app}
						loading={loadingCustomData}
						uri={`credentials/${credentials_id}`}
					/>
				</div>
			</div>
			<div className="credential-detail-resource-area credential-resources-wrapper">
				<CredentialsTenantsCard app={props.app} credentials_id={credentials_id} resource={resourceAssignTenantRole} resources={resources} setRolesRefresh={setRolesRefresh}/>

				{displaySessions && <CredentialsSessionCard
					app={props.app}
					credentials_id={credentials_id}
					data={sessions}
					resources={resources}
					retrieveSessions={retrieveSessions}/>
				}
				<CredentialsRolesCard app={props.app} credentials_id={credentials_id} resource={resourceAssignTenantRole} resources={resources} rolesRefresh={rolesRefresh}/>
			</div>

			<div className="credential-detail-json-area">
				{(advmode == true) && <Card className="h-100">
						<CardHeader className="border-bottom">
							<div className="card-header-title">
								<i className="cil-code pr-2"></i>
								JSON
							</div>
						</CardHeader>
						{data !== null ?
						<CardBody>
							<ReactJson
								theme={theme === 'dark' ? "chalk" : "rjv-default"}
								src={data}
								name={false}
								collapsed={false}
							/>
						</CardBody>
						: null}
					</Card>
				}
			</div>

		</Container>
	)
}


export default CredentialsDetailContainer;


function CredentialsInfoCard(props) {
	const { handleSubmit, register, formState: { errors }, getValues, setValue } = useForm();
	const { t, i18n } = useTranslation();
	const [ editMode, setEditMode ] = useState(false);
	const [ onUpdate, setOnUpdate ] = useState(false);
	const disableEmail = props.updateFeatures.some(feature => feature.type === "email") ? false : true;
	const disablePhone = props.updateFeatures.some(feature => feature.type === "phone") ? false : true;

	if (props.data != null && onUpdate === false) {
		setValue("email", props.data.email);
		setValue("phone", props.data.phone);
		setOnUpdate(true);
	}

	// Update user
	const onSubmit = async (values) => {
		let SeaCatAuthAPI = props.app.axiosCreate('seacat_auth');

		// If one of the fields (phone or email) is not met, it will be sent 'null' to the body
		if (values.phone === "") {
			values.phone = null;
		}

		if (values.email === "") {
			values.email = null;
		}

		let response;
		try {
			response = await SeaCatAuthAPI.put(`credentials/${props.credentials_id}`,
				JSON.stringify(values),
				{ headers: {
						'Content-Type': 'application/json'
					}
				});
			if (response.data.result !== "OK") {
				throw new Error(t("CredentialsDetailContainer|Something went wrong, failed to update user"));
			}
			props.app.addAlert("success", t('CredentialsDetailContainer|User has been updated successfully'));
			setEditMode(false);
			setOnUpdate(true);
			props.retrieveData();
		} catch(e) {
			if (e.response.status === 400) {
				if (e.response.data.result.key === "phone" && e.response.data.result.error === "ALREADY-IN-USE") {
					console.error(t("CredentialsDetailContainer|Phone number already in use"));
					props.app.addAlert("warning", t("CredentialsDetailContainer|Phone number already in use"), 30);
					return;
				} else if (e.response.data.result.key === "email" && e.response.data.result.error === "ALREADY-IN-USE") {
					console.error(t("CredentialsDetailContainer|Email address already in use"));
					props.app.addAlert("warning", t("CredentialsDetailContainer|Email address already in use"), 30);
					return;
				}
			}
			console.error(e);
			props.app.addAlert("warning", `${t("CredentialsDetailContainer|Something went wrong, failed to update user")}. ${e?.response?.data?.message}`, 30);
			return;
		}
	}

	return (
		<Form className="cred-info-card" onSubmit={handleSubmit(onSubmit)}>
			<Card className="h-100">
				<CardHeader className="border-bottom">
					<div className="card-header-title">
						<i className="cil-info pr-2"></i>
						{t("CredentialsDetailContainer|Information")}
					</div>
				</CardHeader>

				<CardBody>
					<fieldset disabled={editMode ? "": "disabled"}>
						<EmailField register={register} getValues={getValues} errors={errors} disable={disableEmail}/>
						<PhoneField register={register} getValues={getValues} setValue={setValue} errors={errors} disable={disablePhone}/>
					</fieldset>
				</CardBody>

				<CardFooter>
				{editMode ?
					<React.Fragment>
						<ButtonGroup>
							<Button color="primary" type="submit">{t("Save")}</Button>
							<Button color="outline-primary" type="button" onClick={(e) => (setEditMode(false), setOnUpdate(false))}>{t("Cancel")}</Button>
						</ButtonGroup>
					</React.Fragment>
				:
					<ButtonWithAuthz
						title={props.updateFeatures.length === 0 && t("CredentialsDetailContainer|Information editing is not allowed within this credentials")}
						color="primary"
						outline
						type="button"
						onClick={(e) => (e.preventDefault(), setEditMode(true))}
						disabled={props.updateFeatures.length === 0}
						resources={props.resources}
						resource={props.resource}
					>
						{t("Edit")}
					</ButtonWithAuthz>
				}
				</CardFooter>
			</Card>
		</Form>

	);
}
