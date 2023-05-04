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
		window.location.replace(values.redirect_uri);
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
										defaultValue="mongodb:ext:60eee70d6b47935cf7bacdda"
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
										defaultValue="https://auth.local.loc/seacat/?tenant=default#/"
										onChange={registerRedirectUri.onChange}
										onBlur={registerRedirectUri.onBlur}
										innerRef={registerRedirectUri.ref}
									/>
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
