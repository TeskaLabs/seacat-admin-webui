import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, useFieldArray } from 'react-hook-form';
import CustomDataInput from "./CustomDataInput";

import { ButtonWithAuthz, CellContentLoader } from 'asab-webui';
import { Container, Row, Form,  Card,
	CardBody, CardHeader, CardFooter,
	ButtonGroup, Button, Col,
	Input, Dropdown, DropdownToggle,
	DropdownItem, DropdownMenu } from "reactstrap";


export default function RoleDropdown({tenantObj, selectedTenants, setSelectedTenants, idx, selectedRoles, setSelectedRoles}) {

	const { t } = useTranslation();
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const [displayRoles, setDisplayRoles] = useState({data: []});

	useEffect(() => {
		console.log('selected tenants', selectedTenants);
		let obj = {...tenantObj.roles};
		setDisplayRoles(obj);
		// console.log(displayRoles)
	}, [])

	// TODO: this useeffect should match selected roles with the ones we want to display and readd the ones which were removed from selected roles in BulkAssignmentContainer
	// useEffect(() => {
	// 	if (tenantObj.selectedRole && (tenantObj.selectedRole.length > 0)) {
	// 		let display = {lenght: displayRoles.length, data: []};
	// 		tenantObj.selectedRole.map((selectedRole) => {
	// 			let found = tenantObj.roles.data.find(el => el === selectedRole)
	// 			if (found) {
	// 				display.data.push(found);
	// 			}
	// 		})
	// 		setDisplayRoles(...display);
	// 	}
	// }, [tenantObj])

	const addRole = (roleId, index) => {
		let tenants = [...selectedTenants];
		let tenant = {...tenantObj};
		// let displayTenantRoles = [...selectedTenants[idx]?.roles?.data];
		let displayTenantRoles = [...displayRoles.data];

		if (tenant.selectedRole) {
			Object.assign(tenant, {'selectedRole': [...tenant?.selectedRole, roleId] });
		} else {
			Object.assign(tenant, {'selectedRole': [ roleId] });
		}

		displayTenantRoles.splice(index, 1);
		setDisplayRoles({...displayRoles, data: displayTenantRoles});
		// console.log('tenants hello from the dropdown component', tenant);
		tenants[idx] = tenant;
		setSelectedTenants(tenants);
	}


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