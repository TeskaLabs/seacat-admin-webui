import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useForm } from "react-hook-form";
import { useTranslation } from 'react-i18next';

import {
	Container, Row, Col, Card, Input, Label,
	CardHeader, CardBody, Form, Button, CardFooter, FormGroup, ButtonGroup
} from 'reactstrap';

import ReactJson from 'react-json-view';
import { DateTime, ButtonWithAuthz } from 'asab-webui';

const ResourceDetailContainer = (props) =>  {
	const { handleSubmit, register, formState: { errors }, getValues, setValue } = useForm();
	const { t } = useTranslation();
	const SeaCatAuthAPI = props.app.axiosCreate('seacat_auth');
	const [resource, setResource] = useState(null);
	const [ editMode, setEditMode ] = useState(false);
	const [ onUpdate, setOnUpdate ] = useState(false);
	const { resource_id } = props.match.params;

	const resources = useSelector(state => state.auth?.resources);
	const advmode = useSelector(state => state.advmode?.enabled);
	const theme = useSelector(state => state.theme);

	const registerDescription = register("resource_description");

	const getResourceDetail = async () => {
		try {
			let response = await SeaCatAuthAPI.get(`resource/${resource_id}`);
			setResource(response.data);
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", t("ResourcesDetailContainer|Something went wrong, can't fetch resource details"));
		}
	}

	useEffect(() => {
		getResourceDetail();
	}, []);

	if (!resource) return null;

	if (resource != null && onUpdate === false) {
		setValue("resource_description", resource.description);
		setOnUpdate(true);
	}

	// Update description
	const onSubmit = async (values) => {
		try {
			await SeaCatAuthAPI.put(`/resource/${resource_id}`,
				{
					description:  values.resource_description
				});
			props.app.addAlert("success", t("ResourcesDetailContainer|Resource updated successfully"));
			setEditMode(false);
			setOnUpdate(true);
			getResourceDetail();
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", t("ResourcesDetailContainer|Something went wrong, failed to update resource"));
		}
	}

	return (
		<Container>
			<Row className="mb-4 justify-content-md-center">
				<Col md={8}>
					<Card>
						<Form onSubmit={handleSubmit(onSubmit)}>
							<CardHeader className="border-bottom">
								<div className="card-header-title">
									<i className="cil-lock-unlocked pr-2"></i>
									{t("ResourcesDetailContainer|Resource")}
								</div>
							</CardHeader>

							<CardBody>
								<Row className="card-body-row">
									<Col md={3}>{t("Name")}</Col>
									<Col>{resource._id}</Col>
								</Row>
								<Row className="mt-3 card-body-row">
									<Col md={3}>{t("Created at")}</Col>
									<Col><DateTime value={resource._c} /></Col>
								</Row>
								<Row className="card-body-row">
									<Col md={3}>{t("Modified at")}</Col>
									<Col><DateTime value={resource._m} /></Col>
								</Row>

									<FormGroup row className="mt-3">
										<Col sm={3}>{t("Description")}</Col>
										<Col sm={6} style={{minHeight: "90px"}}>
											{editMode ?
												<Input
													id="resource_description"
													name="resource_description"
													type="textarea"
													rows={3}
													autoComplete="off"
													onChange={registerDescription.onChange}
													onBlur={registerDescription.onBlur}
													innerRef={registerDescription.ref}
												/>
											: resource.description }
										</Col>
									</FormGroup>
							</CardBody>

							<CardFooter>
								<ButtonGroup>
									{editMode ?
										<>
											<Button color="primary" type="submit" >{t("Save")}</Button>
											<Button color="outline-primary" type="button" onClick={(e) => (setEditMode(false), setOnUpdate(false))}>{t("Cancel")}</Button>
										</>
									:
										<ButtonWithAuthz
											color="primary"
											outline
											type="button"
											onClick={(e) => (e.preventDefault(), setEditMode(true))}
											resources={resources}
											resource="authz:superuser"
										>
											{t("Edit")}
										</ButtonWithAuthz>
									}
								</ButtonGroup>
							</CardFooter>
						</Form>
					</Card>
				</Col>
			</Row>

			<Row className="justify-content-md-center">
				{advmode &&
					<Col md={8}>
						<Card>
							<CardHeader className="border-bottom">
								<div className="card-header-title">
									<i className="cil-code pr-2"></i>
									JSON
								</div>
							</CardHeader>
							{resource &&
								<CardBody>
									<ReactJson
										theme={theme === 'dark' ? "chalk" : "rjv-default"}
										src={resource}
										name={false}
										collapsed={false}
									/>
								</CardBody>
							}
						</Card>
					</Col>
				}
			</Row>
		</Container>
	);
}

export default ResourceDetailContainer;
