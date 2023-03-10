import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useForm, useFieldArray } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useLocation } from "react-router-dom";
import ReactJson from 'react-json-view';

import {
	Container, Row, Col,
	Card, CardHeader, CardFooter, CardBody,
	Form, ButtonGroup
} from 'reactstrap';

import {TextInput, URiInput, RadioInput} from './FormFields';
import CustomDataInput from "../components/CustomDataInput";

import { ButtonWithAuthz } from 'asab-webui';

const ClientCreateContainer = (props) => {
	const [metaData, setMetaData] = useState({});
	const [disabled, setDisabled] = useState(false);
	const [client, setClient] = useState(null); // tracking method in URL
	const [showMore, setShowMore] = useState(false);
	const { client_id } = props.match.params;
	const location = useLocation(); // tracking method in URL

	const SeaCatAuthAPI = props.app.axiosCreate('seacat_auth');
	const resource = "authz:superuser";
	const resources = useSelector(state => state.auth?.resources);
	const theme = useSelector(state => state.theme);
	const advmode = useSelector(state => state.advmode.enabled);

	const { t } = useTranslation();

	const { handleSubmit, register, formState: { errors, isSubmitting }, control, setValue, reset } = useForm({
		defaultValues: {
			login_key: [{key: '', value: ''}]
		}
	});

	const regRedirectUrisMain = register("redirect_uris_main", {
		validate: {
			emptyInput: value => (value && value.toString().length !== 0) || t("ClientCreateContainer|URI can't be empty"),
			startWith: value => (/(https:\/\/)/).test(value) || t("ClientCreateContainer|URI have to start with https"),
			urlHash: value => (value && new URL(value).hash.length === 0) || t("ClientCreateContainer|URL hash have to be empty"),
		}
	});

	const {
		fields: redirect_urisFields,
		append: redirect_urisAppend,
		remove: redirect_urisRemove,
		update: redirect_urisUpdate
	} = useFieldArray({ control, name: "redirect_uris" });

	const {
		fields: loginKeyFields,
		append: loginKeyAppend,
		remove: loginKeyRemove,
		replace: loginKeyReplace
	} = useFieldArray({ control, name: "login_key" });

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
			redirect_urisUpdate(idx, item);
			setValue(`redirect_uris[${idx}].value`, item);
		})

		if (obj?.login_key) {
			let data = { login_key: [obj.login_key] }
			reset(data)
			data?.login_key.map((obj) => {
				Object.keys(obj) && Object.keys(obj).map((key, index) => {
					setValue(`login_key[${index}].key`, key);
					setValue(`login_key[${index}].value`, obj[key]);
				})
			})
		}

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
	}

	const refactorSubmitData = (values, type) => {
		let body = {};
		let login_keyObj = {};
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

		(values?.login_key?.length !== 0) && values?.login_key?.map((el) => {
			if ((el.key != undefined) && (el.key != '') && (el.key != 'undefined')) {
				login_keyObj[el.key] = el.value;
			}
		});
		body["login_key"] = login_keyObj;

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

			if (Object.keys(body?.login_key).length == 0) {
				delete body.login_key;
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
		<Container>
			<Row className="justify-content-md-center">
				<Col md={6}>
					<Form onSubmit={(client == undefined) ? handleSubmit(onSubmitNewClient) : handleSubmit(onSubmitEditClient)}>
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
									append={redirect_urisAppend}
									remove={redirect_urisRemove}
									fields={redirect_urisFields}
									register={register}
									reg={regRedirectUrisMain}
									labelName={`${t("ClientCreateContainer|Redirect URIs")}*`}
								/>
								{showMore && metaData["properties"] && Object.entries(metaData["properties"]).map(([key, value]) => {
									if (key != "template") {
										switch(key) {
											case 'client_uri': return(<TextInput key={key} name={key} register={register} disabled={disabled} labelName={t('ClientCreateContainer|Client URI')}/>)
											case 'cookie_domain': return(<TextInput key={key} name={key} register={register} errors={errors} disabled={disabled} labelName={t('ClientCreateContainer|Cookie domain')}/>)
											case 'preferred_client_id': return((client == undefined) && <TextInput key={key} name={key} register={register} errors={errors} disabled={disabled} labelName={t('ClientCreateContainer|Preferred client ID')}/>)
											case 'login_uri': return(<TextInput key={key} name={key} register={register} errors={errors} disabled={disabled} labelName={t('ClientCreateContainer|Login URI')}/>)
											case 'authorize_uri': return(<TextInput key={key} name={key} register={register} errors={errors} disabled={disabled} labelName={t('ClientCreateContainer|Authorize URI')}/>)
											case 'code_challenge_method': return(<RadioInput key={key} name={key} register={register} valueList={value["enum"]} disabled={disabled} labelName={t('ClientCreateContainer|Code challenge method (PKCE)')}/>)
											case 'login_key': return (<CustomDataInput key={key} name={key} control={control} errors={errors} append={loginKeyAppend} remove={loginKeyRemove} fields={loginKeyFields} replace={loginKeyReplace} labelName={t('ClientCreateContainer|Login key')}/>)
											case 'response_types': return null
											case 'grant_types': return null
											case 'application_type': return null
											case 'token_endpoint_auth_method': return null
											case 'redirect_uris': return null
											case 'client_name': return null
											default: return(<div key={key}>{t('ClientCreateContainer|Unknown item')}: "{key}"</div>)
										}
									}
								})}
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
										<ButtonWithAuthz
											outline
											title={showMore ? t("ExportNewContainer|Hide custom inputs") : t("ExportNewContainer|Show custom inputs")}
											color="primary"
											type="button"
											resource={resource}
											resources={resources}
											onClick={() => setShowMore(!showMore)}
										>
											{showMore ? t("ExportNewContainer|Hide custom inputs") : t("ExportNewContainer|Show custom inputs")}
										</ButtonWithAuthz>
									</>
								:
									<>
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
										<ButtonWithAuthz
											outline
											title={showMore ? t("ExportNewContainer|Hide custom inputs") : t("ExportNewContainer|Show custom inputs")}
											color="primary"
											type="button"
											resource={resource}
											resources={resources}
											onClick={() => setShowMore(!showMore)}
										>
											{showMore ? t("ExportNewContainer|Hide custom inputs") : t("ExportNewContainer|Show custom inputs")}
										</ButtonWithAuthz>
									</>
								}
								</ButtonGroup>
							</CardFooter>
						</Card>
					</Form>
					{(advmode && ((client != undefined) && (editClient == true))) &&
						<Card className="w-100 mt-3">
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
				</Col>
			</Row>
		</Container>
	)
}

export default ClientCreateContainer;
