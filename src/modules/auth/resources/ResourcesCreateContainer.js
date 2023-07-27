import React from 'react';
import { useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { ButtonWithAuthz } from 'asab-webui';

import {
	Container, Row, Col,
	Card, CardHeader, CardFooter, CardBody,
	Form, Input, Label, FormText, FormFeedback
} from 'reactstrap';

const ResourceCreateContainer = (props) => {
	const { handleSubmit, register, formState: { errors, isSubmitting }, getValues } = useForm();
	const credentialsResources = useSelector(state => state.auth?.resources);
	const resourceEdit = "seacat:resource:edit";
	const SeaCatAuthAPI = props.app.axiosCreate('seacat-auth');
	const { t } = useTranslation();
	const reg = register(
			"resource_id",
			{
				validate: {
					emptyInput: value => (value && value.toString().length !== 0) || t("ResourcesCreateContainer|Resource name cannot be empty!"),
					startWithNumber: value => !(/^\d/).test(value) || t("ResourcesCreateContainer|Invalid format, resource cannot start with a number"),
					startWithDash: value => !(/^[-]$/).test(value) || t("ResourcesCreateContainer|Invalid format, resource cannot start with a dash"),
					startWithUnderscore: value => !(/^[_]$/).test(value) || t("ResourcesCreateContainer|Invalid format, resource cannot start with a underscore"),
					validation: value => (/^[a-z][a-z0-9:._-]{0,128}[a-z0-9]$/).test(value) || t("ResourcesCreateContainer|Invalid format, only lower-case letters, numbers, dash and underscore are allowed"),
				}
			}
		);
	const reg_description = register("resource_description");

	// Display a modal window with description
	props.app.addHelpButton("https://docs.teskalabs.com/seacat-auth/");

	const onSubmit = async (values) => {
		let body = {};
		body["description"] = values.resource_description;
		try {
			let response = await SeaCatAuthAPI.post(`/resource/${values.resource_id}`,
				JSON.stringify(body),
				{
					headers: {
						'Content-Type': 'application/json'
					}
				});
			if (response.data.result != "OK"){
				throw new Error(t('ResourcesCreateContainer|Failed to create resource'));
			}
			props.app.addAlert("success", t("ResourcesCreateContainer|Resource created"));
			props.history.push("/auth/resources");
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("ResourcesCreateContainer|Failed to create resource")}. ${e?.response?.data?.message}`, 30);
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
									<i className="cil-lock-unlocked pe-2"></i>
									{t("ResourcesCreateContainer|Create new resource")}
								</div>
							</CardHeader>

							<CardBody>
								<Col className='mb-3'>
									<Label for="resource_id" className="form-label">{t("Name")}</Label>
									<Input
										id="resource_id"
										name="resource_id"
										type="text"
										autoComplete="off"
										invalid={errors.resource_id}
										placeholder={t("ResourcesCreateContainer|Name of the resource")}
										onChange={reg.onChange}
										onBlur={reg.onBlur}
										innerRef={reg.ref}
									/>
									{errors.resource_id ?
										<FormFeedback>{errors.resource_id.message}</FormFeedback>
										:
										<FormText>{t("ResourcesCreateContainer|Only lower-case letters, numbers, dash and underscore are allowed")}</FormText>
									}
								</Col>

								<Col className='mb-3'>
									<Label for="resource_description" className="form-label">{t("Description")}</Label>
									<Input
										id="resource_description"
										name="resource_description"
										type="textarea"
										row={2}
										autoComplete="off"
										style={{ resize: 'none' }}
										placeholder={t("ResourcesCreateContainer|Description of the resource")}
										onChange={reg_description.onChange}
										onBlur={reg_description.onBlur}
										innerRef={reg_description.ref}
									/>
								</Col>
							</CardBody>

							<CardFooter>
								<ButtonWithAuthz
									color="primary"
									type="submit"
									disabled={isSubmitting}
									resource={resourceEdit}
									resources={credentialsResources}
								>
									{t("ResourcesCreateContainer|Create resource")}
								</ButtonWithAuthz>
							</CardFooter>
						</Card>
					</Form>
				</Col>
			</Row>
		</Container>
	)
}

export default ResourceCreateContainer;
