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
			props.app.addAlert("warning", `${t("ResourcesDeletedDetailContainer|Can't fetch resource details")}. ${e?.response?.data?.message}`, 30);
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

	// Set terminate resource dialog
	const confirmForm = (type) => {
		var r = confirm(t(`ResourcesListContainer|Do you want to ${type === "delete" ? 'hard-delete' : 'retrieve'} this resource?`));
		if (r == true) {
			if (type === "delete") {
				hardDelete()
			} else {
				retrieveResource();
			}
		}
	}

	// Terminate the resource
	const retrieveResource = async () => {
		try {
			let response = await SeaCatAuthAPI.post(`/resource/${resource_id}`, {});
			if (response.data.result !== "OK") {
				throw new Error(t("ResourcesDeletedListContainer|Failed to un-delete resource"));
			}
			props.app.addAlert("success", t("ResourcesDeletedListContainer|Resource returned back to life"));
			props.history.push("/auth/resources");
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("ResourcesDeletedListContainer|Failed to un-delete the resource")}. ${e?.response?.data?.message}`, 30);
		}
	}

	const hardDelete = async () => {
		try {
			let response = await SeaCatAuthAPI.delete(`/resource/${resource_id}`, {hard_delete: true});
			if (response.data.result !== "OK") {
				throw new Error(t("ResourcesDeletedListContainer|Unable to terminate this resource for good"));
			}
			props.app.addAlert("success", t("ResourcesDeletedListContainer|Successfully terminated for good"));
			props.history.push("/auth/resources");
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("ResourcesDeletedListContainer|Failed to hard-delete the resource")}. ${e?.response?.data?.message}`, 30);
		}
	}


	return (
		<Container>
			<Row className="mb-4 justify-content-md-center">
				<Col md={8}>
					<Card>
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
								<Col sm={3}>{t("Description")}</Col>
								<Col sm={6} style={{minHeight: "90px"}}>{ resource.description }</Col>
						</CardBody>

						<CardFooter>
								{editMode ?
										<>
									<ButtonGroup>
											<Button color="primary" onClick={() => confirmForm("retrieve")} >{t("Un-delete")}</Button>
											<Button color="danger" type="button" onClick={() => confirmForm("delete")}>{t("ResourcesDetailContainer|Hard-Delete")}</Button>
											<Button color="outline-primary" type="button" onClick={(e) => (setEditMode(false), setOnUpdate(false))}>{t("Cancel")}</Button>
									</ButtonGroup>
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
						</CardFooter>
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
