import React, { useEffect, useState } from 'react';
import {
	FormGroup, Input, Label, Button,
	InputGroupAddon, InputGroup, FormFeedback
} from 'reactstrap';
import { useTranslation } from 'react-i18next';
import { Controller } from "react-hook-form";

// The usual text input
export function TextInput ({ name, register, errors, labelName, disabled, title }) {
	const { t } = useTranslation();
	const reg = register(
		name,
		(name === "preferred_client_id") ? {
			validate: {
				validation: value => (/^[-_a-zA-Z0-9]{8,64}$|^$/).test(value) || t("ClientFormField|Invalid format, input should have minimum of 8 characters"),
			}
		}
		:
		(name === "cookie_domain") && {
			validate: {
				validation: value => (/^[a-z0-9\.-]{1,61}\.[a-z]{2,}$|^$/).test(value) || t("ClientFormField|Invalid format for cookie_domain"),
			}
		}
	);
	const isInvalid = (name) => {
		if (name === "preferred_client_id" && (errors[name] != undefined)) {
			return true;
		} else if (name === "cookie_domain" && (errors[name] != undefined)) {
			return true;
		} else {
			return false;
		}
	}
	return (
		<FormGroup key={name}>
			{labelName && <Label for={name} title={title && title}>{labelName}{title && "*"}</Label>}
			<Input
				id={name}
				name={name}
				type="text"
				disabled={disabled}
				required={title ? true : false}
				onChange={reg.onChange}
				onBlur={reg.onBlur}
				innerRef={reg.ref}
				invalid={isInvalid(name)}
			/>
			{name === "preferred_client_id" && (errors.preferred_client_id != undefined && <FormFeedback>{errors.preferred_client_id?.message}</FormFeedback>)}
			{name === "cookie_domain" && (errors?.cookie_domain && <FormFeedback>{errors.cookie_domain?.message}</FormFeedback>)}
		</FormGroup>
	)
}

// The usual select input
export function SelectInput ({ name, register, value, labelName }) {
	const { t } = useTranslation();
	const reg = register(name);

	return (
		<FormGroup key={name}>
			{labelName &&
				<Label for={name} title={name}>{labelName}</Label>}
			<Input
				id={name}
				name={name}
				title={name}
				type="select"
				onChange={reg.onChange}
				onBlur={reg.onBlur}
				innerRef={reg.ref}
			>
				{value && value.map((optionItem, idx) => (
					<option key={idx} value={optionItem}>{optionItem}</option>
				))}
			</Input>
		</FormGroup>
	)
}

// Dynamic form that can be added and removed. You can to control your fields.
export function URiInput ({ name, control, errors, append, remove, fields, labelName, disabled, title }) {
	const { t } = useTranslation();

	return (
		<FormGroup title={name}>
			{(labelName && name) &&
				<Label for={name} title={title ? title : name}>{labelName}{title && "*"}</Label>}
				{fields && fields.map((item, idx) => {
					return (
						<InputGroup key={item.id} className="mb-1">
							<Controller
								render={({field}) => <Input {...field} required={true} invalid={errors.redirect_uris?.[idx]?.text} disabled={disabled}/>}
								name={`redirect_uris[${idx}].text`}
								control={control}
								rules={{
									validate: {
										emptyInput: value => (value && value.toString().length !== 0) || t("ClientFormField|URI can't be empty"),
										startWith: value => (/(https:\/\/)/).test(value) || t("ClientFormField|URI have to start with https"),
										urlHash: value => (value && new URL(value).hash.length === 0) || t("ClientFormField|URL hash have to be empty"),
									}
								}}
							/>
							<InputGroupAddon addonType="append" style={{marginLeft: "0"}}>
								<Button
									outline
									size="sm"
									color="danger"
									title={t("ClientFormField|Remove input")}
									disabled={(fields.length  === 1) && true}
									onClick={() => remove(idx)}
								>
									<span className="cil-minus" />
								</Button>
							</InputGroupAddon>
							{errors.redirect_uris?.[idx]?.text && <FormFeedback>{errors.redirect_uris?.[idx]?.text?.message}</FormFeedback>}
						</InputGroup>
					);
				})}
			<Button
				outline
				size="sm"
				color="primary"
				className="mt-2"
				title={t("ClientFormField|Add new input")}
				type="button"
				onClick={() => {
					append({ text: "" });
				}}
			>
				<span className="cil-plus" />
			</Button>
		</FormGroup>
	)
}

// TODO: do not delete, it will be a new component
// A field that allows you to select several options from a dropdown list
export function Multiselect ({ name, value, control, setValue, labelName }) {
	const [dropdown, setDropdown] = useState(false); // State showing if dropdown is open or closed
	const [selectedItems, setSelected] = useState([]); // Contains selected items
	const [option, setOption] = useState(value); // Items shown in the dropdown
	const [addedOption, setAddedOption] = useState([]); // Items show in the input value

	const { t } = useTranslation();

	useEffect(() => {
		if (name === "response_types") {
			setValue("response_types", addedOption);
		} else if (name === "grant_types") {
			setValue("grant_types", addedOption);
		}
	}, [addedOption]);

	const toogleDropdown = () => {
		setDropdown(!dropdown)
	};

	// Adds new item to multiselect
	const addItem = (item) => {
		setAddedOption([...addedOption, item]);
		setSelected(selectedItems.concat(item));
		setDropdown(false);
		setOption(option.filter(p => p !== item));
	}

	// Remove item from multiselect
	const removeItem = (item) => {
		setAddedOption(addedOption.filter((e) => e !== item));
		setSelected(selectedItems.filter((e) => e !== item));
		setOption(option.concat(item));
	}

	return (
		<FormGroup key={name}>
			{labelName && <Label for={name}>{labelName}</Label>}
			<Controller
				name={name}
				control={control}
				render={({ field}) => {
					return (
						<>
							<div className="d-flex position-relative multiselect-input-wrapper" onClick={toogleDropdown}>
								<Input {...field} readOnly autoComplete="off" placeholder={t("ClientFormField|Choose an option")} value={addedOption}/>
								<button className="cursor-pointer custom-dropdown-btn"></button>
							</div>
							{selectedItems && selectedItems.map((optionItem, index) => (
								<span className="mt-1 pr-2 d-inline-block  selected-item" key={index}>
									<span>{ optionItem }</span>
									<span onClick={() => removeItem(optionItem)}>
										<i className="cil-x"></i>
									</span>
								</span>
							))}
						</>
					);
				}}
			/>
			{dropdown  ?
				<div id="dropdown">
					<div>
						{option && option.map((item, key) => (
							<div key={key} onClick={() => addItem(item)}>
								<div className="p-2">{ item }</div>
							</div>
						))}
					</div>
				</div>
				:
				null
			}
		</FormGroup>
	)
};

// Checkbox groups which store the selected values in a single array
export function MultiCheckbox ({ name, value, setValue, labelName }) {
	const [addedOption, setAddedOption] = useState([]); // Items show in the input value

	const { t } = useTranslation();

	useEffect(() => {
		if (name === "response_types") {
			setValue("response_types", addedOption);
		} else if (name === "grant_types") {
			setValue("grant_types", addedOption);
		}
	}, [addedOption]);


	// Adds new item to multiselect
	const addItem = (item) => {
		setAddedOption([...addedOption, item]);
	}

	// Remove item from multiselect
	const removeItem = (item) => {
		setAddedOption(addedOption.filter((e) => e !== item));
	}

	const handleChange = (e, item) => {
		if (e.target.checked) {
			addItem(item);
		} else {
			removeItem(item);
		}
	};

	return (
		<FormGroup key={name}>
			{labelName && <Label for={name} title={name}>{labelName}</Label>}
			<div title={name}>
				{value && value.map((item, key) => (
					<InputGroup key={key}>
						<div className="ml-4">{item}</div>
						<Input
							className="ml-0"
							id={item}
							name={item}
							title={item}
							type="checkbox"
							onChange={() => handleChange(event, item)}
						/>
					</InputGroup>
				))}
			</div>
		</FormGroup>
	)
};
