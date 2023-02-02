import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from 'react-i18next';

import {
	Container, Row, Col,
	Card, CardHeader, CardBody, CardFooter,
	Button, ButtonGroup, Form, FormText
} from 'reactstrap';

import ReactJson from 'react-json-view';
import { DateTime, ButtonWithAuthz } from 'asab-webui';
import { TextInput, URiInput } from "./FormFields";

const ClientDetailContainer = (props) =>  {
	const { t } = useTranslation();
	const SeaCatAuthAPI = props.app.axiosCreate('seacat_auth');
	const [client, setClient] = useState(null);
	const [editMode, setEditMode] = useState(false);
	const [disabled, setDisabled] = useState(false);
	const { client_id } = props.match.params;

	const resource = "authz:superuser";
	const resources = useSelector(state => state.auth?.resources);
	const theme = useSelector(state => state.theme);
	const advmode = useSelector(state => state.advmode.enabled);


	const { handleSubmit, formState: { errors, isSubmitting, isDirty }, control, setValue, register } = useForm();

	const { fields, append, remove, update } = useFieldArray({
		control,
		name: "redirect_uris"
	});

	const regRedirectUrisMain = register("redirect_uris_main", {
		validate: {
			emptyInput: value => (value && value.toString().length !== 0) || t("ClientDetailContainer|URI can't be empty"),
			startWith: value => (/(https:\/\/)/).test(value) || t("ClientDetailContainer|URI have to start with https"),
			urlHash: value => (value && new URL(value).hash.length === 0) || t("ClientDetailContainer|URL hash have to be empty"),
		}
	});

	useEffect(() => {
		getClientDetail();
	}, []);

	/*
		First reset the value we have in the 'client' state. This must be done in order to assign a new value
		In the condition we assign values from the dates to the dynamic inputs
		These values will be updated if the data in the 'client' state changes
	 */
	useEffect(() => {
		let arrUris = []; // copy array
		if (client && client.redirect_uris) {
			arrUris = [...client.redirect_uris];
			setValue("redirect_uris_main", arrUris[0]);
			arrUris.splice(0, 1);
			arrUris.map((item, idx) => {
				update(idx, item);
				setValue(`redirect_uris[${idx}].value`, item);
			});
		}
	}, [client]);

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

	const onSubmit = async (values) => {
		setDisabled(true);

		let body = {}
		let uri = []
		// Refactor object "redirect_uris" to array
		await Promise.all(Object.keys(values).map(async (key, idx) => {
			if (key === "redirect_uris_main") {
				if (values[key] != "") {
					uri.push(values[key]);
				}
			} else if (key === "redirect_uris") {
				values["redirect_uris"] && values["redirect_uris"].map(item => {
					// Don't append empty redirect_uris's
					if (item.value) {
						uri.push(item.value);
					}
				})
			} else if (key == "client_name") {
				body[key] = values[key];
			} else if (key == "cookie_domain") {
				body[key] = values[key];
			}
		}))
		body["redirect_uris"] = uri;

		if (body.client_name == undefined) {
			body.client_name = "";
		}

		try {
			console.log(body)
			let response = await SeaCatAuthAPI.put(`/client/${client_id}`, body);
			if (response.statusText != 'OK') {
				throw new Error("Unable to change client details");
			}
			setClient({...client, redirect_uris: uri});
			setEditMode(false);
			setDisabled(false);
			getClientDetail();
			props.app.addAlert("success", t("ClientDetailContainer|Client updated successfully"));
		} catch (e) {
			setDisabled(false);
			setEditMode(true);
			console.error(e);
			props.app.addAlert("warning", `${t("ClientDetailContainer|Something went wrong, failed to update client")}. ${e?.response?.data?.message}`, 30);
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
						<Form onSubmit={handleSubmit(onSubmit)}>
							<CardHeader className="border-bottom">
								<div className="card-header-title">
									<i className="cil-layers pr-2"></i>
									{t("ClientDetailContainer|Client")}
								</div>
							</CardHeader>
							<CardBody className="card-body-client">
								<Row className="card-body-row">
									<Col md={4} title="client_name">{t("ClientDetailContainer|Client name")}</Col>
									{editMode ?
										<Col className="client-edit">
											<TextInput name="client_name" register={register} disabled={disabled}/>
										</Col>
									:
										<Col className="client-edit" title="client_name">{client?.client_name ? client.client_name : "N/A"}</Col>
									}
								</Row>
								<Row className="card-body-row">
									<Col md={4} title="client_id">{t("ClientDetailContainer|Client ID")}</Col>
									<Col><code>{client?.client_id}</code></Col>
								</Row>
								<Row className="card-body-row">
									<Col md={4} title="client_uri">{t("ClientDetailContainer|Client URI")}</Col>
									<Col>{client?.client_uri ? client.client_uri : "N/A"}</Col>
								</Row>
								{client?.client_secret &&
									<Row className="card-body-row">
										<Col md={4} title="client_secret">{t("ClientDetailContainer|Client secret")}</Col>
										<Col>
											<code>{client?.client_secret}</code>
											<Button
												style={{padding: 0, borderWidth: 0, marginTop: "8px"}}
												color="link"
												onClick={() => resetSecretConfirm()}
											>
												{t("ClientDetailContainer|Reset secret")}
											</Button>
										</Col>
									</Row>
								}
								<Row className="mt-2 card-body-row">
									<Col md={4} title="created_at">{t("Created at")}</Col>
									<Col><DateTime value={client?._c} /></Col>
								</Row>
								<Row className="card-body-row">
									<Col md={4} title="modified_at">{t("Modified at")}</Col>
									<Col><DateTime value={client?._m} /></Col>
								</Row>
								<Row className="card-body-row">
									<Col md={4} title="application_type">{t("ClientDetailContainer|Application type")}</Col>
									<Col title="application_type">{client?.application_type}</Col>
								</Row>
								<Row className="card-body-row">
									<Col md={4} title="response_types">{t("ClientDetailContainer|Response types")}</Col>
									<Col title="response_types">
										{client?.response_types.length > 0 &&
											client?.response_types.map((item, idx) => (
												<div key={idx}>{item}</div>
											))
										}
									</Col>
								</Row>
								<Row className="card-body-row">
									<Col md={4} title="grant_types">{t("ClientDetailContainer|Grant types")}</Col>
									<Col title="grant_types">
										{client?.grant_types.length > 0 &&
											client?.grant_types.map((item, idx) => (
												<div key={idx}>{item}</div>
											))
										}
									</Col>
								</Row>
								<Row className="card-body-row">
									<Col md={4} title="token_endpoint_auth_method">{t("ClientDetailContainer|Token endpoint auth. method")}</Col>
									<Col title="token_endpoint_auth_method">{client?.token_endpoint_auth_method}</Col>
								</Row>
								<Row className="card-body-row">
									<Col md={4} title="cookie_domain">{t("ClientDetailContainer|Cookie domain")}</Col>
									{editMode ?
										<Col className="client-edit">
											<TextInput name="cookie_domain" register={register} errors={errors} disabled={disabled}/>
										</Col>
									:
										<Col className="client-edit" title="cookie_domain">{client?.cookie_domain ? client.cookie_domain : "N/A"}</Col>
									}
								</Row>
								<Row className="mt-3 card-body-row">
									<Col md={4} title="redirect_uris">{t("ClientDetailContainer|Redirect URIs")}</Col>
									<Col title="redirect_uris" className={"redirect_uris" + (editMode ? "" : " edit")}>
										{editMode ?
											<>
												<URiInput name="redirect_uris_main" invalid={errors?.redirect_uris_main && true} mailTemplateName="redirect_uris" errors={errors} append={append} remove={remove} fields={fields} register={register} reg={regRedirectUrisMain} disabled={disabled} labelName={t("ClientDetailContainer|Redirect URIs")}/>
												<FormText>{t("ClientDetailContainer|Redirect URI must be in absolute format without a fragment component.")}</FormText>
											</>
										:
											client?.redirect_uris.map((item, idx) => (
												<div key={idx} className="redirect-uris-item">{item}</div>))
										}
									</Col>
								</Row>
							</CardBody>

							<CardFooter>
								<ButtonGroup>
									{editMode ?
										<>
											<Button
												color="primary"
												type="submit"
												title={isDirty ? t("ClientDetailContainer|Save changes") : t("ClientDetailContainer|No changes were made")}
												disabled={!isDirty || isSubmitting}
											>
												{t("Save")}
											</Button>
											<Button
												color="outline-primary"
												type="button"
												disabled={isSubmitting}
												onClick={(e) => (setEditMode(false))}
											>
												{t("Cancel")}
											</Button>
										</>
									:
										<>
											<ButtonWithAuthz
												title={t("Edit")}
												color="primary"
												type="button"
												onClick={(e) => (e.preventDefault(), setEditMode(true))}
												resource={resource}
												resources={resources}
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
										</>
									}
								</ButtonGroup>
							</CardFooter>
						</Form>
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
							{resource &&
								<CardBody>
									<ReactJson
										theme={theme === 'dark' ? "chalk" : "rjv-default"}
										src={resource}
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
