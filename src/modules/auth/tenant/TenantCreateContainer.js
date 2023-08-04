import React from 'react';
import { useForm } from "react-hook-form";
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import {
	Container, Row, Col,
	Card, CardHeader, CardFooter,
	CardBody, Button, Form,
	Input, Label,
	ButtonGroup, FormFeedback, FormText
} from 'reactstrap';

import { ButtonWithAuthz } from 'asab-webui';

function TenantCreateContainer(props) {

	const { handleSubmit, register, formState: { errors, isSubmitting }, setValue, getValues } = useForm();
	const SeaCatAuthAPI = props.app.axiosCreate('seacat-auth');
	const { t } = useTranslation();
	// TODO: Resource "seacat:tenant:create" will be implemented in future iterations
	const resource = "authz:superuser"; //"seacat:tenant:create";
	const resources = useSelector(state => state.auth?.resources);

	const reg = register(
		"id",
		{
			validate: {
				emptyInput: value => (value && value.toString().length !== 0) || t("TenantCreateContainer|Tenant name cannot be empty!"),
				startWithNumber: value => !(/^\d/).test(value) || t("TenantCreateContainer|Invalid format, tenant cannot start with a number"),
				startWithDash: value => !(/^[-]$/).test(value) || t("TenantCreateContainer|Invalid format, tenant cannot start with a dash"),
				startWithUnderscore: value => !(/^[_]$/).test(value) || t("TenantCreateContainer|Invalid format, tenant cannot start with an underscore"),
				valLength: value => value.length >= 3 || value.length < 1 || t('TenantCreateContainer|Tenant name is too short, minimum is 3 characters'),
				vlidation: value => (/^[a-z][a-z0-9._-]{2,31}$/).test(value) || t("TenantCreateContainer|Invalid format, only lower-case letters, numbers, dash and underscore are allowed"),
			}
		}
	);

	// Display a modal window with description
	props.app.addHelpButton("https://docs.teskalabs.com/seacat-auth/");

	const onSubmit = async (values) => {
		try {
			let response = await SeaCatAuthAPI.post('/tenant',
				JSON.stringify(values),
				{ headers: {
					'Content-Type': 'application/json'
				}});
			props.app.addAlert("success", t("TenantCreateContainer|Tenant has been created"));
			props.history.push("/auth/tenant");
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("TenantCreateContainer|Something went wrong, failed to create tenant")}. ${e?.response?.data?.message}`, 30);
		}
	}

	const proposeName = async () => {
		try {
			let response = await SeaCatAuthAPI.get('/tenant_propose');
			setValue('id', response.data.tenant_id);
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("TenantCreateContainer|Something went wrong, can't propose tenant name")}. ${e?.response?.data?.message}`, 30);
		}
	}

	return (
		<Container>
			<Row className="justify-content-md-center">
				<Col md={6}>
					<Form onSubmit={handleSubmit(onSubmit)}>
						<Card>
							<CardHeader className="border-bottom">
								<div className='card-header-title'>
									<i className="cil-apps pe-2"></i>
									{t("TenantCreateContainer|Create new tenant")}
								</div>
							</CardHeader>

							<CardBody>
								<div>
									<Label className='form-label' for="id">{t("TenantCreateContainer|Name")}</Label>
									<Input
										id="id"
										name="id"
										type="text"
										autoComplete="off"
										invalid={errors.id}
										placeholder={t("TenantCreateContainer|Name of the tenant")}
										required="required"
										onChange={reg.onChange}
										onBlur={reg.onBlur}
										innerRef={reg.ref}
									/>
									{errors.id ?
										<FormFeedback>{errors.id.message}</FormFeedback>
										:
										<FormText>{t("TenantCreateContainer|Only lower-case letters, numbers, dash and underscore are allowed")}</FormText>
									}
								</div>
							</CardBody>

							<CardFooter>
								<ButtonGroup>
									<ButtonWithAuthz
										color="primary"
										type="submit"
										disabled={isSubmitting}
										resources={resources}
										resource={resource}
									>{t("TenantCreateContainer|Create a tenant")}</ButtonWithAuthz>
									<Button
										color="primary"
										outline
										type="button"
										onClick={() => proposeName()}
										title={t("TenantCreateContainer|Propose a name")}
									>{t("TenantCreateContainer|Propose a name")}</Button>
								</ButtonGroup>
							</CardFooter>
						</Card>
					</Form>
				</Col>
			</Row>
		</Container>
	)
}

export default TenantCreateContainer;
