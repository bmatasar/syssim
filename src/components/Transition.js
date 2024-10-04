import { Stack, Typography, styled } from '@mui/material';

const Code = styled('code')({
  whiteSpace: 'pre',
});

const Transition = ({ title = 'Transition:', code }) => (
  <Stack
    component="fieldset"
    sx={{
      px: 2,
      border: 1,
      borderColor: 'red',
    }}
  >
    <Typography component="legend">{title}</Typography>
    <Code>{code?.trim()}</Code>
  </Stack>
);

export default Transition;
