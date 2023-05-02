import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import {
	Row, Col, Card, CardHeader,
	CardFooter, CardBody, Button,
	Dropdown, DropdownToggle, DropdownMenu, DropdownItem, ButtonGroup, Label
} from 'reactstrap';

import { ButtonWithAuthz } from 'asab-webui';

const RolesResourcesCard = (props) => {

	const [assignedResources, setAssignedResources] = useState([]);
	const [unassignedResources, setUnassignedResources] = useState([]);
	const [editMode, setEditMode] = useState(false);
	const [dropdownOpen, setDropdown] = useState(false);
	const { role_name, tenant_id } = props.params;
	const roleId = props.role._id ? props.role._id : role_name;

	const SeaCatAuthAPI = props.app.axiosCreate('seacat_auth');

	const { t } = useTranslation();

	useEffect(() => fetchAssignedResources(), []);
	useEffect(() => fetchUnassignedResources(), [assignedResources]);

	const fetchAssignedResources = () => {
		SeaCatAuthAPI.get(`/role/${tenant_id}/${role_name}`)
			.then(res => {
				const assignedResources = res.data.resources;
				setAssignedResources(assignedResources);
			})
			.catch((e) => props.app.addAlert("warning", `${t("RolesResourcesCard|Fetch of assigned resources failed")}. ${e?.response?.data?.message}`, 30));
		if (editMode) setEditMode(false);
	}

	const fetchUnassignedResources = () => {
		SeaCatAuthAPI.get(`/resource`)
			.then(res => {
				const allResources = res.data.data.map(resource => resource._id);
				const unassignedResources = allResources.filter(resource => assignedResources.indexOf(resource) < 0);
				// Remove authz:superuser from unassigned resources on every role, which is not global
				if (roleId.indexOf('*/') == -1){
					unassignedResources.splice(unassignedResources.indexOf('authz:superuser'), 1)
				}
				setUnassignedResources(unassignedResources);
			})
			.catch((e) => props.app.addAlert("warning", `${t("RolesResourcesCard|Fetch of all resources failed")}. ${e?.response?.data?.message}`, 30));
	}

	const assignResource = (resource) => {
		setAssignedResources([...assignedResources, resource]);
		setUnassignedResources(unassignedResources.filter(currentResource => currentResource !== resource));
	}

	const unassignResource = (resource) => {
		setAssignedResources(assignedResources.filter(currentResource => currentResource !== resource));
		setUnassignedResources([...unassignedResources, resource]);
	}

	const onSave = async () => {
		try {
			let response = await SeaCatAuthAPI.put(`/role/${tenant_id}/${role_name}`, { 'set': assignedResources });
			props.app.addAlert("success", t("RolesResourcesCard|Role has been updated successfully"));
			setEditMode(false);
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("RolesResourcesCard|Update of the role has failed")}. ${e?.response?.data?.message}`, 30);
		}
	}

	return (
		<Card>
			<CardHeader className="border-bottom">
				<div className="card-header-title">
					<i className="cil-lock-unlocked pr-2"></i>
					{t("RolesResourcesCard|Assigned resources")}
				</div>
			</CardHeader>

			<CardBody className="card-body-scroll">
				{assignedResources.length === 0 && !editMode && <Label className="mb-0">{t('RolesResourcesCard|No data')}</Label>}
				{assignedResources.map((resource, idx) => (
					<Row
						key={idx}
						className="mb-2"
					>
						<Col style={{overflow: "hidden", marginLeft: "15px", paddingLeft: "0"}}>
							<span className="d-flex align-items-center btn-edit-mode">
								{editMode &&
									<Button
										disabled={!editMode}
										size="sm"
										color="danger"
										outline
										className="mr-2"
										onClick={() => unassignResource(resource)}>
									<span className="cil-minus" />
									</Button>
								}
								{resource}
							</span>
						</Col>
					</Row>
				))}
			</CardBody>

			<CardFooter>
				{editMode ?
					<>
						<ButtonGroup>
							<Button
								color="primary"
								type="button"
								onClick={onSave}
							>
								{t("RolesResourcesCard|Save")}
							</Button>
							<Button
								color="outline-primary"
								type="button"
								onClick={fetchAssignedResources}
							>
								{t("RolesResourcesCard|Cancel")}
							</Button>
						</ButtonGroup>
						<Dropdown isOpen={dropdownOpen} toggle={() => setDropdown(prev => !prev)}>
							<DropdownToggle caret outline color="primary">
								<span className="at-plus-circle mr-2" />
								{t("RolesResourcesCard|Add resource")}
							</DropdownToggle>
							<DropdownMenu style={{maxHeight: "20em", overflowY: "auto"}} >
								<DropdownItem header>{t("RolesResourcesCard|Select resource")}</DropdownItem>
								{unassignedResources.map((resource, idx) => (
									<DropdownItem key={idx} onClick={() => assignResource(resource)}>
										{resource}
									</DropdownItem>
								))}
							</DropdownMenu>
						</Dropdown>
					</>
					:
					<ButtonWithAuthz
						resource={props.resource}
						resources={props.resources}
						color="primary"
						outline
						type="button"
						onClick={() => setEditMode(true)}
					>
						{t("RolesResourcesCard|Edit")}
					</ButtonWithAuthz>
				}
			</CardFooter>
		</Card>
	)
}

export default RolesResourcesCard;
