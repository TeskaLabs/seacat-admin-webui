import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import {
	Container, Row, Col, Card,
	CardHeader, CardBody, Button,
	CardFooter, ButtonGroup
} from 'reactstrap';

import { DateTime, ButtonWithAuthz } from 'asab-webui';

const ResourceDetailContainer = (props) =>  {
	const { t } = useTranslation();
	const SeaCatAuthAPI = props.app.axiosCreate('seacat_auth');
	const [resource, setResource] = useState(undefined);
	const [editMode, setEditMode] = useState(false);
	const { resource_id } = props.match.params;

	const resources = useSelector(state => state.auth?.resources);

	useEffect(() => {
		getResourceDetail(resource_id);
	}, []);

	useEffect(() => {
		if (!resource) return null;
	}, [resource]);

	const getResourceDetail = async (res) => {
		try {
			let response = await SeaCatAuthAPI.get(`resource/${res}`);
			setResource(response.data);
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("ResourcesDeletedDetailContainer|Can't fetch resource details")}. ${e?.response?.data?.message}`, 30);
		}
	}

	// Set delete resource dialog
	const confirmForm = (type) => {
		var r = confirm(t(`ResourcesDeletedDetailContainer|Do you really want to ${type === "delete" ? 'hard-delete' : 'retrieve'} this resource`));
		if (r == true) {
			if (type === "delete") {
				hardDelete();
			} else {
				retrieveResource();
			}
		}
	}

	// Retrieve the resource
	const retrieveResource = async () => {
		try {
			let response = await SeaCatAuthAPI.post(`/resource/${resource_id}`, {});
			if (response.data.result !== "OK") {
				throw new Error(t("ResourcesDeletedDetailContainer|Failed to retrieve resource"));
			}
			props.app.addAlert("success", t("ResourcesDeletedDetailContainer|Resource retrieved successfuly"));
			props.history.push("/auth/resources");
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("ResourcesDeletedDetailContainer|Failed to retrieve resource")}. ${e?.response?.data?.message}`, 30);
		}
	}

	// Hard-deletes selected resource. After this action, the resource cannot be retrieved anymore.
	const hardDelete = async () => {
		try {
			let response = await SeaCatAuthAPI.delete(`/resource/${resource_id}`, { params: { hard_delete: true } });
			if (response.data.result !== "OK") {
				throw new Error(t("ResourcesDeletedDetailContainer|Failed to hard-delete this resource"));
			}
			props.app.addAlert("success", t("ResourcesDeletedDetailContainer|Resource was successfully hard-deleted"));
			props.history.push("/auth/resources");
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("ResourcesDeletedDetailContainer|Failed to hard-delete this resource")}. ${e?.response?.data?.message}`, 30);
		}
	}


	return (

		<Container>
			<Row className="mb-4 justify-content-md-center">
				<Col md={8}>
					<Card>
						<CardHeader className="border-bottom">
							<div className="card-header-title">
								<i className="cil-lock-locked pr-2"></i>
								{t("ResourcesDeletedDetailContainer|Resource")}
							</div>
						</CardHeader>

						<CardBody>
							<Row className="card-body-row">
								<Col md={3}>{t("Name")}</Col>
								<Col>{resource && resource._id}</Col>
							</Row>
							<Row className="mt-3 card-body-row">
								<Col md={3}>{t("Created at")}</Col>
								<Col><DateTime value={resource && resource._c} /></Col>
							</Row>
							<Row className="card-body-row">
								<Col md={3}>{t("Modified at")}</Col>
								<Col><DateTime value={resource && resource._m} /></Col>
							</Row>
							<Row className="card-body-row">
								<Col sm={3}>{t("Description")}</Col>
								<Col sm={6} style={{minHeight: "90px"}}>{resource &&  resource.description }</Col>
							</Row>
						</CardBody>

						<CardFooter>
								{editMode ?
										<>
											<ButtonGroup>
												<Button
													color="outline-primary"
													type="button"
													title={t("Cancel")}
													onClick={(e) => (setEditMode(false))}
												>
													{t("Cancel")}
												</Button>
											</ButtonGroup>
											<div className="actions-right">
												<Button
													color="primary"
													onClick={() => confirmForm("retrieve")}
													title={t("ResourcesDeletedDetailContainer|Retrieve")}
												>
													{t("ResourcesDeletedDetailContainer|Retrieve")}
												</Button>
												<Button
													color="danger"
													type="button"
													onClick={() => confirmForm("delete")}
													title={t("ResourcesDeletedDetailContainer|Hard-delete")}
												>
													{t("ResourcesDeletedDetailContainer|Hard-delete")}
												</Button>
											</div>
										</>
									:
										<ButtonWithAuthz
											color="primary"
											outline
											type="button"
											onClick={(e) => (e.preventDefault(), setEditMode(true))}
											resources={resources}
											resource="authz:superuser"
											title={t("Edit")}
										>
											{t("Edit")}
										</ButtonWithAuthz>
									}
						</CardFooter>
					</Card>
				</Col>
			</Row>
		</Container>
	);
}

export default ResourceDetailContainer;
