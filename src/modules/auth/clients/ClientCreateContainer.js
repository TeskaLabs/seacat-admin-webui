import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useForm, useFieldArray } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import {
	Container, Row, Col,
	Card, CardHeader, CardFooter, CardBody,
	Form, FormGroup, Input, Label
} from 'reactstrap';

import {TextInput, SelectInput, URiInput, MultiCheckbox} from './FormFields';

import { ButtonWithAuthz } from 'asab-webui';

const ClientCreateContainer = (props) => {
	const [metaData, setMetaData] = useState({});
	const [template, setTemplate] = useState({});
	const [selectedTemplate, setSelectedTemplate] = useState(undefined);

	const SeaCatAuthAPI = props.app.axiosCreate('seacat_auth');
	const resource = "authz:superuser";
	const resources = useSelector(state => state.auth?.resources);

	const { t } = useTranslation();

	const { handleSubmit, register, formState: { errors, isSubmitting }, control, setValue, resetField} = useForm({
		defaultValues: {
			redirect_uris: [{ text: ""}],
			response_types: [],
			grant_types: [],
		}
	});

	const { fields, append, remove } = useFieldArray({
		control,
		name: "redirect_uris"
	});

	useEffect(() => {
		retrieveClientFeatures();
	}, []);


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
			props.app.addAlert("warning", t("ClientCreateContainer|Something went wrong, failed to fetch clients", {error: e?.response?.data?.message}), 30);
		}
	};

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

		if (body.preferred_client_id == "" || body.preferred_client_id == undefined) {
			delete body.preferred_client_id;
		}

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
			props.app.addAlert("warning", t("ClientCreateContainer|Something went wrong, client has not been created", {error: e?.response?.data?.message}), 30);
		}
	};

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
		resetField("client_name");
		resetField("client_uri");
		resetField("preferred_client_id");
		resetField("application_type");
		resetField("grant_types");
		resetField("response_types");
		resetField("token_endpoint_auth_method");

		setInputValue(value);
		setSelectedTemplate(value);
	}

	return (
		<Container>
			<Row className="justify-content-md-center">
				<Col md={6}>
					<Form onSubmit={handleSubmit(onSubmit)}>
						<Card>
							<CardHeader className="border-bottom">
								<div className="card-header-title">
									<i className="cil-layers pr-2"></i>
									{t("ClientCreateContainer|Create new client")}
								</div>
							</CardHeader>

							<CardBody>
								<FormGroup>
									<Label for="template">{t('ClientCreateContainer|Template')}</Label>
									<Input
										id="template"
										type="select"
										name="template"
										value={selectedTemplate}
										onChange={e => changeTemplate(e.target.value)}
									>
										{template && Object.keys(template).map((key, index) => (
											<option key={index} value={key}>{key}</option>
										))}
									</Input>
								</FormGroup>
								{metaData["properties"] && Object.entries(metaData["properties"]).map(([key, value]) => {
									switch(key) {
										case 'redirect_uris': return(<URiInput key={key} name={key} control={control} errors={errors} append={append} remove={remove} fields={fields} labelName={t("ClientCreateContainer|Redirect URIs")}/>)
										case 'client_name': return(<TextInput key={key} name={key} register={register} labelName={t('ClientCreateContainer|Client name')}/>)
										case 'client_uri': return(<TextInput key={key} name={key} register={register} labelName={t('ClientCreateContainer|Client URI')}/>)
										case 'preferred_client_id': return(<TextInput key={key} name={key} register={register} errors={errors} labelName={t('ClientCreateContainer|Preferred client ID')}/>)
										case 'response_types': return(selectedTemplate === "Custom" && <MultiCheckbox key={key} name={key} value={value["items"]["enum"]} setValue={setValue} labelName={t('ClientCreateContainer|Response types')}/>)
										case 'grant_types': return(selectedTemplate === "Custom" && <MultiCheckbox key={key} name={key} value={value["items"]["enum"]} setValue={setValue} labelName={t('ClientCreateContainer|Grant types')}/>)
										case 'application_type': return(selectedTemplate === "Custom" && <SelectInput key={key} name={key} register={register} value={value["enum"]} labelName={t('ClientCreateContainer|Application type')}/>)
										case 'token_endpoint_auth_method': return(selectedTemplate === "Custom" && <SelectInput key={key} name={key} register={register} value={value["enum"]} labelName={t('ClientCreateContainer|Token endpoint authentication method')}/>)
										default: return(<div key={key}>{t('ClientCreateContainer|Unknown item')}: "{key}"</div>)
									}
								})}
							</CardBody>
							<CardFooter>
								<Row>
									<Col>
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
									</Col>
								</Row>
							</CardFooter>
						</Card>
					</Form>
				</Col>
			</Row>
		</Container>
	)
}

export default ClientCreateContainer;
