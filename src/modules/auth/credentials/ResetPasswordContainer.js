import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { useTranslation } from 'react-i18next';

import {
	Container, Row, Col,
	Card, CardHeader, CardFooter, CardBody, CardTitle,
	Form, Label,
	Button, Input, InputGroup,
} from 'reactstrap';

function ResetPasswordContainer(props) {

	const { t, i18n } = useTranslation();

	const { handleSubmit, register, formState: { errors }, getValues } = useForm();
	const [ data, setData ] = useState(null);
	const [ config, setConfig ] = useState(undefined);
	const [ specifyPassword, setSpecifyPassword ] = useState(false);
	const SeaCatAuthAPI = props.app.axiosCreate('seacat-auth');
	const credentials_id = props.match.params.credentials_id;

	useEffect(() => {
		retrieveData();
	}, []);

	// set reset password confirm dialog
	const resetPasswordForm = () => {
		var r = confirm(t('ResetPasswordContainer|Do you want to reset password for this user?'));
		if (r) {
			handleSubmit(onSubmit)();
		}
	}

	const retrieveData = async () => {
		try {
			let response = await SeaCatAuthAPI.get(`/credentials/${credentials_id}`);
			setData(response.data);
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("ResetPasswordContainer|Something went wrong, failed to fetch user details")}. ${e?.response?.data?.message}`, 30);
		}
	};

	const onSubmit = (values) => {
		if (specifyPassword) {
			resetByCode(values);
		} else {
			resetByLink(values);
		}
	}

	// Initiate password reset by sending a link to a user
	const resetByLink = async (values) => {
		try{
			let response = await SeaCatAuthAPI.put('/password',
				JSON.stringify({'credentials_id': credentials_id}),
				{ headers: {
						'Content-Type': 'application/json'
				}});
			if (response.data.result !== true) {
				props.app.addAlert("warning", t("ResetPasswordContainer|Something went wrong, failed to reset user's password"), 30);
				return;
			}
			props.app.addAlert("success", t("ResetPasswordContainer|Password has been reset"));
			// Update page
			props.history.push(`/auth/credentials/${credentials_id}`)
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("ResetPasswordContainer|Something went wrong, failed to reset user's password")}. ${e?.response?.data?.message}`, 30);
		}
	}


	// Do a password change
	const resetByCode = async (values) => {
		// TODO: Update when endpoint for reset password by code will be ready
	}

	return (
		<Container fluid>
			<Row className="justify-content-md-center">
				<Col md={6}>
					<Form>
						<Card>
							<CardHeader className="border-bottom">
								<div className='card-header-title'>
									<i className="cil-lock-unlocked pe-2"></i>
									{t("ResetPasswordContainer|Reset password")}
								</div>
							</CardHeader>

							{data != null ?
							<CardBody>

								{data.username != null ?
								<Row>
									<Col md={3}>{t("ResetPasswordContainer|Username")}</Col>
									<Col>{data.username}</Col>
								</Row>
								: null}

								<Row>
									<Col md={3}>{t("ResetPasswordContainer|ID")}</Col>
									<Col><code>{data._id}</code></Col>
								</Row>

								{specifyPassword === true ?
									<React.Fragment>
										<Row><Col><hr /></Col></Row>
										<ResetPasswordField config={config} getValues={getValues} register={register} errors={errors} />
									</React.Fragment>
								:
									null
								}

							</CardBody>
							: null}

							<CardFooter>
								<Button color="primary" onClick={() => { resetPasswordForm() }}>{t("ResetPasswordContainer|Reset password")}</Button>
							</CardFooter>

						</Card>
					</Form>
				</Col>
			</Row>
		</Container>
	)
}


function ResetPasswordField(props){
	const { t, i18n } = useTranslation();
	const [ type, setType ] = useState("password");
	const reg = props.register(
			"newpassword",
			{
				validate: {
					emptyInput: value => (props.getValues("newpassword") !== "") || t("ResetPasswordContainer|Password cannot be empty!"),
				}
			}
		);

	const changeType = () => {
		if (type === "password") {
			setType("text");
		} else {
			setType("password");
		}
	};

	return(
		<Row>
			<Label sm={3} className='form-label' for="newpassword">{t("ResetPasswordContainer|Password")}</Label>
			<Col sm={6}>
				<InputGroup>
					<Input
						id="newpassword"
						name="newpassword"
						type={type}
						autoComplete="new-password"
						onChange={reg.onChange}
						onBlur={reg.onBlur}
						innerRef={reg.ref}
					/>
					<Button color="secondary" className="ms-0" size="sm" onClick={() => changeType()} onMouseDown={() => changeType()}>
						<span className="cil-low-vision" />
					</Button>
					{props.errors.newpassword && <p>{props.errors.newpassword.message}</p>}
				</InputGroup>
			</Col>
		</Row>
	);

}

export default ResetPasswordContainer;
