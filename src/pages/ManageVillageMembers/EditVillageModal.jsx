import { Autocomplete, Box, Button, Modal, Popper, TextField, Typography } from "@mui/material";
import { useUsersAndVillages } from "../../context/usersAndVillages.context";
import { useEffect, useState } from "react";
import { ref, update } from "firebase/database";
import { db } from "../../misc/firebase";

export default function EditVillageModal({
    editVillageModal,
    setEditVillageModal,
    getFormattedEditModalProperty
}) {
    const { users, villages } = useUsersAndVillages();

    const { isEditModalOpen, villageKey, villGroupKey, villageName } = editVillageModal;

    const [currentAssignedIncharge, setCurrentAssignedIncharge] = useState({});
    const [allInchargeList, setAllInchargeList] = useState([]);
    const [selectedIncharge, setSelectedIncharge] = useState(null);

    useEffect(() => {
        if (villGroupKey) {
            const resp = users.find(el => el.mappedVillGroupKey === villGroupKey);
            const nonresp = users.filter(el => el.mappedVillGroupKey !== villGroupKey);

            nonresp.map(option => {
                option['firstLetter'] = option.email[0].toUpperCase();
            });

            setCurrentAssignedIncharge(resp);
            setAllInchargeList(nonresp);
        }
    }, [villGroupKey]);

    const handleCloseModal = () => {
        setEditVillageModal(
            getFormattedEditModalProperty()
        );

        setSelectedIncharge(null);
    }

    const handleVillageInchargeChange = () => {
        /**
         * --- Information Gathering
         */
        // Get Old Vill Group Key 
        const oldVillageGroupKey = villGroupKey;

        // Get New Village Data to Update
        const currentVillageData = villages.find(x => x.villageKey === villageKey);
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
            handleCloseModal();
        }).catch((error) => {

        });
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
                <Typography>{villageName}</Typography>
                <Typography>{currentAssignedIncharge.email}</Typography>

                <Autocomplete
                    fullWidth
                    PopperComponent={PopperMy}
                    size='small'
                    blurOnSelect={true}
                    value={selectedIncharge}
                    onChange={(d, x, s) => setSelectedIncharge(x)}
                    options={allInchargeList.sort((a, b) => -b.firstLetter.localeCompare(a.firstLetter))}
                    groupBy={(option) => option.firstLetter}
                    getOptionLabel={(option) => option.email}
                    renderInput={(params) => <TextField {...params} label="Incharge" />}
                />

                <Button onClick={handleVillageInchargeChange}>
                    Submit
                </Button>

                <Button onClick={handleCloseModal}>Close</Button>
            </Box>
        </Modal>
    )
}


