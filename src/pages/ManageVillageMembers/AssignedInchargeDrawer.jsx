import { Box, Container, Drawer, Typography } from '@mui/material';
import { Email, PermIdentity } from '@mui/icons-material';

export default function AssignedInchargeDrawer({
    villageInchargeDrawer,
    setVillageInchargeDrawer
}) {
    return (
        <Drawer
            anchor={'bottom'}
            open={villageInchargeDrawer.isDrawerOpen}
            onClose={() => { setVillageInchargeDrawer({}) }}
        >
            <Container maxWidth="xs">
                <Box>
                    <Box display={'flex'} flexDirection={'column'} mb={10} mt={2}>
                        <Typography color='#8896a4' fontWeight='bold' fontSize={24}>
                            {villageInchargeDrawer.villageName}
                        </Typography>
                        <Box display={'flex'} flexDirection={'row'} mt={5}>
                            <PermIdentity sx={{ color: '#133168' }} />
                            <Typography color={'#133168'} ml={2}>
                                {villageInchargeDrawer.inchargeName}
                            </Typography>
                        </Box>
                        <Box display={'flex'} flexDirection={'row'}>
                            <Email sx={{ color: '#133168' }} />
                            <Typography color={'#133168'} ml={2}>
                                {villageInchargeDrawer.inchargeEmail}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Container>
        </Drawer>
    );
}