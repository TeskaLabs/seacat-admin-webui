import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown, DropdownToggle,
	DropdownItem, DropdownMenu, Input } from "reactstrap";

export default function RoleDropdown({props, tenantObj, selectedTenants, setSelectedTenants, idx}) {

	const { t } = useTranslation();
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const [displayRoles, setDisplayRoles] = useState({data: []});
	const [count, setCount] = useState(0);
	const [filter, setFilter] = useState("");
	const [limit, setLimit] = useState(5);

	let SeaCatAuthAPI = props.app.axiosCreate('seacat_auth');

	const timeoutRef = useRef(null);
	// useEffect(() => {
	// 	if(tenantObj?.roles) {
	// 		let obj = {...tenantObj.roles};
	// 		setDisplayRoles(obj);
	// 	}
	// }, []);

	// useEffect(() => {
	// 	console.log('hello form ln25')
	// 	retrieveRoleList(tenantObj)
	// }, []);
	useEffect(() => {
		console.log('hello form ln25')
		retrieveRoleList(tenantObj)
	}, [limit]);

	// TODO: this useeffect should match selected roles with the ones we want to display and readd the ones which were removed from selected roles in BulkAssignmentContainer
	// useEffect(() => {
	// 	if (tenantObj.selectedRole && (tenantObj.selectedRole.length > 0)) {
	// 		let display = {...displayRoles};
	// 		let newDisplayData = [];
	// 		selectedTenants[idx].roles.data.map((tenantRole) => {
	// 			let found = selectedTenants[idx].selectedRole.find(el => el === tenantRole._id);
	// 			if (!found) {
	// 				newDisplayData.push(tenantRole);
	// 			}
	// 		});
	// 		display.data = newDisplayData;
	// 		setDisplayRoles(display);
	// 	}
	// 	if (tenantObj.selectedRole && tenantObj.selectedRole.length === 0) {
	// 		setDisplayRoles(selectedTenants[idx].roles);
	// 	}
	// }, [selectedTenants]);


	useEffect(() => {
		let obj = {...tenantObj?.roles};
		setDisplayRoles(obj);
	}, []);

// uncomment, when search functionality in roles is enabled on the backend
	//sets 0.5s delay before triggering the search call when filtering through tennants
	// useEffect(() => {
	// 	if (timeoutRef.current !== null) {
	// 		clearTimeout(timeoutRef.current);
	// 	}
	// 	timeoutRef.current = setTimeout(() => {
	// 		timeoutRef.current = null;
	// 		retrieveRoleList(tenantObj);
	// 	}, 500);
	// }, [filter]);


	// fetch roles for Tenant dropdowns
	const retrieveRoleList = async (tenantObj) => {
		let response;
		let arr;
		try {
			response = await SeaCatAuthAPI.get(`/role/${tenantObj._id}`, {params: {f: filter, i: limit}});
			tenantObj['roles'] = response.data;
			// arr = [...selectedTenants, tenantObj];
			// setSelectedTenants(arr);
			setCount(response.data.count);
			setDisplayRoles(response.data)
		} catch (e) {
			console.error(e);
			props.app.addAlert("warning", `${t("BulkAssignmentContainer|Failed to fetch roles")}. ${e?.response?.data?.message}`, 30);
		}
	}

	// const addRole = (roleId, index) => {
	// 	let tenants = [...selectedTenants];
	// 	let tenant = {...tenantObj};
	// 	let displayTenantRoles = [...displayRoles.data];
	// 	displayTenantRoles.splice(index, 1);
	// 	setDisplayRoles({...displayRoles, data: displayTenantRoles});
	// 	if (tenant.selectedRole) {
	// 		Object.assign(tenant, {'selectedRole': [...tenant?.selectedRole, roleId] });
	// 	} else {
	// 		Object.assign(tenant, {'selectedRole': [ roleId] });
	// 	};
	// 	tenants[idx] = tenant;
	// 	setSelectedTenants(tenants);
	// };

	const handleFilter = (e) => {
		setLimit(5);
		setFilter(e.target.value);
	}

	return (
		<Dropdown className='ml-auto' size="sm" isOpen={dropdownOpen} toggle={() => setDropdownOpen(prev => !prev)}>
			<DropdownToggle caret outline color="primary">
				<span className="cil-plus mr-2" />
				{t("RolesResourcesCard|Add role")}
			</DropdownToggle>
			<DropdownMenu  style={{maxHeight: "20em", overflowY: "auto"}} >
				<DropdownItem header>{t("RolesResourcesCard|Select role")}</DropdownItem>

{/* uncomment, when search functionality in roles is enabled on the backend
				<Input
					placeholder={t("x|Search")}
					className="m-0"
					onChange={e => handleFilter(e)}
					value={filter}
				/> */}
				{displayRoles?.data && displayRoles.data.map((role, i) => (
					<DropdownItem key={idx} onClick={() => addRole(role._id, i)}>
						{role._id}

					</DropdownItem>
				))}
				{(count > limit) ?
					<>
						<DropdownItem divider />
						<DropdownItem
							onClick={() => {
								setLimit(limit + 5);
								setDropdownOpen(prev => !prev);
							}}
						>
							{t("X|More")}
						</DropdownItem>
					</>
					:
					null
				}
			</DropdownMenu>
		</Dropdown>
	)
}