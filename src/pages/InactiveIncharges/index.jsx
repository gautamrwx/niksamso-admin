import { Alert, Box, Button, Card, CardActions, CardContent, Grid, LinearProgress, Modal, Snackbar, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { DeleteForever } from '@mui/icons-material';
import CustomAppBar from '../../components/AppBarComponent/CustomAppBar';
import FullScreenMessageText from '../../components/FullScreenMessageText';
import { db } from '../../misc/firebase';
import { child, get, ref } from 'firebase/database';
import InactiveInchargeDeleteConfirmation from './InactiveInchargeDeleteConfirmation';
import { secondaryAuth } from '../../misc/firebase';
import { deleteUser, fetchSignInMethodsForEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth';

function ManageIncharges(props) {

    const [inActiveUsers, setInActiveUsers] = useState([]);
    const [isDataLoading, setIsDataLoading] = useState(false);

    // Fetch users on useeffect
    useEffect(() => {
        setIsDataLoading(true);
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
            setIsDataLoading(false);
        }).catch((e) => {
            setIsDataLoading(false);
        });
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

    const deleteRecordFromDatabase = (key, index) => {
        setInActiveUsers(prev => prev.filter((_, i) => i !== index));
        console.log('Dele Ok , Del From FromDB');
    }

    const performDeleteUserAction = (selectedIndex, password) => {
        const { email, key } = inActiveUsers[selectedIndex];

        signInWithEmailAndPassword(secondaryAuth, email, password)
            .then((user) => {
                const userToDelete = secondaryAuth.currentUser;

                deleteUser(userToDelete).then(() => {
                    deleteRecordFromDatabase(key, selectedIndex);
                    toggleProgressIndicator(selectedIndex, 'DELETE', false);
                    signOut(secondaryAuth);
                }).catch((error) => {
                    setErrorMessage(selectedIndex, 'Failed To Delete, Do It Manually');
                    toggleProgressIndicator(selectedIndex, 'DELETE', false);
                });
            }).catch((error) => {
                if (error.code === 'auth/user-not-found') {
                    deleteRecordFromDatabase(key, selectedIndex);
                } else if (error.code === "auth/wrong-password") {
                    setErrorMessage(selectedIndex, 'Invalid Password');
                } else {
                    setErrorMessage(selectedIndex, 'Unkown Error Occoured');
                }

                toggleProgressIndicator(selectedIndex, 'DELETE', false);
            })
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

    const handleDeleteInactiveUser = async (inactiveUser, index) => {
        // Reset Previous Message And Start Processing 
        toggleProgressIndicator(index, 'DELETE', true);
        setErrorMessage(index, '');

        // if user not exist in auth , Delte that directly
        try {
            const methods = await fetchSignInMethodsForEmail(secondaryAuth, inactiveUser.email);
            if (methods.length === 0) {
                deleteRecordFromDatabase(inactiveUser.key, index);
                return;
            }
        } catch (error) {
            setErrorMessage(index, 'Failed To Delete, Do It Manually');
            toggleProgressIndicator(index, 'DELETE', false);
            return;
        }

        showDeleteConfirmationPopup(inactiveUser, index)
    }

    return (
        <>
            <CustomAppBar props={props} />

            {
                isDataLoading &&
                <FullScreenMessageText showLoader>
                    Loading
                </FullScreenMessageText>
            }

            {
                !isDataLoading && Array.from(inActiveUsers).length <= 0 &&
                <FullScreenMessageText >
                    Empty
                </FullScreenMessageText>
            }

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
                                                    onClick={() => { handleDeleteInactiveUser(inactiveUser, index) }}
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
