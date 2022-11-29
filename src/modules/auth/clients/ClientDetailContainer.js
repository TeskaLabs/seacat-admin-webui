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


	const { handleSubmit, formState: { errors }, control, setValue, reset, register } = useForm({
		defaultValues: {
			redirect_uris:  [{ text: ""}],
		}
	});
	const { fields, append, remove } = useFieldArray({
		control,
		name: "redirect_uris"
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
		reset(client);
		if (client && client.redirect_uris) {
			client.redirect_uris.map((item, idx) => {
				setValue(`redirect_uris[${idx}].text`, item);
			})
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
			props.app.addAlert("warning", t("ClientDetailContainer|Something went wrong, failed to fetch client details"));
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
			props.app.addAlert("warning", t('ClientDetailContainer|Something went wrong, failed to reset secret'));
		}
	}

	const resetSecretConfirm = () => {
		let agreeResetSecret = confirm(t('ClientDetailContainer|Do you want to reset this secret?'));
		if (agreeResetSecret) {
			resetSecret();
		}
	}

	const onSubmit = async (values) => {
		let body = {}
		let uri = []
		// Refactor object "redirect_uris" to array
		await Promise.all(Object.keys(values).map(async (key, idx) => {
			if (key.includes("redirect_uris")) {
				await Promise.all(Object.values(values[key]).map((item, index) => {
					uri.push(item.text)
				}))
			} else {
				body[key] = values[key];
			}
		}))
		body["redirect_uris"] = uri;

		if (body.client_name == undefined) {
			body.client_name = "";
		}

		setDisabled(true);

		try {
			let response = await SeaCatAuthAPI.put(`/client/${client_id}`, {
				redirect_uris:  body?.redirect_uris,
				client_name: body?.client_name
			});
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
			props.app.addAlert("warning", t("ClientDetailContainer|Something went wrong, failed to update client"));
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
			props.app.addAlert("warning", t('ClientDetailContainer|Something went wrong, failed to remove client'));
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
								{client?.client_name ?
									<Row className="card-body-row">
										<Col md={4}>{t("ClientDetailContainer|Client name")}</Col>
										{editMode ?
											<Col className="client-name">
												<TextInput name="client_name" register={register} disabled={disabled}/>
											</Col>

										:
											<Col className="client-name">{client?.client_name}</Col>
										}
									</Row>
								:
									editMode &&
									<Row className="card-body-row">
										<Col md={4}>{t("ClientDetailContainer|Client name")}</Col>
										<TextInput name="client_name" register={register}/>
									</Row>
								}
								<Row className="card-body-row">
									<Col md={4}>{t("ClientDetailContainer|Client ID")}</Col>
									<Col><code>{client?.client_id}</code></Col>
								</Row>
								{client?.client_uri &&
									<Row className="card-body-row">
										<Col md={4}>{t("ClientDetailContainer|Client URI")}</Col>
										<Col>{client?.client_uri}</Col>
									</Row>
								}
								{client?.client_secret &&
									<Row className="card-body-row">
										<Col md={4}>{t("ClientDetailContainer|Client secret")}</Col>
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
									<Col md={4}>{t("Created at")}</Col>
									<Col><DateTime value={client?._c} /></Col>
								</Row>
								<Row className="card-body-row">
									<Col md={4}>{t("Modified at")}</Col>
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
								<Row className="mt-3 card-body-row">
									<Col md={4} title="redirect_uris">{t("ClientDetailContainer|Redirect URIs")}</Col>
									<Col title="redirect_uris" className={"redirect_uris" + (editMode ? "" : " edit")}>
										{editMode ?
											<>
												<URiInput disabled={disabled} control={control} errors={errors} append={append} remove={remove} fields={fields} labelName={t("ClientDetailContainer|Redirect URIs")}/>
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
											<Button color="primary" type="submit" >{t("Save")}</Button>
											<Button color="outline-primary" type="button" onClick={(e) => (setEditMode(false))}>{t("Cancel")}</Button>
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
