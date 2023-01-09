import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import {
	Row, Col,
	Card, CardHeader, CardFooter, CardBody,
	Button, Input,
	Dropdown, DropdownToggle, DropdownMenu, DropdownItem, ButtonGroup
} from 'reactstrap';

import { ButtonWithAuthz } from 'asab-webui';

function CredentialsTenantsCard(props) {

	const { t } = useTranslation();
	const [editMode, setEditMode] = useState(false);
	const [assignedTenants, setAssignedTenants] = useState([]);
	const [prevAssignedTenants, setPrevAssignedTenants] = useState([]);
	const [allTenants, setAllTenants] = useState([]);
	const [filter, setFilter] = useState('');
	const [count, setCount] = useState(0);
	const [limit, setLimit] = useState(10);

	const tenant = useSelector(state => state.tenant?.current);

	const [dropdownOpen, setDropdownOpen] = useState(false);
	const toggleDropdown = () => setDropdownOpen(prevState => !prevState);
	const SeaCatAuthAPI = props.app.axiosCreate('seacat_auth');

	const resources = props.resources;
	const resource = props.resource;

	const timeoutRef = useRef(null);


	useEffect(() => {
		retrieveAssignedTenants();
	}, []);

	useEffect(() => {
		editMode && retrieveAllTenants();
	}, [editMode, limit]);

	//sets 0.5s delay before triggering the search call when filtering through tennants
	useEffect(() => {
		if (timeoutRef.current !== null) {
			clearTimeout(timeoutRef.current);
		}
		timeoutRef.current = setTimeout(() => {
			timeoutRef.current = null;
			retrieveAllTenants()
		}, 500);
	}, [filter]);

	const retrieveAssignedTenants = async () => {
		try {
			let response = await SeaCatAuthAPI.get(`/tenant_assign/${props.credentials_id}`);
			setAssignedTenants(response.data);
			setPrevAssignedTenants(response.data)
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", t("CredentialsTenantsCard|Something went wrong, failed to fetch assigned tenants"));
		}
	};

	const addTenant = (tenant_id) => {
		let x = assignedTenants.find((existing) => { return existing == tenant_id });
		if (x == null) {
			setAssignedTenants(assignedTenants.concat(tenant_id))
		}
	}

	const removeTenant = (tenant_id) => {
		let newtenants = [...assignedTenants];
		let index = newtenants.findIndex((t) => t == tenant_id);
		newtenants.splice(index, 1);
		setAssignedTenants(newtenants);
	}

	const retrieveAllTenants = async () => {
		try {
			let eligibleTenants = [];
			let response = await SeaCatAuthAPI.get('/tenants', {params: {f: filter, i: limit}});
			// if a logged in user doesn't hold 'authz:superuser' resource, their rights allow them to only assing the tenant, which they are currently using
			if (resources.includes('authz:superuser')) {
				eligibleTenants = response.data.data;
			} else if (response.data.data.length > 0) {
				let filteredTenant = response.data.data.filter(obj => obj._id === `${tenant}`);
				eligibleTenants.push(filteredTenant[0]);
			}
			setAllTenants(eligibleTenants);
			setCount(response.data.count);
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", t("CredentialsTenantsCard|Something went wrong, failed to fetch tenants"));
		}
	};

	const handleSave = async () => {
		try {
			let response = await SeaCatAuthAPI.put(`/tenant_assign/${props.credentials_id}`, {
				'tenants': assignedTenants,
			});
			props.app.addAlert("success", t("CredentialsTenantsCard|Tenants updated successfully"));
			setEditMode(false);
			props.setRolesRefresh(prev => !prev);
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", t("CredentialsRolesCard|Failed to update tenants"));
		}
	}

	return (
		<Card className="h-100 credential-tenant-area">
			<CardHeader className="border-bottom">
				<div className="card-header-title">
					<i className="cil-apps pr-2"></i>
					{t("CredentialsTenantsCard|Tenants")}
				</div>
			</CardHeader>

			<CardBody className="card-body-scroll">

				{assignedTenants.map((tenant_id, i) => (
				<Row key={tenant_id} className="mb-2">
					<Col style={{overflow: "hidden", marginLeft: "15px", paddingLeft: "0"}}>
						<span className="d-flex align-items-center btn-edit-mode">
							 {editMode &&
								 <Button
									 outline
									 className="mr-2"
									 disabled={!editMode}
									 size="sm" color="danger"
									 onClick={(e) => removeTenant(tenant_id)}>
									 <span className="cil-minus" />
								 </Button>
							 }
							<Tenant tenant={tenant_id} lookup={allTenants} />
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
							onClick={(e) => handleSave()}
						>
							{t("Save")}
						</Button>
						<Button
							color="outline-primary"
							type="button"
							onClick={(e) => (setAssignedTenants(prevAssignedTenants), setEditMode(false))}
						>
							{t("Cancel")}
						</Button>
					</ButtonGroup>
						<Dropdown
							direction="up"
							isOpen={dropdownOpen}
							toggle={toggleDropdown}
						>
							<DropdownToggle
								caret
								outline
								color="primary"
							>
								{t("CredentialsTenantsCard|Assign a tenant")}
							</DropdownToggle>
							<DropdownMenu style={{maxHeight: "20em", overflowY: "auto"}} >
								<DropdownItem header>
									<Input
										placeholder={t("CredentialsTenantsCard|Search")}
										className="m-0"
										onChange={e => setFilter(e.target.value)}
										value={filter}
									/>
								</DropdownItem>
								{(allTenants.length > 0) && allTenants.map((tenant, i) => {
									let aleadyAssignedTenant = assignedTenants.find((existing) => { return existing == tenant._id });
									if (aleadyAssignedTenant == null) {
										// Display only if the tenant is not already assigned
										return (
											<DropdownItem
												key={tenant._id}
												onClick={() => addTenant(tenant._id)}
											>
												<Tenant
													tenant={tenant._id}
													lookup={allTenants}
												/>
											</DropdownItem>
										)
									} else { return null }
								})}
								{(count > limit) ?
									<>
										<DropdownItem divider />
										<DropdownItem
											onClick={() => {
												setLimit(limit + 5);
												toggleDropdown(true);
											}}
										>
											{t("CredentialsRolesCard|More")}
										</DropdownItem>
									</>
									:
									null
								}
								{allTenants.length == 0 && <DropdownItem>
										<span>
											{t("CredentialsTenantsCard|No match")}
										</span>
									</DropdownItem>}
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

function Tenant(props) {
	return (<span>{props.tenant}</span>);
}

export default CredentialsTenantsCard;
