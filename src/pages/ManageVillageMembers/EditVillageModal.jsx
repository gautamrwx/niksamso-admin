import { Autocomplete, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Modal, Popper, TextField, Typography } from "@mui/material";
import { useUsersAndVillages } from "../../context/usersAndVillages.context";
import { useEffect, useState } from "react";
import { ref, update } from "firebase/database";
import { db } from "../../misc/firebase";
import { AutoFixHigh, PermIdentity } from "@mui/icons-material";

export default function EditVillageModal({
    editVillageModal,
    setEditVillageModal,
    getFormattedEditModalProperty,
    handleDeleteVillageMembers,
    toggleProgressIndicator,
    setErrorMessage
}) {
    const { users, villages } = useUsersAndVillages();

    const { isEditModalOpen, villageKey, villGroupKey, villageName, index } = editVillageModal;

    const [currentAssignedIncharge, setCurrentAssignedIncharge] = useState({});
    const [allInchargeList, setAllInchargeList] = useState([]);
    const [selectedIncharge, setSelectedIncharge] = useState(null);
    const [eraseDataConfrimation, setEraseDataConfrimation] = useState(false)

    useEffect(() => {
        if (villGroupKey) {
            const resp = users.find(el => el.mappedVillGroupKey === villGroupKey);
            const nonresp = users.filter(el => el.mappedVillGroupKey !== villGroupKey);

            nonresp.map(option =>
                option['firstLetter'] = option.email[0].toUpperCase()
            );

            setCurrentAssignedIncharge(resp);
            setAllInchargeList(nonresp);
        }
        // eslint-disable-next-line
    }, [villGroupKey]);

    const handleCloseModal = () => {
        setEditVillageModal(
            getFormattedEditModalProperty()
        );

        setSelectedIncharge(null);
    }

    const handleVillageInchargeChange = () => {
        toggleProgressIndicator(index, true);
        /**
         * --- Information Gathering
         */
        // Get Old Vill Group Key 
        const oldVillageGroupKey = villGroupKey;

        // Get New Village Data to Update
        const currentVillageData = villages.find(el => el.villageKey === villageKey);
        delete currentVillageData['villGroupKey'];
        delete currentVillageData['villageKey'];

        // Get New Vill Group Key 
        const newVillageGroupKey = selectedIncharge.mappedVillGroupKey;

        /**
        * --- Execute Update
        */
        const updates = {}

        updates[`villageGroupList/${newVillageGroupKey}/${villageKey}`] = currentVillageData;
        updates[`villageGroupList/${oldVillageGroupKey}/${villageKey}`] = null;

        // <==== | Update All Data In Single Shot | ====>
        update(ref(db), updates).then(x => {
            toggleProgressIndicator(index, false);
            handleCloseModal();
        }).catch((error) => {
            toggleProgressIndicator(index, false);
            setErrorMessage(index, 'Failed To Change Incharge');
            handleCloseModal();
        });
    }

    const onDeleteConfirmationButtonClick = () => {
        setEraseDataConfrimation(false);
        handleCloseModal();
        handleDeleteVillageMembers(villageKey, index);
    }

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
        <Modal open={isEditModalOpen} onClose={null}>
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
                <Box p={2}>

                    <Typography color='#8896a4' fontWeight='bold' fontSize={24}>
                        {villageName}
                    </Typography>
                    <Box display={'flex'} flexDirection={'row'}>
                        <PermIdentity sx={{ color: '#133168' }} />
                        <Typography color={'#133168'} ml={2}>
                            {currentAssignedIncharge.email}
                        </Typography>
                    </Box>

                    <Autocomplete
                        sx={{ mt: 2 }}
                        fullWidth
                        PopperComponent={PopperMy}
                        size='small'
                        blurOnSelect={true}
                        value={selectedIncharge}
                        onChange={(d, x, s) => setSelectedIncharge(x)}
                        options={allInchargeList.sort((a, b) => -b.firstLetter.localeCompare(a.firstLetter))}
                        groupBy={(option) => option.firstLetter}
                        getOptionLabel={(option) => option.email}
                        renderInput={(params) => <TextField {...params} label="Change Incharge" />}
                    />

                    <Button
                        sx={{ mt: 2 }}
                        fullWidth
                        variant="contained"
                        disabled={!selectedIncharge}
                        onClick={handleVillageInchargeChange}
                    >
                        Assign New Incharge
                    </Button>

                    <Divider sx={{ mt: 2 }}>
                        <Chip label="OR" />
                    </Divider>

                    <Box>
                        <Button
                            color="error"
                            sx={{ mt: 2 }}
                            fullWidth
                            variant="contained"
                            onClick={() => { setEraseDataConfrimation(true) }}>
                            Erase Assigned Members <AutoFixHigh />
                        </Button>

                        {
                            eraseDataConfrimation &&

                            <Dialog
                                open={true}
                                onClose={null}
                            >
                                <DialogTitle >
                                    Confirmation
                                </DialogTitle>
                                <DialogContent>
                                    <DialogContentText >
                                        Are you sure, This will clear all Party Members And General Members Data
                                    </DialogContentText>
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={() => { setEraseDataConfrimation(false) }}>Cancel</Button>
                                    <Button onClick={onDeleteConfirmationButtonClick} autoFocus>Confim</Button>
                                </DialogActions>
                            </Dialog>
                        }
                    </Box>

                    <Button
                        onClick={handleCloseModal}
                        color="primary"
                        sx={{ mt: 4 }}
                        fullWidth
                        variant="outlined"
                    >
                        Close
                    </Button>

                </Box>
            </Box>
        </Modal>
    )
}


