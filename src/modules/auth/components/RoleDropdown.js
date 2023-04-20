import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown, DropdownToggle,
	DropdownItem, DropdownMenu, Input,
	UncontrolledTooltip } from "reactstrap";

const RoleDropdown = React.memo(({props, tenantObj, selectedTenants, setSelectedTenants, idx}) => {

	const { t } = useTranslation();
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const [displayTenantRoles, setDisplayTenantRoles] = useState({data: []});
	const [count, setCount] = useState(0);
	const [filter, setFilter] = useState("");
	const [limit, setLimit] = useState(5);
	const [items, setItems] = useState(0);

	let SeaCatAuthAPI = props.app.axiosCreate('seacat_auth');
	let message;

	useEffect(() => {
		retrieveRoleList(tenantObj);
	}, [limit]);

	// TODO: this useEffect should match selected roles with the ones we want to display and re-add the ones which were removed from selected roles in BulkAssignmentContainer
	useEffect(() => {
		if (tenantObj.selectedRole && (tenantObj?.selectedRole?.length > 0)) {
			let display = {...displayTenantRoles};
			// newDisplayData will hold roles coming from the service minus the ones we've already assigned
			let newDisplayData = [];
			// selectedTenants[idx]?.roles?.data.map((tenantRole) => {
			tenantObj?.roles?.data.map((tenantRole) => {
				// we are comparing already selected roles with all roles and keeping only the elements, which are not included in selectedRole(s)
				let found = tenantObj?.selectedRole.find(el => el === tenantRole._id);
				if (!found) {
					newDisplayData.push(tenantRole);
				}
			});
			display['data'] = newDisplayData;
			setDisplayTenantRoles(display);
		}
		if (tenantObj.selectedRole && tenantObj?.selectedRole?.length === 0) {
			setDisplayTenantRoles(tenantObj.roles);
		}
	}, [selectedTenants, items]);

// uncomment, when search functionality in roles is enabled on the backend
	// // sets 0.5s delay before triggering the search call when filtering through tennants
	// useEffect(() => {
	// 	if (timeoutRef.current !== null) {
	// 		clearTimeout(timeoutRef.current);
	// 	}
	// 	timeoutRef.current = setTimeout(() => {
	// 		timeoutRef.current = null;
	// 		retrieveRoleList(tenantObj);
	// 	}, 500);
	// }, [filter]);

	// const handleFilter = (e) => {
	// 	setLimit(5);
	// 	setFilter(e.target.value);
	// }

	// fetch roles for Tenant dropdowns
	const retrieveRoleList = async (tenantObj) => {
		let response;
		let id = tenantObj._id;
		let parameters = {f: filter, i: limit, exclude_global: true};
		if (tenantObj._id === "Global roles") {
			id = '*';
			parameters['exclude_global'] = false;
		}
		try {
			response = await SeaCatAuthAPI.get(`/role/${id}`, {params: parameters});
			tenantObj['roles'] = response.data;
			setCount(response.data.count);
			/* this Items state was created just as a helper to cause triggering of useEffect
			on line 23 when new roles were triggered after pressing the more button in role dropdown.
			This is not the most elegant solution, I'm open for updgrade */
			setItems(response?.data?.data.length);
			setDisplayTenantRoles(response.data);
		} catch (e) {
			console.error(e);
			props.app.addAlert("warning", `${t("BulkAssignmentContainer|Failed to fetch roles")}. ${e?.response?.data?.message}`, 30);
		}
	}

	// adds role to the list of selected roles
	const addRole = (roleId, index) => {
		let tenants = [...selectedTenants];
		let tenant = {...tenantObj};
		//create a copy of displayed roles
		let displayTenantRolesCopy = [...displayTenantRoles?.data];
		// remove selected item from the copy of displayed roles
		displayTenantRolesCopy.splice(index, 1);
		//update state with modified copy
		setDisplayTenantRoles({...displayTenantRoles, data: displayTenantRolesCopy});
		if (tenant.selectedRole) {
			Object.assign(tenant, {'selectedRole': [...tenant.selectedRole, roleId] });
		} else {
			Object.assign(tenant, {'selectedRole': [roleId] });
		};
		tenants[idx] = tenant;
		setSelectedTenants(tenants);
	};

	// determins tooltip messages
	if((tenantObj._id === "Global roles")) {
		(tenantObj?.selectedRole && (tenantObj.selectedRole.length > 0)) ?
			message = t("BulkAssignmentContainer|Selected global roles will be assignes to/unassigned from the selected credentials")
			: message = t("BulkAssignmentContainer|If you wish to assign/unassign global roles, select individual roles. Otherwise leave it as is")
	} else if (tenantObj?.selectedRole && (tenantObj.selectedRole.length > 0)) {
		message = t("BulkAssignmentContainer|Tenant") + " '" + tenantObj._id + "' " + t("BulkAssignmentContainer|and selected roles will be assigned to/unassigned from selected credentials");
	} else {
		message = t("BulkAssignmentContainer|Selected credentials will be assigned to/removed from tenant") + " '" + tenantObj._id + "'"
	}

	return (
		<>
			<span href="#" id={`tooltip-${idx}`}> <i className='cil-info ml-2'></i></span>
			<UncontrolledTooltip placement="auto" target={`tooltip-${idx}`}>
				{message}
			</UncontrolledTooltip>
			<Dropdown className='ml-auto' size="sm" isOpen={dropdownOpen} toggle={() => setDropdownOpen(prev => !prev)}>
				<DropdownToggle caret outline color="primary">
					<span className="cil-plus mr-2" />
					{t("BulkAssignmentContainer|Add role")}
				</DropdownToggle>
				<DropdownMenu  style={{maxHeight: "20em", overflowY: "auto"}} >
					<DropdownItem header>{t("BulkAssignmentContainer|Select roles")}</DropdownItem>

				{/* uncomment, when search functionality in roles is enabled on the backend
					<Input
						placeholder={t("BulkAssignmentContainer|Search")}
						className="m-0"
						onChange={e => handleFilter(e)}
						value={filter}
					/> */}
					{displayTenantRoles?.data && displayTenantRoles.data.map((role, i) => (
						<DropdownItem key={idx} onClick={() => addRole(role._id, i)}>
							{role._id}
						</DropdownItem>
					))}
					{(count > limit) ?
						<>
							<DropdownItem divider />
							<DropdownItem
								onClick={() => {
									setLimit(prev => prev + 5);
									setDropdownOpen(prev => !prev);
								}}
								>
								{t("BulkAssignmentContainer|More")}
							</DropdownItem>
						</>
						:
						null
					}
				</DropdownMenu>
			</Dropdown>
		</>
	)
});

export default RoleDropdown
