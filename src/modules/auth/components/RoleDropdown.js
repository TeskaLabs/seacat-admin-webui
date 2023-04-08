import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown, DropdownToggle,
	DropdownItem, DropdownMenu } from "reactstrap";

export default function RoleDropdown({tenantObj, selectedTenants, setSelectedTenants, idx}) {

	const { t } = useTranslation();
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const [displayRoles, setDisplayRoles] = useState({data: []});

	useEffect(() => {
		let obj = {...tenantObj.roles};
		setDisplayRoles(obj);
	}, []);

	// TODO: this useeffect should match selected roles with the ones we want to display and readd the ones which were removed from selected roles in BulkAssignmentContainer
	useEffect(() => {
		if (tenantObj.selectedRole && (tenantObj.selectedRole.length > 0)) {
			let display = {...displayRoles};
			let newDisplayData = [];
			selectedTenants[idx].roles.data.map((tenantRole) => {
				let found = selectedTenants[idx].selectedRole.find(el => el === tenantRole._id);
				if (!found) {
					newDisplayData.push(tenantRole);
				}
			});
			display.data = newDisplayData;
			setDisplayRoles(display);
		}
		if (tenantObj.selectedRole && tenantObj.selectedRole.length === 0) {
			setDisplayRoles(selectedTenants[idx].roles);
		}
	}, [selectedTenants]);

	const addRole = (roleId, index) => {
		let tenants = [...selectedTenants];
		let tenant = {...tenantObj};
		let displayTenantRoles = [...displayRoles.data];
		displayTenantRoles.splice(index, 1);
		setDisplayRoles({...displayRoles, data: displayTenantRoles});
		if (tenant.selectedRole) {
			Object.assign(tenant, {'selectedRole': [...tenant?.selectedRole, roleId] });
		} else {
			Object.assign(tenant, {'selectedRole': [ roleId] });
		};
		tenants[idx] = tenant;
		setSelectedTenants(tenants);
	};

	return (
		<Dropdown className='ml-auto' size="sm" isOpen={dropdownOpen} toggle={() => setDropdownOpen(prev => !prev)}>
			<DropdownToggle caret outline color="primary">
				<span className="cil-plus mr-2" />
				{t("RolesResourcesCard|Add role")}
			</DropdownToggle>
			<DropdownMenu  style={{maxHeight: "20em", overflowY: "auto"}} >
				<DropdownItem header>{t("RolesResourcesCard|Select role")}</DropdownItem>
				{displayRoles.data.map((role, i) => (
					<DropdownItem key={idx} onClick={() => addRole(role._id, i)}>
						{role._id}

					</DropdownItem>
				))}
			</DropdownMenu>
		</Dropdown>
	)
}