import { Alert, Avatar, Box, Button, Card, CardActions, CardContent, Container, Drawer, Grid, IconButton, LinearProgress, List, ListItem, ListItemButton, ListItemText, Modal, Snackbar, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Email, ListAlt, PermIdentity, Sync } from '@mui/icons-material';
import { useUsersAndVillages } from '../../context/usersAndVillages.context';
import CustomAppBar from '../../components/AppBarComponent/CustomAppBar';
import NewEmailInput from './NewEmailInput';
import { getStorage, ref as storageRef, deleteObject } from "firebase/storage";
import { createUserWithEmailAndPassword } from 'firebase/auth';
import FullScreenMessageText from '../../components/FullScreenMessageText';
import { db, secondaryAuth } from '../../misc/firebase';
import { ref, update } from 'firebase/database';
import InchargeCardGrid from './InchargeCardGrid';

const getFormattedDrawerProperty = (isDrawerOpen = false, inchargeEmail = null, inchargeName = null, assignedVillageList = []) =>
    ({ isDrawerOpen, inchargeEmail, inchargeName, assignedVillageList });

function ManageIncharges(props) {
    const { users, villages } = useUsersAndVillages();

    const [filteredInchargeList, setFilteredInchargeList] = useState([]);
    const [isDataLoading, setIsDataLoading] = useState(false);

    const [villageListDrawer, setVillageListDrawer] = useState(getFormattedDrawerProperty())
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
        setIsDataLoading(false);
    }

    useEffect(() => {
        assignFilteredInchargeListData();
        // eslint-disable-next-line
    }, [users])


    // ===============
    const toggleProgressIndicator = (index, progressType, condition) => {
        setFilteredInchargeList((prevArray) => {
            switch (progressType) {
                case 'EMAIL_CHANGE':
                    prevArray[index].progressStatus.emailChangeInProgress = condition;
                    break;
                default:
                    break;
            }
            return [...prevArray]
        });
    }

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

    const createAndAssignNewEmail = async (selectedIndex, newEmail, password) => {
        // VALIDATION
        if (filteredInchargeList.find(({ email }) => email === newEmail)) {
            toggleProgressIndicator(selectedIndex, 'EMAIL_CHANGE', false);
            setErrorMessage(selectedIndex, `Email ( ${newEmail} ) Already Registered!`);
            return;
        }

        // Get Previous User Info
        const previousUser = filteredInchargeList[selectedIndex];


        // *** Start Execution *** //
        toggleProgressIndicator(selectedIndex, 'EMAIL_CHANGE', true);

        /**
         * --- Delete Profile Pic And ThumbNail Of Previous User
         */
        const imageName = ["_profilePicThumbnail.jpg", "_profilePicFull.jpg"];
        let i = imageName.length;

        while (i--) {
            const { isSuccessful, errorMessage } = await handleDeleteProfilePic('/ProfilePictures/users/' + previousUser.key + imageName[i]);
            if (!isSuccessful) {
                toggleProgressIndicator(selectedIndex, 'EMAIL_CHANGE', false);
                setErrorMessage(selectedIndex, errorMessage);
                return;
            }
        }

        /**
         * --- SignUp new User Account 
         */
        let newRegisteredUser;

        try {
            newRegisteredUser = await createUserWithEmailAndPassword(secondaryAuth, newEmail, password);
        } catch (error) {
            toggleProgressIndicator(selectedIndex, 'EMAIL_CHANGE', false);
            setErrorMessage(selectedIndex, `Email ( ${newEmail} ) ${error.code}`);
            return;
        }

        const { uid, email } = newRegisteredUser.user;

        const updates = {};
        /**
         * --- Save Data Of New User
         */
        const newUserProfileInfo = {
            email,
            fullName: "Unknown",
            mappedVillGroupKey: previousUser.mappedVillGroupKey,
        };

        updates['/users/' + uid] = newUserProfileInfo;

        /**
         * --- Delete Data Of Old User
         */

        const previousUserProfileInfo = {
            email: previousUser.email,
            fullName: previousUser.fullName,
            mappedVillGroupKey: previousUser.mappedVillGroupKey,
        };

        updates['/inactiveUsers/' + previousUser.key] = previousUserProfileInfo;
        updates['/users/' + previousUser.key] = null;

        // <==== | Update All Data In Single Shot | ====>
        update(ref(db), updates).then(x => {
            toggleProgressIndicator(selectedIndex, 'EMAIL_CHANGE', false);
        }).catch((error) => {
            toggleProgressIndicator(selectedIndex, 'EMAIL_CHANGE', false);
        });
    }

    const showEmailInputPopup = (inchargeData, index) => {
        setCurrentSelectedInchage({
            email: inchargeData.email,
            index
        });

        setIsEmailPopupOpen(true);
    }

    const hideEmailInputPopup = () => {
        setCurrentSelectedInchage({
            email: null,
            index: null
        });

        setIsEmailPopupOpen(false);
    }

    const handleSubmitEmailPopup = (newEmail, password) => {
        const selectedInchargeindex = currentSelectedInchage.index;

        hideEmailInputPopup();
        createAndAssignNewEmail(selectedInchargeindex, newEmail, password);
    }

    const displayVillageListDrawer = ({ email, fullName, mappedVillGroupKey }) => {
        const allVillages = villages.filter(el => el.villGroupKey === mappedVillGroupKey);
        setVillageListDrawer(getFormattedDrawerProperty(true, email, fullName, allVillages));
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
                !isDataLoading && Array.from(filteredInchargeList).length <= 0 &&
                <FullScreenMessageText >
                    No Data
                </FullScreenMessageText>
            }

            <Grid container spacing={{ xs: 1, sm: 2, md: 3 }} columns={{ xs: 2, sm: 3, md: 4, lg: 5 }}>
                {Array.from(filteredInchargeList).map((inchargeData, index) => (
                    <InchargeCardGrid
                        inchargeData={inchargeData}
                        index={index}
                        showEmailInputPopup={() => { showEmailInputPopup(inchargeData, index) }}
                        displayVillageListDrawer={() => { displayVillageListDrawer(inchargeData) }}
                    />
                ))
                }
            </Grid >

            {/* Assigned Incharge Display Drawer  */}
            <Drawer
                anchor={'bottom'}
                open={villageListDrawer.isDrawerOpen}
                onClose={() => setVillageListDrawer(getFormattedDrawerProperty())}
            >
                <Container maxWidth="xs">
                    <Box height={window.innerHeight * 6 / 10}>
                        <Box display={'flex'} flexDirection={'column'} mb={10} mt={2}>
                            <Box display={'flex'} flexDirection={'row'} >
                                <PermIdentity sx={{ color: '#133168' }} />
                                <Typography color='#133168' ml={2}>
                                    {villageListDrawer.inchargeName}
                                </Typography>
                            </Box>
                            <Box display={'flex'} flexDirection={'row'}>
                                <Email sx={{ color: '#133168' }} />
                                <Typography color='#133168' ml={2}>
                                    {villageListDrawer.inchargeEmail}
                                </Typography>
                            </Box>

                            <Typography color='#8896a4' mt={3} fontSize={17} fontWeight='bold'>
                                Assigned Villages
                            </Typography>

                            <List>
                                {villageListDrawer.assignedVillageList.map(({ villageName, key }) => (
                                    <ListItem key={key} disablePadding>
                                        <ListItemButton>
                                            <ListItemText primary={villageName} />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>


                        </Box>
                    </Box>
                </Container>
            </Drawer>

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
                        hideEmailInputPopup={hideEmailInputPopup}
                        handleCloseEmailInputPopup={handleSubmitEmailPopup}
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
