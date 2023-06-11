import { useState } from 'react';
import { child, get, ref } from 'firebase/database';
import { db } from '../../misc/firebase';
import TabPanel from './TabPanel';
import GeneralMembersView from './GeneralMembersView';
import PartyMembersView from './PartyMembersView';
import { Box, Button, Container, Drawer, IconButton, List, ListItem, ListItemText, Typography, } from '@mui/material';
import { Call, ContentCopy, Download, Message, Share, WhatsApp } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import CustomAppBar from '../../components/AppBarComponent/CustomAppBar';
import FullScreenMessageText from '../../components/FullScreenMessageText';
import { Parser } from '@json2csv/plainjs';

const csvDownlodHelper = (text, fileType, fileName) => {
    var blob = new Blob([text], { type: fileType });
    var a = document.createElement('a');
    a.download = fileName;
    a.href = URL.createObjectURL(blob);
    a.dataset.downloadurl = [fileType, a.download, a.href].join(':');
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
}


function Dashboard(props) {
    const [partyPeoples, setPartyPeoples] = useState(null);
    const [selectedTabBarIndex, setSelectedTabBarIndex] = useState(0);

    const [isVillageSelected, setIsVillageSelected] = useState(false);
    const [selectedVillageName, setSelectedVillageName] = useState(null);
    const [selectedVillageKey, setSelectedVillageKey] = useState(null);

    const [isLoadingPartyPeoples, setIsLoadingPartyPeoples] = useState(null);

    const [contactDrawerInfo, setContactDrawerInfo] = useState({
        isOpen: false,
        fullName: '',
        post: '',
        youthGeneral: '',
        phoneNumbers: [],
        villageName: ''
    });

    const openContactDrawer = (profileContactData) => {
        setContactDrawerInfo({
            isOpen: true,
            fullName: profileContactData.fullName,
            post: profileContactData.post,
            youthGeneral: profileContactData.youthGeneral,
            phoneNumbers: profileContactData.phoneNumbers,
            villageName: selectedVillageName,
        });
    }

    const closeContactDrawer = () => {
        setContactDrawerInfo({
            isOpen: false,
            fullName: '',
            post: '',
            youthGeneral: '',
            phoneNumbers: [],
            villageName: ''
        });
    }

    const handleContactAction = (contactType, contactNumber) => {
        let isCordovaExitst

        try {
            isCordovaExitst = !!window.cordova;
        } catch {
            isCordovaExitst = false
        }

        switch (contactType) {
            case 'ACTION_SMS':
                isCordovaExitst
                    ? window.plugins.socialsharing.shareViaSMS("", contactNumber, function (msg) { }, function (msg) { })
                    : (() => null)() //navigate('sms:' + contactNumber);
                break;
            case 'ACTION_WHATSAPP':
                isCordovaExitst
                    ? window.plugins.socialsharing.shareViaWhatsAppToPhone(contactNumber, "", null, null, function () { })
                    : (() => null)() //navigate('sms:' + contactNumber);
                break;
            default:
                break;
        }
    }

    const handleShareContact = (shareType, { fullName, phoneNumbers, youthGeneral, post, villageName }) => {

        let stringContactInfo = `Name :\n${fullName}\n\nVillage :\n${villageName}\n\nPost :\n${post}\n\n${youthGeneral}\n\nPhone:\n`
        phoneNumbers.forEach(phoneNumber => {
            stringContactInfo += String(phoneNumber) + '\n'
        });

        switch (shareType) {
            case 'CLIPBOARD':
                navigator.clipboard.writeText(stringContactInfo);
                break;
            case 'SOCIAL':
                if (!window.plugins) break;
                window.plugins.socialsharing.shareWithOptions({ message: stringContactInfo }, null, null);
                break;
        }
    }

    const handleVillageSelectionChange = (selectedVillage = null) => {
        setPartyPeoples(null); // Reset old data before new loading

        if (selectedVillage === null || !selectedVillage.mappedPartyPeoplesKey) {
            setSelectedVillageName(null);
            setSelectedVillageKey(null);
            fetchVillagePartyPeoples(null);
            return;
        }

        const { villageName, mappedPartyPeoplesKey, villageKey } = selectedVillage;
        setSelectedVillageName(villageName);
        setSelectedVillageKey(villageKey);
        fetchVillagePartyPeoples(mappedPartyPeoplesKey);
    };

    // ===< Business Logic [Start] >===

    // Fetch Village Party Peoples  
    const fetchVillagePartyPeoples = (partyPeopleKey) => {
        setIsLoadingPartyPeoples(true) // Start Processing

        get(child(ref(db), "partyPeoples/" + partyPeopleKey)).then((snapshot) => {
            const partyPeoples = snapshot.val();

            if (partyPeoples) {
                setPartyPeoples({ partyPeopleKey, ...partyPeoples });
            } else {
                setPartyPeoples(null);
            }

            setIsLoadingPartyPeoples(false) // Start Processing
        });

    }
    // ===< Business Logic [End] >===

    //====< MISC >====
    const downloadCSVFile = () => {
        const csvJSONData = [];
        // Preape JSON without Array FOR CSV Conversion
        (partyPeoples.partyMembers.concat(partyPeoples.generalMembers)).forEach(
            ({ age, fullName, mobileNumber, post, youthGeneral }) => {

                const mobileNumberObj = {
                    'Mobile Number1': '',
                    'Mobile Number2': '',
                    'Mobile Number3': '',
                    'Mobile Number4': '',
                    'Mobile Number5': ''
                }
                const mobNumbObjKeys = Object.keys(mobileNumberObj);

                mobileNumber.forEach((el, index) => {
                    mobileNumberObj[mobNumbObjKeys[index]] = el
                });

                csvJSONData.push({
                    'Post': post ? post : 'Members',
                    'Name': fullName,
                    'Age': age,
                    ...mobileNumberObj,
                    'GENERAL/YOUTH': youthGeneral
                });
            });

        // Add Village Name In First Row Only 
        csvJSONData[0] = { 'Village Name': selectedVillageName, ...csvJSONData[0] }

        //===== Parse Json to CSV ======//
        try {
            const parser = new Parser();
            const csv = parser.parse(csvJSONData);

            const fileSuffix = new Date(Date.now()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
            const fileName = selectedVillageName + '-' + fileSuffix + '.csv';
            csvDownlodHelper(csv, 'text/plain', fileName)
        } catch (err) {
            console.error(err);
        }
    }

    return (
        <>
            <CustomAppBar
                rightSideComponent="InchargeAndVillageSelector"
                props={props}
                setIsVillageSelected={setIsVillageSelected}
                handleVillageSelectionChange={handleVillageSelectionChange}
                tabSelectionBarVisible
                selectedTabBarIndex={selectedTabBarIndex}
                setSelectedTabBarIndex={setSelectedTabBarIndex}
            />

            {
                isLoadingPartyPeoples &&
                <FullScreenMessageText showLoader>
                    Loading
                </FullScreenMessageText>
            }

            {
                !isLoadingPartyPeoples && !isVillageSelected
                    ?
                    <FullScreenMessageText >
                        Please Select Any Village
                    </FullScreenMessageText>
                    :
                    <>
                        <TabPanel value={selectedTabBarIndex} index={0}>
                            {(partyPeoples && partyPeoples.partyMembers.length > 0)
                                ? <PartyMembersView
                                    selectedVillageKey={selectedVillageKey}
                                    partyPeopleKey={partyPeoples.partyPeopleKey}
                                    members={partyPeoples.partyMembers}
                                    openContactDrawer={openContactDrawer}
                                    setPartyPeoples={setPartyPeoples}
                                />
                                : <FullScreenMessageText >  No Data </FullScreenMessageText>
                            }
                        </TabPanel>

                        <TabPanel value={selectedTabBarIndex} index={1}>
                            {(partyPeoples && partyPeoples.generalMembers.length > 0)
                                ? <GeneralMembersView
                                    members={partyPeoples.generalMembers}
                                    openContactDrawer={openContactDrawer} />
                                : <FullScreenMessageText >  No Data </FullScreenMessageText>
                            }
                        </TabPanel>

                        {
                            partyPeoples &&
                            <Box
                                mt={2}
                                display="grid"
                                justifyContent="center"
                                alignItems="center"
                                minWidth="100%"
                            >
                                <Button onClick={downloadCSVFile}>Downnload <Download /></Button>
                            </Box>
                        }
                    </>
            }

            <Drawer
                anchor={'bottom'}
                open={contactDrawerInfo.isOpen}
                onClose={closeContactDrawer}
            >
                <Container maxWidth="xs">
                    <Box>
                        <Box display={'flex'} flexDirection={'row'} ml={1} mr={2} mt={2} mb={2}>
                            <Typography fontSize={24}>
                                {contactDrawerInfo.fullName}
                            </Typography>
                            <Box flex={1}></Box>
                            <IconButton onClick={() => handleShareContact('CLIPBOARD', contactDrawerInfo)} sx={{ color: '#4365a3', mr: 1 }}  >
                                <ContentCopy />
                            </IconButton>
                            <IconButton onClick={() => handleShareContact('SOCIAL', contactDrawerInfo)} sx={{ color: '#4365a3' }} >
                                <Share />
                            </IconButton>
                        </Box>

                        <List >
                            {contactDrawerInfo.phoneNumbers.map((phone, index) =>
                                <ListItem
                                    key={index}
                                    sx={{ pt: 1.5, pb: 1.5 }}
                                    secondaryAction={
                                        <>
                                            <IconButton component={Link} to={"tel:" + phone} sx={{ color: '#03a995' }} >
                                                <Call />
                                            </IconButton>
                                            <IconButton onClick={() => handleContactAction('ACTION_SMS', phone)} sx={{ color: '#1282a7' }} >
                                                <Message />
                                            </IconButton>
                                            <IconButton onClick={() => handleContactAction('ACTION_WHATSAPP', phone)} sx={{ color: '#0d7b0d' }} >
                                                <WhatsApp />
                                            </IconButton>
                                        </>
                                    }
                                >
                                    <ListItemText primary={phone} />
                                </ListItem>
                            )}
                        </List>
                    </Box>
                </Container>
            </Drawer>
        </>
    );
}

export default Dashboard;
