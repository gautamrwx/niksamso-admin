import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Box, Button, FormControl, IconButton, InputAdornment, InputLabel, OutlinedInput } from '@mui/material';
import { useState } from 'react';
import { passwordValidator } from '../../misc/emailPasswordValidator';

function InactiveInchargeDeleteConfirmation({
    onShowSnackbarMessage,
    currentSelectedData,
    hideDeleteConfirmationPopup,
    handlePasswordSubmit
}) {
    const [password, setPassword] = useState('');
    const [isValidPassword, setIsValidPassword] = useState(true);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const handleInputChange = (event) => {
        setPassword(event.target.value);
    }

    const handleDeleteConfirmationSubmit = (event) => {
        event.preventDefault();

        // reset validation By Default
        setIsValidPassword(true);


        // Validate New Password & Confirm Password
        const { isValidPassword, invalidReason } = passwordValidator(password);

        if (!isValidPassword) {
            setIsValidPassword(false);
            onShowSnackbarMessage('error', invalidReason);
            return;
        }

        //
        handlePasswordSubmit(password);
    }

    return (
        <Box component="form" onSubmit={handleDeleteConfirmationSubmit} noValidate sx={{ m: 2 }}>
            <FormControl
                margin='normal'
                fullWidth
                disabled
                variant="outlined">
                <InputLabel>Email</InputLabel>
                <OutlinedInput
                    inputProps={{ maxLength: 12 }}
                    value={currentSelectedData.email}
                    label="Email"
                />
            </FormControl>

            <FormControl
                margin='normal'
                fullWidth
                required
                error={!isValidPassword}
                onChange={handleInputChange}
                variant="outlined">
                <InputLabel htmlFor="outlined-adornment-password">Old Password</InputLabel>
                <OutlinedInput
                    inputProps={{ maxLength: 12 }}
                    name="password"
                    value={password}
                    type={isPasswordVisible ? 'text' : 'password'}
                    endAdornment={
                        <InputAdornment position="end">
                            <IconButton
                                aria-label="toggle password visibility"
                                onClick={() => { setIsPasswordVisible(!isPasswordVisible) }}
                                edge="end"
                            >
                                {isPasswordVisible ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                        </InputAdornment>
                    }
                    label="Old Password"
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
                Delete
            </Button>

            <Button
                onClick={hideDeleteConfirmationPopup}
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

export default InactiveInchargeDeleteConfirmation;