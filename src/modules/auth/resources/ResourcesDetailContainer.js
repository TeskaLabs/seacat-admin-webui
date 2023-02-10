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
	const registerName = register("resource_name");

	const getResourceDetail = async (res) => {
		try {
			let response = await SeaCatAuthAPI.get(`resource/${res}`);
			setResource(response.data);
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("ResourcesDetailContainer|Can't fetch resource details")}. ${e?.response?.data?.message}`, 30);
		}
	}

	useEffect(() => {
		getResourceDetail(resource_id);
	}, []);

	if (!resource) return null;

	if (resource != null && onUpdate === false) {
		setValue("resource_description", resource.description);
		setValue("resource_name", resource._id);
		setOnUpdate(true);
	}

	// Update description
	const onSubmit = async (values) => {
		console.log('values.resource_name: ',  values.resource_name)
		try {
			await SeaCatAuthAPI.put(`/resource/${resource_id}`,
				{
					description:  values.resource_description,
					name: values.resource_name
				});
			props.app.addAlert("success", t("ResourcesDetailContainer|Resource updated successfully"));
			setEditMode(false);
			setOnUpdate(true);
			getResourceDetail(values.resource_name);
			props.history.push(`/auth/resources/${values.resource_name}`);
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("ResourcesDetailContainer|Failed to update resource")}. ${e?.response?.data?.message}`, 30);
		}
	}

	// Set terminate resource dialog
	const terminateResourceForm = () => {
		var r = confirm(t('ResourcesListContainer|Do you want to delete this resource?'));
		if (r == true) {
			deleteResource();
		}
	}

	// Terminate the resource
	const deleteResource = async () => {
		try {
			let response = await SeaCatAuthAPI.delete(`/resource/${resource_id}`);
			if (response.data.result !== "OK") {
				throw new Error(t("ResourcesListContainer|Failed to terminate resource"));
			}
			props.app.addAlert("success", t("ResourcesListContainer|Resource successfully terminated"));
			// redirect to list of deleted resources
			props.history.push("/auth/deletedresources");
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("ResourcesListContainer|Failed to terminate resource")}. ${e?.response?.data?.message}`, 30);
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
									<Col>
										{ editMode ?
											<Input
												id="resource_name"
												name="resource_name"
												type="text"
												autoComplete="off"
												onChange={registerName.onChange}
												onBlur={registerName.onBlur}
												innerRef={registerName.ref}
											/>
										:
											resource._id
										}
									</Col>
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
									{editMode ?
										<ButtonGroup>
												<Button color="primary" type="submit" >{t("Save")}</Button>
												<Button color="outline-primary" type="button" onClick={(e) => (setEditMode(false), setOnUpdate(false))}>{t("Cancel")}</Button>
												<Button color="danger" type="button" onClick={() => terminateResourceForm(resource._id)}>{t("ResourcesDetailContainer|Delete resource")}</Button>
										</ButtonGroup>
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
