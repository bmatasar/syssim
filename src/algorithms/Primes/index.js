import { useCallback, useMemo, useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { PlayArrow as PlayIcon, Replay as ReplayIcon } from '@mui/icons-material';
import Canvas from 'components/Canvas';
import SystolicArray from 'lib/SystolicArray';
import Transition from 'components/Transition';

const TRANSITION = `
if a <= 0 then
  a’ = a
else if p == 0 then
  p = a
  a’ = -a
else if a % p == 0 then
  a’ = 0
else
  a’ = a
`;

const Primes = () => {
  const [systolicArray, setSystolicArray] = useState(null);

  const [inputValues, setInputValues] = useState([]);

  const handleRestart = () => {
    const inputValues = [];
    for (let i = 2; i < 25; i++) inputValues.push(i);

    const descriptor = {
      startIndex: 1,
      colsCount: 7,
      registers: [
        {
          name: 'p',
          init: 0,
          fx: ({ a, p }) => (a > 0 && !p ? a : p),
        },
      ],
      wires: [
        {
          name: 'a',
          fx: ({ a, p }) => (a <= 0 ? a : p === 0 ? -a : a % p ? a : 0),
        },
      ],
    };

    setInputValues(inputValues);
    setSystolicArray(SystolicArray.create(descriptor));
  };

  const handleStep = () => {
    const values = { a: [0] };
    if (inputValues.length > 0) {
      values.a[0] = inputValues[0];
      setInputValues(inputValues.slice(1));
    }
    setSystolicArray(systolicArray.moveNext(values));
  };

  const canvasSize = useMemo(() => systolicArray?.preferredSize(), [systolicArray]);

  const draw = useCallback(
    (context, width, height, frame) => {
      if (systolicArray) {
        systolicArray.draw(context, width, height, frame);
      }
    },
    [systolicArray],
  );

  return (
    <Stack direction="column" p={2} spacing={2} flex={1}>
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Button variant="contained" color="primary" onClick={handleRestart}>
          Restart
          <ReplayIcon />
        </Button>
        <Button variant="contained" color="primary" disabled={!systolicArray} onClick={handleStep}>
          Step
          <PlayIcon />
        </Button>
        <Box flex={1} />
        <Transition code={TRANSITION} />
      </Stack>
      {systolicArray && (
        <>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Typography>Step: {systolicArray.step}</Typography>
            <Typography>Input: {inputValues.join(', ')}</Typography>
          </Stack>
          <Box p={2} overflow="scroll">
            <Canvas draw={draw} {...canvasSize} />
          </Box>
        </>
      )}
    </Stack>
  );
};

export default Primes;
