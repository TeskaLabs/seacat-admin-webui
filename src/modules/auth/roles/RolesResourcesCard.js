import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import {
	Row, Col, Card, CardHeader,
	CardFooter, CardBody, Button,
	Dropdown, DropdownToggle, DropdownMenu,
	DropdownItem, ButtonGroup, Label,
	Input
} from 'reactstrap';

import { ButtonWithAuthz } from 'asab-webui';

const RolesResourcesCard = (props) => {

	const [assignedResources, setAssignedResources] = useState([]);
	const [unassignedResources, setUnassignedResources] = useState([]);
	const [editMode, setEditMode] = useState(false);
	const [dropdownOpen, setDropdown] = useState(false);
	const [limit, setLimit] = useState(10);
	const [count, setCount] = useState(0);
	const [filter, setFilter] = useState('');
	const { role_name, tenant_id } = props.params;
	const roleId = props.role._id ? props.role._id : role_name;

	const SeaCatAuthAPI = props.app.axiosCreate('seacat-auth');

	const { t } = useTranslation();

	const timeoutRef = useRef(null);

	useEffect(() => fetchAssignedResources(), []);
	useEffect(() => fetchUnassignedResources(), [limit]);

	//sets 0.5s delay before triggering the search call when filtering through tennants
	useEffect(() => {
		if (timeoutRef.current !== null) {
			clearTimeout(timeoutRef.current);
		}
		timeoutRef.current = setTimeout(() => {
			timeoutRef.current = null;
			fetchUnassignedResources()
		}, 500);
	}, [filter]);

	const fetchAssignedResources = async () => {
		try {
			let response = await SeaCatAuthAPI.get(`/role/${tenant_id}/${role_name}`);
			setAssignedResources(response.data.resources);
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("RolesResourcesCard|Fetch of assigned resources failed")}. ${e?.response?.data?.message}`, 30);
			setEditMode(false);
		}
		if (editMode) setEditMode(false);
	}

	const fetchUnassignedResources = async () => {
		try {
			let response = await SeaCatAuthAPI.get(`/resource`, {params: { f: filter, i: limit }});
			const allResources = response.data.data.map(resource => resource._id);
			setUnassignedResources(allResources);
			setCount(response.data.count);
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("RolesResourcesCard|Fetch of all resources failed")}. ${e?.response?.data?.message}`, 30);
		}
	}

	const assignResource = (resource) => {
		// checks if the resource is already assigned to prevent selecting the same resource twice
		if (assignedResources.indexOf(resource) === -1 ) {
			setAssignedResources([...assignedResources, resource]);
		} else {
			setDropdown(prev => !prev);
			props.app.addAlert("warning", `${t("RolesResourcesCard|Resource")} ${resource} ${t("RolesResourcesCard|already selected")}`, 5);
		}
	}

	const unassignResource = (resource) => {
		setAssignedResources(assignedResources.filter(currentResource => currentResource !== resource));
	}

	const onSave = async () => {
		try {
			await SeaCatAuthAPI.put(`/role/${tenant_id}/${role_name}`, { 'set': assignedResources });
			props.app.addAlert("success", t("RolesResourcesCard|Role has been updated successfully"));
			setEditMode(false);
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("RolesResourcesCard|Update of the role has failed")}. ${e?.response?.data?.message}`, 30);
		}
	}

	const onCancel = () => {
		fetchAssignedResources();
	}

	return (
		<Card>
			<CardHeader className="border-bottom">
				<div className="card-header-title">
					<i className="cil-lock-unlocked pe-2"></i>
					{t("RolesResourcesCard|Assigned resources")}
				</div>
			</CardHeader>

			<CardBody className="card-body-scroll">
				{assignedResources.length === 0 && !editMode && <Label className="mb-0">{t('RolesResourcesCard|No data')}</Label>}
				{assignedResources.map((resource, idx) => (
					<Row key={idx}>
						<Col style={{overflow: "hidden", marginLeft: "15px", paddingLeft: "0"}}>
							<span className="d-flex align-items-center">
								{editMode &&
									<Button
										disabled={!editMode}
										size="sm"
										color="danger"
										outline
										className="me-2"
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
								onClick={onCancel}
							>
								{t("RolesResourcesCard|Cancel")}
							</Button>
						</ButtonGroup>
						<Dropdown isOpen={dropdownOpen} toggle={() => setDropdown(prev => !prev)}>
							<DropdownToggle caret outline color="primary">
								<span className="cil-plus me-2" />
								{t("RolesResourcesCard|Add resource")}
							</DropdownToggle>
							<DropdownMenu style={{maxHeight: "20em", overflowY: "auto"}} >
								<DropdownItem header>
									<Input
										placeholder={t("RolesResourcesCard|Search")}
										className="m-0"
										onChange={e => setFilter(e.target.value)}
										value={filter}
									/>
								</DropdownItem>
								{unassignedResources.map((resource, idx) => (
									<DropdownItem key={idx} onClick={() => assignResource(resource)}>
										{resource}
									</DropdownItem>
								))}
								{count > limit ?
								<>
									<DropdownItem divider />
									<DropdownItem
										onClick={() => {
											setLimit(limit + 5);
											setDropdown(prev => !prev);
										}}
									>
										{t("RolesResourcesCard|More")}
									</DropdownItem>
								</>
								:
								null}
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
