import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';

import { DataTable, ButtonWithAuthz } from 'asab-webui';

import {Container} from 'reactstrap';

function CredentialsListContainer(props) {

	const { t } = useTranslation();

	const [data, setData] = useState([]);
	const [count, setCount] = useState(0);
	const [tenants, setTenants] = useState({});
	const [roles, setRoles] = useState({});

	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(0);
	const [filter, setFilter] = useState("");
	const [loading, setLoading] = useState(true);
	const [show, setShow] = useState(false);

	const [height, setHeight] = useState(0);
	const ref = useRef(null);

	const resourceCreateCredentials = "seacat:credentials:edit";
	const resources = useSelector(state => state.auth?.resources);
	const tenant = useSelector(state => state.tenant?.current);

	const headers = [
		{
			name: t('CredentialsListContainer|Name'),
			customComponent: {
				generate: (obj) => (
					<div
						style={{whiteSpace: "nowrap",
							maxWidth: "40ch",
							textOverflow: "ellipsis",
							overflow: "hidden",
							marginBottom: 0}}
					>
						{obj.suspended === true ?
							<span className="cil-user-unfollow text-muted mr-1" title={(obj.registered === false) ? t("CredentialsListContainer|Credentials invited") : t("CredentialsListContainer|Credentials suspended")}/>
							: <span className="cil-user mr-1" />}
						<Link
							style={{color: obj.suspended === true && '#73818f'}}
							to={{
								pathname: `/auth/credentials/${obj._id}`,
							}}>
							{/* TODO: substitute with Credentials component, when it's ready */}
							{obj.username ?? obj._id}
						</Link>
					</div>
				)
			},
			customHeaderStyle: { width: "10%" }
		},
		{
			name: t('CredentialsListContainer|Provider'),
			key: "_provider_id",
			customCellStyle: {
				textOverflow: "ellipsis",
				overflow: "hidden",
				whiteSpace: "nowrap",
				maxWidth: "11ch"
			},
			customHeaderStyle: { width: "10%" }
		},
		{
			name: t('CredentialsListContainer|Type'),
			key: "_type",
			customCellStyle: {
				textOverflow: "ellipsis",
				overflow: "hidden",
				whiteSpace: "nowrap",
				maxWidth: "11ch"
			},
			customHeaderStyle: { width: "10%" }
		},
		{
			name: t('CredentialsListContainer|Tenants'),
			customComponent: {
				generate: (obj) => (
					<div className="credentials-table-tenants">
						{tenants && Object.keys(tenants).map((item_id, idx) => {
							if (obj._id === item_id) {
								let joinedTenants = tenants[item_id].join(", ");
								return (
									<span title={joinedTenants}>{joinedTenants}</span>
								)
							}
						})}
					</div>
				)
			},
			customHeaderStyle: { width: "35%" }
		},
		{
			name: t('CredentialsListContainer|Roles'),
			customComponent: {
				generate: (obj) => (
					<div className="credentials-table-tenants">
						{roles && Object.keys(roles).map((item_id, idx) => {
							if (obj._id === item_id) {
								let joinedRoles = roles[item_id].join(", ");
								return (
									<span title={joinedRoles}>{joinedRoles}</span>
								)
							}
						})}
					</div>
				)
			},
			customHeaderStyle: { width: "35%" }
		}
	];

	const suspendRow = {condition: (row) => (row.suspended === true), className: "bg-light"};

	// Filter the value
	const onSearch = (value) => {
		setFilter(value);
	};

	useEffect(() => {
		setHeight(ref.current.clientHeight);
	}, []);

	useEffect(() => {
		setShow(false);
		if (data?.length === 0) {
			// Timeout delays appearance of content loader in DataTable. This measure prevents 'flickering effect' during fast fetch of data, where content loader appears just for a split second.
			setTimeout(() => setShow(true), 500);
		}
		if (limit > 0) {
			retrieveData();
		}
	}, [page, filter, limit]);

	useEffect(() => {
		retrieveTenantList();
		retrieveRoleList();
	}, [data]);

	const retrieveData = async () => {
		let SeaCatAuthAPI = props.app.axiosCreate('seacat_auth');
		let response;
		setLoading(true);
		try {
			response = await SeaCatAuthAPI.get("/credentials", {params: {p:page, i: limit, f: filter}});
			if (response.data.result !== "OK") {
				throw new Error(t("CredentialsListContainer|Something went wrong, failed to fetch data"));
			}
			setData(response.data.data);
			setCount(response.data.count);
			setLoading(false);
		} catch(e) {
			console.error(e);
			setLoading(false);
			if (e.response.status === 401) {
				props.app.addAlert("warning", t("CredentialsListContainer|Can't fetch the data, you don't have rights to display it"), 30);
				return;
			}
			props.app.addAlert("warning", `${t("CredentialsListContainer|Something went wrong, failed to fetch data")}. ${e?.response?.data?.message}`, 30);
		}
	};

	const retrieveTenantList = async () => {
		let credentialIds = (data !== undefined) && data.map((item, idx) => {
			return item._id ? item._id : "N/A";
		})
		let SeaCatAuthAPI = props.app.axiosCreate('seacat_auth');
		let response;
		try {
			response = await SeaCatAuthAPI.put("/tenants",  credentialIds);
			setTenants(response.data)

		} catch (e) {
			console.error(e);
			props.app.addAlert("warning", `${t("CredentialsListContainer|Something went wrong, failed to fetch data")}. ${e?.response?.data?.message}`, 30);
		}
	}

	const retrieveRoleList = async () => {
		let credentialIds = (data !== undefined) && data.map((item, idx) => {
			return item._id ? item._id : "N/A";
		})
		let SeaCatAuthAPI = props.app.axiosCreate('seacat_auth');
		let response;
		try {
			response = await SeaCatAuthAPI.put(`/roles/${tenant}`,  credentialIds);
			setRoles(response.data);

		} catch (e) {
			console.error(e);
			props.app.addAlert("warning", `${t("CredentialsListContainer|Something went wrong, failed to fetch data")}. ${e?.response?.data?.message}`, 30);
		}
	}

	const createCredentialsComponent = (
		<ButtonWithAuthz
			title={t("CredentialsListContainer|Create new credentials")}
			color="primary"
			onClick={() => {redirectToCreate()}}
			resource={resourceCreateCredentials}
			resources={resources}
		>
			{t("CredentialsListContainer|Create new credentials")}
		</ButtonWithAuthz>
	);

	const redirectToCreate = () => {
		props.history.push('/auth/credentials/!create');
	}

	return (
		<div className="h-100" ref={ref}>
			<Container>
					<DataTable
						title={{ text: t("CredentialsListContainer|Credentials"), icon: "cil-storage" }}
						headers={headers}
						data={data}
						count={count}
						limit={limit}
						setLimit={setLimit}
						currentPage={page}
						setPage={setPage}
						search={{ icon: 'cil-magnifying-glass', placeholder: t("CredentialsListContainer|Search") }}
						onSearch={onSearch}
						customComponent={createCredentialsComponent}
						customRowClassName={suspendRow}
						isLoading={loading}
						contentLoader={show}
						height={height}
					/>
			</Container>
		</div>
	)
}

export default CredentialsListContainer;
