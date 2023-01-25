import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { DataTable, ButtonWithAuthz } from 'asab-webui';
import { Container } from 'reactstrap';

function ResourcesListContainer(props) {

	let SeaCatAuthAPI = props.app.axiosCreate('seacat_auth');

	const [resources, setResources] = useState([]);
	const [count, setCount] = useState(0);
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(true);
	const [show, setShow] = useState(false);
	const [limit, setLimit] = useState(0);
	const [height, setHeight] = useState(0);
	const ref = useRef(null);
	const { t } = useTranslation();

	const credentialsResources = useSelector(state => state.auth?.resources);

	const headers = [
		{
			name: t("Name"),
			key: '_id',
			link: {
				pathname: '/auth/resources/',
				key: '_id'
			}
		},
		{
			name: t("Created at"),
			key: '_c',
			datetime: true
		},
		{
			name: t("Description"),
			key: 'description'
		}
	];

	useEffect(() => {
		setHeight(ref.current.clientHeight);
	}, []);

	useEffect(()=>{
		setShow(false);
		if (resources.length === 0) {
			// Timeout delays appearance of content loader in DataTable. This measure prevents 'flickering effect' during fast fetch of data, where content loader appears just for a split second.
			setTimeout(() => setShow(true), 500);
		};
		if (limit > 0) {
			getResources();
		}
	}, [page, limit]);

	const getResources = async () => {
		try {
			let response = await SeaCatAuthAPI.get(`/resource`, {params: {p:page, i:limit}});
			setResources(response.data.data);
			setCount(response.data.count || 0);
			setLoading(false);
		} catch(e) {
			console.error(e);
			setLoading(false);
			props.app.addAlert("warning", `${t("ResourcesListContainer|Something went wrong, failed to load resources")}. ${e?.response?.data?.message}`, 30);
		}
	}

	const createResourceComponent = (
		<ButtonWithAuthz
			title={t("ResourcesListContainer|Create resource")}
			color="primary"
			onClick={() => {redirectToCreate()}}
			resource="authz:superuser"
			resources={credentialsResources}
		>
			{t("ResourcesListContainer|Create resource")}
		</ButtonWithAuthz>
	)

	const redirectToCreate = () => {
		props.history.push('/auth/resources/!create');
	}

	const customRowClassName = {
		condition: row => typeof (row.description) === "string",
		className: "description-row"
	}

	return (
		<div className="h-100" ref={ref}>
			<Container>
				<DataTable
					title={{ text: t('ResourcesListContainer|Resources list'), icon: 'cil-lock-unlocked'}}
					data={resources}
					headers={headers}
					count={count}
					currentPage={page}
					setPage={setPage}
					limit={limit}
					setLimit={setLimit}
					customComponent={createResourceComponent}
					isLoading={loading}
					contentLoader={show}
					customRowClassName={customRowClassName}
					height={height}
				/>
			</Container>
		</div>
	);
};

export default ResourcesListContainer;
