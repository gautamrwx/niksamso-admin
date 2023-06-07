import { Alert, Box, Button, Card, CardActions, CardContent, Grid, LinearProgress, Modal, Snackbar, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { DeleteForever } from '@mui/icons-material';
import CustomAppBar from '../../components/AppBarComponent/CustomAppBar';
import { getStorage, ref as storageRef, deleteObject } from "firebase/storage";
import { db } from '../../misc/firebase';
import { child, get, ref } from 'firebase/database';
import InactiveInchargeDeleteConfirmation from './InactiveInchargeDeleteConfirmation';

function ManageIncharges(props) {

    const [inActiveUsers, setInActiveUsers] = useState([]);

    // Fetch users on useeffect
    useEffect(() => {
        get(child(ref(db), "inactiveUsers")).then((snapshot) => {
            const data = snapshot.val();

            if (data) {
                const inactiveUserList = [];
                Object.keys(data).map(x => inactiveUserList.push({ key: x, ...data[x] }));

                // Assign data in proper structure
                const structuredInactiveUserList = [];
                inactiveUserList.forEach((inactUser) => {
                    structuredInactiveUserList.push({
                        'errorMessage': null,
                        'progressStatus': {
                            deleteInProgress: false
                        },
                        ...inactUser
                    });
                });

                // Short By Name
                structuredInactiveUserList.sort((a, b) => {
                    return (function (a, b) {
                        a = a.toLowerCase();
                        b = b.toLowerCase();
                        return (a < b) ? -1 : (a > b) ? 1 : 0;
                    })(a.fullName, b.fullName);
                });

                setInActiveUsers(structuredInactiveUserList);
            }
        }).catch((e) => { });
    }, []);


    const [isConfirmationPopupOpen, setIsConfirmationPopupOpen] = useState(false);
    const [isSnackbarOpen, setIsSnackbarOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState({
        msgType: null,
        msgContent: null
    });
    const [currentSelectedData, setCurrentSelectedData] = useState({
        email: null,
        index: null
    });

    const toggleProgressIndicator = (index, progressType, condition) => {
        setInActiveUsers((prevArray) => {
            switch (progressType) {
                case 'DELETE':
                    prevArray[index].progressStatus.deleteInProgress = condition;
                    break;
                default:
                    break;
            }
            return [...prevArray]
        });
    }

    const setErrorMessage = (index, errorMessage = null) => {
        setInActiveUsers((prevArray) => {
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

    const handleDeleteProfilePic = async (filePath) => {
        const storage = getStorage();
        const userProfileRef = storageRef(storage, filePath);

        const jsonResponseStructure = (isSuccessful, errorMessage) => ({ isSuccessful, errorCode: errorMessage })

        return new Promise((resolve, _) => {
            deleteObject(userProfileRef).then(() => {
                resolve(jsonResponseStructure(true, ''));
            }).catch((err) => {
                if (err.code === 'storage/object-not-found')
                    resolve(jsonResponseStructure(true, ''));
                else
                    resolve(jsonResponseStructure(false, 'Problem Occoured While Deleting Profile Pic'));
            });
        })
    }

    const performDeleteUserAction = (selectedIndex, password) => {

    }

    const showDeleteConfirmationPopup = (inactiveUser, index) => {
        setCurrentSelectedData({
            email: inactiveUser.email,
            index
        });

        setIsConfirmationPopupOpen(true);
    }

    const hideDeleteConfirmationPopup = () => {
        setCurrentSelectedData({
            email: null,
            index: null
        });

        setIsConfirmationPopupOpen(false);
    }

    const handlePasswordSubmit = (password) => {
        const selectedIndex = currentSelectedData.index;

        hideDeleteConfirmationPopup();
        performDeleteUserAction(selectedIndex, password);
    }

    return (
        <>
            <CustomAppBar props={props} />

            <Grid container spacing={{ xs: 1, sm: 2, md: 3 }} columns={{ xs: 2, sm: 3, md: 4, lg: 5 }}>
                {Array.from(inActiveUsers).map((inactiveUser, index) => (
                    <Grid item xs={1} sm={1} md={1} lg={1} key={index}>
                        <Card sx={{ minHeight: 120 }}>
                            <CardContent >
                                <Box>
                                    <Typography color={'#415468'} fontWeight='bold'>
                                        {inactiveUser.fullName}
                                    </Typography>
                                    <Typography color={'#415468'}>
                                        {inactiveUser.email}
                                    </Typography>
                                </Box>
                                <Box height='2rem'>
                                    <Typography sx={{ color: '#d81f10', fontSize: 13 }}>
                                        {inactiveUser.errorMessage}
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
                                            inactiveUser.progressStatus.deleteInProgress
                                                ? <LinearProgress />
                                                : <Button
                                                    color='error'
                                                    onClick={() => { showDeleteConfirmationPopup(inactiveUser, index) }}
                                                    variant="outlined"
                                                    component="label"
                                                >
                                                    <DeleteForever color='error' />
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

            <Modal open={isConfirmationPopupOpen} onClose={null}>
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
                    <InactiveInchargeDeleteConfirmation
                    handlePasswordSubmit={handlePasswordSubmit}
                        currentSelectedData={currentSelectedData}
                        onShowSnackbarMessage={onShowSnackbarMessage}
                        hideDeleteConfirmationPopup={hideDeleteConfirmationPopup}
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
