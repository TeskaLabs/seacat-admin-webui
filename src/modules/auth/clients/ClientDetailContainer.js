import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import {
	Container, Row, Col,
	Card, CardHeader, CardBody, CardFooter,
	Button, ButtonGroup, Input, FormGroup
} from 'reactstrap';

import ReactJson from 'react-json-view';
import { DateTime, ButtonWithAuthz } from 'asab-webui';

const ClientDetailContainer = (props) =>  {
	const { t } = useTranslation();
	const SeaCatAuthAPI = props.app.axiosCreate('seacat_auth');
	const [client, setClient] = useState(null);
	const { client_id } = props.match.params;

	const resource = "seacat:client:edit";
	const resources = useSelector(state => state.auth?.resources);
	const theme = useSelector(state => state.theme);
	const advmode = useSelector(state => state.advmode.enabled);

	useEffect(() => {
		getClientDetail();
	}, []);

	const getClientDetail = async () => {
		try {
			let response = await SeaCatAuthAPI.get(`client/${client_id}`);
			setClient(response.data);
		} catch (e) {
			console.error(e);
			props.app.addAlert("warning", `${t("ClientDetailContainer|Something went wrong, failed to fetch client details")}. ${e?.response?.data?.message}`, 30);
		}
	}

	const resetSecret = async () => {
		try {
			let response = await SeaCatAuthAPI.post(`client/${client_id}/reset_secret`);
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
			if (response.data.result !== "OK") {
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
		<Container fluid className="client-wrapper">
			<Card className="client-main-info-card">
				<CardHeader className="border-bottom">
					<div className="card-header-title">
						<i className="at-pc pr-2"></i>
						{t("ClientDetailContainer|Client")}
					</div>
				</CardHeader>
				<CardBody>
					<Row>
						<Col md={5} title="client_name">{t("ClientDetailContainer|Client name")}</Col>
						<Col title="client_name">{client?.client_name ? client.client_name : "N/A"}</Col>
					</Row>
					<Row>
						<Col md={5} title="client_id">{t("ClientDetailContainer|Client ID")}</Col>
						<Col><code>{client?.client_id ? client.client_id : "N/A"}</code></Col>
					</Row>
					<Row className="mt-3">
						<Col md={5} title="created_at">{t("Created at")}</Col>
						<Col><DateTime value={client?._c} /></Col>
					</Row>
					<Row>
						<Col md={5} title="modified_at">{t("Modified at")}</Col>
						<Col><DateTime value={client?._m} /></Col>
					</Row>
					<Row className="mt-3">
						<Col md={5} title="redirect_uris">{t("ClientDetailContainer|Redirect URIs")}</Col>
						<Col title="redirect_uris" className="redirect_uris">
							{client?.redirect_uris.map((item, idx) => (
								<div key={idx} className="redirect-uris-item">{item}</div>))
							}
						</Col>
					</Row>
					<Row>
						<Col md={5} title="redirect_uri_validation_method">{t("ClientDetailContainer|Redirect URI validation method")}</Col>
						<Col>{client?.redirect_uri_validation_method ? client.redirect_uri_validation_method : "N/A"}</Col>
					</Row>
					<Row>
						<Col md={5} title="client_uri">{t("ClientDetailContainer|Client URI")}</Col>
						<Col>{client?.client_uri ? client.client_uri : "N/A"}</Col>
					</Row>
					<Row>
						<Col md={5} title="application_type">{t("ClientDetailContainer|Application type")}</Col>
						<Col title="application_type">{client?.application_type}</Col>
					</Row>
				</CardBody>
				<CardFooter>
					<ButtonGroup>
						<ButtonWithAuthz
							title={t("Edit")}
							color="primary"
							type="button"
							resource={resource}
							resources={resources}
							onClick={() => props.history.push(`/auth/clients/${client_id}/edit`)}
						>
							{t("Edit")}
						</ButtonWithAuthz>
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

			<Card className="client-multidomain-card">
				<CardHeader className="border-bottom">
					<div className="card-header-title">
						<i className="at-sliders pr-2"></i>
						{t("ClientDetailContainer|Multidomain")}
					</div>
				</CardHeader>
				<CardBody>
					<Row>
						<Col md={5} title="login_uri">{t("ClientDetailContainer|Login URI")}</Col>
						<Col>{client?.login_uri ? client.login_uri : "N/A"}</Col>
					</Row>
					<Row>
						<Col md={5} title="cookie_domain">{t("ClientDetailContainer|Cookie domain")}</Col>
						<Col title="cookie_domain">{client?.cookie_domain ? client.cookie_domain : "N/A"}</Col>
					</Row>
					<Row>
						<Col md={5} title="authorize_uri">{t("ClientDetailContainer|Authorize URI")}</Col>
						<Col>{client?.authorize_uri ? client.authorize_uri : "N/A"}</Col>
					</Row>
				</CardBody>
			</Card>

			<Card className="client-authorization-card">
				<CardHeader className="border-bottom">
					<div className="card-header-title">
						<i className="at-replay-arrow-left-right pr-2"></i>
						{t("ClientDetailContainer|Authorization")}
					</div>
				</CardHeader>
				<CardBody>
					<Row>
						<Col md={5} title="code_challenge_method">{t("ClientDetailContainer|Code challenge method (PKCE)")}</Col>
						<Col title="code_challenge_method">{client?.code_challenge_method ? client.code_challenge_method : "N/A"}</Col>
					</Row>
					<Row>
						<Col md={5} title="response_types">{t("ClientDetailContainer|Response types")}</Col>
						<Col title="response_types">
							{client?.response_types?.length > 0 &&
								client?.response_types.map((item, idx) => (
									<div key={idx}>{item}</div>
								))
							}
						</Col>
					</Row>
					<Row>
						<Col md={5} title="grant_types">{t("ClientDetailContainer|Grant types")}</Col>
						<Col title="grant_types">
							{client?.grant_types?.length > 0 &&
								client?.grant_types.map((item, idx) => (
									<div key={idx}>{item}</div>
								))
							}
						</Col>
					</Row>
					<Row>
						<Col md={5} title="token_endpoint_auth_method">{t("ClientDetailContainer|Token endpoint auth. method")}</Col>
						<Col title="token_endpoint_auth_method">{client?.token_endpoint_auth_method}</Col>
					</Row>
					{client?.client_secret &&
						<Row>
							<Col md={5} title="client_secret">{t("ClientDetailContainer|Client secret")}</Col>
							<Col>
								<code>{client?.client_secret ? client.client_secret : "N/A"}</code>
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
				</CardBody>
			</Card>

			<Card className="client-access-control-card">
				<CardHeader className="border-bottom">
					<div className="card-header-title">
						<i className="at-arrow-down-to-square pr-2"></i>
						{t("ClientDetailContainer|Access control")}
					</div>
				</CardHeader>
				<CardBody>
					<FormGroup check>
						<Input
							id="authorize_anonymous_users"
							name="authorize_anonymous_users"
							type="checkbox"
							disabled={true}
							checked={(client?.authorize_anonymous_users == true) ? true : false}
						/>{' '}
						{t('ClientDetailContainer|Authorize anonymous users')}
					</FormGroup>
				</CardBody>
			</Card>

			{advmode &&
				<Card className="w-100 adv-card">
					<CardHeader className="border-bottom">
						<div className="card-header-title">
							<i className="at-programming pr-2"></i>
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
			}
		</Container>
	);
}

export default ClientDetailContainer;
