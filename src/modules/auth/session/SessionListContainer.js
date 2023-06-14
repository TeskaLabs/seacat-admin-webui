import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';

import { Container } from 'reactstrap';
import { DataTable, ButtonWithAuthz } from 'asab-webui';

const SessionListContainer = (props) => {
	let SeaCatAuthAPI = props.app.axiosCreate('seacat_auth');

	const { t } = useTranslation();

	const [page, setPage] = useState(1);
	const [data, setData] = useState([]);
	const [count, setCount] = useState(0);
	const [loading, setLoading] = useState(true);
	const [show, setShow] = useState(false);
	const [limit, setLimit] = useState(15);

	const resource = "seacat:session:terminate";
	const resources = useSelector(state => state.auth?.resources);

	const headers = [
		{
			name: t("SessionListContainer|Session"),
			key: "_id",
			customComponent: {
				generate: (session) => (
					<Link to={{ pathname: `/auth/session/${session._id}` }}>
						{session._id}
					</Link>
				)
			}
		},
		{
			name: t("SessionListContainer|Credentials"),
			key: "credentials_id",
			customComponent: {
				generate: (session) => (
					<Link to={{ pathname: `/auth/credentials/${session.credentials_id}`}}>
						{session.credentials_id}
					</Link>
				)
			}
		},
		{
			name: t("Created at"),
			key: "_c",
			datetime: true
		},
		{
			name: t("SessionListContainer|Expected expiration"),
			key: "expiration",
			datetime: true
		},
		{
			name: " ",
			customComponent: {
				generate: (session) => (
					<div className="d-flex justify-content-end">
						<ButtonWithAuthz
							title={t("SessionListContainer|Terminate session")}
							id={session._id}
							size="sm"
							color="danger"
							outline
							onClick={() => {terminateSessionForm(session._id)}}
							resource={resource}
							resources={resources}
						>
							<i className="at-xmark-circle"></i>
						</ButtonWithAuthz>
					</div>
				)
			}
		}

	]

	useEffect(() => {
		setShow(false);
		if (data.length === 0) {
			// Timeout delays appearance of content loader in DataTable. This measure prevents 'flickering effect' during fast fetch of data, where content loader appears just for a split second.
			setTimeout(() => setShow(true), 500);
		};
		retrieveData();
	}, [page, limit]);

	const retrieveData = async () => {
		try {
			let response = await SeaCatAuthAPI.get("/session", {params: {p:page, i:limit}});
			setData(response.data.data);
			setCount(response.data.count);
			setLoading(false);
		} catch(e) {
			if (e.response.status == 403) {
				console.error(e);
				props.app.addAlert("warning", t("SessionListContainer|Access denied, you do not have a right to perform this action"), 30);
			} else {
				console.error(e);
				props.app.addAlert("warning", `${t("SessionListContainer|Failed to fetch the object")}. ${e?.response?.data?.message}`, 30);
			}
			setLoading(false);
		}
	}

	// Set terminate session dialog
	const terminateSessionForm = (sessionId) => {
		var r = confirm(t('SessionListContainer|Do you want to terminate this session?'));
		if (r == true) {
			terminateSession(sessionId);
		}
	}

	// Set terminate all sessions dialog
	const terminateAllSessionsForm = () => {
		var r = confirm(t('SessionListContainer|Do you want to terminate all sessions?'));
		if (r == true) {
			terminateAllSessions();
		}
	}

	// Terminate the session
	const terminateSession = async (sessionId) => {
		try {
			let response = await SeaCatAuthAPI.delete(`/session/${sessionId}`);
			if (response.data.result !== "OK") {
				throw new Error(t("SessionListContainer|Something went wrong when terminating session"));
			}
			props.app.addAlert("success", t("SessionListContainer|Session successfully terminated"));
			retrieveData();
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("SessionListContainer|Failed to terminate the session")}. ${e?.response?.data?.message}`, 30);
		}
	}

	// Terminate all sessions
	const terminateAllSessions = async () => {
		try {
			let response = await SeaCatAuthAPI.delete(`/sessions`);
			if (response.data.result !== "OK") {
				throw new Error(t("SessionListContainer|Something went wrong when terminating all sessions"));
			}
			props.app.addAlert("success", t("SessionListContainer|All sessions successfully terminated"));
			// Set timeout for 5s before reloading the page and loging out
			setTimeout(() => {
				window.location.reload();
			}, 5000)
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("SessionListContainer|Failed to terminate all sessions")}. ${e?.response?.data?.message}`, 30);
		}
	}

	// Button for terminating all sessions
	const terminateAllSessionsButton = {
		title: t("SessionListContainer|Terminate all sessions"),
		color:"danger",
		onClick() {terminateAllSessionsForm()},
		resource: "authz:superuser", // Only superusers can terminate all sessions
		resources: resources,
		children: t("SessionListContainer|Terminate all")
	}

	return (
		<Container>
			<DataTable
				category={{
					key: "_id",
					sublistKey: "children"
				}}
				title={{ text: t("SessionListContainer|Sessions"), icon: "at-stopwatch" }}
				headers={headers}
				data={data}
				count={count}
				limit={limit}
				setLimit={setLimit}
				currentPage={page}
				setPage={setPage}
				buttonWithAuthz={terminateAllSessionsButton}
				isLoading={loading}
				contentLoader={show}
			/>
		</Container>
	);
}

export default SessionListContainer;
