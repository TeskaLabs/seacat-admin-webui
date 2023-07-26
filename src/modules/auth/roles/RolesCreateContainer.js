import React from 'react';
import { useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import {
	Container, Row, Col,
	Card, CardHeader, CardFooter, CardBody,
	Form, FormGroup, FormText,
	Input, Label, FormFeedback
} from 'reactstrap';

import { ButtonWithAuthz } from 'asab-webui';

const RolesCreateContainer = (props) => {
	const { handleSubmit, register, formState: { errors, isSubmitting }, getValues } = useForm();
	const SeaCatAuthAPI = props.app.axiosCreate('seacat-auth');

	const resource = "seacat:role:edit";
	const resources = useSelector(state => state.auth?.resources);
	const currentTenant = useSelector(state => state.tenant?.current);

	const { t } = useTranslation();
	const regRoleName = register(
			"roleName",
			{
				validate: {
					emptyInput: value => (value && value.toString().length !== 0) || t("RolesCreateContainer|Role name cannot be empty!"),
					startWithNumber: value => !(/^\d/).test(value) || t("RolesCreateContainer|Invalid format, role cannot start with a number"),
					startWithDash: value => !(/^[-]$/).test(value) || t("RolesCreateContainer|Invalid format, role cannot start with a dash"),
					vlidation: value => (/^[a-zA-Z_][a-zA-Z0-9_-]{0,31}$/).test(value) || t("RolesCreateContainer|Invalid format, only letters, numbers, dash and underscore are allowed"),
				}
			}
		);
	const regGlobalRole = register("global");

	// Display a modal window with description
	props.app.addHelpButton("https://docs.teskalabs.com/seacat-auth/");

	const onSubmit = async (values) => {
		const tenant = values.global && resources.includes("authz:superuser") ? '*' : currentTenant;
		try {
			let response = await SeaCatAuthAPI.post(`/role/${tenant}/${values.roleName}`);
			props.app.addAlert("success", t("RolesCreateContainer|Role has been created"));
			props.history.push(`/auth/roles/${tenant}/${values.roleName}`);
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("RolesCreateContainer|Something went wrong, role has not been created")}. ${e?.response?.data?.message}`, 30);
		}
	}

	return (
		<Container>
			<Row className="justify-content-md-center">
				<Col md={6}>
					<Form onSubmit={handleSubmit(onSubmit)}>
						<Card>
							<CardHeader className="border-bottom">
								<div className="card-header-title">
									<i className="cil-user pr-2"></i>
									{t("RolesCreateContainer|Create new role")}
								</div>
							</CardHeader>

							<CardBody>
								<Col className='mb-3'>
									<Label className="form-label" for="roleName">{t("Name")}</Label>
									<Input
										id="roleName"
										name="roleName"
										type="text"
										autoComplete="off"
										invalid={errors.roleName}
										placeholder={t("RolesCreateContainer|Name of the role")}
										onChange={regRoleName.onChange}
										onBlur={regRoleName.onBlur}
										innerRef={regRoleName.ref}
									/>

									{errors.roleName ?
										<FormFeedback>{errors.roleName.message}</FormFeedback>
										:
										<FormText>{t("RolesCreateContainer|Only letters, numbers, dash and underscore are allowed")}</FormText>
									}
								</Col>

								{resources.includes("authz:superuser") && (
									<Row>
										<Label
											className="form-label"
											for="global"
										>
											<Input
												name="global"
												id="global"
												type="checkbox"
												onChange={regGlobalRole.onChange}
												onBlur={regGlobalRole.onBlur}
												innerRef={regGlobalRole.ref}
											/> {' '}
											{t("RolesCreateContainer|Global role")}
										</Label>
									</Row>
								)}
							</CardBody>

							<CardFooter>
								<Row>
									<Col>
										<ButtonWithAuthz
											color="primary"
											type="submit"
											disabled={isSubmitting}
											resources={resources}
											resource={resource}
										>{t("RolesCreateContainer|Create role")}</ButtonWithAuthz>
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

export default RolesCreateContainer;
