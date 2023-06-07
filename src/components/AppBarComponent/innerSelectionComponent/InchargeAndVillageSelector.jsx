import { Autocomplete, Box, Popper, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { useUsersAndVillages } from '../../../context/usersAndVillages.context';

export default function InchargeAndVillageSelector({
    handleVillageSelectionChange,
    setIsVillageSelected
}) {
    const { users, villages } = useUsersAndVillages();

    const [userDropdownListOption, setUserDropdownListOption] = useState([]);
    const [villageDropdownListOption, setVillageDropdownListOption] = useState([]);
    const [selectedDDUser, setSelectedDDUser] = useState(null);
    const [selectedDDVillage, setSelectedDDVillage] = useState(null);

    const setVillListDropDown = (mappedVillGroupKey = null) => {
        const filteredVillages =
            mappedVillGroupKey
                ? villages.filter(x => x.villGroupKey === mappedVillGroupKey)
                : villages;

        const villDropdownListOption = filteredVillages.map((option) => {
            const firstLetter = option.villageName[0].toUpperCase();
            return {
                firstLetter: /[0-9]/.test(firstLetter) ? '0-9' : firstLetter,
                ...option,
            };
        })

        setVillageDropdownListOption(villDropdownListOption);

        // Select Last Selected Item
        if (selectedDDVillage) {
            const lastSelectedItemIndex = villDropdownListOption.findIndex(village => village.villageKey === selectedDDVillage.villageKey);

            if (lastSelectedItemIndex !== -1) {
                setSelectedDDVillage(villDropdownListOption[lastSelectedItemIndex]);
            } else {
                setSelectedDDVillage(null);
                handleVillageSelectionChange(null);
                setIsVillageSelected(false);
            }
        }
    }

    const onUserSelectionChange = (event, value, reason) => {
        switch (reason) {
            case 'clear':
                setSelectedDDUser(null);
                setVillListDropDown();
                break;
            case 'selectOption':
                setSelectedDDUser(value);
                setVillListDropDown(value.mappedVillGroupKey);
                break;
            default:
                break;
        }
    }

    const onVillageSelectionChange = (event, value, reason) => {
        switch (reason) {
            case 'selectOption':
                setSelectedDDVillage(value);
                handleVillageSelectionChange(value);
                setIsVillageSelected(true);
                break;
            default:
                break;
        }
    }

    useEffect(() => {
        // Set Users Data in dropDown 
        setUserDropdownListOption(users.map((option) => {
            const firstLetter = option.email[0].toUpperCase();
            return {
                firstLetter: /[0-9]/.test(firstLetter) ? '0-9' : firstLetter,
                ...option,
            };
        }));

        // Set Villages Data in Dropdown
        setVillageDropdownListOption(villages.map((option) => {
            const firstLetter = option.villageName[0].toUpperCase();
            return {
                firstLetter: /[0-9]/.test(firstLetter) ? '0-9' : firstLetter,
                ...option,
            };
        }));

    }, [users, villages]);


    /**----- UI Component [Start]---- */
    const styles = (theme) => ({
        popper: {
            width: "fit-content"
        }
    });

    const PopperMy = function (props) {
        return <Popper {...props} style={styles.popper} placement="bottom-start" />;
    };
    /**----- UI Component [END]---- */

    return (
        <Box display='flex' flexDirection='row' sx={{ width: { xs: 1, sm: 6 / 11, md: 450, lg: 500 }, ml: 1 }}>
            <Autocomplete
                fullWidth
                PopperComponent={PopperMy}
                size='small'
                className='selectItemOnAppBar'
                blurOnSelect={true}
                value={selectedDDUser}
                onChange={onUserSelectionChange}
                options={userDropdownListOption.sort((a, b) => -b.firstLetter.localeCompare(a.firstLetter))}
                groupBy={(option) => option.firstLetter}
                getOptionLabel={(option) => option.email}
                renderInput={(params) => <TextField {...params} label="Incharge" />}
            />

            <Autocomplete
                fullWidth
                size='small'
                PopperComponent={PopperMy}
                sx={{ ml: 1 }}
                className='selectItemOnAppBar'
                value={selectedDDVillage}
                disableClearable
                onChange={onVillageSelectionChange}
                options={villageDropdownListOption.sort((a, b) => -b.firstLetter.localeCompare(a.firstLetter))}
                groupBy={(option) => option.firstLetter}
                getOptionLabel={(option) => option.villageName}
                renderInput={(params) => <TextField {...params} label="Villages" />}
            />
        </Box >
    )
}