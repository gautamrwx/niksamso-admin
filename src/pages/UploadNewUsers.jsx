import { Box, Button, Typography } from '@mui/material';
import SimpleAppBar from '../components/AppBarComponent/SimpleAppBar';
import { useProfile } from '../context/profile.context';
import { useState } from 'react';
import { Upload } from '@mui/icons-material';
import csv from 'csvtojson';
import { ref, update } from 'firebase/database';
import { db } from '../misc/firebase';
import md5 from 'md5';

function UploadNewUsers(props) {
    const { profile } = useProfile();

    const getPreapredData = (jsonArr) => {
        jsonArr = jsonArr.slice(1); // Delete First Index

        const email = jsonArr[0][0];
        const maskedEmail = String(email).replace(
            /(..)(.{1,2})(?=.*@)/g,
            (_, a, b) => a + '*'.repeat(b.length)
        );

        const assignedVillages = [];

        jsonArr.forEach(x => {
            assignedVillages.push(x[1])
        })

        return {
            'emailHash': md5(email),
            'newUserData': {
                maskedEmail,
                assignedVillages
            }
        }
    }

    const uploadData = (jsonArr) => {
        const { emailHash, newUserData } = getPreapredData(jsonArr);

        const updates = {};
        updates['/nonRegistedUsers/' + emailHash] = newUserData;

        // <==== | Update All Data In Single Shot | ====>
        update(ref(db), updates).then(x => {
            alert('SuccessFul');
        }).catch((error) => {
            alert("Error  Update");
        });
    }

    const handleNewUsersCSVUpload = ({ target }) => {

        const fr = new FileReader();

        fr.onload = function () {
            csv({
                noheader: true,
                output: "csv",
            })
                .fromString(fr.result)
                .then((csvRow) => {
                    uploadData(csvRow);
                });
        };

        fr.readAsText(target.files[0]);
    };

    return (
        <>
            <SimpleAppBar props={props} />

            <Box
                display="grid"
                justifyContent="center"
                alignItems="center"
                minWidth="100%"
                minHeight="60vh"
            >
                <Box>
                    <Button

                        variant="outlined"
                        component="label"
                    >
                        <Typography display={{ xs: 'none', sm: 'block' }}>Upload</Typography> <Upload />
                        <input
                            onChange={handleNewUsersCSVUpload}
                            type="file"
                            hidden
                        />
                    </Button>
                </Box>
            </Box>


        </>
    );
}

export default UploadNewUsers;
