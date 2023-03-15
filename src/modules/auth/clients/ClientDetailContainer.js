import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Link } from "react-router-dom";

import {
	Container, Row, Col,
	Card, CardHeader, CardBody, CardFooter,
	Button, ButtonGroup
} from 'reactstrap';

import ReactJson from 'react-json-view';
import { DateTime, ButtonWithAuthz } from 'asab-webui';

const ClientDetailContainer = (props) =>  {
	const { t } = useTranslation();
	const SeaCatAuthAPI = props.app.axiosCreate('seacat_auth');
	const [client, setClient] = useState(null);
	const { client_id } = props.match.params;

	const resource = "authz:superuser";
	const resources = useSelector(state => state.auth?.resources);
	const theme = useSelector(state => state.theme);
	const advmode = useSelector(state => state.advmode.enabled);

	useEffect(() => {
		getClientDetail();
	}, []);

	const getClientDetail = async () => {
		try {
			let response = await SeaCatAuthAPI.get(`client/${client_id}`);
			if (response.statusText != 'OK') {
				throw new Error("Unable to get client details");
			}
			setClient(response.data);
		} catch (e) {
			console.error(e);
			props.app.addAlert("warning", `${t("ClientDetailContainer|Something went wrong, failed to fetch client details")}. ${e?.response?.data?.message}`, 30);
		}
	}

	const resetSecret = async () => {
		try {
			let response = await SeaCatAuthAPI.post(`client/${client_id}/reset_secret`);
			if (response.statusText != 'OK') {
				throw new Error("Unable to reset client secret");
			}
			props.app.addAlert("success", t('ClientDetailContainer|Secret has been reset successfully'));
			getClientDetail();
		} catch (e) {
			console.error(e);
			props.app.addAlert("warning", `${t("ClientDetailContainer|Something went wrong, failed to reset secret")}. ${e?.response?.data?.message}`, 30);
		}
	}

	const resetSecretConfirm = () => {
		let agreeResetSecret = confirm(t('ClientDetailContainer|Do you want to reset this secret?'));
		if (agreeResetSecret) {
			resetSecret();
		}
	}

	// Set delete client dialog
	const removeClientConfirm = () => {
		let r = confirm(t('ClientDetailContainer|Do you want to remove this client?'));
		if (r === true) {
			removeClient();
		}
	}

	// Remove client
	const removeClient = async () => {
		try {
			let response = await SeaCatAuthAPI.delete(`/client/${client_id}`);
			if (response.statusText != 'OK') {
				throw new Error("Unable to delete client");
			}
			props.app.addAlert("success", t('ClientDetailContainer|Client removed successfully'));
			props.history.push("/auth/clients"); // Redirect to the Client list page
		} catch(e) {
			console.error(e); // log the error to the browser's console
			props.app.addAlert("warning", `${t("ClientDetailContainer|Something went wrong, failed to remove client")}. ${e?.response?.data?.message}`, 30);
		}
	};

	return (
		<Container>
			<Row className="mb-4 justify-content-md-center">
				<Col md={8}>
					<Card>
						<CardHeader className="border-bottom">
							<div className="card-header-title">
								<i className="cil-layers pr-2"></i>
								{t("ClientDetailContainer|Client")}
							</div>
						</CardHeader>
						<CardBody>
							<Row>
								<Col md={4} title="client_name">{t("ClientDetailContainer|Client name")}</Col>
								<Col title="client_name">{client?.client_name ? client.client_name : "N/A"}</Col>
							</Row>
							<Row>
								<Col md={4} title="client_id">{t("ClientDetailContainer|Client ID")}</Col>
								<Col><code>{client?.client_id}</code></Col>
							</Row>
							<Row>
								<Col md={4} title="client_uri">{t("ClientDetailContainer|Client URI")}</Col>
								<Col>{client?.client_uri ? client.client_uri : "N/A"}</Col>
							</Row>
							<Row>
								<Col md={4} title="application_type">{t("ClientDetailContainer|Application type")}</Col>
								<Col title="application_type">{client?.application_type}</Col>
							</Row>
							<Row className="mt-3">
								<Col md={4} title="created_at">{t("Created at")}</Col>
								<Col><DateTime value={client?._c} /></Col>
							</Row>
							<Row>
								<Col md={4} title="modified_at">{t("Modified at")}</Col>
								<Col><DateTime value={client?._m} /></Col>
							</Row>
							<Row className="mt-3">
								<Col md={4} title="code_challenge_method">{t("ClientDetailContainer|Code challenge method")}</Col>
								<Col title="code_challenge_method">{client?.code_challenge_method ? client.code_challenge_method : "N/A"}</Col>
							</Row>
							<Row>
								<Col md={4} title="response_types">{t("ClientDetailContainer|Response types")}</Col>
								<Col title="response_types">
									{client?.response_types?.length > 0 &&
										client?.response_types.map((item, idx) => (
											<div key={idx}>{item}</div>
										))
									}
								</Col>
							</Row>
							<Row>
								<Col md={4} title="grant_types">{t("ClientDetailContainer|Grant types")}</Col>
								<Col title="grant_types">
									{client?.grant_types?.length > 0 &&
										client?.grant_types.map((item, idx) => (
											<div key={idx}>{item}</div>
										))
									}
								</Col>
							</Row>
							<Row className="mt-3">
								<Col md={4} title="token_endpoint_auth_method">{t("ClientDetailContainer|Token endpoint auth. method")}</Col>
								<Col title="token_endpoint_auth_method">{client?.token_endpoint_auth_method}</Col>
							</Row>
							{client?.client_secret &&
								<Row>
									<Col md={4} title="client_secret">{t("ClientDetailContainer|Client secret")}</Col>
									<Col>
										<code>{client?.client_secret}</code>
										<Button
											color="link"
											onClick={() => resetSecretConfirm()}
											className="client-secret-btn"
										>
											{t("ClientDetailContainer|Reset secret")}
										</Button>
									</Col>
								</Row>
							}
							<Row className="mt-3">
								<Col md={4} title="login_uri">{t("ClientDetailContainer|Login URI")}</Col>
								<Col>{client?.login_uri ? client.login_uri : "N/A"}</Col>
							</Row>
							<Row>
								<Col md={4} title="cookie_domain">{t("ClientDetailContainer|Cookie domain")}</Col>
								<Col title="cookie_domain">{client?.cookie_domain ? client.cookie_domain : "N/A"}</Col>
							</Row>
							<Row>
								<Col md={4} title="authorize_uri">{t("ClientDetailContainer|Authorize URI")}</Col>
								<Col>{client?.authorize_uri ? client.authorize_uri : "N/A"}</Col>
							</Row>
							<Row className="mt-3">
								<Col md={4} title="redirect_uris">{t("ClientDetailContainer|Redirect URIs")}</Col>
								<Col title="redirect_uris" className="redirect_uris">
									{client?.redirect_uris.map((item, idx) => (
											<div key={idx} className="redirect-uris-item">{item}</div>))
									}
								</Col>
							</Row>
							<Row className="mt-3">
								<Col md={4} title="authorize_anonymous_users">{t("ClientDetailContainer|Authorize anonymous users")}</Col>
								<Col>{client?.authorize_anonymous_users ? ((client.authorize_anonymous_users == true) ? "true" : "false") : "N/A"}</Col>
							</Row>
						</CardBody>

						<CardFooter>
							<ButtonGroup>
								<Link to={{pathname: `/auth/clients/${client_id}/edit`}}>
									<ButtonWithAuthz
										title={t("Edit")}
										color="primary"
										type="button"
										resource={resource}
										resources={resources}
									>
										{t("Edit")}
									</ButtonWithAuthz>
								</Link>
								<ButtonWithAuthz
									outline
									title={t("ClientDetailContainer|Remove client")}
									color="danger"
									type="button"
									onClick={() => removeClientConfirm()}
									resource={resource}
									resources={resources}
								>
									{t("ClientDetailContainer|Remove client")}
								</ButtonWithAuthz>
							</ButtonGroup>
						</CardFooter>
					</Card>
				</Col>
			</Row>

			<Row className="justify-content-md-center">
				{advmode &&
					<Col md={8}>
						<Card>
							<CardHeader className="border-bottom">
								<div className="card-header-title">
									<i className="cil-code pr-2"></i>
									JSON
								</div>
							</CardHeader>
							{client &&
								<CardBody>
									<ReactJson
										theme={theme === 'dark' ? "chalk" : "rjv-default"}
										src={client}
										name={false}
										collapsed={false}
									/>
								</CardBody>
							}
						</Card>
					</Col>
				}
			</Row>
		</Container>
	);
}

export default ClientDetailContainer;
