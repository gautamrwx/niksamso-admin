import { Replay, Upload } from "@mui/icons-material";
import { Button, Typography } from "@mui/material";

export default function UploadButton({
    iconType,
    onFileChange,
    children
}) {
    return (
        <Button
            size="small"
            color={iconType === 'Upload' ? 'info' : 'success'}
            variant="contained"
            component="label"
        >
            {iconType === 'Upload' && <Upload />}
            {iconType === 'Replay' && <Replay />}
            <Typography fontSize={14} p={0} ml={{ xs: 0, md: 2 }} display={{ xs: 'none', sm: 'flex' }}>{children}</Typography>
            <input
                onChange={onFileChange}
                type="file"
                accept=".csv"
                hidden
            />
        </Button>
    );
}