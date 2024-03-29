import { Alert, Box, Button, CircularProgress, Container, Modal, Paper, Tooltip, Typography, tooltipClasses } from '@mui/material';
import CustomAppBar from '../../components/AppBarComponent/CustomAppBar';
import { CheckCircleOutline, ErrorOutline, HourglassBottomRounded, Upload, QuestionMark } from '@mui/icons-material';
import csv from 'csvtojson';
import { useState } from 'react';
import { useUsersAndVillages } from '../../context/usersAndVillages.context';
import { db, secondaryAuth } from '../../misc/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import styled from '@emotion/styled';
import { child, push, ref, update } from 'firebase/database';
import inchargeCsvUplDemo from '../../images/inchargeCsvUplDemo.jpg'
import { emailValidator } from '../../misc/emailPasswordValidator';

// check duplicate emails and villages
const findDuplicateArrElement = arry => {
    // Find all duplicates
    const allDuplicates = arry.filter((item, index) => arry.indexOf(item) !== index);

    // Remove Multiple Occourence
    const minifiedDuplicates = allDuplicates.filter((item, index) => allDuplicates.indexOf(item) === index);

    return minifiedDuplicates;
}

function CreateIncharges(props) {
    const { users, villages } = useUsersAndVillages();

    const [alertMessage, SetAlertMessage] = useState([]);
    const [isVisibleUploadModal, SetIsVisibleUploadModal] = useState(false);
    const [isVisibleHelpModal, SetIsVisibleHelpModal] = useState(false);
    const [preparedUploadData, setPreparedUploadData] = useState([]);
    const [btnClosePopupDisabled, setBtnClosePopupDisabled] = useState(false);
    const [btnSubmitPopupDisabled, setBtnSubmitPopupDisabled] = useState(false);

    const validateInputCSV = (inputCSVLines) => {
        inputCSVLines = inputCSVLines.slice(1); // Delete First Line

        // check num of row
        if (inputCSVLines.length < 1) {
            return ['Uploaded file doea not have any data'];
        }

        // check num of cols
        else if (inputCSVLines[0].length < 2) {
            return ['Uploaded file is not valid'];
        }

        /**
         * -------------
         * VALIDATION
         * -------------
         */

        // Store all Email  and Village Name in seperate array 
        const allEmails = [];
        const allVillages = [];

        inputCSVLines.forEach(lineItem => {
            if (lineItem[0] !== '') allEmails.push(String(lineItem[0]).toLowerCase());
            if (lineItem[1] !== '') allVillages.push(lineItem[1]);
        });

        // Check Invalid Emails
        let invalidEmails = '';
        allEmails.forEach(email => {
            if (!emailValidator(email)) {
                invalidEmails += email + ', ';
            }
        });


        // Check Duplicate && Exiting Emails.
        let existingEmails = '';
        users.forEach(user => {
            if (allEmails.includes(user.email)) {
                existingEmails += user.email + ' ,'
            }
        });

        let duplicateEmails = '';
        findDuplicateArrElement(allEmails).forEach(email => {
            duplicateEmails += email + ', ';
        });

        // Check Duplicate && Exiting Villages. 
        let existingVillages = '';
        villages.forEach(village => {
            if (allVillages.includes(village.villageName)) {
                existingVillages += village.villageName + ', '
            }
        });

        let duplicateVillages = '';
        findDuplicateArrElement(allVillages).forEach(villName => {
            duplicateVillages += villName + ', ';
        });

        let finalMessage = [];
        if (invalidEmails !== '') finalMessage.push(`Invalid email entries for ( ${invalidEmails.slice(0, -2)} ).`);
        if (duplicateEmails !== '') finalMessage.push(`Multiple email entries for ( ${duplicateEmails.slice(0, -2)} ).`);
        if (existingEmails !== '') finalMessage.push(`Email ( ${existingEmails.slice(0, -2)} ) already exist.`);
        if (duplicateVillages !== '') finalMessage.push(`Multiple village entries for ( ${duplicateVillages.slice(0, -2)} ).`);
        if (existingVillages !== '') finalMessage.push(`Village ( ${existingVillages.slice(0, -2)} ) already exist.`);

        return finalMessage;
    }

    const getPreapredData = (inputCSVLines) => {
        inputCSVLines = inputCSVLines.slice(1); // Delete First Line

        const userVillageMappings = [];
        let index = -1;

        inputCSVLines.forEach(lineItem => {
            if (lineItem[0] !== '') {
                index++
                userVillageMappings[index] = {
                    email: String(lineItem[0]).toLowerCase(),
                    villages: [],
                    progressStatus: '',
                    toolTipMessge: ''
                };
            }

            if (lineItem[1] !== '') {
                userVillageMappings[index]['villages'].push(lineItem[1]);
            }
        });

        return userVillageMappings;
    }

    const startDataUploading = async () => {
        // +Status+ Set Pending Status For All Data
        setPreparedUploadData(prevArray => {
            prevArray.map(x => x.progressStatus = 'PENDING')
            return [...prevArray]
        });

        // Disable CloseBTN And SubmitBTN
        setBtnClosePopupDisabled(true);
        setBtnSubmitPopupDisabled(true);

        // Execute Operation by picking data one by one
        const dataSize = preparedUploadData.length;
        for (let i = 0; i < dataSize; i++) {
            const newUserData = preparedUploadData[i];

            // +Status+
            setPreparedUploadData(prevArray => {
                prevArray[i].progressStatus = 'INPROGRESS';
                return [...prevArray];
            });

            try {
                const newRegisteredUser = await createUserWithEmailAndPassword(secondaryAuth, newUserData.email, '123456');

                /**
                 * -----------------------------
                 * - SAVE DATA OF CURRENT USER -
                 * -----------------------------
                 */

                const updates = {};
                const { uid, email } = newRegisteredUser.user;

                // 1. Assign [Villages] Inside New {VillageGroup}
                const newVillageGroupKey = push(child(ref(db), 'villageGroupList')).key;
                newUserData.villages.forEach(villageName => {
                    const newVillageKey = push(child(ref(db), 'villageGroupList/' + newVillageGroupKey)).key;
                    updates['/villageGroupList/' + newVillageGroupKey + '/' + newVillageKey] = {
                        villageName,
                        mappedPartyPeoplesKey: ''
                    };
                });

                // 2. Assign User Profile Information
                const newUserProfileInfo = {
                    email,
                    fullName: "Unknown",
                    profilePic: "",
                    mappedVillGroupKey: newVillageGroupKey,
                };
                updates['/users/' + uid] = newUserProfileInfo;

                // <==== | Update All Data In Single Shot | ====>
                update(ref(db), updates).then(x => {
                    // +Status+
                    setPreparedUploadData(prevArray => {
                        prevArray[i].progressStatus = 'SUCCESS';
                        prevArray[i].toolTipMessge = '';
                        return [...prevArray];
                    });
                    (i === dataSize - 1) && setBtnClosePopupDisabled(false);
                }).catch((error) => {
                    setPreparedUploadData(prevArray => {
                        prevArray[i].progressStatus = 'ERROR';
                        prevArray[i].toolTipMessge = 'User Created But Failed To Update Database';
                        return [...prevArray];
                    });
                    (i === dataSize - 1) && setBtnClosePopupDisabled(false);
                });
            } catch (event) {
                // +Status+
                setPreparedUploadData(prevArray => {
                    prevArray[i].progressStatus = 'ERROR';
                    prevArray[i].toolTipMessge = event.code;
                    return [...prevArray];
                });
                (i === dataSize - 1) && setBtnClosePopupDisabled(false);
            }
        }
    }

    const handleNewUsersCSVUpload = ({ target }) => {
        const fr = new FileReader();

        fr.onload = function () {
            csv({ noheader: true, output: "csv", })
                .fromString(fr.result)
                .then((inputCSVLines) => {
                    const arrValidationMessges = validateInputCSV(inputCSVLines);
                    // 1. Check for validation 
                    if (arrValidationMessges.length > 0) {
                        const alertMessages = [];

                        arrValidationMessges.forEach(validationMsgs => {
                            alertMessages.push({
                                messageText: validationMsgs, type: 'error'
                            })
                        });

                        SetAlertMessage(alertMessages);
                    }
                    // 1. Execute After Validation Successful 
                    else {
                        SetAlertMessage([]);
                        SetIsVisibleUploadModal(true);
                        setPreparedUploadData(getPreapredData(inputCSVLines));
                    }
                });
        };

        if (target.files.length > 0)
            fr.readAsText(target.files[0]);
    };

    const HtmlTooltip = styled(({ className, ...props }) => (
        <Tooltip {...props} classes={{ popper: className }} />
    ))(() => ({
        [`& .${tooltipClasses.tooltip}`]: {
            backgroundColor: '#f5f5f9',
            color: 'rgba(0, 0, 0, 0.87)',
            maxWidth: 220,
            fontSize: 12,
            border: '1px solid #dadde9',
        },
    }));

    return (
        <>
            <CustomAppBar props={props} />

            <Container component="main" maxWidth="xs" sx={{ px: 0 }}>
                <Box
                    sx={{
                        borderBottom: '0.2rem solid #1976d2',
                        mt: 10,
                        mb: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        py: 2
                    }}
                >
                    <Box>
                        <Button
                            variant="contained"
                            component="label"
                        >
                            <Typography>Upload CSV</Typography>
                            <Upload />
                            <input
                                onClick={(e) => { e.target.value = '' }}
                                onChange={handleNewUsersCSVUpload}
                                type="file"
                                accept=".csv"
                                hidden
                            />
                        </Button>

                        <Button
                            variant="outlined"
                            component="label"
                            sx={{
                                ml: 2
                            }}
                            onClick={() => SetIsVisibleHelpModal(true)}
                        >
                            <Typography display={{ xs: 'none', sm: 'block' }}>File Format</Typography>
                            <QuestionMark />
                        </Button>
                    </Box>
                </Box>


                <Box>
                    <Modal open={isVisibleUploadModal} onClose={null}>
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
                            <Paper style={{ maxHeight: 400, overflow: 'auto', boxShadow: 'none' }}>
                                <Box sx={{ m: 2 }}>
                                    {preparedUploadData.map(currUploadData =>
                                        <Box key={currUploadData.email} display={'flex'} sx={{ pt: 2, p: 1 }}>
                                            <Typography flex={1}>
                                                {currUploadData.email}
                                            </Typography>

                                            {currUploadData.progressStatus === 'PENDING' &&
                                                <HourglassBottomRounded sx={{ color: '#1976d2' }} />
                                            }
                                            {currUploadData.progressStatus === 'INPROGRESS' &&
                                                <CircularProgress size={25} />
                                            }
                                            {currUploadData.progressStatus === 'SUCCESS' &&
                                                <CheckCircleOutline color='success' />
                                            }
                                            {currUploadData.progressStatus === 'ERROR' &&
                                                <HtmlTooltip
                                                    title={<Typography color="inherit">{currUploadData.toolTipMessge}</Typography>}
                                                >
                                                    <ErrorOutline color='error' />
                                                </HtmlTooltip>
                                            }
                                        </Box>
                                    )}
                                </Box>
                            </Paper>

                            <Box paddingY={1} paddingX={0.5} display='flex'>
                                <Button
                                    disabled={btnClosePopupDisabled}
                                    onClick={() => SetIsVisibleUploadModal(false)}
                                    color='error'
                                    fullWidth
                                    type="submit"
                                    variant="outlined"
                                >
                                    Close
                                </Button>
                                <Button
                                    disabled={btnSubmitPopupDisabled}
                                    onClick={startDataUploading}
                                    color='success'
                                    sx={{ ml: 1 }}
                                    fullWidth
                                    type="submit"
                                    variant="contained"
                                >
                                    Submit
                                </Button>
                            </Box>
                        </Box>
                    </Modal>

                    <Modal open={isVisibleHelpModal} onClose={null}>
                        <Box
                            sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                width: { xs: '95%', sm: '60%' },
                                transform: 'translate(-50%, -50%)',
                                bgcolor: 'background.paper',
                            }}
                        >
                            <Paper style={{ maxHeight: 400, overflow: 'auto', boxShadow: 'none' }}>

                                <Typography sx={{
                                    fontWeight: 'bold',
                                    margin: '11px 22px',
                                    fontSize: 20
                                }} >
                                    demo-file.csv
                                </Typography>
                                <Typography sx={{
                                    fontWeight: 'bold',
                                    margin: '11px 22px',
                                    fontSize: 14,
                                    color: 'red'
                                }} >
                                    * Upload file in .CSV format only
                                </Typography>

                                <Box
                                    component="img"
                                    src={inchargeCsvUplDemo}
                                />

                            </Paper>

                            <Box paddingY={1} paddingX={0.5} display='flex'>
                                <Button
                                    onClick={() => SetIsVisibleHelpModal(false)}
                                    color='error'
                                    fullWidth
                                    type="submit"
                                    variant="outlined"
                                >
                                    Close
                                </Button>
                            </Box>
                        </Box>
                    </Modal>

                    {
                        alertMessage.map(msg =>
                            <Alert severity={msg.type}>{msg.messageText}</Alert>
                        )
                    }
                </Box>
            </Container>
        </>
    );
}

export default CreateIncharges;
