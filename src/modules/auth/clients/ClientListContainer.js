import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Container } from 'reactstrap';

import { DataTable, ButtonWithAuthz } from 'asab-webui';

function ClientListContainer(props) {
	let SeaCatAuthAPI = props.app.axiosCreate('seacat_auth');

	const { t } = useTranslation();

	const [page, setPage] = useState(1);
	const [data, setData] = useState([]);
	const [count, setCount] = useState(0);
	const [loading, setLoading] = useState(true);
	const [show, setShow] = useState(false);
	const [filter, setFilter] = useState("");
	const [limit, setLimit] = useState(0);
	const [height, setHeight] = useState(0);
	const ref = useRef(null);

	const resource = "authz:superuser";
	const resources = useSelector(state => state.auth?.resources);

	const headers = [
		{
			name: t('ClientListContainer|Client name'),
			customComponent: {
				generate: (obj) => (
					<Link
						className="client-name-column"
						to={{
							pathname: `/auth/clients/${obj.client_id}`
						}}
					>
						{obj.client_name ? obj.client_name : obj.client_id}
					</Link>
				)
			},
			customHeaderStyle: { width: "25%" }
		},
		{
			name: t("Created at"),
			key: '_c',
			datetime: true,
			customHeaderStyle: { width: "25%" }
		},
		{
			name: t('ClientListContainer|Application type'),
			customComponent: {
				generate: (obj) => (
					obj["application_type"] && <div>{obj["application_type"]}</div>
				)
			},
			customHeaderStyle: { width: "50%", minWidth: '155px' }
		}
	];

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
			let response = await SeaCatAuthAPI.get("/client", {params: {p:page, i: limit, f: filter}});
			if (response.statusText != 'OK') {
				throw new Error("Unable to get clients");
			}
			setData(response.data.data);
			setCount(response.data.count);
			setLoading(false);
		} catch (e) {
			console.error(e);
			setLoading(false);
			props.app.addAlert("warning", t("ClientListContainer|Failed to fetch clients"));
		}
	}

	const createClientComponent = (
		<ButtonWithAuthz
			title={t("ClientListContainer|New client")}
			color="primary"
			onClick={() => redirectToCreate()}
			resource={resource}
			resources={resources}
		>
			{t("ClientListContainer|New client")}
		</ButtonWithAuthz>
	)

	const redirectToCreate = () => {
		props.history.push('/auth/clients/!create');
	}

	// Filter the value
	const onSearch = (value) => {
		setFilter(value);
	};

	return (
		<div className="h-100" ref={ref}>
			<Container>
				<DataTable
					title={{ text: t("ClientListContainer|Clients"), icon: "cil-layers" }}
					headers={headers}
					data={data}
					count={count}
					limit={limit}
					setLimit={setLimit}
					currentPage={page}
					setPage={setPage}
					customComponent={createClientComponent}
					search={{ icon: 'cil-magnifying-glass', placeholder: t("ClientListContainer|Search") }}
					onSearch={onSearch}
					isLoading={loading}
					contentLoader={show}
					height={height}
				/>
			</Container>
		</div>
	);
}

export default ClientListContainer;
