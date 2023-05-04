import React from 'react';
import { useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { ButtonWithAuthz } from 'asab-webui';

import {
	Container, Row, Col,
	Card, CardHeader, CardFooter, CardBody,
	Button, Form, FormGroup,
	Input, Label, FormText, FormFeedback
} from 'reactstrap';

const ImpersonationContainer = (props) => {
	const { handleSubmit, register, formState: { errors, isSubmitting }, getValues } = useForm();
	const resources = useSelector(state => state.auth?.resources);
	const resourceImpersonate = "authz:impersonate";
	const SeaCatAuthAPI = props.app.axiosCreate("seacat_auth");
	const { t } = useTranslation();

	const registerRedirectUri = register("redirect_uri")
	const registerCredentialsId = register("credentials_id")
	const registerClearStorage = register("clear_session_storage")

	const defaultRedirectUri = "https://auth.local.loc/seacat"
	// const defaultRedirectUri = "https://example.app.loc:8443/demo"
	const defaultCredentialsId = "mongodb:ext:60eee70d6b47935cf7bacdda"

	const onSubmit = async (values) => {
		try {
			console.log("values ", values);
			await SeaCatAuthAPI.put(`/impersonate`,
				{
					credentials_id:  values.credentials_id
				});
		} catch (e) {
			console.error(e);
			props.app.addAlert(
				"danger", "Nefunguje!", 30
			);
			return;
		}
		if (values.credentials_id){
			sessionStorage.clear();
		}
		window.location.replace(values.redirect_uri);
		// window.location.reload();
		await new Promise(r => setTimeout(r, 3600*1000));
	}

	return (
		<Container>
			<Row className="justify-content-md-center">
				<Col md={6}>
					<Form onSubmit={handleSubmit(onSubmit)}>
						<Card>
							<CardHeader className="border-bottom">
								<div className='card-header-title'>
									<i className="cil-lock-unlocked pr-2"></i>
									Impersonation
								</div>
							</CardHeader>

							<CardBody>
								<FormGroup>
									<Label for="credentials_id">Credentials ID</Label>
									<Input
										id="credentials_id"
										name="credentials_id"
										type="text"
										autoComplete="off"
										defaultValue={defaultCredentialsId}
										onChange={registerCredentialsId.onChange}
										onBlur={registerCredentialsId.onBlur}
										innerRef={registerCredentialsId.ref}
									/>
								</FormGroup>
								<FormGroup>
									<Label for="redirect_uri">Redirect URI</Label>
									<Input
										id="redirect_uri"
										name="redirect_uri"
										type="text"
										autoComplete="off"
										defaultValue={defaultRedirectUri}
										onChange={registerRedirectUri.onChange}
										onBlur={registerRedirectUri.onBlur}
										innerRef={registerRedirectUri.ref}
									/>
								</FormGroup>
								<FormGroup check>
									<Label check for="clear_session_storage">
										<Input
											name="clear_session_storage"
											id="clear_session_storage"
											type="checkbox"
											onChange={registerClearStorage.onChange}
											onBlur={registerClearStorage.onBlur}
											innerRef={registerClearStorage.ref}
										/>
										Clear session storage
									</Label>
								</FormGroup>
							</CardBody>

							<CardFooter>
							<ButtonWithAuthz
									color="primary"
									type="submit"
									disabled={isSubmitting}
									resource={resourceImpersonate}
									resources={resources}
								>
									Go!
								</ButtonWithAuthz>
							</CardFooter>
						</Card>
					</Form>
				</Col>
			</Row>
		</Container>
	)
}

export default ImpersonationContainer;
