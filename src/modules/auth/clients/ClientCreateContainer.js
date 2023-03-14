import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useForm, useFieldArray } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useLocation } from "react-router-dom";
import ReactJson from 'react-json-view';

import {
	Container, Card, CardHeader,
	CardFooter, CardBody, Form, ButtonGroup
} from 'reactstrap';

import {TextInput, URiInput, RadioInput, SingleCheckboxInput} from './FormFields';

import { ButtonWithAuthz } from 'asab-webui';

const ClientCreateContainer = (props) => {
	const [metaData, setMetaData] = useState({});
	const [disabled, setDisabled] = useState(false);
	const [client, setClient] = useState(null); // tracking method in URL
	const { client_id } = props.match.params;
	const location = useLocation(); // tracking method in URL

	const SeaCatAuthAPI = props.app.axiosCreate('seacat_auth');
	const resource = "authz:superuser";
	const resources = useSelector(state => state.auth?.resources);
	const theme = useSelector(state => state.theme);
	const advmode = useSelector(state => state.advmode.enabled);

	const { t } = useTranslation();

	const { handleSubmit, register, formState: { errors, isSubmitting }, control, setValue } = useForm();

	const regRedirectUrisMain = register("redirect_uris_main", {
		validate: {
			emptyInput: value => (value && value.toString().length !== 0) || t("ClientCreateContainer|URI can't be empty"),
			startWith: value => (/(https:\/\/)/).test(value) || t("ClientCreateContainer|URI have to start with https"),
			urlHash: value => (value && new URL(value).hash.length === 0) || t("ClientCreateContainer|URL hash have to be empty"),
		}
	});

	const { fields, append, remove, update } = useFieldArray({control, name: "redirect_uris"});

	useEffect(() => {
		retrieveClientFeatures();
	}, []);

	const clientState = useMemo(() => {
		if (location.pathname.indexOf('/edit') !== -1) {
			return {editClient: true};
		}
		return {editClient: false};
	}, [location.pathname]);

	let editClient = clientState["editClient"];

	useEffect(() => {
		if ((editClient == true) && metaData) {
			getClientDetail();
		}
	}, [editClient]);

	useEffect(() => {
		if (client != undefined) {
			assignValueToInputs(client);
		}
	}, [client]);

	// Retrieve providers from server
	const retrieveClientFeatures = async () => {
		try {
			let response = await SeaCatAuthAPI.get('/client/features');
			if (response.statusText != 'OK') {
				throw new Error("Unable to get clients");
			}
			setMetaData(response.data["metadata_schema"]);
		} catch (e) {
			console.error("Failed to retrieve providers from server: ", e);
			props.app.addAlert("warning", `${t("ClientCreateContainer|Something went wrong, failed to fetch clients")}. ${e?.response?.data?.message}`, 30);
		}
	};

	const getClientDetail = async () => {
		try {
			let response = await SeaCatAuthAPI.get(`client/${client_id}`);
			if (response.statusText != 'OK') {
				throw new Error("Unable to get client details");
			}
			setClient(response.data);
		} catch (e) {
			console.error(e);
			// todo: update locales
			props.app.addAlert("warning", `${t("ClientCreateContainer|Something went wrong, failed to fetch client info")}. ${e?.response?.data?.message}`, 30);
		}
	}

	const onSubmitNewClient = async (values) => {
		let body = refactorSubmitData(values, "create");
		try {
			let response = await SeaCatAuthAPI.post(`/client`, body);
			if (response.statusText != 'OK') {
				throw new Error("Unable to create client");
			}
			if (response.data?.client_id) {
				props.app.addAlert("success", t("ClientCreateContainer|Client has been created"));
				props.history.push(`/auth/clients/${response.data.client_id}`);
			}
		} catch (e) {
			console.error(e);
			props.app.addAlert("warning", `${t("ClientCreateContainer|Something went wrong, client has not been created")}. ${e?.response?.data?.message}`, 30);
		}
	};

	const onSubmitEditClient = async (values) => {
		let body = refactorSubmitData(values, "edit");
		setDisabled(true);
		try {
			let response = await SeaCatAuthAPI.put(`/client/${client_id}`, body);
			if (response.statusText != 'OK') {
				throw new Error("Unable to change client details");
			}
			setDisabled(false);
			props.app.addAlert("success", t("ClientCreateContainer|Client updated successfully"));
			props.history.push(`/auth/clients/${client_id}`);
		} catch (e) {
			setDisabled(false);
			console.error(e);
			props.app.addAlert("warning", `${t("ClientCreateContainer|Something went wrong, failed to update client")}. ${e?.response?.data?.message}`, 30);
		}
	}

	// Fill the fields with the correct values
	const assignValueToInputs = (obj) => {
		let copyArr = [];

		if (obj?.redirect_uris != undefined) {
			copyArr = [...obj?.redirect_uris];
			setValue("redirect_uris_main", copyArr[0]);
			copyArr.splice(0, 1);
		}
		copyArr.map((item, idx) => {
			update(idx, item);
			setValue(`redirect_uris[${idx}].value`, item);
		})

		if (obj?.code_challenge_method?.length > 0) {
			setValue("code_challenge_method", obj?.code_challenge_method);
		}

		if (obj?.cookie_domain?.length > 0) {
			setValue("cookie_domain", obj?.cookie_domain);
		}

		setValue("client_name", obj?.client_name);
		setValue("client_uri", obj?.client_uri);
		setValue("login_uri", obj?.login_uri);
		setValue("authorize_uri", obj?.authorize_uri);
		setValue("authorize_anonymous_users", obj?.authorize_anonymous_users);
	}

	const refactorSubmitData = (values, type) => {
		let body = {};
		let uri = [];

		// Refactor "redirect_uris" and "redirect_uris_main" to array
		Object.keys(values).map((key, idx) => {
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
			} else {
				body[key] = values[key];
			}
		})
		body["redirect_uris"] = uri;

		if (type == "create") {
			if (body?.client_uri == "") {
				delete body.client_uri;
			}
			if (body?.cookie_domain == "") {
				delete body.cookie_domain;
			}
			if (body?.login_uri == "") {
				delete body.login_uri;
			}
			if (body?.authorize_uri) {
				delete body?.authorize_uri;
			}
		}

		if (body?.client_name == undefined) {
			body.client_name = "";
		}

		if (body?.preferred_client_id == "" || body.preferred_client_id == undefined) {
			delete body.preferred_client_id;
		}
		return body;
	}

	return (
		<Container className="client-wrapper">
			<Form onSubmit={(client == undefined) ? handleSubmit(onSubmitNewClient) : handleSubmit(onSubmitEditClient)}>
				<div className="client-main-info">
					<Card>
						<CardHeader className="border-bottom">
							<div className="card-header-title">
								<i className="cil-layers pr-2"></i>
								{((client != undefined) && (editClient == true)) ?
									t("ClientCreateContainer|Edit client")
								:
									t("ClientCreateContainer|Create new client")
								}
							</div>
						</CardHeader>

						<CardBody>
							<TextInput
								name="client_name"
								register={register}
								required={true}
								disabled={disabled}
								labelName={`${t("ClientCreateContainer|Client name")}*`}
							/>
							<URiInput
								name="redirect_uris_main"
								templateName="redirect_uris"
								invalid={errors?.redirect_uris_main && true}
								disabled={disabled}
								errors={errors}
								append={append}
								remove={remove}
								fields={fields}
								register={register}
								reg={regRedirectUrisMain}
								labelName={`${t("ClientCreateContainer|Redirect URIs")}*`}
							/>
							{(client == undefined) &&
								<TextInput
									name="preferred_client_id"
									register={register}
									errors={errors}
									disabled={disabled}
									labelName={t('ClientCreateContainer|Preferred client ID')}
								/>
							}
							<TextInput name="client_uri" register={register} disabled={disabled} labelName={t('ClientCreateContainer|Client URI')}/>
						</CardBody>
						<CardFooter>
							<ButtonGroup>
							{((client != undefined) && (editClient == true)) ?
								<>
									<ButtonWithAuthz
										title={t("ClientListContainer|Save")}
										color="primary"
										type="submit"
										disabled={isSubmitting}
										resource={resource}
										resources={resources}
									>
										{t("ClientListContainer|Save")}
									</ButtonWithAuthz>
									<ButtonWithAuthz
										outline
										title={t("Cancel")}
										color="primary"
										type="submit"
										disabled={isSubmitting}
										resource={resource}
										resources={resources}
										onClick={() => props.history.push(`/auth/clients/${client_id}`)}
									>
										{t("Cancel")}
									</ButtonWithAuthz>
								</>
							:
								<ButtonWithAuthz
									title={t("ClientListContainer|New client")}
									color="primary"
									type="submit"
									disabled={isSubmitting}
									resource={resource}
									resources={resources}
								>
									{t("ClientListContainer|New client")}
								</ButtonWithAuthz>
							}
							</ButtonGroup>
						</CardFooter>
					</Card>
				</div>
				<div className="client-right-cards">
					<Card>
						<CardHeader className="border-bottom">
							<div className="card-header-title">
								<i className="cil-layers pr-2"></i>
								{t("ClientCreateContainer|Multidomain support")}
							</div>
						</CardHeader>
						<CardBody>
							<TextInput
								name="login_uri"
								register={register}
								errors={errors}
								disabled={disabled}
								labelName={t('ClientCreateContainer|Login URI')}
							/>
							<TextInput
								name="cookie_domain"
								register={register}
								errors={errors}
								disabled={disabled}
								labelName={t('ClientCreateContainer|Cookie domain')}
							/>
							<TextInput
								name="authorize_uri"
								register={register}
								errors={errors}
								disabled={disabled}
								labelName={t('ClientCreateContainer|Authorize URI')}
							/>
						</CardBody>
					</Card>

					<Card className="mt-3">
						<CardHeader className="border-bottom">
							<div className="card-header-title">
								<i className="cil-layers pr-2"></i>
								{t("ClientCreateContainer|Proof Key for Code Exchange (PKCE)")}
							</div>
						</CardHeader>
						<CardBody>
							{metaData["properties"] && Object.entries(metaData["properties"]).map(([key, value]) => {
								if (key == "code_challenge_method") {
									return(
										<RadioInput
											key={key}
											name={key}
											register={register}
											valueList={value["enum"]}
											disabled={disabled}
											labelName={t('ClientCreateContainer|Code challenge method')}
										/>
									)
								}
							})}
						</CardBody>
					</Card>

					<Card className="mt-3">
						<CardHeader className="border-bottom">
							<div className="card-header-title">
								<i className="cil-layers pr-2"></i>
								{t("ClientCreateContainer|Access control")}
							</div>
						</CardHeader>
						<CardBody>
							<SingleCheckboxInput
								name="authorize_anonymous_users"
								register={register}
								disabled={disabled}
								checkboxText={t('ClientCreateContainer|Authorize anonymous users')}
							/>
						</CardBody>
					</Card>
				</div>
			</Form>
			{(advmode && ((client != undefined) && (editClient == true))) &&
				<Card className="w-100 adv-card">
					<CardHeader className="border-bottom">
						<div className="card-header-title">
							<i className="cil-code pr-2"></i>
							JSON
						</div>
					</CardHeader>
					<CardBody>
						<ReactJson
							src={client}
							name={false}
							collapsed={false}
							theme={(theme === 'dark') ? "chalk" : "rjv-default"}
						/>
					</CardBody>
				</Card>
			}
		</Container>
	)
}

export default ClientCreateContainer;
