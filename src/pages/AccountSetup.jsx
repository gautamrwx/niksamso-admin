import { useState } from 'react';
import { ref, update, child, get } from 'firebase/database';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { Alert, Box, Button, CircularProgress, Container, FormControl, IconButton, InputAdornment, InputLabel, OutlinedInput, Snackbar, TextField, Typography } from '@mui/material';
import { db, auth } from '../misc/firebase';
import md5 from 'md5';
import logo from '../images/logo.png'
import { PersonAddAlt, Visibility, VisibilityOff } from '@mui/icons-material';
import { emailValidator, passwordValidator } from '../misc/emailPasswordValidator';

function AccountSetup() {
  const [userFormData, setUserFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [userInputValidation, setuserInputValidation] = useState({
    isCorrectEmail: true,
    isCorrectPassword: true,
    isCorrectConfirmPassword: true
  });
  const [isSignUpInProgress, setIsSignUpInProgress] = useState(false);
  const [isSnackbarOpen, setIsSnackbarOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isPassWordVisible, setIsPasswordVisible] = useState(false);
  const [isCnfPassWordVisible, setIsCnfPasswordVisible] = useState(false);

  const handleUserInputChange = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setUserFormData(values => ({ ...values, [name]: value }))
  }

  const onShowSnackbarMessage = (message) => {
    setIsSnackbarOpen(true);
    setAlertMessage(message);
  }

  const onHideSnackbarMessage = () => {
    setIsSnackbarOpen(false);
  }

  const onUserSignUp = (event) => {
    event.preventDefault();

    // Reset Prevoius Error Highlights And Process Next
    setuserInputValidation({
      isCorrectEmail: true,
      isCorrectPassword: true,
      isCorrectConfirmPassword: true
    });

    // Validate Input Email
    const isEmailValid = emailValidator(userFormData.email);
    if (!isEmailValid) {
      setuserInputValidation(values => ({ ...values, isCorrectEmail: false }));
      onShowSnackbarMessage('Email Is Invalid');
      return;
    }

    // Validate Input Password & Confirm Password
    const { isValidPassword, invalidReason } = passwordValidator(userFormData.password);
    if (!isValidPassword) {
      setuserInputValidation(values => ({ ...values, isCorrectPassword: false }));
      onShowSnackbarMessage(invalidReason);
      return;
    }
    else if (userFormData.password !== userFormData.confirmPassword) {
      setuserInputValidation(values => ({ ...values, isCorrectConfirmPassword: false }));
      onShowSnackbarMessage('Password Do Not Match');
      return;
    }

    // == proceed to login after successful validation == //
    setIsSignUpInProgress(true);

    // Step 2. Check If Current Admin is in Unregisted List
    let unRegisteredUserKey = md5(userFormData.email); // We using Email(md5) as primary key of Firebase 

    get(child(ref(db), 'nonRegistedAdmins/' + unRegisteredUserKey)).then((snapshot) => {
      const data = snapshot.val();
      if (data) {
        // ---- Sign Up for A New User ---- //
        createUserWithEmailAndPassword(auth, userFormData.email, userFormData.password)
          .then((userCredential) => {
            // Signed in 
            const user = userCredential.user;

            //-----------------------------------
            // Assign Admin Data to Database
            //-----------------------------------
            initializeAdmin(unRegisteredUserKey, user);

            // On Succesfull Sign In User Will Directly Go To Dashboard
          })
          .catch((error) => {
            setIsSignUpInProgress(false);
            onShowSnackbarMessage(error.code);
            setuserInputValidation(values => ({ ...values, isCorrectEmail: false }));
          });
      }
      else {
        setIsSignUpInProgress(false);
        onShowSnackbarMessage('This Email Is Not Assigned In Database');
        setuserInputValidation(values => ({ ...values, isCorrectEmail: false }));
      }
    });
  }

  const initializeAdmin = (unRegisteredUserKey, user) => {
    const updates = {}

    // 1. Assign User Profile Information
    const profileInfo = {
      fullName: "Unknown",
      profilePic: "",
    };
    updates['/admins/' + user.uid] = profileInfo

    // 2. Admin Has been Regitered , Now Delete Unregistered Admin from Database 
    updates['/nonRegistedAdmins/' + unRegisteredUserKey] = null;

    // <==== | Update All Data In Single Shot | ====>
    update(ref(db), updates).then(x => {
      // Do Nothing
    }).catch((error) => {
      alert("Error !! Admin Created Without Database");
    });
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Box
          width={150}
          component="img"
          src={logo} />

        <Typography sx={{ color: '#1976d2' }}>
          Admin
        </Typography>

        <Box component="form" onSubmit={onUserSignUp} noValidate sx={{ mt: 1 }}>
          <TextField
            margin='normal'
            error={!userInputValidation.isCorrectEmail}
            fullWidth
            required
            label="Email Address"
            type='email'
            name="email"
            value={userFormData.email || ""}
            onChange={handleUserInputChange}
          />

          <FormControl
            margin='normal'
            fullWidth
            required
            error={!userInputValidation.isCorrectPassword}
            onChange={handleUserInputChange}
            variant="outlined">
            <InputLabel htmlFor="outlined-adornment-password">Password</InputLabel>
            <OutlinedInput
              inputProps={{ maxLength: 12 }}
              name="password"
              value={userFormData.password || ""}
              type={isPassWordVisible ? 'text' : 'password'}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => { setIsPasswordVisible(!isPassWordVisible) }}
                    edge="end"
                  >
                    {isPassWordVisible ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              }
              label="Password"
            />
          </FormControl>

          <FormControl
            margin='normal'
            fullWidth
            required
            error={!userInputValidation.isCorrectConfirmPassword}
            onChange={handleUserInputChange}
            variant="outlined">
            <InputLabel htmlFor="outlined-adornment-confirm-password">Confirm Password</InputLabel>
            <OutlinedInput
              inputProps={{ maxLength: 12 }}
              name="confirmPassword"
              value={userFormData.confirmPassword || ""}
              type={isCnfPassWordVisible ? 'text' : 'password'}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => { setIsCnfPasswordVisible(!isCnfPassWordVisible) }}
                    edge="end"
                  >
                    {isCnfPassWordVisible ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              }
              label="Confirm Password"
            />
          </FormControl>

          <Button
            type="submit"
            variant="contained"
            startIcon={!isSignUpInProgress && <PersonAddAlt />}
            fullWidth
            sx={{
              mt: 3, pt: 3 / 2, pb: 3 / 2, "&.Mui-disabled": {
                background: "transparent"
              }
            }}
            disabled={isSignUpInProgress}
          >
            {!isSignUpInProgress ? 'Setup New Account' : <CircularProgress disableShrink />}
          </Button>
        </Box>

        <Snackbar
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center'
          }}
          open={isSnackbarOpen}
          onClose={onHideSnackbarMessage}
        >
          <Alert severity="error">{alertMessage}</Alert>
        </Snackbar>
      </Box>
    </Container>
  );
}

export default AccountSetup;
