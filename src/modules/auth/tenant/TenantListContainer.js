import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { Container } from 'reactstrap';

import { DataTable, ButtonWithAuthz } from 'asab-webui';

function TenantListContainer(props) {
	let SeaCatAuthAPI = props.app.axiosCreate('seacat-auth');

	const { t } = useTranslation();

	const [page, setPage] = useState(1);
	const [data, setData] = useState([]);
	const [count, setCount] = useState(0);
	const [filter, setFilter] = useState("");
	const [loading, setLoading] = useState(true);
	const [show, setShow] = useState(false);
	const [limit, setLimit] = useState(0);
	const [height, setHeight] = useState(0);
	const ref = useRef(null);

	// TODO: Resource "seacat:tenant:create" will be implemented in future iterations
	const resource = "authz:superuser"; //"seacat:tenant:create";
	const resources = useSelector(state => state.auth?.resources);

	// Display a modal window with description
	props.app.addHelpButton("https://docs.teskalabs.com/seacat-auth/");

	const headers = [
		{
			name: t("Name"),
			key: "_id",
			link: {
				key: "_id",
				pathname: "/auth/tenant/"
			}
		},
		{
			name: t("Created at"),
			key: "_c",
			datetime: true
		}
	];

	// Filter the value
	const onSearch = (value) => {
		setFilter(value);
	};

	useEffect(() => {
		setHeight(ref.current.clientHeight);
	}, []);

	useEffect(() => {
		setShow(false);
		if (data.length === 0) {
			// Timeout delays appearance of content loader in DataTable. This measure prevents 'flickering effect' during fast fetch of data, where content loader appears just for a split second.
			setTimeout(() => setShow(true), 500);
		};
		if (limit > 0) {
			retrieveData();
		}
	}, [page, filter, limit]);

	const retrieveData = async () => {
		try {
			let response = await SeaCatAuthAPI.get("/tenants", {params: {p:page, i:limit, f: filter}});
			setData(response.data.data);
			setCount(response.data.count);
			setLoading(false);
		} catch(e) {
			console.error(e);
			setLoading(false);
			props.app.addAlert("warning", `${t("TenantListContainer|Failed to fetch tenants")}. ${e?.response?.data?.message}`, 30);
		}
	}

	const createTenantComponent = (
		<ButtonWithAuthz
			title={t("TenantDetailContainer|New tenant")}
			color="primary"
			onClick={() => redirectToCreate()}
			resource={resource}
			resources={resources}
		>
			{t("TenantListContainer|New tenant")}
		</ButtonWithAuthz>
	)

	const redirectToCreate = () => {
		props.history.push('/auth/tenant/!create');
	}

	return (
		<div className="h-100" ref={ref}>
			<Container>
				<DataTable
					title={{ text: t("TenantListContainer|Tenants"), icon: "cil-apps" }}
					headers={headers}
					data={data}
					count={count}
					limit={limit}
					setLimit={setLimit}
					currentPage={page}
					setPage={setPage}
					search={{ icon: 'cil-magnifying-glass', placeholder: t("TenantListContainer|Search") }}
					onSearch={onSearch}
					customComponent={createTenantComponent}
					isLoading={loading}
					contentLoader={show}
					height={height}
				/>
			</Container>
		</div>
	);
}

export default TenantListContainer;
