import { Alert, Avatar, Box, Button, Card, CardActions, CardContent, Grid, IconButton, LinearProgress, Modal, Snackbar, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { ListAlt, Sync } from '@mui/icons-material';
import { useUsersAndVillages } from '../../context/usersAndVillages.context';
import CustomAppBar from '../../components/AppBarComponent/CustomAppBar';
import NewEmailInput from './NewEmailInput';
import { getStorage, ref as storageRef, deleteObject } from "firebase/storage";
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { secondaryAuth } from '../../misc/firebase';

function ManageIncharges(props) {
    const { users } = useUsersAndVillages();

    const [filteredInchargeList, setFilteredInchargeList] = useState([]);

    const [isEmailPopupOpen, setIsEmailPopupOpen] = useState(false);
    const [isSnackbarOpen, setIsSnackbarOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState({
        msgType: null,
        msgContent: null
    });

    const [currentSelectedInchage, setCurrentSelectedInchage] = useState({
        email: null,
        index: null
    });

    const assignFilteredInchargeListData = () => {
        const tempInchargeList = [];
        const arrFilteredInchargeList = users;
        // Assign data in proper structure
        arrFilteredInchargeList.forEach(({ key, email, fullName, mappedVillGroupKey, profilePicThumbnail }) => {
            tempInchargeList.push({
                key,
                email,
                fullName,
                mappedVillGroupKey,
                profilePicThumbnail,
                'errorMessage': null,
                'progressStatus': {
                    emailChangeInProgress: false
                }
            });
        });

        // Short By Name
        tempInchargeList.sort((a, b) => {
            return (function (a, b) {
                a = a.toLowerCase();
                b = b.toLowerCase();
                return (a < b) ? -1 : (a > b) ? 1 : 0;
            })(a.fullName, b.fullName);
        });

        setFilteredInchargeList(tempInchargeList);
    }

    useEffect(() => {
        assignFilteredInchargeListData();
        // eslint-disable-next-line
    }, [users])


    // ===============

    const setErrorMessage = (index, errorMessage = null) => {
        setFilteredInchargeList((prevArray) => {
            prevArray[index].errorMessage = errorMessage;
            return [...prevArray];
        });
    }

    const onShowSnackbarMessage = (msgType, msgContent) => {
        setIsSnackbarOpen(true);
        setAlertMessage({ msgType, msgContent });
    }

    const onHideSnackbarMessage = () => {
        setIsSnackbarOpen(false);
    }

    const createAndAssignNewEmail = async (selectedInchargeindex, newEmail, password) => {
        //const newRegisteredUser = await createUserWithEmailAndPassword(secondaryAuth, newEmail, password);
        const { uid, email } = { uid: 'qqq', email: 'www@ww.ww' } //newRegisteredUser.user;

        // Get Previous User Info
        const previousUser = filteredInchargeList[selectedInchargeindex];

        const updates = {};
        /**
         * -----------------------------
         * - SAVE DATA OF New USER -
         * -----------------------------
         */
        const newUserProfileInfo = {
            email,
            fullName: "Unknown",
            mappedVillGroupKey: previousUser.mappedVillGroupKey,
        };

        updates['/users/' + uid] = newUserProfileInfo;

        /**
         * -----------------------------
         * - Delete DATA OF Old USER -
         * -----------------------------
         */

        // Delete Profile Pic First
        const storage = getStorage();

        // Create a reference to the file to delete
        const userProfileRef = storageRef(storage, '/ProfilePictures/users/' + previousUser.key);

        debugger;

        try {
            const x = await deleteObject(userProfileRef);
            console.log(x);
        } catch (error) {
            console.log(error);
        }

        const previousUserProfileInfo = {
            email: previousUser.email,
            fullName: previousUser.fullName,
            mappedVillGroupKey: previousUser.mappedVillGroupKey,
        };

        updates['/inactiveUsers/' + previousUser.key] = previousUserProfileInfo;
        updates['/users/' + previousUser.key] = null;

    }

    const handleCloseEmailInputPopup = (newEmail, password) => {
        const selectedInchargeindex = currentSelectedInchage.index;

        setCurrentSelectedInchage({
            email: null,
            index: null
        });

        setIsEmailPopupOpen(false);

        createAndAssignNewEmail(selectedInchargeindex, newEmail, password);
    }

    const showEmailInputPopup = (inchargeData, index) => {
        setCurrentSelectedInchage({
            email: inchargeData.email,
            index
        });

        setIsEmailPopupOpen(true);
    }

    return (
        <>
            <CustomAppBar props={props} />

            <Grid container spacing={{ xs: 1, sm: 2, md: 3 }} columns={{ xs: 2, sm: 3, md: 4, lg: 5 }}>
                {Array.from(filteredInchargeList).map((inchargeData, index) => (
                    <Grid item xs={1} sm={1} md={1} lg={1} key={index}>
                        <Card sx={{ minHeight: 120 }}>
                            <CardContent >
                                <Box display="flex" flex='1'>
                                    <Avatar
                                        alt={String(inchargeData.fullName).toUpperCase()}
                                        src={inchargeData.profilePicThumbnail ? inchargeData.profilePicThumbnail : 'null'}
                                    />
                                    <Box flex='1'></Box>

                                    <IconButton>
                                        <ListAlt color='info' />
                                    </IconButton>

                                </Box>

                                <Box>
                                    <Typography color={'#415468'} fontWeight='bold'>
                                        {inchargeData.fullName}
                                    </Typography>
                                    <Typography color={'#415468'}>
                                        {inchargeData.email}
                                    </Typography>
                                </Box>
                                <Box height='2rem'>
                                    <Typography sx={{ color: '#d81f10', fontSize: 13 }}>
                                        {inchargeData.errorMessage}
                                    </Typography>
                                </Box>
                            </CardContent>
                            <CardActions>
                                <Box display="flex" flex='1' >
                                    <Box
                                        display="flex"
                                        flexDirection={'column'}
                                        flex='1'
                                        justifyContent={'center'}
                                    >
                                        {
                                            inchargeData.progressStatus.emailChangeInProgress
                                                ? <LinearProgress />
                                                : <Button
                                                    onClick={() => { showEmailInputPopup(inchargeData, index) }}
                                                    variant="outlined"
                                                    component="label"
                                                >
                                                    <Typography fontSize={12} >Assign New Email </Typography> <Sync />
                                                </Button>
                                        }
                                    </Box>
                                </Box>
                            </CardActions>
                        </Card >
                    </Grid>
                ))
                }
            </Grid >

            <Modal open={isEmailPopupOpen} onClose={null}>
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: { xs: '95%', sm: '400px' },
                        transform: 'translate(-50%, -50%)',
                        bgcolor: 'background.paper',
                    }}
                >
                    <NewEmailInput
                        handleCloseEmailInputPopup={handleCloseEmailInputPopup}
                        currentSelectedInchage={currentSelectedInchage}
                        onShowSnackbarMessage={onShowSnackbarMessage}
                    />
                </Box>
            </Modal>

            <Snackbar
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center'
                }}
                open={isSnackbarOpen}
                onClose={onHideSnackbarMessage}
            >
                <Alert severity={alertMessage.msgType}>{alertMessage.msgContent}</Alert>
            </Snackbar>
        </>
    );
}

export default ManageIncharges;
