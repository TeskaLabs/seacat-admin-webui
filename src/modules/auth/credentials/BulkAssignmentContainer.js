import React, { useState, useEffect, useRef } from "react"
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSelector } from "react-redux";
import { Container, Row, Form,  Card,
	CardBody, CardHeader, CardFooter,
	ButtonGroup, Button, Col,
	Input, Dropdown, DropdownToggle,
	DropdownItem, DropdownMenu } from "reactstrap";
import { Credentials } from 'asab-webui';

const BulkAssignmentContainer = (props) => {

	const {t} = useTranslation();
	const SeaCatAuthAPI = props.app.axiosCreate('seacat_auth');
	const timeoutRef = useRef(null);

	const [ allTenants, setAllTenants] = useState(undefined);
	const [ assignedTenants, setAssignedTenants] = useState([]);
	const [ assignedCredentialsDropdown, setAssignedCredentialsDropdown ] = useState([]);
	const [ limit, setLimit] = useState(15);
	const [ count, setCount ] = useState(undefined);
	const [ filter, setFilter] = useState('');
	const [ page, setPage] = useState('');
	const [ loading, setLoading ] = useState(true);
	const [ dropdownOpen, setDropdownOpen ] = useState(false);
	const [ credentialsList, setCredentialsList ] = useState([]);
	const [ prevAssignedTenants, setPrevAssignedTenants ] = useState(undefined);

	const { register, handleSubmit, reset, setValue } = useForm();
	// const { register, handleSubmit, reset, setValue } = useForm({defaultValues: { tenants: assignedTenants }});
	const resources = useSelector(state => state.auth?.resources);
	const tenant = useSelector(state => state.tenant?.current);
	const credentials_id = props.match.params.credentials_id;

	useEffect(() => {
		fetchAllTenants();
		retrieveUserInfo();
		// retrieveAssignedTenants();
	}, [])

	//useEffect, applying filtering to credentials dropdown
	useEffect(() => {
		if (timeoutRef.current !== null) {
			clearTimeout(timeoutRef.current);
		}
		timeoutRef.current = setTimeout(() => {
			timeoutRef.current = null;
			retrieveCredentialsForDropdown()
		}, 500);
	}, [filter]);

	const toggleDropdown = () => setDropdownOpen(prevState => !prevState);

	const retrieveUserInfo = async () => {
		try {
			let response = await SeaCatAuthAPI.get(`/credentials/${credentials_id}`);
			setCredentialsList([response.data]);
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("BulkAssignmentContainer|Failed to fetch user details")}. ${e?.response?.data?.message}`, 30);
		}
	};

	const retrieveAssignedTenants = async () => {
		try {
			let response = await SeaCatAuthAPI.get(`/tenant_assign/${credentials_id}`);
			//updates tenants inside useForm and activates ('prefills') appropriate checkboxes on the screen
			setValue('tenants', response.data);
			setAssignedTenants(response.data);
			setPrevAssignedTenants(response.data);
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("BulkAssignmentContainer|Failed to fetch assigned tenants")}. ${e?.response?.data?.message}`, 30);
		}
	};

	const fetchAllTenants = async() => {
		try {
			let eligibleTenants = [];
			let response = await SeaCatAuthAPI.get('/tenants', {params: {f: filter, i: limit}});
			// if a logged in user doesn't hold 'authz:superuser' resource, their rights allow them to only assing the tenant, which they are currently using
			if (resources.includes('authz:superuser')) {
				eligibleTenants = response.data.data;
			} else if (response.data.data.length > 0) {
				let filteredTenant = response.data.data.filter(obj => obj._id === `${tenant}`);
				eligibleTenants.push(filteredTenant[0]);
			}
			// this function changed eligibleTenants order to alphabetical
			eligibleTenants.sort((a, b) => a._id.localeCompare(b._id));
			setAllTenants(eligibleTenants);
			setCount(response.data.count);
		} catch(e) {
			console.error(e);
			props.app.addAlert("warning", `${t("BulkAssignmentContainer|Failed to fetch tenants")}. ${e?.response?.data?.message}`, 30);
		}
	};

	// Receives data from all credentials
	const retrieveCredentialsForDropdown = async () => {
		let response;
		try {
			// response = await SeaCatAuthAPI.get("/credentials", {params: {f: filter}});
			response = await SeaCatAuthAPI.get("/credentials", {params: {m: 'tenant', f: tenant}});
			// GET /credentials?m=tenant&f=tenant-a
			console.log('response.data from GET / credentails: ', response.data)
			if (response.data.result !== "OK") {
				throw new Error(t("BulkAssignmentContainer|Failed to fetch data"));
			}
			setAssignedCredentialsDropdown(response.data.data);
			setLoading(false);
		} catch(e) {
			console.error(e);
			setLoading(false)
			if (e.response.status === 401) {
				props.app.addAlert("warning", t("BulkAssignmentContainer|Can't fetch the data, you don't have rights to display it"), 30);
				return;
			}
			props.app.addAlert("warning", `${t("BulkAssignmentContainer|Failed to fetch data")}. ${e?.response?.data?.message}`, 30);
		}
	};

	// Removes credentials from being displayed in the tenants card
	const removeCredentialFromList = (idx) => {
		const modifiedCreds = credentialsList;
		modifiedCreds.splice(idx, 1);
		setCredentialsList([...modifiedCreds]);
	};

	const submit = async (data) => {
		// TBD
		console.log('data: ', data);
		console.log('Credentials to use: ', credentialsList);
		let arr = []
		credentialsList.map((el) => {
			arr.push(el._id)
		})
		console.log('arr: ', arr)

		try {
			let response = await SeaCatAuthAPI.put(`/tenant_assign_many/${data.tenant}`, arr);
			if (response.data.result !== "OK") {
				throw new Error(t("BulkAssignmentContainer|Fail"));
			}
			console.log('reponse: ', response)
			props.app.addAlert("success", t("BulkAssignmentContainer|Tenant assignment was successful"), 30);
		} catch(e) {
			console.error(e);
			if (e.response.status === 401) {
				props.app.addAlert("warning", t("BulkAssignmentContainer|Fail"), 30);
				return;
			}
			props.app.addAlert("warning", `${t("BulkAssignmentContainer|Fail")}. ${e?.response?.data?.message}`, 30);
		}

	};

	return (
		<Container>
			<Form onSubmit={handleSubmit(submit)} className="assign-tenants-wraper">
				<Card className='assign-tenants-credentails w-30'>
					<CardHeader>
						<div className="card-header-title">
							<i className="cil-people mr-2" />
							{t("BulkAssignmentContainer|Credentials")}
						</div>
						<Dropdown isOpen={dropdownOpen} toggle={toggleDropdown} onClick={() => retrieveCredentialsForDropdown()}>
							<DropdownToggle caret outline color="primary" className="card-header-dropdown">
								{t("BulkAssignmentContainer|Select credentials")}
							</DropdownToggle>
							<DropdownMenu className="assign-credential-list-dropdown">
								<DropdownItem header>
									<Input
										className="m-0"
										placeholder={t("BulkAssignmentContainer|Search")}
										onChange={e => setFilter(e.target.value)}
										value={filter}
									/>
								</DropdownItem>
								{loading ?
									<DropdownItem><span>{t("BulkAssignmentContainer|Loading")}</span></DropdownItem>
									:
									(assignedCredentialsDropdown && Object.keys(assignedCredentialsDropdown).map((item, i) => {
										let checkCredentialsAvailability = credentialsList.findIndex(elem => elem._id === assignedCredentialsDropdown[item]._id);
										if (checkCredentialsAvailability === -1) {
											// Display only if the credentials is not already assigned
											return (
												<DropdownItem key={assignedCredentialsDropdown[item]._id} onClick={() => setCredentialsList([...credentialsList, assignedCredentialsDropdown[item]])}>
													{assignedCredentialsDropdown[item].username ?
														<span>{assignedCredentialsDropdown[item].username}</span>
														:
														<Credentials
															className="disabled-link"
															app={props.app}
															credentials_ids={assignedCredentialsDropdown[item]._id}
														/>
													}
												</DropdownItem>
											)
										}
										else {return null}
									}))
								}
								{(!assignedCredentialsDropdown ) && <DropdownItem><span>{t("BulkAssignmentContainer|No match")}</span></DropdownItem>}
							</DropdownMenu>
						</Dropdown>
					</CardHeader>
					<CardBody>
						{ (credentialsList.length > 0) && (
							credentialsList.map((el, idx) => {
								return (
									<div className="mt-2">
										{el.username ?
											<>
												<i className="cil-user mr-1" />
												{el.username}
											</>
										:
											<Credentials
												className="disabled-link"
												app={props.app}
												credentials_ids={el._id}
											/>
										}
										<Button
											size="sm"
											outline
											className='ml-4'
											style={{'display': 'inline'}}
											color="danger"
											onClick={() => ( console.log('we bouta remove'), removeCredentialFromList(idx))}
											title={t("BulkAssignmentContainer|Remove")}
										>
											-
										</Button>
									</div>
									)
								}
							))
						}
					</CardBody>
				</Card>
				<Card className="assign-tenants-tenants w-30">
					<CardHeader>
						<div className="card-header-title">
							<i className="cil-apps mr-2" />
							{t("BulkAssignmentContainer|Assign tenants")}
						</div>
					</CardHeader>

					<CardBody>
						<Col>
						{(allTenants && allTenants.length > 0) ?
						allTenants.map((tenant) => {
							return(
								<Row key={tenant._id}>
									<input
										type="radio"
										name="tenant"
										className="mr-1"
										value={tenant._id}
										{...register("tenant")}
									/>
									{tenant._id}
								</Row>
							)
						})
						: <p>{t("BulkAssignmentContainer|No data")}</p>}
						</Col>
					</CardBody>

					<CardFooter className="border-top">
						<ButtonGroup className="flex-nowrap">
							<Button
								color="primary"
								type="submit"
								title={t("BulkAssignmentContainer|Assign selected tennant to selected list of credentials")}
							>
								{t("BulkAssignmentContainer|Assign")}
							</Button>
						</ButtonGroup>
						<div className='actions-right'>
							<Button
								outline
								title={t("BulkAssignmentContainer|Cancel")}
								onClick={(e) => (
									e.preventDefault(),
									reset({tenants: assignedTenants}),
									retrieveUserInfo(),
									setAssignedTenants(prevAssignedTenants)
								)}
							>
								{t("BulkAssignmentContainer|Cancel")}
							</Button>
						</div>
					</CardFooter>
				</Card>
			</Form>
		</Container>
	)
}

export default BulkAssignmentContainer
