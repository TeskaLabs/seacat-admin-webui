import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { DataTable, ButtonWithAuthz } from 'asab-webui';
import { Container } from 'reactstrap';

function ResourcesListContainer(props) {

	let SeaCatAuthAPI = props.app.axiosCreate('seacat-auth');

	const [resources, setResources] = useState([]);
	const [count, setCount] = useState(0);
	const [page, setPage] = useState(1);
	const [filter, setFilter] = useState("");
	const [loading, setLoading] = useState(true);
	const [limit, setLimit] = useState(0);
	const [height, setHeight] = useState(0);
	const ref = useRef(null);
	const { t } = useTranslation();

	const resourceEdit = "seacat:resource:edit";
	const credentialsResources = useSelector(state => state.auth?.resources);

	// Display a modal window with description
	props.app.addHelpButton("https://docs.teskalabs.com/seacat-auth/");

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
							resource={resourceEdit}
							resources={credentialsResources}
						>
							<i className="cil-x"></i>
						</ButtonWithAuthz>
					</div>
				)
			}
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
		if (limit > 0) getResources();
	}, [page, filter, limit]);

	const getResources = async () => {
		try {
			let response = await SeaCatAuthAPI.get(`/resource`, {params: {exclude: "deleted", p:page, i:limit, f: filter}});
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
			deleteResourceFunction(resourceId);
		}
	}

	// Terminate the resource
	const deleteResourceFunction = async (resourceId) => {
		try {
			let response = await SeaCatAuthAPI.delete(`/resource/${resourceId}`);
			if (response.data.result !== "OK") {
				throw new Error(t("ResourcesListContainer|Failed to delete the resource"));
			}
			props.app.addAlert("success", t("ResourcesListContainer|Resource successfully deleted"));
			props.history.push("/auth/resources-deleted");
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("ResourcesListContainer|Failed to delete the resource")}. ${e?.response?.data?.message}`, 30);
		}
	}

	const customComponent = (
		<div style={{display: "flex"}} >
			<ButtonWithAuthz
				title={t("ResourcesListContainer|Deleted resources")}
				color="primary"
				outline
				resources={credentialsResources}
				resource={resourceEdit}
				onClick={() => props.history.push('/auth/resources-deleted')}
				>
				{t("ResourcesListContainer|Deleted resources")}
			</ButtonWithAuthz>
			<ButtonWithAuthz
				title={t("ResourcesListContainer|Create resource")}
				color="primary"
				onClick={() => {redirectToCreate()}}
				resource={resourceEdit}
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
					search={{ icon: 'cil-magnifying-glass', placeholder: t("ResourcesListContainer|Search") }}
					onSearch={onSearch}
					limit={limit}
					setLimit={setLimit}
					customComponent={customComponent}
					isLoading={loading}
					customRowClassName={customRowClassName}
					height={height}
				/>
			</Container>
		</div>
	);
};

export default ResourcesListContainer;
