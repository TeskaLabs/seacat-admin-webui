import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { useForm } from "react-hook-form";
import { useTranslation } from 'react-i18next';
import classnames from 'classnames';

import { ButtonWithAuthz } from 'asab-webui';

import {
	Container, Row, Col,
	Card, CardHeader, CardFooter, CardBody,
	Form, FormGroup, Input, Label,
	Nav, NavLink, NavItem, ButtonGroup,
	TabPane, TabContent
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

	const { handleSubmit, register, formState: { errors }, getValues, setValue, reset, resetField } = useForm({
		defaultValues: {
			'passwordlink': true,
		}
	});
	const [providers, setProviders] = useState({});
	const [provider, setProvider] = useState(undefined);
	const [config, setConfig] = useState(undefined);

	const [activeTab, setActiveTab] = useState('create');

	const resourceCreateCredentials = "authz:tenant:admin";
	const resources = useSelector(state => state.auth?.resources);
	const tenant = useSelector(state => state.tenant?.current);

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
			props.app.addAlert("warning", `${t("CredentialsCreateContainer|Something went wrong, failed to fetch providers")}. ${e?.response?.data?.message}`, 30);
		}
	};


	// Process credentials creation on submit
	const onCreate = async (values) => {
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
			props.app.addAlert("warning", `${t("CredentialsCreateContainer|Something went wrong, failed to create credentials")}. ${e?.response?.data?.message}`, 30);
		}
	}

	// Invite user
	const onInvite = async (values) => {
		let body = {};
		let credentials = {};
		// TODO: Allow setting up the expiration by admin (default is defined within service config)
		// let expiration = 999999999;

		// Fill credentials key with filled values
		Promise.all(Object.keys(values).map((key, i) => {
			if ((values[key] != undefined) && (values[key].length != 0)) {
				credentials[key] = values[key];
			}
		}))

		body["credentials"] = credentials;
		// TODO: Allow setting up the expiration by admin
		// body["expiration"] = expiration;

		let response;
		try {
			response = await SeaCatAuthAPI.post(`/${tenant}/invite`,
				body,
				{
					headers: {
						'Content-Type': 'application/json'
					}
				});
			props.app.addAlert("success", t("CredentialsCreateContainer|Invitation sent successfully"));
			// Navigate to a newly created credentials
			props.history.push(`/auth/credentials/${response.data.credentials_id}`);
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("CredentialsCreateContainer|Something went wrong, failed to send invitation")}. ${e?.response?.data?.message}`, 30);
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

	// Swith between the tabs
	const toggle = (tab) => {
		if(activeTab !== tab) {
			reset({});
			setActiveTab(tab);
		}
	}

	return (
		<Container>
			<Row className="justify-content-md-center">
				<Col md={8}>
					<Form onSubmit={activeTab == "create" ? handleSubmit(onCreate) : handleSubmit(onInvite)}>
						<Card>
							<CardHeader className="border-bottom">
								<div className='card-header-title'>
									<i className="cil-people pr-2"></i>
									{activeTab == "create" ? t('CredentialsCreateContainer|Create new credentials') : t('CredentialsCreateContainer|Invite user')}
								</div>
								<ButtonGroup className="p-1">
									<Nav tabs>
										<NavItem>
											<NavLink
												className={classnames({ active: activeTab === 'create' })}
												onClick={() => { toggle('create'); }}
											>
												{t('CredentialsCreateContainer|Create')}
											</NavLink>
										</NavItem>
										<NavItem>
											<NavLink
												className={classnames({ active: activeTab === 'invite' })}
												onClick={() => { toggle('invite'); }}
											>
												{t('CredentialsCreateContainer|Invite')}
											</NavLink>
										</NavItem>
									</Nav>
								</ButtonGroup>
							</CardHeader>
							<TabContent style={{border: "none"}} activeTab={activeTab}>
								<TabPane tabId="create">
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

										{(activeTab == "create") && (config !== undefined) && config.creation.map((item, idx) => {
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
								</TabPane>
								<TabPane tabId="invite">
									<CardBody>
										{(activeTab == "invite") &&
										<>
											<EmailField register={register} getValues={getValues} errors={errors} required={true} />
											<UserNameField register={register} getValues={getValues} errors={errors} required={false} />
											<PhoneField register={register} getValues={getValues} setValue={setValue} errors={errors} required={false} />
										</>}
									</CardBody>
								</TabPane>
							</TabContent>
							<CardFooter>
								<ButtonWithAuthz
									color="primary"
									type="submit"
									disabled={(activeTab == "create") && (provider == undefined)}
									resource={resourceCreateCredentials}
									resources={resources}
								>
									{activeTab == "create" ? t('CredentialsCreateContainer|Create credentials') : t('CredentialsCreateContainer|Invite')}
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
