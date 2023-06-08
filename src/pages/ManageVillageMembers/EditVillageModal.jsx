import { Box, Modal } from "@mui/material";

export default function EditVillageModal({
    isEditModalOpen,
    setIsEditModalOpen
}) {
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
                dd
            </Box>
        </Modal>
    )
}


