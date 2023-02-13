import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useForm, useFieldArray } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import ReactJson from 'react-json-view';

import {
	Container, Row, Col,
	Card, CardHeader, CardFooter, CardBody,
	Form, FormGroup, Input, Label
} from 'reactstrap';

import {TextInput, SelectInput, URiInput, MultiCheckbox, RadioInput} from './FormFields';

import { ButtonWithAuthz } from 'asab-webui';

const ClientCreateContainer = (props) => {
	const [metaData, setMetaData] = useState({});
	const [template, setTemplate] = useState({});
	const [selectedTemplate, setSelectedTemplate] = useState(undefined);

	const [incomingLink, setIncomingLink] = useState(window.location.href); // tracking method in URL
	const [client, setClient] = useState(null); // tracking method in URL
	const { client_id } = props.match.params;

	const SeaCatAuthAPI = props.app.axiosCreate('seacat_auth');
	const resource = "authz:superuser";
	const resources = useSelector(state => state.auth?.resources);
	const theme = useSelector(state => state.theme);
	const advmode = useSelector(state => state.advmode.enabled);

	const { t } = useTranslation();

	const { handleSubmit, register, formState: { errors, isSubmitting }, control, setValue, resetField } = useForm({
		defaultValues: {
			response_types: [],
			grant_types: [],
			code_challenge_methods: [],
		}
	});

	const regTemplate = register("template");
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
		if (incomingLink.indexOf('/edit') !== -1) {
			return {editClient: true};
		}
		return {editClient: false};
	}, [incomingLink]);

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

	/*
		Set the 'selectedTemplate' when the page is loaded
		and the data from the 'template' state is retrieved

		This will be the first template from the data - "Public web application"

		Also pass the 'selectedTemplate' to the 'setInputValue' function
		which assigns template values
	*/
	useEffect(() => {
		if (selectedTemplate == undefined) {
			setSelectedTemplate(Object.keys(template)[0]);
			setInputValue(Object.keys(template)[0]);
		}
	}, [template]);

	useEffect(() => {
		setValue("template", selectedTemplate);
		// Сheck which template is assigned and assign values to input
		template && Object.keys(template).map((key, index) => {
			// key === "Public web application or Public mobile application"
			if ((selectedTemplate === "Public web application") || (selectedTemplate === "Public mobile application")) {
				Object.entries(template[key]).map((val, idx) => {
					if (val[0] === "response_types") {
						setValue("response_types",[val[1][0]]);
					} else if (val[0] === "grant_types") {
						setValue("grant_types",[val[1][0]]);
					}
				})
			}
		})
	}, [selectedTemplate]);

	// Retrieve providers from server
	const retrieveClientFeatures = async () => {
		try {
			let response = await SeaCatAuthAPI.get('/client/features');
			if (response.statusText != 'OK') {
				throw new Error("Unable to get clients");
			}
			setMetaData(response.data["metadata_schema"]);
			setTemplate(response.data["templates"]);
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
			props.app.addAlert("warning", `${t("ClientCreateContainer|Something went wrong, failed to fetch client details")}. ${e?.response?.data?.message}`, 30);
		}
	}

	const onSubmitNewClient = async (values) => {
		try {
			console.log(refactorSubmitData(values), "new client")
			let response = await SeaCatAuthAPI.post(`/client`, refactorSubmitData(values));
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
		try {
			console.log(refactorSubmitData(values), "edit")
			let response = await SeaCatAuthAPI.put(`/client/${client_id}`, refactorSubmitData(values));
			if (response.statusText != 'OK') {
				throw new Error("Unable to change client details");
			}
			props.app.addAlert("success", t("ClientDetailContainer|Client updated successfully"));
			props.history.push(`/auth/clients/${client_id}`);
		} catch (e) {
			console.error(e);
			props.app.addAlert("warning", `${t("ClientDetailContainer|Something went wrong, failed to update client")}. ${e?.response?.data?.message}`, 30);
		}
	}

	// Depending on the selected template, values are assigned to the input
	const setInputValue = (value) => {
		template && Object.keys(template).map((key, index) => {
			if (value === key) {
				Object.entries(template[key]).map((val, idx) => {
					setValue(val[0], val[1]);
				})
			}
		})
	}

	/*
		When a template is changed, the values in the inputs are reset
		The selected template is passed to the function
		Assigns the selected template to the state
	*/
	const changeTemplate = (value) => {
		resetField("application_type");
		resetField("grant_types");
		resetField("response_types");
		resetField("token_endpoint_auth_method");

		setInputValue(value);
		setSelectedTemplate(value);
	}

	// Fill the fields with the correct values
	const assignValueToInputs = (obj) => {
		let copyArr = [];
		console.log(obj, "obj")
		if (obj?.redirect_uris != undefined) {
			copyArr = [...obj?.redirect_uris];
			setValue("redirect_uris_main", copyArr[0]);
			copyArr.splice(0, 1);
		}
		copyArr.map((item, idx) => {
			update(idx, item);
			setValue(`redirect_uris[${idx}].value`, item);
		})

		if (obj.template == undefined) {
			console.log("is it undef?")
			setValue("template", Object.keys(template)[1]);
			setSelectedTemplate(Object.keys(template)[1]);
		} else {
			setValue("template", obj?.template);
			setSelectedTemplate(obj?.template);
		}

		setValue("application_type", obj?.application_type);
		setValue("client_name", obj?.client_name);
		setValue("client_uri", obj?.client_uri);
		setValue("cookie_domain", obj?.cookie_domain);
		setValue("login_uri", obj?.login_uri);
		// setValue("code_challenge_methods", obj?.code_challenge_methods);
	}

	const refactorSubmitData = (values) => {
		let body = {};
		let uri = [];

		// Refactor "redirect_uris" and "redirect_uris_main" to array
		Object.keys(values).map(async (key, idx) => {
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
			}
			else {
				body[key] = values[key];
			}
		})
		body["redirect_uris"] = uri;

		if (body?.client_name == undefined) {
			body.client_name = "";
		}
		if (body?.preferred_client_id == "" || body.preferred_client_id == undefined) {
			delete body.preferred_client_id;
		}
		if (body?.client_uri == "") {
			delete body.client_uri;
		}
		if (body?.cookie_domain == "") {
			delete body.cookie_domain;
		}
		if (body?.response_types?.length == 0) {
			delete body.response_types;
		}
		if (body?.grant_types?.length == 0) {
			delete body.response_types;
		}
		// if (body?.code_challenge_methods?.length == 0) {
		// 	delete body.code_challenge_methods;
		// }
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
								<FormGroup>
									<Label for="template">{t('ClientCreateContainer|Template')}</Label>
									<Input
										id="template"
										name="template"
										title={t('ClientCreateContainer|Template')}
										type="select"
										onChange={e => changeTemplate(e.target.value)}
										onBlur={regTemplate.onBlur}
										innerRef={regTemplate.ref}
									>
										{template && Object.keys(template).map((key, index) => (
											<option key={index} value={key}>{key}</option>
										))}
									</Input>
								</FormGroup>
								{metaData["properties"] && Object.entries(metaData["properties"]).map(([key, value]) => {
									if (key != "template") {
										switch(key) {
											case 'redirect_uris': return(<URiInput key={key} name="redirect_uris_main" invalid={errors?.redirect_uris_main && true} mailTemplateName="redirect_uris" errors={errors} append={append} remove={remove} fields={fields} register={register} reg={regRedirectUrisMain} labelName={`${t("ClientCreateContainer|Redirect URIs")}*`}/>)
											case 'client_name': return(<TextInput key={key} name={key} register={register} required={true} labelName={`${t("ClientCreateContainer|Client name")}*`}/>)
											case 'client_uri': return(<TextInput key={key} name={key} register={register} labelName={t('ClientCreateContainer|Client URI')}/>)
											case 'cookie_domain': return(<TextInput key={key} name={key} register={register} errors={errors} labelName={t('ClientCreateContainer|Cookie domain')}/>)
											case 'preferred_client_id': return((client == undefined) && <TextInput key={key} name={key} register={register} errors={errors} labelName={t('ClientCreateContainer|Preferred client ID')}/>)
											case 'login_uri': return(<TextInput key={key} name={key} register={register} errors={errors} labelName={t('ClientCreateContainer|Login URi')}/>)
											case 'response_types': return(selectedTemplate === "Custom" && <MultiCheckbox key={key} name={key} value={value["items"]["enum"]} assignValue={client && client} setValue={setValue} labelName={t('ClientCreateContainer|Response types')}/>)
											case 'grant_types': return(selectedTemplate === "Custom" && <MultiCheckbox key={key} name={key} value={value["items"]["enum"]} assignValue={client && client} setValue={setValue} labelName={t('ClientCreateContainer|Grant types')}/>)
											case 'code_challenge_methods': return(<MultiCheckbox key={key} name={key} value={value["items"]["enum"]} assignValue={client && client} setValue={setValue} labelName={t('ClientCreateContainer|Code challenge method')}/>)
											// case 'code_challenge_methods': return(<RadioInput key={key} name={key} register={register} value={value["items"]["enum"]} labelName={t('ClientCreateContainer|Code challenge method')}/>)
											case 'application_type': return(selectedTemplate === "Custom" && <SelectInput key={key} name={key} register={register} value={value["enum"]} labelName={t('ClientCreateContainer|Application type')}/>)
											case 'token_endpoint_auth_method': return(selectedTemplate === "Custom" && <SelectInput key={key} name={key} register={register} value={value["enum"]} labelName={t('ClientCreateContainer|Token endpoint authentication method')}/>)
											default: return(<div key={key}>{t('ClientCreateContainer|Unknown item')}: "{key}"</div>)
										}
									}
								})}
							</CardBody>
							<CardFooter>
								{((client != undefined) && (editClient == true)) ?
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
