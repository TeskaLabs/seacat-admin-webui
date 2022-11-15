import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { useForm } from "react-hook-form";
import { useTranslation } from 'react-i18next';

import { ButtonWithAuthz } from 'asab-webui';

import {
	Container, Row, Col,
	Card, CardHeader, CardFooter, CardBody,
	Form, FormGroup, Input, Label,
} from 'reactstrap';

import {
	PhoneField,
	EmailField,
	PasswordField,
	UserNameField,
	PasswordLinkField,
} from './FormFields';


function CredentialsCreateContainer(props) {

	let SeaCatAuthAPI = props.app.axiosCreate('seacat_auth');
	const { t, i18n } = useTranslation();

	const { handleSubmit, register, formState: { errors }, getValues, setValue, resetField } = useForm({
		defaultValues: {
			'passwordlink': true,
		}
	});
	const [providers, setProviders] = useState({});
	const [provider, setProvider] = useState(undefined);
	const [config, setConfig] = useState(undefined);

	const resourceCreateCredentials = "authz:tenant:admin";
	const resources = useSelector(state => state.auth?.resources);

	useEffect(() => {
		retrieveProviders();
	}, []);

	// Make sure that we set a first provider, if no is set and we received one
	useEffect(() => {
		if (provider === undefined) {
			setProvider(Object.keys(providers)[0]);
		}
	}, [providers]);

	useEffect(() => {
		setConfig(providers[provider]);
	}, [provider]);


	// Retrieve providers from server
	const retrieveProviders = async () => {
		let response;
		try {
			response = await SeaCatAuthAPI.get('/providers');
			// Filter only these, which provides details of the creation
			var reg_conf = Object.keys(response.data).reduce(function(filtered, key) {
				if (response.data[key].creation !== undefined) filtered[key] = response.data[key];
				return filtered;
			}, {});
			// Set the response
			setProviders(reg_conf);
		} catch (e) {
			console.error("Failed to retrieve providers from server: ", e);
			props.app.addAlert("warning", t("CredentialsCreateContainer|Something went wrong, failed to fetch providers"));
		}
	};



	// Process credentials creation on submit
	const onSubmit = async (values) => {
	// Provider-specific data retention
		let providerInfo = providers[provider];
		if (values.username === undefined){
			values["username"] = values.email
		}
		// TODO: remove this when there will be better solution of not passing the password2 value from FormFields
		if (values.password2) {
			delete values.password2;
		}

		// Overwriting data, obtaining information for creation
		providerInfo = providerInfo?.creation;

		providerInfo != undefined && Object.keys(values).map((key, idx) => {
			let isValid = providerInfo.some(obj => Object.values(obj).includes(key));
			if (!isValid) {
				delete values[key];
			}
		})

		// If one of the fields (phone or email) is not met, it will not be sent to the body
		if (values.phone === "") {
			delete values.phone;
		}

		if (values.email === "") {
			delete values.email;
		}

		let response;
		try {
			response = await SeaCatAuthAPI.post(`/credentials/${provider}`,
				JSON.stringify(values),
				{
					headers: {
						'Content-Type': 'application/json'
					}
				});
			props.app.addAlert("success", t("CredentialsCreateContainer|Credentials have been created successfully"));
			// Navigate to a newly created credentials
			props.history.push("/auth/credentials/" + response.data._id);
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", t("CredentialsCreateContainer|Something went wrong, failed to create credentials"));
		}
	}

	const changeProvider = (value) => {
		resetField("username");
		resetField("phone");
		resetField("email");
		resetField("passwordlink");
		resetField("password");
		resetField("password2");
		setProvider(value);
	}

	return (
		<Container>
			<Row className="justify-content-md-center">
				<Col md={8}>
					<Form onSubmit={handleSubmit(onSubmit)}>
						<Card>
							<CardHeader className="border-bottom">
								<div className='card-header-title'>
									<i className="cil-people pr-2"></i>
									{t('CredentialsCreateContainer|Create new credentials')}
								</div>
							</CardHeader>

							<CardBody>

								{Object.keys(providers).length > 1 &&
									<FormGroup>
										<Label for="provider">{t('CredentialsCreateContainer|Provider')}</Label>
											<Input
												id="provider"
												type="select"
												name="provider"
												value={provider}
												onChange={e => changeProvider(e.target.value)}
											>
											{Object.keys(providers).map((key, index) => (
												<option key={index} value={key}>{providers[key]._provider_id} ({providers[key]._type == 'm2m' ? "Machine-to-Machine" : "Human"})</option>
											))}
											</Input>
									</FormGroup>
								}

								{config !== undefined && config.creation.map((item, idx) => {
									switch(item.type) {
										case 'username': return(<UserNameField key={idx} register={register} config={item} getValues={getValues} errors={errors} required={item.policy === "required"} />)
										case 'email': return(<EmailField key={idx} register={register} config={item} getValues={getValues} errors={errors} required={item.policy === "required"} />)
										case 'password': return(<PasswordField key={idx} register={register} config={item} getValues={getValues} errors={errors} />)
										case 'phone': return(<PhoneField key={idx} register={register} config={item} getValues={getValues} setValue={setValue} errors={errors} required={item.policy === "required"} />)
										case 'passwordlink': return(<PasswordLinkField key={idx} register={register} config={item} getValues={getValues} errors={errors}/>)
										default: return(<div key={idx}>Unknown item: "{item.type}"</div>)
									}
								})}

							</CardBody>

							<CardFooter>
								<ButtonWithAuthz
									color="primary"
									type="submit"
									disabled={provider === undefined}
									resource={resourceCreateCredentials}
									resources={resources}
								>
									{t('CredentialsCreateContainer|Create credentials')}
								</ButtonWithAuthz>
							</CardFooter>
						</Card>
					</Form>
				</Col>

			</Row>
		</Container>
	)
}

export default CredentialsCreateContainer;
