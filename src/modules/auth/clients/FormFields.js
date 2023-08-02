import React, { useEffect, useState } from 'react';
import {
	FormGroup, Input, Label, Button,
	InputGroupAddon, InputGroup, FormFeedback
} from 'reactstrap';
import { useTranslation } from 'react-i18next';
import { Controller } from "react-hook-form";

// The usual text input
export function TextInput ({ name, register, errors, labelName, disabled, required }) {
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
				validation: value => value === undefined || (/^[a-z0-9\.-]{1,61}\.[a-z]{2,}$|^$/).test(value) || t("ClientFormField|Invalid format for cookie_domain"),
			}
		}
	);

	const isInvalid = (name) => {
		if (((name === "preferred_client_id") || (name === "cookie_domain")) && (errors[name] != undefined)) {
			return true;
		}
		return false;
	}
	return (
		<FormGroup key={name}>
			{labelName && <Label for={name} title={(name === "client_name") && t("ClientFormField|Required field")}>{labelName}</Label>}
			<Input
				id={name}
				name={name}
				type="text"
				disabled={disabled}
				required={required}
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
export function SelectInput ({ name, register, valueList, labelName, disabled }) {
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
				disabled={disabled}
				onChange={reg.onChange}
				onBlur={reg.onBlur}
				innerRef={reg.ref}
			>
				{valueList && valueList.map((optionItem, idx) => (
					<option key={idx} value={optionItem}>{optionItem}</option>
				))}
			</Input>
		</FormGroup>
	)
}

// The usual single checkbox input
export function SingleCheckboxInput ({ name, register, checkboxText, disabled }) {
	const { t } = useTranslation();
	const reg = register(name);

	return (
		<FormGroup check>
			<Label for={name}>
				<Input
					id={name}
					name={name}
					type="checkbox"
					onChange={reg.onChange}
					onBlur={reg.onBlur}
					innerRef={reg.ref}
					disabled={disabled}
				/>{' '}
				{checkboxText}
			</Label>
		</FormGroup>
	)
}

// The usual select input
export function RadioInput ({ name, valueList, register, labelName, disabled, editing }) {

	return (
		<FormGroup key={name}>
			{labelName && <Label for={name} title={name}>{labelName}</Label>}
			<div title={name}>
				{valueList && valueList?.map((item, key) => (
					<InputGroup key={key}>
						<input
							id={item}
							name={item}
							title={item}
							type="radio"
							className="ml-0 client-radio-input"
							value={item}
							disabled={disabled}
							{...register(name)}
							defaultChecked={!editing && (key == 0)}
						/>
						<div className="ml-4">{item}</div>
					</InputGroup>
				))}
			</div>
		</FormGroup>
	)
}

// Dynamic form that can be added and removed. You can to control your fields.
export function URiInput ({name, errors, append, remove, fields, labelName, reg, invalid, register, templateName, disabled}) {
	const { t } = useTranslation();

	return (
		<FormGroup>
			<Label title={t("ClientFormField|Required field")} for={name}>{labelName}</Label>
			<InputGroup>
				<Input
					id={name}
					name={name}
					type="text"
					onChange={reg.onChange}
					onBlur={reg.onBlur}
					innerRef={reg.ref}
					invalid={invalid}
					disabled={disabled}
				/>
				<InputGroupAddon addonType="append" className="ml-0">
					<Button
						outline
						color="primary"
						size="sm"
						title={t("ClientFormField|Add new input")}
						onClick={() => append({ value: ""})}
					>
						<span className="at-plus-circle" />
					</Button>
				</InputGroupAddon>
				{errors && errors[name] && <FormFeedback>{errors[name].message}</FormFeedback>}
			</InputGroup>
			{fields && fields.map((item, i) => (
				<InputTemplate
					key={item.id}
					index={i}
					errors={errors}
					remove={remove}
					register={register}
					name={templateName}
					disabled={disabled}
				/>
			))}
		</FormGroup>
	)
}

function InputTemplate({index, errors, remove, register, name, disabled}){
	const { t } = useTranslation();
	const regMail = register(`${name}[${index}].value`, {
		validate: {
			emptyInput: value => (value && value.toString().length !== 0) || t("ClientFormField|URI can't be empty"),
			urlHash: value => (value && new URL(value).hash.length === 0) || t("ClientFormField|URL hash has to be empty"),
		}
	});
	return(
		<InputGroup className="pt-1">
			<Input
				type="text"
				id={`${name}[${index}].value`}
				name={`${name}[${index}].value`}
				disabled={disabled}
				onChange={regMail.onChange}
				onBlur={regMail.onBlur}
				innerRef={regMail.ref}
				invalid={errors[name]?.[index]?.value && true}
			/>
			<InputGroupAddon addonType="append" className="ml-0">
				<Button outline color="danger" size="sm" onClick={() => remove(`${index}`)} title={t("ClientFormField|Remove input")}>
					<span className="at-minus-circle" />
				</Button>
			</InputGroupAddon>
			{errors && errors[name]?.[index]?.value && <FormFeedback>{errors[name]?.[index]?.value.message}</FormFeedback>}
		</InputGroup>
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
										<i className="at-xmark-circle"></i>
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
export function MultiCheckbox ({ name, valueList, assignValue, setValue, labelName, disabled }) {
	const [addedOption, setAddedOption] = useState([]); // Items show in the input value
	const [checkedState, setCheckedState] = useState(new Array(valueList?.length).fill(false));

	const { t } = useTranslation();

	useEffect(() => {
		if (name === "response_types") {
			setValue("response_types", addedOption);
		} else if (name === "grant_types") {
			setValue("grant_types", addedOption);
		}
	}, [addedOption]);

	useEffect(() => {
		if (assignValue != undefined) {
			if (name === "response_types") {
				setValue("response_types", assignValue[name]);
			} else if (name === "grant_types") {
				setValue("grant_types", assignValue[name]);
			}
			valueList && valueList?.map((item, idx) => {
				if (assignValue[name]?.includes(item)) {
					const updatedCheckedState = checkedState.map((item, index) =>
						index === idx ? !item : item
					);
					setCheckedState(updatedCheckedState)
				}
			})
		}

	}, [assignValue]);

	// Adds new item to multiselect
	const addItem = (item) => {
		setAddedOption([...addedOption, item]);
	}

	// Remove item from multiselect
	const removeItem = (item) => {
		setAddedOption(addedOption.filter((e) => e !== item));
	}

	const handleChange = (e, item, position) => {
		if (e.target.checked) {
			addItem(item);
		} else {
			removeItem(item);
		}

		const updatedCheckedState = checkedState.map((item, index) =>
			index === position ? !item : item
		);
		setCheckedState(updatedCheckedState);
	};

	return (
		<FormGroup key={name}>
			{labelName && <Label for={name} title={name}>{labelName}</Label>}
			<div title={name}>
				{valueList && valueList?.map((item, key) => (
					<InputGroup key={key}>
						<div className="ml-4">{item}</div>
						<Input
							id={item}
							name={item}
							title={item}
							type="checkbox"
							className="ml-0"
							value={item}
							disabled={disabled}
							checked={checkedState[key]}
							onChange={() => handleChange(event, item, key)}
						/>
					</InputGroup>
				))}
			</div>
		</FormGroup>
	)
};
