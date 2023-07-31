import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { DataTable, ButtonWithAuthz } from 'asab-webui';
import { Container } from 'reactstrap';

const RolesListcontainer = (props) => {

	let SeaCatAuthAPI = props.app.axiosCreate('seacat-auth');

	const [roles, setRoles] = useState([]);
	const [count, setCount] = useState(0);
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(true);
	const [show, setShow] = useState(false);
	const [limit, setLimit] = useState(0);
	const [height, setHeight] = useState(0);
	const ref = useRef(null);

	const resource = "seacat:role:edit";
	const resources = useSelector(state => state.auth?.resources);
	const tenant = useSelector(state => state.tenant?.current);

	const { t } = useTranslation();

	// Display a modal window with description
	props.app.addHelpButton("https://docs.teskalabs.com/seacat-auth/");

	const title = {
		text: `${t("RolesListContainer|Roles overview")} (${tenant})`,
		icon: "at-hierarchy-account-user"
	}

	const headers = [
		{
			name: t("RolesListContainer|Role"),
			key: '_id',
			link: {
				pathname: '/auth/roles/',
				key: '_id'
			}
		},
		{
			name: t("Created at"),
			key: '_c',
			datetime: true
		}
	];

	const createRoleComponent = (
		<ButtonWithAuthz
			title={t("TenantDetailContainer|Create role")}
			resource={resource}
			resources={resources}
			color="primary"
			type="button"
			onClick={() => {redirectToCreate()}}
		>
			{t("RolesListContainer|Create role")}
		</ButtonWithAuthz>
	)

	useEffect(() => {
		setHeight(ref.current.clientHeight);
	}, []);

	useEffect(()=>{
		setShow(false);
		if (roles.length === 0) {
			// Timeout delays appearance of content loader in DataTable. This measure prevents 'flickering effect' during fast fetch of data, where content loader appears just for a split second.
			setTimeout(() => setShow(true), 500);
		};
		if (limit > 0) {
			getRoles();
		}
	}, [page, limit]);

	const getRoles = async () => {
		try {
			let response = await SeaCatAuthAPI.get(`/role/${tenant}`, {params: {p:page, i:limit}});
			setRoles(response.data.data);
			setCount(response.data.count);
			setLoading(false);
		} catch(e) {
			console.error(e);
			setLoading(false);
			props.app.addAlert("warning", `${t("RolesListContainer|Something went wrong, failed to fetch roles")}. ${e?.response?.data?.message}`, 30);
		}
	}

	const redirectToCreate = () => {
		props.history.push('/auth/roles/!create');
	}

	return (
		<div className="h-100" ref={ref}>
			<Container>
				<DataTable
					title={title}
					data={roles}
					headers={headers}
					count={count}
					limit={limit}
					setLimit={setLimit}
					currentPage={page}
					setPage={setPage}
					customComponent={createRoleComponent}
					isLoading={loading}
					contentLoader={show}
					height={height}
				/>
			</Container>
		</div>
	);
};

export default RolesListcontainer;
