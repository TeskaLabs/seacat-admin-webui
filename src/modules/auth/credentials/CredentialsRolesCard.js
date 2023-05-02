import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import {
	Row, Col,
	Card, CardHeader, CardFooter, CardBody,
	Button,
	Dropdown, DropdownToggle, DropdownMenu, DropdownItem, ButtonGroup
} from 'reactstrap';

import { ButtonWithAuthz } from 'asab-webui';

function CredentialsRolesCard(props) {

	const { t } = useTranslation();
	const [editMode, setEditMode] = useState(false);
	const [assignedRoles, setAssignedRoles] = useState([]);
	const [prevAssignedRoles, setPrevAssignedRoles] = useState([]);
	const [rolesLookup, setRolesLookup] = useState([]);
	const [limit, setLimit] = useState(10);
	const [count, setCount] = useState(0);

	const [dropdownAddRoleOpen, setDropdownAddRoleOpen] = useState(false);
	const toggleAddRole = () => setDropdownAddRoleOpen(prevState => !prevState);
	const SeaCatAuthAPI = props.app.axiosCreate('seacat_auth');
	const tenant = useSelector(state => state.tenant?.current);

	const resources = props.resources;
	const resource = props.resource;

	useEffect(() => {
		retrieveAssignedRoles();
	}, [props.rolesRefresh]);

	useEffect(() => {
		editMode && retrieveRolesLookup();
	}, [editMode, limit])


	const retrieveAssignedRoles = async () => {
		try {
			let response = await SeaCatAuthAPI.get(`/roles/${tenant}/${props.credentials_id}`);
			setAssignedRoles(response.data);
			setPrevAssignedRoles(response.data);
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("CredentialsRolesCard|Something went wrong, failed to fetch assigned roles")}. ${e?.response?.data?.message}`, 30);
		}
	};

	const retrieveRolesLookup = async () => {
		try {
			let response = await SeaCatAuthAPI.get(`/role/${tenant}`, {params: {i: limit}});
			let roles = response.data.data;
			if (!resources.includes("authz:superuser")) {
				roles = roles.filter(item => !item._id.startsWith('*'))
			}
			setRolesLookup(roles);
			setCount(response.data.count);
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("CredentialsRolesCard|Something went wrong, failed to fetch roles")}. ${e?.response?.data?.message}`, 30);
		}
	};


	const assignRole = (role) => {
		let x = assignedRoles.find((existing) => { return existing == role });
		if (x == null) {
			setAssignedRoles(assignedRoles.concat(role))
		}
	}

	const removeRole = (urole) => {
		let newroles = [...assignedRoles];
		let index = newroles.findIndex((role) => role == urole);
		newroles.splice(index, 1);
		setAssignedRoles(newroles);
	}


	const handleSave = async () => {
		try {
			let response = await SeaCatAuthAPI.put(`/roles/${tenant}/${props.credentials_id}`, {
				'roles': assignedRoles,
			});
			props.app.addAlert("success", t("CredentialsRolesCard|Roles updated successfully"));
			setEditMode(false);
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("CredentialsRolesCard|Failed to update roles")}. ${e?.response?.data?.message}`, 30);
		}
	}

	return (
		<Card className="h-100 credential-role-area">
			<CardHeader className="border-bottom">
				<div className="card-header-title">
					<i className="at-account pr-2"></i>
					{t("CredentialsRolesCard|Assigned roles")}
				</div>
			</CardHeader>

			<CardBody className="card-body-scroll">

				{assignedRoles.map((role) => (
					<Row key={role} className="mb-2">
						<Col style={{overflow: "hidden", marginLeft: "15px", paddingLeft: "0"}}>
							<span className="d-flex align-items-center btn-edit-mode">
								{editMode &&
									<Button
										outline
										className="mr-2"
										disabled={!editMode}
										size="sm"
										color="danger"
										onClick={() => removeRole(role)}>
										<span className="at-minus-circle" />
									</Button>
								}
								<Role role={role} lookup={rolesLookup}/>
							</span>
						</Col>
					</Row>
				))}

			</CardBody>

			<CardFooter>
			{editMode ?
				<>
					<ButtonGroup>
						<Button color="primary" type="button" onClick={(e) => handleSave()}>{t("Save")}</Button>
						<Button color="outline-primary" type="button" onClick={(e) => (setAssignedRoles(prevAssignedRoles), setEditMode(false))}>{t("Cancel")}</Button>
					</ButtonGroup>
					<Dropdown isOpen={dropdownAddRoleOpen} toggle={toggleAddRole}>
						<DropdownToggle caret outline color="primary">
							<span className="at-plus-circle mr-2" />
							{t("CredentialsRolesCard|Assign a new role")}
						</DropdownToggle>
						<DropdownMenu style={{maxHeight: "20em", overflowY: "auto"}} >
							<DropdownItem header>{t("CredentialsRolesCard|Select role to assign ...")}</DropdownItem>
							{Object.values(rolesLookup).map((role_id, i) => {
								let x = assignedRoles.find((existing) => { return existing == role_id._id });
								if (x == null) {
									// Add only if the role is not already assigned
									return (
										<DropdownItem key={i} onClick={() => assignRole(role_id._id)}>
											<Role role={role_id._id} lookup={rolesLookup} />
										</DropdownItem>
									)
								} else { return null }
							})}
							{count > limit ?
								<>
									<DropdownItem divider />
									<DropdownItem
										onClick={() => {
											setLimit(limit + 5);
											toggleAddRole();
										}}
									>
										{t("CredentialsRolesCard|More")}
									</DropdownItem>
								</>
								:
								null
							}
						</DropdownMenu>
					</Dropdown>
				</>
			:
				<ButtonWithAuthz
					outline
					color="primary"
					type="button"
					onClick={(e) => (setEditMode(true))}
					resource={resource}
					resources={resources}
				>
					{t("Edit")}
				</ButtonWithAuthz>
			}
			</CardFooter>

		</Card>
	)
}

function Role(props) {

	let role_dict = props.lookup[props.role];

	if ((role_dict == null) || (role_dict.label == null)) {
		return (<span title={props.role}>{props.role}</span>);
	}

	return (<span title={props.role}>{role_dict.label}</span>);
}

export default CredentialsRolesCard;
