import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import {  ButtonWithAuthz, CellContentLoader } from 'asab-webui';
import {
	Row, Card, CardHeader, Col,
	CardFooter, CardBody, Button, Label,
	InputGroup, ButtonGroup, Input
} from 'reactstrap';

export function CustomDataContainer({app, resources, customTenantData, setCustomTenantData, SeaCatAuthAPI, tenant_id, loading }) {

	const { t } = useTranslation();
	const [data, setData] = useState([{key: '', value: ''}]);
	const [edit, setEdit] = useState(false);
	const [changed, setChanged] = useState(false);

	const turnObjectToArray = (obj) => {
		let modifiedData = [];
		// if object passed does not contain any data, data state returs to initial value
		if (Object.keys(obj).length === 0) {
			setData([{key: '', value: ''}]);
			return;
		}
		Object.keys(obj).map((element) => {
			modifiedData.push({key:[element][0], value: obj[element]});
		});
		setData(modifiedData);
	}

	// transforms data array to object and skips pairs with empty key field
	const turnArrayToObject = (arr) => {
		let obj = {};
		arr.map((element) => {
			if(element.key !== '') {
				obj[element.key] = element.value;
			};
		});
		return obj
	}

	const addNewLine = () => {
		setData([...data, {key: '', value: ''}]);
	}

	/*
		Removes current line.
		In case the line is the last remaining - sets Data
		to it's initial value in order to always have an empty
		line ready for new data
	*/
	const removeLine = (index) => {
		const updatedData = [...data];
		updatedData.splice(index, 1);
		data.length === 1 && index === 0 ? setData([{key: '', value: ''}]) : setData(updatedData);
	};

	const onSave = async () => {
		// first, transform data to appropirate format for api request and skip pairs with empty key field
		let objToSubmit = turnArrayToObject(data);
		try {
			let response = await SeaCatAuthAPI.put(`/tenant/${tenant_id}/data`, objToSubmit);
			if (response.data.result !== "OK") {
				throw new Error(t("CustomDataContainer|Something went wrong, failed to update tenant's data"));
			};
			setCustomTenantData(objToSubmit);
			turnObjectToArray(objToSubmit);
			setEdit(false);
			setChanged(false);
			app.addAlert("success", t("CustomDataContainer|Tenant's data updated successfully"));
		} catch (e) {
			app.addAlert("warning", t("CustomDataContainer|Something went wrong, failed to update tenant's data"));
		}
	}

	const onChange = (index, e, part) => {
		let updatedData = [...data];
		updatedData[index][part] = e.target.value;
		setData(updatedData);
	}

	/*
		Confirms if user really wants to discard changes;
		if so, returns data state to one matching with data
		on server(happens inside turnObjectToArray function),
		else comes back to draft
	*/
	const onCancel = () => {
		if (changed) {
			const r = confirm(t('CustomDataContainer|Changes have not been saved. Discard and continue?'));
			if (!r) {
				return
			}
		};
		setEdit(false);
		setChanged(false);
		turnObjectToArray(customTenantData)
	}

	// monitors changes coming from the server
	useEffect(() => {
		turnObjectToArray(customTenantData);
	}, [customTenantData])

	// this useeffect compares data from server with currest state to determine wheter these differ
	useEffect(() => {
		if (JSON.stringify(turnArrayToObject(data)) !== JSON.stringify(customTenantData)){
			setChanged(true)
		} else {
			setChanged(false)
		}
	}, [data])

	return (
		<Card className={`custom-data-card${edit ? " edit" : ""}`}>
			<CardHeader className='border-bottom'>
				<div className="card-header-title">
					<i className="cil-ethernet pr-2" />
					{t("CustomDataContainer|Custom data")}
				</div>
			</CardHeader>

			{loading ?
				<CardBody>
					<CellContentLoader cols={2} rows={5} />
				</CardBody>
				:
				<>
					<CardBody>
						{ data.length === 1 && data[0].key === '' && !edit && <Label className="mb-0">{t('CustomDataContainer|No data')}</Label>}
						{ data && data.map((obj, index) => {
							return !edit ? (
										<div key={index} id={index} className="d-flex card-body-row">
											<Col sm="4" md="3" className="px-0" >{obj.key}</Col>
											<Col sm="8" md="9" className="px-0" >{obj.value}</Col>
										</div>
								) : (
										<InputGroup className="mb-1" key={index} id={index}>
											<Input
												name="key"
												value={obj.key}
												placeholder={t('CustomDataContainer|Add key name')}
												disabled={!edit}
												onChange={(e) => onChange(index, e, 'key')}
											/>
											<Input
												name="value"
												value={obj.value}
												placeholder={t('CustomDataContainer|Add value')}
												disabled={!edit}
												onChange={(e) => onChange(index, e, 'value')}
											/>
											<ButtonWithAuthz
												key={index}
												title={data.length === 1 && data[0].key === "" ? t("CustomDataContainer|Nothing to remove") : t("CustomDataContainer|Remove input")}
												color="danger"
												outline
												size="sm"
												disabled={data.length === 1 && data[0].key === ""}
												onClick={() => removeLine(index)}
												resource="authz:tenant:admin"
												resources={resources}
											>
												<span className="cil-minus" />
											</ButtonWithAuthz>
										</InputGroup>
								)}
							)}

							{edit && (
								<Button
									outline
									className="mt-2"
									title={t("CustomDataContainer|Add new input")}
									color="primary"
									size="sm"
									type="button"
									onClick={() => addNewLine()}
								>
									<span className="cil-plus" />
								</Button>
							)}
					</CardBody>

					<CardFooter>
						{edit ?
							<ButtonGroup>
								<Button
									title={changed ? t("CustomDataContainer|Save changes") : t("CustomDataContainer|No changes were made")}
									color="primary"
									type="submit"
									disabled={!changed}
									onClick={() => onSave()}
								>
									{t("Save")}
								</Button>
								<Button
									title={t("Cancel")}
									color="primary"
									outline
									type="button"
									onClick={() => onCancel()}
								>
									{t("Cancel")}
								</Button>
							</ButtonGroup>
						: <ButtonWithAuthz
							title={t("CustomDataContainer|Edit data")}
							color="primary"
							outline
							onClick={() => setEdit(true)}
							resource="authz:tenant:admin"
							resources={resources}
							hideOnUnauthorizedAccess={true}
						>
							{t("Edit")}
						</ButtonWithAuthz>
						}
					</CardFooter>
				</>
			}
		</Card>
	)
}
