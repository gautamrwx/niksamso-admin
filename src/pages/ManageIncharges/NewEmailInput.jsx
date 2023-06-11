import { Box, Button, FormControl, InputLabel, OutlinedInput, Typography } from '@mui/material';
import { useState } from 'react';
import { emailValidator } from '../../misc/emailPasswordValidator';

const newPassword = '123456';

function NewEmailInput({
    onShowSnackbarMessage,
    currentSelectedInchage,
    handleCloseEmailInputPopup,
    hideEmailInputPopup
}) {
    const [inputNewEmail, setInputNewEmail] = useState({
        newEmail: ''
    });

    const [inputEmailValidation, setInputEmailValidation] = useState({
        isValidNewEmail: true,
    });

    const handleInputEmailChange = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setInputNewEmail(values => ({ ...values, [name]: String(value).toLowerCase() }))
    }

    const handleNewPasswordSubmit = (event) => {
        event.preventDefault();

        if (!emailValidator(inputNewEmail.newEmail)) {
            setInputEmailValidation(values => ({ ...values, isValidNewEmail: false }));
            onShowSnackbarMessage('error', 'Invalid Email');
            return;
        }

        handleCloseEmailInputPopup(inputNewEmail.newEmail, newPassword);
    }

    return (
        <Box component="form" onSubmit={handleNewPasswordSubmit} noValidate sx={{ m: 2 }}>
            <FormControl
                margin='normal'
                fullWidth
                disabled
                variant="outlined">
                <InputLabel>Old Email</InputLabel>
                <OutlinedInput
                    inputProps={{ maxLength: 12 }}
                    value={currentSelectedInchage.email}
                    label="Old Email"
                />
            </FormControl>

            <FormControl
                margin='normal'
                fullWidth
                required
                error={!inputEmailValidation.isValidNewEmail}
                onChange={handleInputEmailChange}
                variant="outlined">
                <InputLabel htmlFor="outlined-adornment-newEmail">New Email</InputLabel>
                <OutlinedInput
                    inputProps={{ maxLength: 50 }}
                    name="newEmail"
                    value={inputNewEmail.newEmail}
                    label="New Password"
                />
            </FormControl>

            <FormControl
                margin='normal'
                fullWidth
                disabled
                variant="outlined">
                <InputLabel>New Password</InputLabel>
                <OutlinedInput
                    inputProps={{ maxLength: 12 }}
                    value={newPassword}
                    label="New Password"
                />
            </FormControl>

            <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{
                    mt: 3, pt: 3 / 2, pb: 3 / 2, "&.Mui-disabled": {
                        background: "transparent"
                    }
                }}
            >
                Create Account
            </Button>

            <Button
                onClick={hideEmailInputPopup}
                variant="outlined"
                fullWidth
                sx={{
                    mt: 3, pt: 3 / 2, pb: 3 / 2, "&.Mui-disabled": {
                        background: "transparent"
                    }
                }}
            >
                Cancel
            </Button>
        </Box>
    );
}

export default NewEmailInput;