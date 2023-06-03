import { Autocomplete, Box, Popper, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { useUsersAndVillages } from '../../../context/usersAndVillages.context';

export default function InchargeSelector({
    selectedDDUser,
    setSelectedDDUser
}) {

    const { users } = useUsersAndVillages();

    const onUserSelectionChange = (event, value, reason) => {
        switch (reason) {
            case 'clear':
                setSelectedDDUser(null);
                break;
            case 'selectOption':
                setSelectedDDUser(value);
                break;
            default:
                break;
        }
    }

    // User Dropdown Data Configuration
    const [userDropdownListOption, setUserDropdownListOption] = useState([]);

    useEffect(() => {
        // Set Users Data in dropDown 
        setUserDropdownListOption(users.map((option) => {
            const firstLetter = option.email[0].toUpperCase();
            return {
                firstLetter: /[0-9]/.test(firstLetter) ? '0-9' : firstLetter,
                ...option,
            };
        }));

    }, [users]);


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
        <Box display='flex' flexDirection='row' sx={{ width: { xs: 1, sm: 2 / 5, md: 300, lg: 350 }, ml: 1 }}>
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
        </Box >
    )
}