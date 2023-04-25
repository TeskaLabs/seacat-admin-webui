import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { DataTable, ButtonWithAuthz } from 'asab-webui';
import { Container, Button } from 'reactstrap';

const ResourcesDeletedListContainer = (props) => {

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

	const retrieveButtonResource = "seacat:resource:edit";

	const credentialsResources = useSelector(state => state.auth?.resources);

	const headers = [
		{
			name: t("Name"),
			key: '_id',
			link: {
				pathname: '/auth/resources-deleted/',
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
							title={t("ResourcesDeletedListContainer|Retrieve resource")}
							id={resource._id}
							size="sm"
							color="primary"
							outline
							onClick={() => {confirmationPrompt(resource._id)}}
							resource={retrieveButtonResource}
							resources={credentialsResources}
						>
							<i className="cil-action-undo"></i>
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

	// Fetches deleted resources
	const getResources = async () => {
		try {
			let response = await SeaCatAuthAPI.get(`/resource`, {params: {exclude: "active", p:page, i:limit}});
			setResources(response.data.data);
			setCount(response.data.count || 0);
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("ResourcesDeletedListContainer|Failed to load resources")}. ${e?.response?.data?.message}`, 30);
		}
		setLoading(false);
	}

	// Undelete the resource
	const retrieveResource = async (resourceId) => {
		try {
			let response = await SeaCatAuthAPI.post(`/resource/${resourceId}`, {});
			if (response.data.result !== "OK") {
				throw new Error(t("ResourcesDeletedListContainer|Failed to retrieve resource"));
			}
			props.app.addAlert("success", t("ResourcesDeletedListContainer|Resource retrieved successfuly"));
			props.history.push(`resources/${resourceId}`);
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("ResourcesDeletedListContainer|Failed to retrieve resource")}. ${e?.response?.data?.message}`, 30);
		}
	}

	// This prompt invites user to confirm if they really wish to retrieve selected resource.
	const confirmationPrompt = (resourceId) => {
		var r = confirm(t('ResourcesDeletedListContainer|Do you really want to retrieve this resource'));
		if (r == true) {
			retrieveResource(resourceId);
		}
	}

	const customRowClassName = {
		condition: row => typeof (row.description) === "string",
		className: "description-row"
	}

	const goBackButton = (
		<Button
			outline
			title={t('ResourcesDeletedListContainer|Back')}
			onClick={() => props.history.push("/auth/resources")}
		>
			{t('ResourcesDeletedListContainer|Back')}
		</Button>
	)

	return (
		<div className="h-100" ref={ref}>
			<Container>
				<DataTable
					title={{ text: t('ResourcesDeletedListContainer|Deleted resources'), icon: 'cil-lock-locked'}}
					data={resources}
					headers={headers}
					count={count}
					currentPage={page}
					setPage={setPage}
					limit={limit}
					setLimit={setLimit}
					isLoading={loading}
					contentLoader={show}
					customComponent={goBackButton}
					customRowClassName={customRowClassName}
					height={height}
				/>
			</Container>
		</div>
	);
};

export default ResourcesDeletedListContainer;
