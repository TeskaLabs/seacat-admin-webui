import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { DataTable, ButtonWithAuthz } from 'asab-webui';
import { Container, Button } from 'reactstrap';

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

	const deleteButtonResource = "authz:tenant:admin";
	const createResourceButtonResource = "authz:superuser"

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
		},
		{
			name: " ",
			customComponent: {
				generate: (resource) => (
					<div className="d-flex justify-content-end">
						<ButtonWithAuthz
							title={t("ResourcesListContainer|Delete resource")}
							id={resource._id}
							size="sm"
							color="danger"
							outline
							onClick={() => {terminateResourceForm(resource._id)}}
							resource={deleteButtonResource}
							resources={credentialsResources}
						>
							<i className="cil-x"></i>
						</ButtonWithAuthz>
					</div>
				)
			}
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
			props.app.addAlert("warning", `${t("ResourcesListContainer|Failed to load resources")}. ${e?.response?.data?.message}`, 30);
		}
	}
	// Set terminate resource dialog
	const terminateResourceForm = (resourceId) => {
		var r = confirm(t('ResourcesListContainer|Do you want to delete this resource'));
		if (r == true) {
			deleteResource(resourceId);
		}
	}

	// Terminate the resource
	const deleteResource = async (resourceId) => {
		try {
			let response = await SeaCatAuthAPI.delete(`/resource/${resourceId}`);
			if (response.data.result !== "OK") {
				throw new Error(t("ResourcesListContainer|Failed to delete the resource"));
			}
			props.app.addAlert("success", t("ResourcesListContainer|Resource successfully deleted"));
			props.history.push("/auth/resources/!deleted");
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("ResourcesListContainer|Failed to delete the resource")}. ${e?.response?.data?.message}`, 30);
		}
	}

	const customComponent = (
		<div style={{display: "flex"}} >
			<Button
				title={t("ResourcesListContainer|Deleted resources")}
				color="primary"
				outline
				onClick={() => props.history.push('/auth/resources/!deleted')}
				>
				{t("ResourcesListContainer|Deleted resources")}
			</Button>
			<ButtonWithAuthz
				title={t("ResourcesListContainer|Create resource")}
				color="primary"
				onClick={() => {redirectToCreate()}}
				resource={createResourceButtonResource}
				resources={credentialsResources}
				>
				{t("ResourcesListContainer|Create resource")}
			</ButtonWithAuthz>
		</div>
	);

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
					customComponent={customComponent}
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
